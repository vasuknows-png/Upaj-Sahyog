import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { db, rows, one, run, uid, verifyPassword } from './db.mjs';

const PORT=Number(process.env.PORT||3000), PUBLIC=new URL('./public/',import.meta.url).pathname;
const now=()=>new Date().toISOString();
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))};
const body=async req=>{let s='';for await(const c of req){s+=c;if(s.length>1e6)throw Error('Payload too large')}return s?JSON.parse(s):{}};
const bearer=req=>(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
const auth=req=>one(`SELECT u.id,u.name,u.phone,u.role,u.location,u.aadhaar_last4 FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND datetime(s.expires_at)>datetime('now')`,bearer(req));
const requireAuth=(req,res,roles)=>{const u=auth(req);if(!u){json(res,401,{error:'Authentication required'});return null}if(roles&&!roles.includes(u.role)){json(res,403,{error:'Role not permitted'});return null}return u};
const hash=v=>createHmac('sha256',process.env.AADHAAR_HASH_SALT||'upaj-sahyog-dev-only').update(String(v)).digest('hex');
const issueToken=userId=>{const token=randomBytes(32).toString('hex');run('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)',token,userId,new Date(Date.now()+7*864e5).toISOString());return token};
const validAadhaar=a=>/^\d{12}$/.test(a)&&!/^([0-9])\1{11}$/.test(a);
const safeUser=u=>({id:u.id,name:u.name,phone:u.phone,role:u.role,location:u.location,aadhaarLast4:u.aadhaar_last4});
const listingRows=()=>rows(`SELECT l.*,u.name farmer FROM listings l LEFT JOIN users u ON u.id=l.user_id WHERE l.status='active' ORDER BY l.id DESC`);

async function api(req,res,url){
 const p=url.pathname;
 if(req.method==='GET'&&p==='/api/health')return json(res,200,{ok:true,service:'Upaj Sahyog API',database:'sqlite',time:now()});
 if(req.method==='GET'&&p==='/api/listings')return json(res,200,listingRows());
 if(req.method==='GET'&&p==='/api/forecasts')return json(res,200,rows('SELECT * FROM forecasts ORDER BY confidence DESC'));
 if(req.method==='GET'&&p==='/api/auth/aadhaar/status')return json(res,200,{provider:process.env.AADHAAR_PROVIDER||'simulator',live:(process.env.AADHAAR_PROVIDER||'simulator')!=='simulator',paperlessOfflineEkyc:true,notice:'Live UIDAI OTP requires licensed AUA/KUA connectivity through an ASA/KSA.'});
 if(req.method==='POST'&&p==='/api/auth/aadhaar/otp'){
   const b=await body(req);const aadhaar=String(b.aadhaar||'').replace(/\D/g,'');
   if(b.consent!==true)return json(res,400,{error:'Explicit Aadhaar consent is required'});
   if(!validAadhaar(aadhaar))return json(res,400,{error:'Invalid Aadhaar number'});
   const id=uid(),otp=(process.env.AADHAAR_PROVIDER||'simulator')==='simulator'?'123456':String(Math.floor(100000+Math.random()*900000));
   if((process.env.AADHAAR_PROVIDER||'simulator')!=='simulator'&&!process.env.AADHAAR_GATEWAY_URL)return json(res,503,{error:'Licensed Aadhaar gateway is not configured'});
   run('INSERT INTO aadhaar_sessions(id,uid_hash,last4,otp_hash,consent,expires_at) VALUES(?,?,?,?,1,?)',id,hash(aadhaar),aadhaar.slice(-4),hash(otp),new Date(Date.now()+10*60000).toISOString());
   run('INSERT INTO aadhaar_audit(event,uid_hash,last4,success) VALUES(?,?,?,1)','OTP_REQUESTED',hash(aadhaar),aadhaar.slice(-4));
   return json(res,200,{transactionId:id,maskedAadhaar:`XXXX-XXXX-${aadhaar.slice(-4)}`,...((process.env.AADHAAR_PROVIDER||'simulator')==='simulator'?{demoOtp:otp}:{})});
 }
 if(req.method==='POST'&&p==='/api/auth/aadhaar/verify'){
   const b=await body(req),s=one('SELECT * FROM aadhaar_sessions WHERE id=?',b.transactionId);
   if(!s||new Date(s.expires_at)<new Date())return json(res,400,{error:'OTP session expired'});
   if(s.attempts>=3)return json(res,429,{error:'OTP attempts exceeded'});
   const ok=timingSafeEqual(Buffer.from(s.otp_hash),Buffer.from(hash(String(b.otp||''))));
   if(!ok){run('UPDATE aadhaar_sessions SET attempts=attempts+1 WHERE id=?',s.id);run('INSERT INTO aadhaar_audit(event,uid_hash,last4,success) VALUES(?,?,?,0)','OTP_VERIFY',s.uid_hash,s.last4);return json(res,400,{error:'Invalid OTP'})}
   let u=one('SELECT * FROM users WHERE aadhaar_hash=?',s.uid_hash);
   if(!u){const id=uid();run('INSERT INTO users(id,name,role,location,aadhaar_hash,aadhaar_last4) VALUES(?,?,?,?,?,?)',id,String(b.name||'Upaj Sahyog User').slice(0,80),['farmer','buyer','fpo'].includes(b.role)?b.role:'buyer',String(b.location||''),s.uid_hash,s.last4);u=one('SELECT * FROM users WHERE id=?',id)}
   run('DELETE FROM aadhaar_sessions WHERE id=?',s.id);run('INSERT INTO aadhaar_audit(event,uid_hash,last4,success) VALUES(?,?,?,1)','OTP_VERIFY',s.uid_hash,s.last4);
   return json(res,200,{token:issueToken(u.id),user:safeUser(u)});
 }
 if(req.method==='POST'&&p==='/api/auth/login'){
   const b=await body(req),u=one('SELECT * FROM users WHERE phone=?',String(b.phone||''));
   if(!u||!verifyPassword(String(b.password||''),u.password_hash))return json(res,401,{error:'Invalid phone or password'});
   return json(res,200,{token:issueToken(u.id),user:safeUser(u)});
 }
 if(req.method==='GET'&&p==='/api/me'){const u=requireAuth(req,res);if(!u)return;return json(res,200,{user:safeUser(u)})}
 if(req.method==='POST'&&p==='/api/listings'){
   const u=requireAuth(req,res,['farmer','fpo','admin']);if(!u)return;const b=await body(req);
   if(!b.crop||Number(b.quantity)<=0||Number(b.price)<=0)return json(res,400,{error:'Crop, positive quantity and price are required'});
   const r=run('INSERT INTO listings(user_id,crop,crop_hi,category,grade,quantity,unit,price,location,emoji,high_demand) VALUES(?,?,?,?,?,?,?,?,?,?,?)',u.id,String(b.crop),String(b.cropHi||b.crop),String(b.category||'veg'),String(b.grade||'Standard'),Number(b.quantity),String(b.unit||'kg'),Number(b.price),String(b.location||u.location||''),String(b.emoji||'🌾'),b.highDemand?1:0);
   return json(res,201,one('SELECT * FROM listings WHERE id=?',Number(r.lastInsertRowid)));
 }
 if(req.method==='GET'&&p==='/api/orders'){const u=requireAuth(req,res);if(!u)return;const q=u.role==='buyer'?rows('SELECT * FROM orders WHERE buyer_id=? ORDER BY created_at DESC',u.id):rows('SELECT DISTINCT o.* FROM orders o JOIN order_items i ON i.order_id=o.id JOIN listings l ON l.id=i.listing_id WHERE l.user_id=? ORDER BY o.created_at DESC',u.id);return json(res,200,q)}
 if(req.method==='POST'&&p==='/api/orders'){
   const u=requireAuth(req,res);if(!u)return;const b=await body(req);if(!Array.isArray(b.items)||!b.items.length)return json(res,400,{error:'Order items required'});
   let subtotal=0;const checked=[];
   for(const it of b.items){const l=one("SELECT * FROM listings WHERE id=? AND status='active'",Number(it.listingId));const q=Number(it.quantity);if(!l||q<=0||q>l.quantity)return json(res,409,{error:`Listing ${it.listingId} unavailable`});subtotal+=l.price*q;checked.push([l,q])}
   const id='US'+Date.now().toString(36).toUpperCase(),delivery=subtotal?40:0,total=subtotal+delivery;
   db.exec('BEGIN');try{run('INSERT INTO orders(id,buyer_id,subtotal,delivery_fee,total,payment_method,address_json) VALUES(?,?,?,?,?,?,?)',id,u.id,subtotal,delivery,total,String(b.paymentMethod||'upi'),JSON.stringify(b.address||{}));for(const [l,q] of checked){run('INSERT INTO order_items(order_id,listing_id,quantity,price,amount) VALUES(?,?,?,?,?)',id,l.id,q,l.price,l.price*q);run('UPDATE listings SET quantity=quantity-? WHERE id=?',q,l.id)}run('INSERT INTO order_events(order_id,event,detail) VALUES(?,?,?)',id,'confirmed','Order confirmed by marketplace');db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
   return json(res,201,{...one('SELECT * FROM orders WHERE id=?',id),items:rows('SELECT * FROM order_items WHERE order_id=?',id)});
 }
 if(req.method==='GET'&&/^\/api\/orders\/[^/]+\/track$/.test(p)){const u=requireAuth(req,res);if(!u)return;const id=p.split('/')[3];return json(res,200,{order:one('SELECT * FROM orders WHERE id=?',id),events:rows('SELECT * FROM order_events WHERE order_id=? ORDER BY id',id)})}
 if(req.method==='GET'&&p==='/api/payments/config')return json(res,200,{provider:process.env.PAYMENT_PROVIDER||'simulator',keyId:process.env.RAZORPAY_KEY_ID||null,currency:'INR'});
 if(req.method==='POST'&&p==='/api/payments/order'){
   const u=requireAuth(req,res);if(!u)return;const b=await body(req),o=one('SELECT * FROM orders WHERE id=?',b.orderId);if(!o)return json(res,404,{error:'Order not found'});
   const id='pay_'+uid(),provider=process.env.PAYMENT_PROVIDER||'simulator';run('INSERT INTO payments(id,order_id,provider,amount,status,provider_ref) VALUES(?,?,?,?,?,?)',id,o.id,provider,o.total,'created',provider==='simulator'?'sim_'+uid():null);
   return json(res,201,{paymentId:id,provider,amount:o.total,currency:'INR',orderId:o.id,keyId:process.env.RAZORPAY_KEY_ID||null});
 }
 if(req.method==='POST'&&p==='/api/payments/verify'){
   const u=requireAuth(req,res);if(!u)return;const b=await body(req),pay=one('SELECT * FROM payments WHERE id=?',b.paymentId);if(!pay)return json(res,404,{error:'Payment not found'});
   let ok=(pay.provider==='simulator');if(pay.provider==='razorpay'&&process.env.RAZORPAY_KEY_SECRET){const sig=createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(`${b.razorpayOrderId}|${b.razorpayPaymentId}`).digest('hex');ok=timingSafeEqual(Buffer.from(sig),Buffer.from(String(b.signature||'')))}
   if(!ok)return json(res,400,{error:'Payment verification failed'});run("UPDATE payments SET status='captured',updated_at=CURRENT_TIMESTAMP WHERE id=?",pay.id);run("UPDATE orders SET payment_status='paid_in_escrow' WHERE id=?",pay.order_id);run('INSERT INTO order_events(order_id,event,detail) VALUES(?,?,?)',pay.order_id,'paid_in_escrow','Payment verified and held for farmer settlement');return json(res,200,{ok:true,status:'paid_in_escrow',orderId:pay.order_id});
 }
 if(req.method==='POST'&&p==='/api/routes/optimize'){const u=requireAuth(req,res);if(!u)return;const b=await body(req),stops=Array.isArray(b.stops)?b.stops:[];return json(res,200,{optimized:stops.map((x,i)=>({...x,sequence:i+1})),estimatedKm:Math.max(4,stops.length*7),method:'nearest-neighbour demo; OR-Tools adapter ready'})}
 if(req.method==='GET'&&p==='/api/dashboard')return json(res,200,{metrics:{activeListings:one("SELECT count(*) c FROM listings WHERE status='active'").c,availableKg:one("SELECT coalesce(sum(quantity),0) n FROM listings WHERE unit='kg'").n,orders:one('SELECT count(*) c FROM orders').c},forecasts:rows('SELECT * FROM forecasts')});
 return false;
}

function staticFile(req,res,url){let rel=url.pathname==='/'?'index.html':url.pathname.replace(/^\//,'');rel=normalize(rel).replace(/^(\.\.\/)+/,'');const file=join(PUBLIC,rel);if(!file.startsWith(PUBLIC)||!existsSync(file)){json(res,404,{error:'Not found'});return}const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-cache'});res.end(readFileSync(file))}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://'+req.headers.host);if(url.pathname.startsWith('/api/')){const handled=await api(req,res,url);if(handled===false)json(res,404,{error:'API route not found'});return}staticFile(req,res,url)}catch(e){console.error(e);json(res,500,{error:e.message||'Internal error'})}});
server.listen(PORT,()=>console.log(`Upaj Sahyog running at http://localhost:${PORT}`));
