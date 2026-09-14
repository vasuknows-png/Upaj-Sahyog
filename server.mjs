import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { db, initDb, hashPassword, id, now } from './db.mjs';
import { requestOtp, verifyOtp, verifyOfflineKyc, providerStatus, maskAadhaar } from './aadhaar.mjs';
import { createPayment, confirmPayment, verifySignature, verifyWebhook, settlePayout, publicConfig, listPayments } from './payments.mjs';

initDb();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC = new URL('./public', import.meta.url).pathname;
const sessions = new Map();
const json = (res, status, data) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(data)); };
const body = async req => { const parts=[]; for await(const c of req) parts.push(c); if(!parts.length) return {}; try{return JSON.parse(Buffer.concat(parts).toString())}catch{return null} };
const userFor = req => { const t=(req.headers.authorization||'').replace('Bearer ',''); return sessions.get(t)||null; };
const requireUser = (req,res,roles=[]) => { const u=userFor(req); if(!u){json(res,401,{error:'Authentication required'});return null} if(roles.length&&!roles.includes(u.role)){json(res,403,{error:'Role not permitted'});return null} return u; };
const rows = (sql,...params) => db.prepare(sql).all(...params);
const one = (sql,...params) => db.prepare(sql).get(...params);
const haversine=(a,b,c,d)=>{const R=6371,r=x=>x*Math.PI/180,dp=r(c-a),dl=r(d-b);const q=Math.sin(dp/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(q))};
const scoreMatch=(l,d)=>{let s=0;if(l.crop.toLowerCase()===d.crop.toLowerCase())s+=45;if(!d.grade||l.grade===d.grade)s+=15;if(l.price_per_kg<=d.max_price)s+=20;const km=haversine(l.latitude||0,l.longitude||0,d.latitude||0,d.longitude||0);s+=Math.max(0,20-Math.min(20,km/15));return Math.round(s)};

async function api(req,res,url){
  const p=url.pathname;
  if(req.method==='GET'&&p==='/api/health') return json(res,200,{ok:true,service:'Upaj Sahyog API',database:'sqlite',time:now()});
  if(req.method==='POST'&&p==='/api/auth/login'){
    const b=await body(req); if(!b)return json(res,400,{error:'Invalid JSON'});
    const u=one('SELECT id,name,phone,role,district,state,language FROM users WHERE phone=? AND password_hash=?',b.phone,hashPassword(b.password||''));
    if(!u)return json(res,401,{error:'Incorrect phone or password'}); const token=createHash('sha256').update(randomUUID()).digest('hex'); sessions.set(token,u); return json(res,200,{token,user:u});
  }
  if(req.method==='GET'&&p==='/api/me'){const u=requireUser(req,res);if(u)return json(res,200,u);return}
  if(req.method==='GET'&&p==='/api/dashboard'){
    const u=userFor(req); const active=one("SELECT COUNT(*) c, COALESCE(SUM(available_kg),0) kg FROM listings WHERE status='active'");
    const demand=one("SELECT COUNT(*) c, COALESCE(SUM(quantity_kg),0) kg FROM demands WHERE status='open'");
    const orders=one("SELECT COUNT(*) c, COALESCE(SUM(quantity_kg*price_per_kg),0) value FROM orders");
    const crops=rows("SELECT crop,ROUND(SUM(available_kg)) available_kg,ROUND(AVG(price_per_kg),1) avg_price FROM listings WHERE status='active' GROUP BY crop ORDER BY available_kg DESC");
    return json(res,200,{user:u,metrics:{activeListings:active.c,availableKg:active.kg,openDemands:demand.c,demandKg:demand.kg,orders:orders.c,gmv:orders.value},crops,forecast:one("SELECT * FROM forecasts ORDER BY confidence DESC LIMIT 1")});
  }
  if(req.method==='GET'&&p==='/api/listings'){
    const q=(url.searchParams.get('q')||'').toLowerCase(); const crop=url.searchParams.get('crop');
    let sql=`SELECT l.*,u.name seller_name FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.status='active'`, ps=[];
    if(q){sql+=' AND (lower(l.crop) LIKE ? OR lower(l.district) LIKE ? OR lower(l.variety) LIKE ?)';ps.push(`%${q}%`,`%${q}%`,`%${q}%`)} if(crop){sql+=' AND l.crop=?';ps.push(crop)} sql+=' ORDER BY l.created_at DESC';
    return json(res,200,rows(sql,...ps));
  }
  if(req.method==='POST'&&p==='/api/listings'){
    const u=requireUser(req,res,['farmer','fpo','admin']);if(!u)return;const b=await body(req);if(!b?.crop||!Number(b.quantity_kg)||!Number(b.price_per_kg))return json(res,400,{error:'crop, quantity and price are required'});
    const lid=id('lot');db.prepare(`INSERT INTO listings(id,seller_id,crop,variety,grade,quantity_kg,available_kg,price_per_kg,harvest_date,district,state,latitude,longitude,organic,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(lid,u.id,b.crop,b.variety||'',b.grade||'A',+b.quantity_kg,+b.quantity_kg,+b.price_per_kg,b.harvest_date||now().slice(0,10),b.district||u.district,b.state||u.state,+b.latitude||20.0,+b.longitude||73.8,b.organic?1:0,'active',now());return json(res,201,one('SELECT * FROM listings WHERE id=?',lid));
  }
  if(req.method==='PATCH'&&p.startsWith('/api/listings/')){
    const u=requireUser(req,res,['farmer','fpo','admin']);if(!u)return;const lid=p.split('/').pop(),b=await body(req);const l=one('SELECT * FROM listings WHERE id=?',lid);if(!l)return json(res,404,{error:'Listing not found'});if(u.role!=='admin'&&l.seller_id!==u.id)return json(res,403,{error:'Not your listing'});db.prepare('UPDATE listings SET price_per_kg=COALESCE(?,price_per_kg),status=COALESCE(?,status) WHERE id=?').run(b.price_per_kg??null,b.status??null,lid);return json(res,200,one('SELECT * FROM listings WHERE id=?',lid));
  }
  if(req.method==='GET'&&p==='/api/demands') return json(res,200,rows(`SELECT d.*,u.name buyer_name FROM demands d JOIN users u ON u.id=d.buyer_id WHERE d.status='open' ORDER BY d.required_by`));
  if(req.method==='POST'&&p==='/api/demands'){
    const u=requireUser(req,res,['buyer','admin']);if(!u)return;const b=await body(req);if(!b?.crop||!+b.quantity_kg||!+b.max_price)return json(res,400,{error:'crop, quantity and max price required'});const did=id('need');db.prepare(`INSERT INTO demands(id,buyer_id,crop,grade,quantity_kg,max_price,required_by,district,state,latitude,longitude,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(did,u.id,b.crop,b.grade||'A',+b.quantity_kg,+b.max_price,b.required_by||now().slice(0,10),b.district||u.district,b.state||u.state,+b.latitude||18.52,+b.longitude||73.85,'open',now());return json(res,201,one('SELECT * FROM demands WHERE id=?',did));
  }
  if(req.method==='GET'&&p==='/api/matches'){
    const ls=rows("SELECT l.*,u.name seller_name FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.status='active'"); const ds=rows("SELECT d.*,u.name buyer_name FROM demands d JOIN users u ON u.id=d.buyer_id WHERE d.status='open'");
    const matches=[];for(const l of ls)for(const d of ds)if(l.crop.toLowerCase()===d.crop.toLowerCase()){const distance=Math.round(haversine(l.latitude,l.longitude,d.latitude,d.longitude));matches.push({listing:l,demand:d,score:scoreMatch(l,d),distanceKm:distance,matchQty:Math.min(l.available_kg,d.quantity_kg),spread:+(d.max_price-l.price_per_kg).toFixed(2)})}return json(res,200,matches.sort((a,b)=>b.score-a.score));
  }
  if(req.method==='GET'&&p==='/api/orders'){
    const u=userFor(req);let sql=`SELECT o.*,l.crop,l.grade,bu.name buyer_name,su.name seller_name FROM orders o JOIN listings l ON l.id=o.listing_id JOIN users bu ON bu.id=o.buyer_id JOIN users su ON su.id=o.seller_id`,ps=[];
    if(u&&u.role==='buyer'){sql+=' WHERE o.buyer_id=?';ps=[u.id]}else if(u&&['farmer','fpo'].includes(u.role)){sql+=' WHERE o.seller_id=?';ps=[u.id]}sql+=' ORDER BY o.created_at DESC';return json(res,200,rows(sql,...ps));
  }
  if(req.method==='POST'&&p==='/api/orders'){
    const u=requireUser(req,res,['buyer','admin']);if(!u)return;const b=await body(req),l=one("SELECT * FROM listings WHERE id=? AND status='active'",b.listing_id);if(!l)return json(res,404,{error:'Active listing not found'});const qty=Math.min(+b.quantity_kg||0,l.available_kg);if(qty<=0)return json(res,400,{error:'Valid quantity required'});const oid=id('ord'),logistics=Math.round(Math.max(120,qty*.65)),fee=Math.round(qty*l.price_per_kg*.015);const buyerId=u.role==='admin'?(b.buyer_id||'u-buyer'):u.id;
    db.exec('BEGIN');try{db.prepare(`INSERT INTO orders(id,listing_id,buyer_id,seller_id,quantity_kg,price_per_kg,platform_fee,logistics_fee,status,pickup_date,delivery_date,payment_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(oid,l.id,buyerId,l.seller_id,qty,l.price_per_kg,fee,logistics,'confirmed',b.pickup_date||now().slice(0,10),b.delivery_date||null,'pending',now(),now());db.prepare('UPDATE listings SET available_kg=available_kg-?,status=CASE WHEN available_kg-?<=0 THEN \'sold\' ELSE status END WHERE id=?').run(qty,qty,l.id);db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(oid,'confirmed','Order placed and inventory reserved',now());db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}return json(res,201,one('SELECT * FROM orders WHERE id=?',oid));
  }
  if(req.method==='PATCH'&&p.startsWith('/api/orders/')){
    const u=requireUser(req,res);if(!u)return;const oid=p.split('/').pop(),b=await body(req),allowed=['confirmed','packed','picked_up','in_transit','delivered','cancelled'];if(!allowed.includes(b.status))return json(res,400,{error:'Invalid order status'});db.prepare('UPDATE orders SET status=?,payment_status=CASE WHEN ?=\'delivered\' THEN \'settled\' ELSE payment_status END,updated_at=? WHERE id=?').run(b.status,b.status,now(),oid);db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(oid,b.status,b.note||'',now());return json(res,200,one('SELECT * FROM orders WHERE id=?',oid));
  }
  if(req.method==='GET'&&p==='/api/forecasts') return json(res,200,rows('SELECT * FROM forecasts ORDER BY confidence DESC'));
  if(req.method==='POST'&&p==='/api/routes/optimize'){
    const b=await body(req);const ids=Array.isArray(b?.orderIds)?b.orderIds:[];let stops=ids.length?rows(`SELECT o.id,l.crop,l.latitude,l.longitude,l.district FROM orders o JOIN listings l ON l.id=o.listing_id WHERE o.id IN (${ids.map(()=>'?').join(',')})`,...ids):rows("SELECT id,crop,latitude,longitude,district FROM listings WHERE status='active' LIMIT 5");const depot={latitude:+b?.depotLat||18.5204,longitude:+b?.depotLng||73.8567,district:'Pune depot'};let cur=depot,ordered=[],km=0;while(stops.length){stops.sort((a,b)=>haversine(cur.latitude,cur.longitude,a.latitude,a.longitude)-haversine(cur.latitude,cur.longitude,b.latitude,b.longitude));const n=stops.shift();const leg=haversine(cur.latitude,cur.longitude,n.latitude,n.longitude);km+=leg;ordered.push({...n,legKm:Math.round(leg)});cur=n}km+=haversine(cur.latitude,cur.longitude,depot.latitude,depot.longitude);const baseline=Math.round(km*1.28);return json(res,200,{route:[depot,...ordered,depot],distanceKm:Math.round(km),baselineKm:baseline,savedKm:baseline-Math.round(km),savedPercent:Math.round((baseline-km)/baseline*100),estimatedHours:+(km/38).toFixed(1)});
  }
  /* ---------------- Aadhaar authentication ---------------- */
  if(req.method==='GET'&&p==='/api/auth/aadhaar/status') return json(res,200,providerStatus());
  if(req.method==='POST'&&p==='/api/auth/aadhaar/otp'){
    const b=await body(req);if(!b)return json(res,400,{error:'Invalid JSON'});
    try{return json(res,200,await requestOtp({aadhaar:String(b.aadhaar||'').replace(/\s/g,''),consent:b.consent===true,purpose:b.purpose}))}catch(e){return json(res,400,{error:e.message})}
  }
  if(req.method==='POST'&&p==='/api/auth/aadhaar/verify'){
    const b=await body(req);if(!b)return json(res,400,{error:'Invalid JSON'});
    let v;try{v=await verifyOtp({txn:b.txn,otp:b.otp})}catch(e){return json(res,400,{error:e.message})}
    const role=['farmer','fpo','buyer','transporter'].includes(b.role)?b.role:'buyer';
    let u=one('SELECT u.id,u.name,u.phone,u.role,u.district,u.state,u.language FROM users u JOIN kyc_profiles k ON k.user_id=u.id WHERE k.uid_hash=?',v.uidHash);
    if(!u){
      const uid=id('usr');
      db.prepare('INSERT INTO users(id,name,phone,password_hash,role,district,state,language,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(uid,v.kyc?.name||'Aadhaar User',b.phone||('AADHAAR-'+v.uidLast4+'-'+uid.slice(-4)),hashPassword(randomUUID()),role,v.kyc?.district||'Nashik',v.kyc?.state||'Maharashtra',b.language||'en',now());
      db.prepare('INSERT INTO kyc_profiles(user_id,uid_hash,uid_last4,name,gender,district,state,pincode,mode,reference_id,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .run(uid,v.uidHash,v.uidLast4,v.kyc?.name||'',v.kyc?.gender||'',v.kyc?.district||'',v.kyc?.state||'',v.kyc?.pincode||'',v.provider,v.kyc?.referenceId||'',now());
      u=one('SELECT id,name,phone,role,district,state,language FROM users WHERE id=?',uid);
    }
    const token=createHash('sha256').update(randomUUID()).digest('hex');sessions.set(token,u);
    return json(res,200,{token,user:u,aadhaar:{verified:true,masked:v.maskedAadhaar,provider:v.provider},kyc:v.kyc});
  }
  if(req.method==='POST'&&p==='/api/auth/aadhaar/offline-ekyc'){
    const b=await body(req);if(!b?.zipPath)return json(res,400,{error:'zipPath and shareCode are required'});
    try{return json(res,200,await verifyOfflineKyc({zipPath:b.zipPath,shareCode:b.shareCode}))}catch(e){return json(res,400,{error:e.message})}
  }

  /* ---------------- Cart ---------------- */
  if(p==='/api/cart'){
    const u=requireUser(req,res);if(!u)return;
    if(req.method==='GET')return json(res,200,rows('SELECT c.id,c.listing_id,c.quantity_kg,l.crop,l.variety,l.grade,l.price_per_kg,l.district,us.name seller_name FROM cart_items c JOIN listings l ON l.id=c.listing_id JOIN users us ON us.id=l.seller_id WHERE c.user_id=?',u.id));
    if(req.method==='POST'){const b=await body(req);const l=one('SELECT * FROM listings WHERE id=?',b?.listing_id);if(!l)return json(res,404,{error:'Listing not found'});const qty=+b.quantity_kg||1;db.prepare('INSERT INTO cart_items(id,user_id,listing_id,quantity_kg,created_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,listing_id) DO UPDATE SET quantity_kg=?').run(id('cart'),u.id,l.id,qty,now(),qty);return json(res,201,{ok:true})}
    if(req.method==='DELETE'){db.prepare('DELETE FROM cart_items WHERE user_id=?').run(u.id);return json(res,200,{ok:true})}
  }
  if(req.method==='DELETE'&&p.startsWith('/api/cart/')){const u=requireUser(req,res);if(!u)return;db.prepare('DELETE FROM cart_items WHERE user_id=? AND listing_id=?').run(u.id,p.split('/').pop());return json(res,200,{ok:true})}

  /* ---------------- Payments ---------------- */
  if(req.method==='GET'&&p==='/api/payments/config') return json(res,200,publicConfig());
  if(req.method==='GET'&&p==='/api/payments') {const u=requireUser(req,res);if(!u)return;return json(res,200,listPayments(url.searchParams.get('orderId')))}
  if(req.method==='POST'&&p==='/api/payments/order'){
    const u=requireUser(req,res);if(!u)return;const b=await body(req);const o=one('SELECT * FROM orders WHERE id=?',b?.order_id);if(!o)return json(res,404,{error:'Order not found'});
    const amount=Math.round((o.quantity_kg*o.price_per_kg+o.platform_fee+o.logistics_fee)*100);
    try{return json(res,201,await createPayment({orderId:o.id,amountPaise:amount,buyerId:u.id,method:b.method||'upi',notes:{phone:u.phone}}))}catch(e){return json(res,400,{error:e.message})}
  }
  if(req.method==='POST'&&p==='/api/payments/verify'){
    const u=requireUser(req,res);if(!u)return;const b=await body(req);
    if(b?.razorpay_signature&&!verifySignature(b))return json(res,400,{error:'Payment signature verification failed'});
    try{return json(res,200,confirmPayment({paymentId:b.payment_id||b.razorpay_order_id,providerPaymentId:b.razorpay_payment_id,status:b.status||'captured'}))}catch(e){return json(res,400,{error:e.message})}
  }
  if(req.method==='POST'&&p==='/api/payments/webhook'){
    const parts=[];for await(const c of req)parts.push(c);const raw=Buffer.concat(parts).toString();
    if(!verifyWebhook(raw,req.headers['x-razorpay-signature']))return json(res,400,{error:'Invalid webhook signature'});
    let evt={};try{evt=JSON.parse(raw||'{}')}catch{}
    const ref=evt?.payload?.payment?.entity?.order_id;const payId=evt?.payload?.payment?.entity?.id;
    if(ref){try{confirmPayment({paymentId:ref,providerPaymentId:payId,status:evt.event==='payment.failed'?'failed':'captured'})}catch{}}
    return json(res,200,{received:true});
  }
  if(req.method==='POST'&&p==='/api/payments/settle'){
    const u=requireUser(req,res,['admin','fpo','farmer']);if(!u)return;const b=await body(req);
    try{return json(res,200,await settlePayout({orderId:b?.order_id}))}catch(e){return json(res,400,{error:e.message})}
  }
  if(req.method==='GET'&&p.startsWith('/api/orders/')&&p.endsWith('/track')){
    const oid=p.split('/')[3];const o=one('SELECT * FROM orders WHERE id=?',oid);if(!o)return json(res,404,{error:'Order not found'});
    return json(res,200,{order:o,events:rows('SELECT * FROM order_events WHERE order_id=? ORDER BY id',oid),payments:listPayments(oid)});
  }

  return json(res,404,{error:'API route not found'});
}

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
async function staticFile(req,res,url){let rel=decodeURIComponent(url.pathname);if(rel==='/'||!extname(rel))rel='/index.html';const file=normalize(join(PUBLIC,rel));if(!file.startsWith(PUBLIC))return json(res,403,{error:'Forbidden'});try{const data=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-cache'});res.end(data)}catch{try{const data=await readFile(join(PUBLIC,'index.html'));res.writeHead(200,{'content-type':mime['.html']});res.end(data)}catch{json(res,404,{error:'Not found'})}}}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http'+ '://' + req.headers.host);try{if(url.pathname.startsWith('/api/'))await api(req,res,url);else await staticFile(req,res,url)}catch(e){console.error(e);json(res,500,{error:'Server error',detail:process.env.NODE_ENV==='development'?e.message:undefined})}});
server.listen(PORT,()=>console.log(`Upaj Sahyog running at http://localhost:${PORT}`));
