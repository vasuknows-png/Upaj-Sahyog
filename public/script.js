/* ---------------- DATA ---------------- */
const CATEGORIES = [
  {id:'all', hi:'सभी', en:'All', icon:'🧺'},
  {id:'grain', hi:'अनाज', en:'Grains', icon:'🌾'},
  {id:'veg', hi:'सब्ज़ी', en:'Veggies', icon:'🥬'},
  {id:'pulse', hi:'दालें', en:'Pulses', icon:'🫘'},
  {id:'fruit', hi:'फल', en:'Fruits', icon:'🍊'},
];

const PRODUCTS = [
  {id:1, cat:'grain', emoji:'🌾', nameHi:'गेहूं (गेहूं 306)', nameEn:'Wheat (HD-2967)', farmer:'राजेश यादव, बरेली', price:2150, unit:'क्विंटल', highDemand:true, stock:42},
  {id:2, cat:'grain', emoji:'🌾', nameHi:'बासमती चावल', nameEn:'Basmati Rice', farmer:'सुरेश सिंह, करनाल', price:3800, unit:'क्विंटल', highDemand:false, stock:18},
  {id:3, cat:'veg', emoji:'🍅', nameHi:'ताज़ा टमाटर', nameEn:'Fresh Tomato', farmer:'गीता देवी, नासिक', price:22, unit:'किलो', highDemand:true, stock:120},
  {id:4, cat:'veg', emoji:'🧅', nameHi:'प्याज़', nameEn:'Onion', farmer:'विजय पाटिल, नासिक', price:18, unit:'किलो', highDemand:false, stock:200},
  {id:5, cat:'veg', emoji:'🥔', nameHi:'आलू', nameEn:'Potato', farmer:'हरपाल सिंह, आगरा', price:14, unit:'किलो', highDemand:false, stock:300},
  {id:6, cat:'pulse', emoji:'🫘', nameHi:'अरहर दाल', nameEn:'Toor Dal', farmer:'मोहन लाल, इंदौर', price:112, unit:'किलो', highDemand:true, stock:65},
  {id:7, cat:'pulse', emoji:'🫘', nameHi:'चना दाल', nameEn:'Chana Dal', farmer:'सुनीता वर्मा, भोपाल', price:88, unit:'किलो', highDemand:false, stock:90},
  {id:8, cat:'fruit', emoji:'🥭', nameHi:'आम (दशहरी)', nameEn:'Mango (Dasheri)', farmer:'रामू भाई, लखनऊ', price:65, unit:'किलो', highDemand:true, stock:75},
  {id:9, cat:'fruit', emoji:'🍊', nameHi:'संतरा', nameEn:'Orange', farmer:'दीपक पवार, नागपुर', price:48, unit:'किलो', highDemand:false, stock:110},
  {id:10, cat:'grain', emoji:'🌽', nameHi:'मक्का', nameEn:'Maize', farmer:'अनिल कुमार, उन्नाव', price:1850, unit:'क्विंटल', highDemand:false, stock:55},
];


// Official govt mandi rate sheet (min/max/modal price) — editable like Excel
const GOVT_RATES_SEED = [
  {id:1, cropHi:'गेहूं (गेहूं 306)', cropEn:'Wheat (HD-2967)', market:'बरेली मंडी, यूपी', min:2080, max:2210, modal:2150, unit:'क्विंटल', date:'10-09-2026'},
  {id:2, cropHi:'बासमती चावल', cropEn:'Basmati Rice', market:'करनाल मंडी, हरियाणा', min:3650, max:3950, modal:3800, unit:'क्विंटल', date:'10-09-2026'},
  {id:3, cropHi:'ताज़ा टमाटर', cropEn:'Fresh Tomato', market:'लासलगांव मंडी, महाराष्ट्र', min:1600, max:2400, modal:2200, unit:'क्विंटल', date:'10-09-2026'},
  {id:4, cropHi:'प्याज़', cropEn:'Onion', market:'लासलगांव मंडी, महाराष्ट्र', min:1500, max:2000, modal:1800, unit:'क्विंटल', date:'10-09-2026'},
  {id:5, cropHi:'आलू', cropEn:'Potato', market:'आगरा मंडी, यूपी', min:1100, max:1500, modal:1400, unit:'क्विंटल', date:'10-09-2026'},
  {id:6, cropHi:'अरहर दाल', cropEn:'Toor Dal', market:'इंदौर मंडी, मप्र', min:10500, max:11400, modal:11200, unit:'क्विंटल', date:'10-09-2026'},
  {id:7, cropHi:'चना दाल', cropEn:'Chana Dal', market:'भोपाल मंडी, मप्र', min:8400, max:8900, modal:8800, unit:'क्विंटल', date:'10-09-2026'},
  {id:8, cropHi:'आम (दशहरी)', cropEn:'Mango (Dasheri)', market:'लखनऊ मंडी, यूपी', min:5500, max:7000, modal:6500, unit:'क्विंटल', date:'10-09-2026'},
  {id:9, cropHi:'संतरा', cropEn:'Orange', market:'नागपुर मंडी, महाराष्ट्र', min:4200, max:5000, modal:4800, unit:'क्विंटल', date:'10-09-2026'},
  {id:10, cropHi:'मक्का', cropEn:'Maize', market:'उन्नाव मंडी, यूपी', min:1780, max:1920, modal:1850, unit:'क्विंटल', date:'10-09-2026'},
];

const MY_LISTINGS_SEED = [
  {emoji:'🌾', cat:'grain', nameHi:'गेहूं (गेहूं 306)', nameEn:'Wheat (HD-2967)', qty:'42 क्विंटल', qtyEn:'42 Quintal', price:'₹2,150 / क्विंटल', priceEn:'₹2,150 / Quintal', status:'inStock', highDemand:true},
  {emoji:'🍅', cat:'veg', nameHi:'ताज़ा टमाटर', nameEn:'Fresh Tomato', qty:'बिक गया', qtyEn:'Sold out', price:'₹22 / किलो', priceEn:'₹22 / Kg', status:'sold', highDemand:false},
];

let state = {
  lang:'hi',            // 'hi' or 'en'
  role:'buyer',
  activeCat:'all',
  cart:{},               // id -> qty
  currentScreen:'home',
  payMethod:'upi',
  user:null,              // {name, aadhaar, role}
  loginRoleChoice:'buyer',
  myListings: MY_LISTINGS_SEED.slice(),
  acEmoji:'🌾',
  acCat:'grain',
  acDemand:false,
  govtRates: [],
  address:{name:'',phone:'',line1:'',line2:'',city:'',state:'',pin:''},
  needGstInvoice:false,
  gst:{number:'',billName:'',billAddr:''},
  lastOrder:null,          // {id, address, gst, subtotal, delivery, total, payMethod}
};

const CROP_EMOJIS = ['🌾','🌽','🍅','🧅','🥔','🥬','🫘','🥭','🍊','🍎','🍌','🥕','🌶️','🥦'];

// Real photos (Wikimedia Commons, freely licensed) shown in place of emoji icons
const WIKI = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=200`;
const PRODUCT_IMAGES = {
  1: WIKI('Wheat_grain.jpg'),
  2: WIKI('1121-Sella-Basmati-Rice.jpg'),
  3: WIKI('Tomatoes.jpg'),
  4: WIKI('Red_onions.jpg'),
  5: WIKI('Potatoes.jpg'),
  6: WIKI('Split_Red_Lentil.jpg'),
  7: WIKI('Chana_dal.jpg'),
  8: WIKI('Large_mango.jpg'),
  9: WIKI('Orange_fruit.jpeg'),
  10: WIKI('Corn_on_the_cob.jpg'),
};
const EMOJI_IMAGES = {
  '🌾': WIKI('Wheat_grain.jpg'),
  '🌽': WIKI('Corn_on_the_cob.jpg'),
  '🍅': WIKI('Tomatoes.jpg'),
  '🧅': WIKI('Red_onions.jpg'),
  '🥔': WIKI('Potatoes.jpg'),
  '🥬': WIKI('Spinach_leaves.jpg'),
  '🫘': WIKI('Chana_dal.jpg'),
  '🥭': WIKI('Large_mango.jpg'),
  '🍊': WIKI('Orange_fruit.jpeg'),
  '🍎': WIKI('Red_Apple.jpg'),
  '🍌': WIKI('Bananas.jpg'),
  '🥕': WIKI('Carrots.JPG'),
  '🌶️': WIKI('Chili_pepper.jpg'),
  '🥦': WIKI('Broccoli.jpg'),
};
function productImageUrl(productId, emoji){
  return PRODUCT_IMAGES[productId] || EMOJI_IMAGES[emoji] || null;
}
// Returns the media markup for a product/crop: a real photo if we have one, else the emoji as fallback
function mediaHtml(emoji, productId){
  const url = productImageUrl(productId, emoji);
  if(url){
    return `<img class="prod-img" src="${url}" alt="${emoji}" loading="eager" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'prod-img-fallback',textContent:'${emoji}'}))">`;
  }
  return emoji;
}


/* ---------------- HELPERS ---------------- */
function t(hi,en){ return state.lang==='hi' ? hi : en; }
function fmtMoney(n){ return '₹' + n.toLocaleString('en-IN'); }
function cartCount(){ return Object.values(state.cart).reduce((a,b)=>a+b,0); }
function cartTotal(){
  let sum=0;
  for(const id in state.cart){
    const p = PRODUCTS.find(x=>x.id==id);
    if(p) sum += p.price * state.cart[id];
  }
  return sum;
}
function showToast(msg){
  const el=document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>el.classList.remove('show'), 1600);
}

/* ---------------- GOVT MANDI RATES (editable excel-like sheet) ---------------- */
function escAttr(s){ return String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
function loadGovtRates(){
  try{
    const saved = localStorage.getItem('ks_govt_rates');
    if(saved){
      const parsed = JSON.parse(saved);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  }catch(e){}
  return GOVT_RATES_SEED.map(r=>({...r}));
}
function renderGovtRates(){
  document.getElementById('govtUpdatedText').textContent = t('अंतिम अपडेट: आज','Last updated: today');
  const body = document.getElementById('govtRatesBody');
  body.innerHTML = state.govtRates.map((r,i)=>`
    <tr>
      <td><input class="sheet-cell static" value="${i+1}" readonly></td>
      <td><input class="sheet-cell" value="${escAttr(t(r.cropHi,r.cropEn))}" oninput="editGovtCell(${r.id}, state.lang==='hi'?'cropHi':'cropEn', this.value)"></td>
      <td><input class="sheet-cell" value="${escAttr(r.market)}" oninput="editGovtCell(${r.id},'market',this.value)"></td>
      <td><input class="sheet-cell num" type="number" value="${r.min}" oninput="editGovtCell(${r.id},'min',this.value)"></td>
      <td><input class="sheet-cell num" type="number" value="${r.max}" oninput="editGovtCell(${r.id},'max',this.value)"></td>
      <td><input class="sheet-cell num" type="number" value="${r.modal}" oninput="editGovtCell(${r.id},'modal',this.value)"></td>
      <td><input class="sheet-cell" value="${escAttr(r.unit)}" oninput="editGovtCell(${r.id},'unit',this.value)"></td>
      <td><input class="sheet-cell" value="${escAttr(r.date)}" oninput="editGovtCell(${r.id},'date',this.value)"></td>
      <td><button class="sheet-del" onclick="deleteGovtRow(${r.id})" title="Delete row">🗑</button></td>
    </tr>
  `).join('');
}
function editGovtCell(id, field, value){
  const row = state.govtRates.find(r=>r.id===id);
  if(!row) return;
  if(field==='min' || field==='max' || field==='modal') value = Number(value) || 0;
  row[field] = value;
}
function addGovtRow(){
  const newId = (state.govtRates.length ? Math.max(...state.govtRates.map(r=>r.id)) : 0) + 1;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yyyy = today.getFullYear();
  state.govtRates.push({id:newId, cropHi:'', cropEn:'', market:'', min:0, max:0, modal:0, unit:'क्विंटल', date:`${dd}-${mm}-${yyyy}`});
  renderGovtRates();
  showToast(t('नई पंक्ति जोड़ी गई ✓','New row added ✓'));
}
function deleteGovtRow(id){
  state.govtRates = state.govtRates.filter(r=>r.id!==id);
  renderGovtRates();
  showToast(t('पंक्ति हटाई गई','Row removed'));
}
function saveGovtRates(){
  try{ localStorage.setItem('ks_govt_rates', JSON.stringify(state.govtRates)); }catch(e){}
  showToast(t('भाव सेव हो गए ✓','Rates saved ✓'));
}
/* ---------------- RENDER: CHIPS ---------------- */
function renderChips(){
  const row = document.getElementById('chipRow');
  row.innerHTML = CATEGORIES.map(c => `
    <button class="chip ${state.activeCat===c.id?'active':''}" onclick="setCategory('${c.id}')">
      <span>${c.icon}</span>${t(c.hi,c.en)}
    </button>
  `).join('');
}
function setCategory(id){ state.activeCat=id; renderChips(); renderProducts(); }

/* ---------------- RENDER: PRODUCTS ---------------- */
function renderProducts(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  let list = PRODUCTS.filter(p=>{
    const matchCat = state.activeCat==='all' || p.cat===state.activeCat;
    const matchQ = !q || p.nameHi.includes(q) || p.nameEn.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  document.getElementById('listCount').textContent = list.length + ' ' + t('उत्पाद','items');
  const grid = document.getElementById('productGrid');
  if(list.length===0){
    grid.innerHTML = '';
    grid.parentElement.querySelector('.grid').style.display='none';
    return;
  }
  grid.innerHTML = list.map(p=>{
    const qty = state.cart[p.id] || 0;
    return `
    <div class="card">
      <div class="card-media">
        ${p.highDemand ? `<span class="badge demand">${t('ज़्यादा मांग','High demand')}</span>` : `<span class="badge">${t('ताज़ा','Fresh')}</span>`}
        ${mediaHtml(p.emoji, p.id)}
      </div>
      <div class="card-body">
        <div class="card-title">${t(p.nameHi,p.nameEn)}</div>
        <div class="card-sub">👨‍🌾 ${p.farmer}</div>
        <div class="card-price">${fmtMoney(p.price)} <small>/ ${p.unit}</small></div>
        <div class="card-footer">
          ${qty===0
            ? `<button class="add-btn" onclick="addToCart(${p.id})">+ ${t('कार्ट में जोड़ें','Add to Cart')}</button>`
            : `<div class="stepper">
                 <button onclick="changeQty(${p.id},-1)">−</button>
                 <span>${qty}</span>
                 <button onclick="changeQty(${p.id},1)">+</button>
               </div>`
          }
        </div>
      </div>
    </div>`;
  }).join('');
}

function addToCart(id){
  state.cart[id] = (state.cart[id]||0) + 1;
  renderProducts();
  updateCartBadges();
  showToast(t('कार्ट में जोड़ा गया ✓','Added to cart ✓'));
}
function changeQty(id,delta){
  const cur = state.cart[id] || 0;
  const next = cur + delta;
  if(next<=0){ delete state.cart[id]; } else { state.cart[id]=next; }
  renderProducts();
  renderCart();
  updateCartBadges();
}
function removeFromCart(id){
  delete state.cart[id];
  renderCart();
  renderProducts();
  updateCartBadges();
}

function updateCartBadges(){
  const c = cartCount();
  const dot = document.getElementById('cartDot');
  const navBadge = document.getElementById('navCartBadge');
  if(c>0){
    dot.textContent=c; dot.classList.remove('hidden');
    navBadge.textContent=c; navBadge.classList.remove('hidden');
  } else {
    dot.classList.add('hidden');
    navBadge.classList.add('hidden');
  }
}

/* ---------------- RENDER: CART ---------------- */
function renderCart(){
  const ids = Object.keys(state.cart);
  const emptyEl = document.getElementById('cartEmpty');
  const hasEl = document.getElementById('cartHasItems');
  const checkoutBar = document.getElementById('checkoutBar');
  if(ids.length===0){
    emptyEl.classList.remove('hidden');
    hasEl.classList.add('hidden');
    checkoutBar.classList.add('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  hasEl.classList.remove('hidden');
  checkoutBar.classList.remove('hidden');

  document.getElementById('cartItemCount').textContent = cartCount() + ' ' + t('वस्तुएं','items');

  document.getElementById('cartItemsWrap').innerHTML = ids.map(id=>{
    const p = PRODUCTS.find(x=>x.id==id);
    const qty = state.cart[id];
    return `
    <div class="cart-item">
      <div class="ci-media">${mediaHtml(p.emoji, p.id)}</div>
      <div class="ci-info">
        <div class="ci-title">${t(p.nameHi,p.nameEn)}</div>
        <div class="ci-sub">${p.farmer}</div>
        <div class="ci-price">${fmtMoney(p.price*qty)}</div>
        <button class="remove-x" onclick="removeFromCart(${p.id})">${t('हटाएं','Remove')}</button>
      </div>
      <div class="ci-stepper">
        <button onclick="changeQty(${p.id},-1)">−</button>
        <span>${qty}</span>
        <button onclick="changeQty(${p.id},1)">+</button>
      </div>
    </div>`;
  }).join('');

  const subtotal = cartTotal();
  const delivery = subtotal>0 ? 40 : 0;
  const total = subtotal + delivery;
  document.getElementById('summaryCard').innerHTML = `
    <div class="summary-row"><span>${t('उप-कुल / Subtotal','Subtotal')}</span><span>${fmtMoney(subtotal)}</span></div>
    <div class="summary-row"><span>${t('डिलीवरी शुल्क','Delivery fee')}</span><span>${fmtMoney(delivery)}</span></div>
    <div class="summary-row total"><span>${t('कुल राशि','Total')}</span><span>${fmtMoney(total)}</span></div>
  `;
  document.getElementById('checkoutAmt').textContent = fmtMoney(total);
}

/* ---------------- FARMER VIEW ---------------- */
function renderFarmer(){
  document.getElementById('farmerCount').textContent = state.myListings.length + ' ' + t('लिस्टिंग','listings');
  document.getElementById('farmerListings').innerHTML = state.myListings.map(l=>`
    <div class="farm-row">
      <div class="fi">
        <div class="emoji">${mediaHtml(l.emoji, l.productId)}</div>
        <div>
          <div class="name">${t(l.nameHi,l.nameEn)} ${l.highDemand && l.status==='inStock' ? '🔥' : ''}</div>
          <div class="meta">${t(l.qty,l.qtyEn)} • ${t(l.price,l.priceEn)}</div>
        </div>
      </div>
      <div class="status-pill ${l.status}">${l.status==='inStock' ? t('उपलब्ध','inStock') : t('बिका','Sold')}</div>
    </div>
  `).join('');
}
function openAddCrop(){
  resetAddCropForm();
  goScreen('addcrop');
}

/* ---------------- ADD CROP FORM ---------------- */
function renderEmojiRow(){
  document.getElementById('emojiRow').innerHTML = CROP_EMOJIS.map(e=>`
    <button type="button" class="emoji-opt ${state.acEmoji===e?'selected':''}" onclick="pickEmoji('${e}')">${mediaHtml(e, null)}</button>
  `).join('');
}
function pickEmoji(e){
  state.acEmoji = e;
  renderEmojiRow();
}
function renderAcCatRow(){
  document.getElementById('acCatRow').innerHTML = CATEGORIES.filter(c=>c.id!=='all').map(c=>`
    <button type="button" class="cat-opt ${state.acCat===c.id?'selected':''}" onclick="pickAcCat('${c.id}')">${c.icon} ${t(c.hi,c.en)}</button>
  `).join('');
}
function pickAcCat(id){
  state.acCat = id;
  renderAcCatRow();
}
function toggleDemand(){
  state.acDemand = !state.acDemand;
  document.getElementById('demandSwitch').classList.toggle('on', state.acDemand);
}
function updatePricePreview(){
  const qty = parseFloat(document.getElementById('acQty').value) || 0;
  const price = parseFloat(document.getElementById('acPrice').value) || 0;
  document.getElementById('ppVal').textContent = fmtMoney(Math.round(qty*price));
}
function resetAddCropForm(){
  state.acEmoji = '🌾';
  state.acCat = 'grain';
  state.acDemand = false;
  document.getElementById('acNameHi').value='';
  document.getElementById('acNameEn').value='';
  document.getElementById('acQty').value='';
  document.getElementById('acUnit').value='क्विंटल';
  document.getElementById('acPrice').value='';
  document.getElementById('acLoc').value='';
  document.getElementById('acNote').value='';
  document.getElementById('demandSwitch').classList.remove('on');
  document.getElementById('ppVal').textContent='₹0';
  renderEmojiRow();
  renderAcCatRow();
}
function submitAddCrop(){
  const nameHi = document.getElementById('acNameHi').value.trim();
  const nameEn = document.getElementById('acNameEn').value.trim();
  const qty = document.getElementById('acQty').value.trim();
  const unit = document.getElementById('acUnit').value;
  const price = document.getElementById('acPrice').value.trim();

  if(!nameHi && !nameEn){ showToast(t('कृपया फसल का नाम डालें','Please enter the crop name')); return; }
  if(!qty || Number(qty)<=0){ showToast(t('कृपया सही मात्रा डालें','Please enter a valid quantity')); return; }
  if(!price || Number(price)<=0){ showToast(t('कृपया सही मूल्य डालें','Please enter a valid price')); return; }

  const finalNameHi = nameHi || nameEn;
  const finalNameEn = nameEn || nameHi;
  const loc = document.getElementById('acLoc').value.trim();
  const farmerName = state.user && !state.user.guest ? state.user.name : t('आप','You');
  const farmerLabel = loc ? `${farmerName}, ${loc}` : farmerName;
  const newId = (PRODUCTS.length ? Math.max(...PRODUCTS.map(p=>p.id)) : 0) + 1;

  // Buyer-facing product so it shows up on the buyer home page immediately
  PRODUCTS.unshift({
    id: newId,
    cat: state.acCat,
    emoji: state.acEmoji,
    nameHi: finalNameHi,
    nameEn: finalNameEn,
    farmer: farmerLabel,
    price: Number(price),
    unit,
    highDemand: state.acDemand,
    stock: Number(qty),
  });

  state.myListings.unshift({
    productId: newId,
    emoji: state.acEmoji,
    cat: state.acCat,
    nameHi: finalNameHi,
    nameEn: finalNameEn,
    qty: `${qty} ${unit}`,
    qtyEn: `${qty} ${unit}`,
    price: `${fmtMoney(Number(price))} / ${unit}`,
    priceEn: `${fmtMoney(Number(price))} / ${unit}`,
    status:'inStock',
    highDemand: state.acDemand,
    loc,
  });

  renderProducts();
  showToast(t('फसल सफलतापूर्वक लिस्ट हो गई और खरीदारों को दिख रही है ✓','Crop listed successfully — now visible to buyers ✓'));
  goScreen('farmer');
}

/* ---------------- NAVIGATION ---------------- */
function goScreen(name){
  ['home','farmer','cart','address','payment','success','profile','addcrop','govtrates'].forEach(s=>{
    document.getElementById('screen-'+s)?.classList.add('hidden');
  });
  document.getElementById('checkoutBar').classList.add('hidden');
  document.getElementById('addressBar').classList.add('hidden');
  document.getElementById('payBar').classList.add('hidden');
  document.getElementById('searchWrap').style.display='flex';
  document.getElementById('locRow').style.display='flex';

  if(name==='orders'){ showToast(t('डेमो: ऑर्डर हिस्ट्री यहां दिखेगी','Demo: order history shown here')); name='home'; }

  state.currentScreen = name;

  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  const navMap = {home:'home', cart:'cart', profile:'profile'};
  document.querySelector(`.navbtn[data-nav="${navMap[name]||'home'}"]`)?.classList.add('active');

  if(name==='home'){
    document.getElementById('screen-home').classList.remove('hidden');
    document.getElementById('bottomNav').classList.remove('hidden');
  } else if(name==='farmer'){
    document.getElementById('screen-farmer').classList.remove('hidden');
    document.getElementById('bottomNav').classList.remove('hidden');
    document.getElementById('searchWrap').style.display='none';
    renderFarmer();
  } else if(name==='profile'){
    document.getElementById('screen-profile').classList.remove('hidden');
    document.getElementById('bottomNav').classList.remove('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
    renderProfile();
  } else if(name==='cart'){
    document.getElementById('screen-cart').classList.remove('hidden');
    document.getElementById('bottomNav').classList.remove('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
    renderCart();
  } else if(name==='address'){
    document.getElementById('screen-address').classList.remove('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
    document.getElementById('addressBar').classList.remove('hidden');
    renderAddressScreen();
  } else if(name==='payment'){
    document.getElementById('screen-payment').classList.remove('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
    document.getElementById('payBar').classList.remove('hidden');
    renderPayment();
  } else if(name==='success'){
    document.getElementById('screen-success').classList.remove('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
  } else if(name==='addcrop'){
    document.getElementById('screen-addcrop').classList.remove('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
  } else if(name==='govtrates'){
    document.getElementById('screen-govtrates').classList.remove('hidden');
    document.getElementById('bottomNav').classList.add('hidden');
    document.getElementById('searchWrap').style.display='none';
    document.getElementById('locRow').style.display='none';
    renderGovtRates();
  }
}

function goToAddress(){
  if(cartCount()===0) return;
  goScreen('address');
}

function goToPayment(){
  if(cartCount()===0) return;
  goScreen('payment');
}

/* ---------------- ADDRESS & INVOICE DETAILS ---------------- */
function renderAddressScreen(){
  const a = state.address;
  document.getElementById('adName').value = a.name;
  document.getElementById('adPhone').value = a.phone;
  document.getElementById('adLine1').value = a.line1;
  document.getElementById('adLine2').value = a.line2;
  document.getElementById('adCity').value = a.city;
  document.getElementById('adState').value = a.state;
  document.getElementById('adPin').value = a.pin;

  document.getElementById('gstSwitch').classList.toggle('on', state.needGstInvoice);
  document.getElementById('gstFields').classList.toggle('hidden', !state.needGstInvoice);
  document.getElementById('adGstNum').value = state.gst.number;
  document.getElementById('adBillName').value = state.gst.billName;
  document.getElementById('adBillAddr').value = state.gst.billAddr;

  const subtotal = cartTotal();
  const delivery = subtotal>0 ? 40 : 0;
  document.getElementById('addressAmt').textContent = fmtMoney(subtotal + delivery);
}

function toggleGstInvoice(){
  state.needGstInvoice = !state.needGstInvoice;
  document.getElementById('gstSwitch').classList.toggle('on', state.needGstInvoice);
  document.getElementById('gstFields').classList.toggle('hidden', !state.needGstInvoice);
}

function saveAddressAndContinue(){
  const name = document.getElementById('adName').value.trim();
  const phone = document.getElementById('adPhone').value.trim();
  const line1 = document.getElementById('adLine1').value.trim();
  const line2 = document.getElementById('adLine2').value.trim();
  const city = document.getElementById('adCity').value.trim();
  const st = document.getElementById('adState').value.trim();
  const pin = document.getElementById('adPin').value.trim();

  if(!name || !phone || !line1 || !city || !st || !pin){
    showToast(t('कृपया सभी ज़रूरी पता विवरण भरें','Please fill all required address fields'));
    return;
  }
  if(!/^\d{10}$/.test(phone)){
    showToast(t('कृपया सही 10-अंकों का मोबाइल नंबर डालें','Please enter a valid 10-digit mobile number'));
    return;
  }
  if(!/^\d{6}$/.test(pin)){
    showToast(t('कृपया सही 6-अंकों का पिन कोड डालें','Please enter a valid 6-digit PIN code'));
    return;
  }

  state.address = {name, phone, line1, line2, city, state:st, pin};

  if(state.needGstInvoice){
    const gstNum = document.getElementById('adGstNum').value.trim();
    const billName = document.getElementById('adBillName').value.trim();
    const billAddr = document.getElementById('adBillAddr').value.trim();
    if(!gstNum || !billName){
      showToast(t('कृपया GSTIN और बिलिंग नाम भरें','Please fill GSTIN and billing name'));
      return;
    }
    state.gst = {number:gstNum, billName, billAddr};
  } else {
    state.gst = {number:'', billName:'', billAddr:''};
  }

  goScreen('payment');
}

function selectPay(method){
  state.payMethod = method;
  document.querySelectorAll('.pay-option').forEach(el=>{
    el.classList.toggle('selected', el.dataset.pay===method);
  });
  document.getElementById('upiInputWrap').style.display = method==='upi' ? 'block' : 'none';
}

function renderPayment(){
  const subtotal = cartTotal();
  const delivery = subtotal>0 ? 40 : 0;
  const total = subtotal + delivery;
  const a = state.address;
  const deliverToRow = a && a.line1 ? `
    <div class="summary-row"><span>${t('डिलीवर होगा','Deliver to')}</span><span></span></div>
    <div class="summary-row"><span>${a.name} · ${a.phone}<br>${[a.line1,a.line2,a.city,a.state,a.pin].filter(Boolean).join(', ')} <a href="javascript:void(0)" onclick="goScreen('address')" style="color:var(--green-700); font-weight:700;">${t('बदलें','Change')}</a></span><span></span></div>
  ` : '';
  document.getElementById('paySummaryCard').innerHTML = `
    ${deliverToRow}
    <div class="summary-row"><span>${t('उप-कुल','Subtotal')}</span><span>${fmtMoney(subtotal)}</span></div>
    <div class="summary-row"><span>${t('डिलीवरी शुल्क','Delivery fee')}</span><span>${fmtMoney(delivery)}</span></div>
    <div class="summary-row total"><span>${t('कुल देय राशि','Total payable')}</span><span>${fmtMoney(total)}</span></div>
  `;
  document.getElementById('payAmt').textContent = fmtMoney(total);
  selectPay(state.payMethod);
}

function placeOrder(){
  if(state.payMethod==='upi'){
    const upi = document.getElementById('upiId').value.trim();
    if(!upi.includes('@')){
      showToast(t('कृपया सही UPI ID डालें','Please enter a valid UPI ID'));
      return;
    }
  }
  const subtotal = cartTotal();
  const delivery = subtotal>0 ? 40 : 0;
  const orderId = 'KS' + Math.floor(1000+Math.random()*9000);
  const items = Object.keys(state.cart).map(id=>{
    const p = PRODUCTS.find(x=>x.id==id);
    const qty = state.cart[id];
    return {nameHi:p.nameHi, nameEn:p.nameEn, unit:p.unit, price:p.price, qty, amount:p.price*qty, farmer:p.farmer};
  });
  state.lastOrder = {
    id:orderId,
    date: new Date(),
    items,
    address:{...state.address},
    gst: state.needGstInvoice ? {...state.gst} : null,
    subtotal, delivery, total: subtotal+delivery,
    payMethod: state.payMethod
  };
  document.getElementById('orderIdText').textContent = 'Order #' + orderId;
  renderInvoiceSummary();
  state.cart = {};
  updateCartBadges();
  goScreen('success');
}

function fmtInvoiceDate(d){
  if(!d) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function renderInvoiceSummary(){
  const o = state.lastOrder;
  const box = document.getElementById('invoiceSummaryCard');
  if(!o || !box) return;
  const a = o.address;
  const payLabel = o.payMethod==='upi' ? 'UPI' : (o.payMethod==='card' ? t('कार्ड','Card') : t('कैश ऑन डिलीवरी','Cash on Delivery'));

  let gstBlock = '';
  if(o.gst && o.gst.number){
    gstBlock = `
      <div class="summary-row"><span>${t('GSTIN','GSTIN')}</span><span>${o.gst.number}</span></div>
      <div class="summary-row"><span>${t('बिलिंग नाम','Billing name')}</span><span>${o.gst.billName}</span></div>
    `;
  }

  const itemRows = (o.items||[]).map(it=>`
    <div class="summary-row">
      <span>${t(it.nameHi,it.nameEn)}<br><span style="font-size:11px;">${it.qty} ${it.unit} × ${fmtMoney(it.price)}</span></span>
      <span>${fmtMoney(it.amount)}</span>
    </div>
  `).join('');

  box.innerHTML = `
    <div class="summary-row"><span><b>${t('इनवॉइस / रसीद','Invoice / Receipt')}</b></span><span></span></div>
    <div class="summary-row"><span>${t('इनवॉइस नंबर','Invoice No.')}</span><span>INV-${o.id}</span></div>
    <div class="summary-row"><span>${t('दिनांक','Date')}</span><span>${fmtInvoiceDate(o.date)}</span></div>
    <div class="summary-row" style="border-top:1px dashed var(--line); margin-top:6px; padding-top:8px;"><span><b>${t('खरीदी गई वस्तुएं','Items Purchased')}</b></span><span></span></div>
    ${itemRows}
    <div class="summary-row" style="border-top:1px dashed var(--line); margin-top:6px; padding-top:8px;"><span><b>${t('डिलीवरी पता','Delivery Address')}</b></span><span></span></div>
    <div class="summary-row"><span>${a.name}${a.phone ? ' · '+a.phone : ''}</span><span></span></div>
    <div class="summary-row"><span>${[a.line1,a.line2,a.city,a.state,a.pin].filter(Boolean).join(', ')}</span><span></span></div>
    ${gstBlock}
    <div class="summary-row"><span>${t('भुगतान का तरीका','Payment method')}</span><span>${payLabel}</span></div>
    <div class="summary-row" style="border-top:1px dashed var(--line); margin-top:6px; padding-top:8px;"><span>${t('उप-कुल','Subtotal')}</span><span>${fmtMoney(o.subtotal)}</span></div>
    <div class="summary-row"><span>${t('डिलीवरी शुल्क','Delivery fee')}</span><span>${fmtMoney(o.delivery)}</span></div>
    <div class="summary-row total"><span>${t('कुल राशि','Total')}</span><span>${fmtMoney(o.total)}</span></div>
  `;
}

/* ---- Download invoice as a standalone HTML receipt file ---- */
function downloadInvoice(){
  const o = state.lastOrder;
  if(!o) return;
  const a = o.address;
  const payLabel = o.payMethod==='upi' ? 'UPI' : (o.payMethod==='card' ? t('कार्ड','Card') : t('कैश ऑन डिलीवरी','Cash on Delivery'));
  const itemsHtml = (o.items||[]).map(it=>`
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${t(it.nameHi,it.nameEn)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.qty} ${it.unit}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(it.price)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(it.amount)}</td>
    </tr>
  `).join('');
  const gstHtml = (o.gst && o.gst.number) ? `
    <p style="margin:2px 0;"><b>GSTIN:</b> ${o.gst.number}</p>
    <p style="margin:2px 0;"><b>${t('बिलिंग नाम','Billing name')}:</b> ${o.gst.billName}</p>
    ${o.gst.billAddr ? `<p style="margin:2px 0;"><b>${t('बिलिंग पता','Billing address')}:</b> ${o.gst.billAddr}</p>` : ''}
  ` : '';
  const html = `<!DOCTYPE html>
<html lang="${state.lang}">
<head>
<meta charset="UTF-8">
<title>Invoice INV-${o.id}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif; color:#1B241C; max-width:640px; margin:24px auto; padding:0 16px;}
  h1{color:#1F5E3D; font-size:22px; margin-bottom:2px;}
  .muted{color:#5C6B5E; font-size:13px;}
  table{width:100%; border-collapse:collapse; margin-top:14px;}
  th{background:#E3EEE3; text-align:left; padding:8px; font-size:13px;}
  td{font-size:13px;}
  .totals{margin-top:10px; width:100%;}
  .totals td{padding:4px 8px;}
  .totals .grand{font-weight:800; font-size:15px; border-top:2px solid #1F5E3D;}
  .box{background:#F6F6EF; border-radius:10px; padding:12px 14px; margin-top:14px;}
</style>
</head>
<body>
  <h1>UpajSahyog — उपज सहयोग</h1>
  <p class="muted">${t('कर रसीद / टैक्स इनवॉइस','Tax Invoice / Receipt')}</p>
  <p><b>${t('इनवॉइस नंबर','Invoice No.')}:</b> INV-${o.id} &nbsp;&nbsp; <b>${t('दिनांक','Date')}:</b> ${fmtInvoiceDate(o.date)}</p>

  <div class="box">
    <p style="margin:2px 0;"><b>${t('डिलीवरी पता / Bill To','Delivery Address / Bill To')}:</b></p>
    <p style="margin:2px 0;">${a.name} · ${a.phone}</p>
    <p style="margin:2px 0;">${[a.line1,a.line2,a.city,a.state,a.pin].filter(Boolean).join(', ')}</p>
    ${gstHtml}
  </div>

  <table>
    <thead><tr><th>${t('वस्तु','Item')}</th><th style="text-align:center;">${t('मात्रा','Qty')}</th><th style="text-align:right;">${t('दर','Rate')}</th><th style="text-align:right;">${t('राशि','Amount')}</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <table class="totals">
    <tr><td>${t('उप-कुल','Subtotal')}</td><td style="text-align:right;">${fmtMoney(o.subtotal)}</td></tr>
    <tr><td>${t('डिलीवरी शुल्क','Delivery fee')}</td><td style="text-align:right;">${fmtMoney(o.delivery)}</td></tr>
    <tr class="grand"><td>${t('कुल राशि','Total')}</td><td style="text-align:right;">${fmtMoney(o.total)}</td></tr>
  </table>

  <p style="margin-top:14px;"><b>${t('भुगतान का तरीका','Payment method')}:</b> ${payLabel}</p>
  <p class="muted" style="margin-top:24px;">${t('धन्यवाद! UpajSahyog से खरीदारी के लिए शुक्रिया।','Thank you for shopping with UpajSahyog!')}</p>
</body>
</html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${o.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function backToHomeFresh(){
  goScreen('home');
    }
/* ---------------- LOGIN / PROFILE ---------------- */
function setLoginRole(role){
  state.loginRoleChoice = role;
  document.getElementById('loginRoleBuyer').classList.toggle('selected', role==='buyer');
  document.getElementById('loginRoleFarmer').classList.toggle('selected', role==='farmer');
}

function sendOtp(){
  const name = document.getElementById('loginName').value.trim();
  const mobile = document.getElementById('loginMobile').value.trim();
  if(name.length<2){ showToast(t('कृपया अपना नाम डालें','Please enter your name')); return; }
  if(mobile.length!==12 || isNaN(mobile)){ showToast(t('12 अंकों का सही आधार नंबर डालें','Enter a valid 12-digit Aadhaar number')); return; }
  document.getElementById('loginStep1').classList.add('hidden');
  document.getElementById('loginStep2').classList.remove('hidden');
  showToast(t('आधार से लिंक मोबाइल पर OTP भेजा गया (डेमो: 1234)','OTP sent to Aadhaar-linked mobile (demo: 1234)'));
}

function verifyOtp(){
  const otp = document.getElementById('loginOtp').value.trim();
  if(otp.length!==4 || isNaN(otp)){
    showToast(t('4 अंकों का सही OTP डालें','Enter a valid 4-digit OTP'));
    return;
  }
  const name = document.getElementById('loginName').value.trim();
  const aadhaar = document.getElementById('loginMobile').value.trim();
  completeLogin({name, aadhaar, role: state.loginRoleChoice, guest:false});
}

function skipLogin(){
  completeLogin({name: t('अतिथि उपयोगकर्ता','Guest User'), aadhaar:'', role: state.loginRoleChoice, guest:true});
}

function completeLogin(user){
  state.user = user;
  try{ localStorage.setItem('ks_user', JSON.stringify(user)); }catch(e){}
  document.getElementById('loginOverlay').classList.add('hidden');
  setRole(user.role);
}

function logout(){
  state.user = null;
  try{ localStorage.removeItem('ks_user'); }catch(e){}
  document.getElementById('loginName').value='';
  document.getElementById('loginMobile').value='';
  document.getElementById('loginOtp').value='';
  document.getElementById('loginStep1').classList.remove('hidden');
  document.getElementById('loginStep2').classList.add('hidden');
  document.getElementById('loginOverlay').classList.remove('hidden');
}

function initials(name){
  const parts = name.trim().split(' ').filter(Boolean);
  if(parts.length===0) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function handleAvatarUpload(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){
    showToast(t('कृपया एक तस्वीर फ़ाइल चुनें','Please choose an image file'));
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result;
    if(!state.user){ state.user = {name:t('अतिथि उपयोगकर्ता','Guest User'), aadhaar:'', role:state.role, guest:true}; }
    state.user.photo = dataUrl;
    try{ localStorage.setItem('ks_user', JSON.stringify(state.user)); }catch(err){}
    renderProfile();
    showToast(t('प्रोफ़ाइल फोटो अपडेट हो गई ✓','Profile photo updated ✓'));
  };
  reader.onerror = function(){
    showToast(t('फोटो अपलोड नहीं हो पाई, दोबारा कोशिश करें','Could not upload photo, please try again'));
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}
function renderProfile(){
  const u = state.user || {name:t('अतिथि उपयोगकर्ता','Guest User'), aadhaar:'', role:state.role, guest:true};
  const avatarEl = document.getElementById('profileAvatar');
  if(u.photo){
    avatarEl.innerHTML = `<img src="${u.photo}" alt="${t('प्रोफ़ाइल फोटो','Profile photo')}">`;
  } else {
    avatarEl.textContent = initials(u.name);
  }
  document.getElementById('profileName').textContent = u.name;
  document.getElementById('profileMobile').textContent = u.aadhaar ? ('आधार / Aadhaar: XXXX XXXX ' + u.aadhaar.slice(-4)) : t('गेस्ट मोड — कोई आधार सेव नहीं','Guest mode — no Aadhaar saved');
  document.getElementById('profileRoleBadge').textContent = u.role==='farmer' ? t('🌱 किसान / Farmer','🌱 Farmer') : t('🧺 खरीदार / Buyer','🧺 Buyer');
  document.getElementById('profRow3Wrap').style.display = u.role==='farmer' ? 'flex' : 'none';
}

/* ---------------- ROLE / LANG ---------------- */
function setRole(role){
  state.role = role;
  document.getElementById('roleBuyerBtn').classList.toggle('active', role==='buyer');
  document.getElementById('roleFarmerBtn').classList.toggle('active', role==='farmer');
  if(role==='buyer'){
    goScreen('home');
  } else {
    goScreen('farmer');
  }
}

function toggleLang(){
  state.lang = state.lang==='hi' ? 'en' : 'hi';
  refreshStaticText();
  renderChips();
  renderProducts();
  if(state.currentScreen==='farmer') renderFarmer();
  if(state.currentScreen==='cart') renderCart();
  if(state.currentScreen==='payment') renderPayment();
}

function refreshStaticText(){
  document.getElementById('chatBotSub').textContent = t('हमेशा उपलब्ध','Always available');
  document.getElementById('chatInput').placeholder = t('अपना सवाल लिखें...','Type your question...');
  if(!document.getElementById('chatPanel').classList.contains('hidden')) renderChatQuickRow();
  document.getElementById('tagline').textContent = t('सीधे खेत से आपके घर तक','Straight from farm to your home');
  document.getElementById('rb-label').textContent = t('खरीदार / Buyer','Buyer / खरीदार');
  document.getElementById('rf-label').textContent = t('किसान / Farmer','Farmer / किसान');
  document.getElementById('locText').textContent = t('छपरा, बिहार — बदलें','Nalanda, Bihar — Change');
  document.getElementById('listHeading').textContent = t('ताज़ा उपज / Fresh from Farms','Fresh from Farms');
  document.getElementById('searchInput').placeholder = t('अनाज, सब्ज़ी खोजें...','Search grains, veggies...');
  document.getElementById('checkoutSmall').textContent = t('कुल राशि / Total','Total');
  document.getElementById('checkoutBtn').textContent = t('आगे बढ़ें →','Proceed →');
  document.getElementById('navProfileLbl').textContent = t('प्रोफ़ाइल','Profile');

  document.getElementById('govtBannerTitle').textContent = t('सरकारी मंडी भाव देखें','View Govt Mandi Rates');
  document.getElementById('govtBannerSub').textContent = t('आधिकारिक दाम — असली व सटीक कीमत जानें','Official rates — know the real, genuine price');
  document.getElementById('govtRatesTitle').textContent = t('सरकारी मंडी भाव / Govt Mandi Rates','Govt Mandi Rates');
  document.getElementById('govtSourceBadge').textContent = t('📡 स्रोत: कृषि विभाग / मंडी समिति','📡 Source: Agriculture Dept. / Mandi Board');
  document.getElementById('govtNoteText').textContent = t(
    'यह आधिकारिक सरकारी मंडी भाव है ताकि सभी को असली और सही कीमत पता चल सके। मंडी अधिकारी/एडमिन नीचे दी गई शीट में भाव अपडेट कर सकते हैं — बिल्कुल एक्सेल शीट की तरह।',
    'These are official government mandi rates so everyone can see the real, genuine price. Mandi officials/admins can update rates in the sheet below — just like an Excel sheet.'
  );
  document.getElementById('govtAddBtn').textContent = t('+ नई पंक्ति / Add Row','+ Add Row');
  document.getElementById('govtSaveBtn').textContent = t('💾 सेव करें / Save','💾 Save');
  document.getElementById('thCrop').textContent = t('फसल / Commodity','Commodity');
  document.getElementById('thMarket').textContent = t('मंडी / Market','Market');
  document.getElementById('thMin').textContent = t('न्यून. भाव / Min (₹)','Min (₹)');
  document.getElementById('thMax').textContent = t('अधि. भाव / Max (₹)','Max (₹)');
  document.getElementById('thModal').textContent = t('मॉडल भाव / Modal (₹)','Modal (₹)');
  document.getElementById('thUnit').textContent = t('इकाई / Unit','Unit');
  document.getElementById('thDate').textContent = t('दिनांक / Date','Date');
  document.getElementById('profRowGovt').textContent = t('सरकारी मंडी भाव / Govt Mandi Rates','Govt Mandi Rates');
  if(state.currentScreen==='govtrates') renderGovtRates();

  document.getElementById('loginTitle').textContent = t('UpajSahyog में आपका स्वागत है','Welcome to UpajSahyog');
  document.getElementById('loginSub').textContent = t('जारी रखने के लिए अपनी जानकारी भरें','Fill your details to continue');
  document.getElementById('loginRoleLabel').textContent = t('आप कौन हैं?','You are a');
  document.getElementById('loginRoleBuyerLbl').textContent = t('खरीदार / Buyer','Buyer');
  document.getElementById('loginRoleFarmerLbl').textContent = t('किसान / Farmer','Farmer');
  document.getElementById('nameLabel').textContent = t('पूरा नाम','Full name');
  document.getElementById('mobileLabel').textContent = t('आधार कार्ड नंबर','Aadhaar number');
  document.getElementById('sendOtpBtn').textContent = t('OTP भेजें / Send OTP','Send OTP');
  document.getElementById('demoHint1').textContent = t('डेमो: कोई भी नाम व 12 अंक डालें','Demo: enter any name & 12 digits');
  document.getElementById('otpSentHint').textContent = t('आधार से लिंक मोबाइल नंबर पर OTP भेजा गया','OTP sent to Aadhaar-linked mobile number');
  document.getElementById('otpLabel').textContent = t('OTP दर्ज करें','Enter OTP');
  document.getElementById('verifyBtn').textContent = t('सत्यापित करें और आगे बढ़ें','Verify & Continue');
  document.getElementById('demoHint2').textContent = t('डेमो: कोई भी 4 अंक डालें','Demo: enter any 4 digits');
  document.getElementById('skipBtn').textContent = t('अभी के लिए छोड़ें (गेस्ट मोड)','Skip for now (guest)');

  document.getElementById('profRow1').textContent = t('पता बदलें','Change Address');
  document.getElementById('profRow2').textContent = t('मेरे ऑर्डर','My Orders');
  document.getElementById('profRow3').textContent = t('मेरी फसल लिस्टिंग','My Listings');
  document.getElementById('profRow4').textContent = t('भाषा बदलें','Change Language');
  document.getElementById('profRow5').textContent = t('सहायता','Help & Support');
  document.getElementById('profRow6').textContent = t('लॉग आउट','Logout');

  document.getElementById('addCropTitle').textContent = t('नई फसल जोड़ें','Add Produce');
  document.getElementById('acEmojiLabel').textContent = t('फसल की तस्वीर चुनें','Choose crop icon');
  document.getElementById('acCatLabel').textContent = t('श्रेणी','Category');
  document.getElementById('acNameHiLabel').textContent = t('फसल का नाम (हिंदी में)','Crop name (Hindi)');
  document.getElementById('acNameEnLabel').textContent = t('फसल का नाम (अंग्रेज़ी में)','Crop name (English)');
  document.getElementById('acQtyLabel').textContent = t('मात्रा','Quantity');
  document.getElementById('acUnitLabel').textContent = t('इकाई','Unit');
  document.getElementById('acPriceLabel').textContent = t('प्रति इकाई मूल्य (₹)','Price per unit (₹)');
  document.getElementById('ppLabel').textContent = t('अनुमानित कुल मूल्य','Estimated total value');
  document.getElementById('acLocLabel').textContent = t('स्थान','Location');
  document.getElementById('acNoteLabel').textContent = t('अतिरिक्त जानकारी (वैकल्पिक)','Notes (optional)');
  document.getElementById('dtTitle').textContent = t('ज़्यादा मांग टैग','High demand tag');
  document.getElementById('dtSub').textContent = t('खरीदारों को अधिक दिखेगा','Shows more to buyers');
  document.getElementById('acSubmitBtn').textContent = t('फसल लिस्ट करें','List Produce');
  renderAcCatRow();

  document.getElementById('addressTitle').textContent = t('डिलीवरी व इनवॉइस विवरण','Delivery & Invoice Details');
  document.getElementById('adNameLabel').textContent = t('पूरा नाम','Full Name');
  document.getElementById('adPhoneLabel').textContent = t('मोबाइल नंबर','Mobile Number');
  document.getElementById('adLine1Label').textContent = t('पता (लाइन 1)','Address Line 1');
  document.getElementById('adLine2Label').textContent = t('पता (लाइन 2, वैकल्पिक)','Address Line 2 (optional)');
  document.getElementById('adCityLabel').textContent = t('शहर / गांव','City / Village');
  document.getElementById('adStateLabel').textContent = t('राज्य','State');
  document.getElementById('adPinLabel').textContent = t('पिन कोड','PIN Code');
  document.getElementById('adGstTitle').textContent = t('GST इनवॉइस चाहिए','Need GST Invoice');
  document.getElementById('adGstSub').textContent = t('व्यवसाय के लिए टैक्स इनवॉइस','Tax invoice for business use');
  document.getElementById('adGstNumLabel').textContent = 'GSTIN';
  document.getElementById('adBillNameLabel').textContent = t('बिलिंग / फर्म का नाम','Billing / Firm Name');
  document.getElementById('adBillAddrLabel').textContent = t('बिलिंग पता','Billing Address');
  document.getElementById('addressBarSmall').textContent = t('कुल राशि / Total','Total');
  document.getElementById('addressContinueBtn').textContent = t('भुगतान पर जाएं →','Continue to Payment →');
  document.getElementById('paymentTitle').textContent = t('भुगतान का तरीका','Payment Method');
  document.getElementById('downloadInvoiceBtn').textContent = '⬇ ' + t('इनवॉइस डाउनलोड करें','Download Invoice');
  if(state.currentScreen==='address') renderAddressScreen();
  if(state.currentScreen==='payment') renderPayment();
  if(state.currentScreen==='success') renderInvoiceSummary();
  if(state.currentScreen==='farmer') renderFarmer();
  if(state.currentScreen==='profile') renderProfile();
}

/* ---------------- AI CHATBOT ---------------- */
state.chatMessages = [];   // {sender:'bot'|'user', text, action}
state.voiceOutput = true;   // बोलकर जवाब देना डिफ़ॉल्ट चालू — कम पढ़े-लिखे किसानों की मदद के लिए
let recognition = null;
let recognitionActive = false;

const QUICK_CHIPS = [
  {hi:'गेहूं का दाम क्या है?', en:'What is the wheat price?'},
  {hi:'सरकारी मंडी भाव बताओ', en:'Tell me official govt mandi rates'},
  {hi:'फसल कैसे बेचें?', en:'How do I sell my crop?'},
  {hi:'पेमेंट के तरीके क्या हैं?', en:'What payment methods are available?'},
  {hi:'डिलीवरी में कितना समय लगेगा?', en:'How long does delivery take?'},
  {hi:'किसी इंसान से बात करनी है', en:'I want to talk to a person'},
];

function openChatBot(){
  document.getElementById('chatPanel').classList.remove('hidden');
  if(state.chatMessages.length===0){
    const greeting = t(
      'नमस्ते! मैं साथी AI हूं 🙏 मैं आपकी मदद कर सकता हूं — फसल की कीमत, सरकारी मंडी भाव, ऑर्डर, पेमेंट, डिलीवरी या फसल बेचने से जुड़ी कोई भी जानकारी पूछें। आप माइक 🎤 दबाकर बोलकर भी पूछ सकते हैं।',
      "Hello! I'm Saarthi AI 🙏 I can help with crop prices, official govt mandi rates, orders, payments, delivery, or selling your produce — just ask. You can also tap the mic 🎤 and ask by voice."
    );
    pushChatMessage('bot', greeting);
    renderChatBody();
    speakText(greeting);
  } else {
    renderChatBody();
  }
}
function closeChatBot(){
  document.getElementById('chatPanel').classList.add('hidden');
  try{ speechSynthesis.cancel(); }catch(e){}
}
function pushChatMessage(sender, text, action){
  state.chatMessages.push({sender, text, action: action || null});
}
function chatActionAttr(action){
  if(!action) return '';
  if(action.go) return `goScreen('${action.go}'); closeChatBot();`;
  if(action.call) return `window.location.href='tel:${action.call}'`;
  return '';
}
function renderChatBody(){
  const body = document.getElementById('chatBody');
  body.innerHTML = state.chatMessages.map(m => `
    <div class="msg-row ${m.sender}">
      ${m.sender==='bot' ? '<div class="msg-avatar">🤖</div>' : ''}
      <div class="msg-col">
        <div class="msg-bubble">${m.text}</div>
        ${m.action ? `<button class="msg-action-btn" onclick="${chatActionAttr(m.action)}">${m.action.label}</button>` : ''}
      </div>
    </div>
  `).join('');
  body.scrollTop = body.scrollHeight;
  renderChatQuickRow();
}
function renderChatQuickRow(){
  document.getElementById('chatQuickRow').innerHTML = QUICK_CHIPS.map(c => `
    <button class="quick-chip" onclick="askQuick('${(t(c.hi,c.en)).replace(/'/g,"\\'")}')">${t(c.hi,c.en)}</button>
  `).join('');
}
function askQuick(text){
  document.getElementById('chatInput').value = text;
  sendChatMessage();
}
function sendChatMessage(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  pushChatMessage('user', text);
  input.value='';
  renderChatBody();
  showTypingIndicator();
  setTimeout(()=>{
    hideTypingIndicator();
    const reply = getBotReply(text);
    const action = getBotAction(text);
    pushChatMessage('bot', reply, action);
    renderChatBody();
    speakText(reply);
  }, 650);
}

/* ---- Voice output (Text-to-Speech) — कम पढ़े-लिखे किसानों के लिए जवाब बोलकर सुनाना ---- */
function toggleVoiceOutput(){
  state.voiceOutput = !state.voiceOutput;
  const btn = document.getElementById('voiceToggleBtn');
  if(btn) btn.textContent = state.voiceOutput ? '🔊' : '🔇';
  if(!state.voiceOutput){ try{ speechSynthesis.cancel(); }catch(e){} }
  showToast(state.voiceOutput ? t('आवाज़ में जवाब चालू ✓','Voice replies on ✓') : t('आवाज़ में जवाब बंद','Voice replies off'));
}
function speakText(text){
  if(!state.voiceOutput) return;
  try{
    if(!('speechSynthesis' in window)) return;
    const clean = String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[•\n]/g,' ').trim();
    if(!clean) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = state.lang==='hi' ? 'hi-IN' : 'en-IN';
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---- Voice input (Speech-to-Text) — बोलकर सवाल पूछना, टाइप करने की ज़रूरत नहीं ---- */
function startVoiceInput(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('micBtn');
  if(!SR){
    showToast(t('इस डिवाइस/ब्राउज़र पर आवाज़ से पूछना उपलब्ध नहीं है','Voice input is not supported on this device/browser'));
    return;
  }
  if(recognitionActive){ try{ recognition.stop(); }catch(e){} return; }
  if(!recognition) recognition = new SR();
  recognition.lang = state.lang==='hi' ? 'hi-IN' : 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = ()=>{
    recognitionActive = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '●';
    showToast(t('सुन रहा हूं... बोलिए','Listening... please speak'));
  };
  recognition.onresult = (e)=>{
    const transcript = e.results[0][0].transcript;
    document.getElementById('chatInput').value = transcript;
    sendChatMessage();
  };
  recognition.onerror = ()=>{
    showToast(t('आवाज़ समझ नहीं आई, दोबारा कोशिश करें','Could not hear you clearly, please try again'));
  };
  recognition.onend = ()=>{
    recognitionActive = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤';
  };
  try{ recognition.start(); }catch(e){}
}

/* ---- Chat CTA actions — सीधे सही स्क्रीन/कॉल तक ले जाना ---- */
function getBotAction(rawText){
  const low = rawText.toLowerCase();
  if(/सरकारी|govt|official|मंडी.*भाव|mandi rate/i.test(low)){
    return {label: t('सरकारी मंडी भाव देखें →','View Govt Mandi Rates →'), go:'govtrates'};
  }
  if(/इंसान|एजेंट|इंसान से|human|agent|मदद चाहिए|talk to (a )?person|customer care|कस्टमर केयर/i.test(low)){
    return {label: t('📞 किसान कॉल सेंटर: 1800-180-1551','📞 Kisan Call Centre: 1800-180-1551'), call:'18001801551'};
  }
  if(/बेच|फसल जोड़|add crop|नई फसल/i.test(low)){
    return {label: t('+ नई फसल जोड़ें →','+ Add Produce →'), go:'addcrop'};
  }
  if(/कार्ट|cart/i.test(low)){
    return {label: t('कार्ट देखें →','View Cart →'), go:'cart'};
  }
  return null;
}
function showTypingIndicator(){
  const body = document.getElementById('chatBody');
  body.insertAdjacentHTML('beforeend', `
    <div class="msg-row bot" id="typingRow">
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble typing-dots"><span></span><span></span><span></span></div>
    </div>
  `);
  body.scrollTop = body.scrollHeight;
}
function hideTypingIndicator(){
  document.getElementById('typingRow')?.remove();
}

function findProductInText(text){
  const low = text.toLowerCase();
  return PRODUCTS.find(p => text.includes(p.nameHi) || low.includes(p.nameEn.toLowerCase()));
}

function getBotReply(rawText){
  const text = rawText.trim();
  const low = text.toLowerCase();

  // Greetings

if(/नमस्ते|हैलो|hi\b|hello|hey/i.test(low)){
    return t('नमस्ते! बताइए, मैं आपकी क्या मदद कर सकता हूं?','Hello! How can I help you today?');
  }

  // Official govt mandi rate lookup — किसान के लिए असली/सरकारी भाव
  if(/सरकारी|govt|official|apna mandi|मंडी.*भाव|mandi rate|mandi bhav/i.test(low)){
    const govtRow = state.govtRates.find(r => text.includes(r.cropHi) || low.includes((r.cropEn||'').toLowerCase()));
    if(govtRow){
      return t(
        `${t(govtRow.cropHi,govtRow.cropEn)} का आज का सरकारी मंडी भाव (${govtRow.market}): न्यूनतम ₹${govtRow.min}, अधिकतम ₹${govtRow.max}, मॉडल भाव ₹${govtRow.modal} प्रति ${govtRow.unit} (दिनांक ${govtRow.date})। यह कृषि विभाग/मंडी समिति द्वारा जारी आधिकारिक भाव है।`,
        `Today's official govt mandi rate for ${govtRow.cropEn} (${govtRow.market}): Min ₹${govtRow.min}, Max ₹${govtRow.max}, Modal ₹${govtRow.modal} per ${govtRow.unit} (dated ${govtRow.date}). This is the official rate published by the Agriculture Dept./Mandi Board.`
      );
    }
    const list = state.govtRates.slice(0,5).map(r=>`• ${t(r.cropHi,r.cropEn)} — ₹${r.modal}/${r.unit}`).join('\n');
    return t(
      `ये हैं कुछ आधिकारिक सरकारी मंडी भाव:\n${list}\n\nपूरी सूची और सभी फसलों के लिए नीचे "सरकारी मंडी भाव देखें" बटन दबाएं, या किसी फसल का नाम बताएं जैसे "प्याज़ का सरकारी भाव क्या है?"`,
      `Here are some official govt mandi rates:\n${list}\n\nFor the full list, tap "View Govt Mandi Rates" below, or name a specific crop like "What is the official onion rate?"`
    );
  }

  // Price / crop lookup
  const product = findProductInText(text);
  if(product){
    return t(
      `${product.nameHi} की कीमत ${fmtMoney(product.price)} प्रति ${product.unit} है, जो ${product.farmer} बेच रहे हैं। स्टॉक: ${product.stock} ${product.unit}।${product.highDemand ? ' यह ज़्यादा मांग वाला उत्पाद है 🔥' : ''}`,
      `${product.nameEn} is priced at ${fmtMoney(product.price)} per ${product.unit}, sold by ${product.farmer}. Stock available: ${product.stock} ${product.unit}.${product.highDemand ? ' This is a high-demand item 🔥' : ''}`
    );
  }
  if(/दाम|कीमत|भाव|price|cost|rate/i.test(low)){
    const top = PRODUCTS.slice(0,4).map(p=>`• ${t(p.nameHi,p.nameEn)} — ${fmtMoney(p.price)}/${p.unit}`).join('\n');
    return t(
      `कुछ लोकप्रिय उत्पादों के दाम:\n${top}\n\nकिसी खास फसल का नाम पूछें, जैसे "गेहूं का दाम क्या है?"`,
      `Here are some current prices:\n${top}\n\nAsk about a specific crop, e.g. "What is the wheat price?"`
    );
  }

  // Selling / farmer
  if(/बेच|फसल जोड़|listing|sell|add crop|फसल कैसे/i.test(low)){
    return t(
      'फसल बेचने के लिए: ऊपर "किसान / Farmer" मोड चुनें → "+ नई फसल जोड़ें" बटन दबाएं → नाम, मात्रा, मूल्य और स्थान भरें → "फसल लिस्ट करें" दबाएं। आपकी फसल तुरंत खरीदारों को दिखने लगेगी।',
      'To sell your crop: switch to "Farmer" mode at the top → tap "+ Add Produce" → fill in name, quantity, price and location → tap "List Produce". Your crop will instantly appear to buyers.'
    );
  }

  // Payment
  if(/पेमेंट|भुगतान|upi|card|cod|pay/i.test(low)){
    return t(
      'हमारे पास 3 भुगतान विकल्प हैं: 📱 UPI (GPay/PhonePe/Paytm), 💳 डेबिट/क्रेडिट कार्ड, और 💵 कैश ऑन डिलीवरी। कार्ट में जाकर "आगे बढ़ें" दबाएं और अपना पसंदीदा तरीका चुनें।',
      'We support 3 payment methods: 📱 UPI (GPay/PhonePe/Paytm), 💳 Debit/Credit Card, and 💵 Cash on Delivery. Go to your Cart, tap "Proceed", and choose your preferred method.'
    );
  }

  // Delivery / order tracking
  if(/डिलीवरी|कब आएगा|order.*status|ट्रैकिंग|delivery|track/i.test(low)){
    return t(
      'ऑर्डर देने के बाद आमतौर पर 2 दिन में डिलीवरी हो जाती है। स्थिति: ऑर्डर कन्फर्म → किसान पैकिंग कर रहा है → लॉजिस्टिक्स पिकअप → डिलीवर हुआ। ऑर्डर स्क्रीन पर पूरी ट्रैकिंग दिखती है।',
      'Delivery usually takes about 2 days after placing an order. Status flow: Order confirmed → Farmer packing → Logistics pickup → Delivered. Full tracking is shown on the order confirmation screen.'
    );
  }

  // Login / aadhaar
  if(/लॉगिन|login|आधार|otp|aadhaar/i.test(low)){
    return t(
      'लॉगिन के लिए अपना नाम और 12-अंकों का आधार नंबर डालें → "OTP भेजें" दबाएं → आधार से लिंक मोबाइल पर आया OTP डालें → आगे बढ़ें। चाहें तो "गेस्ट मोड" से बिना लॉगिन के भी ऐप इस्तेमाल कर सकते हैं।',
      'To login, enter your name and 12-digit Aadhaar number → tap "Send OTP" → enter the OTP sent to your Aadhaar-linked mobile → continue. You can also use "Guest mode" to browse without logging in.'
    );
  }

  // Cart
  if(/कार्ट|cart|add to cart|जोड़ें/i.test(low)){
    return t(
      'किसी भी उत्पाद कार्ड पर "+ कार्ट में जोड़ें" दबाएं। मात्रा बदलने के लिए + / − बटन का उपयोग करें। कार्ट देखने के लिए नीचे 🛒 आइकॉन दबाएं।',
      'Tap "+ Add to Cart" on any product card. Use the + / − buttons to change quantity. Tap the 🛒 icon at the bottom to view your cart.'
    );
  }

  // Categories
  if(/श्रेणी|category|categories|अनाज|सब्ज़ी|दाल|फल/i.test(low)){
    const cats = CATEGORIES.filter(c=>c.id!=='all').map(c=>t(c.hi,c.en)).join(', ');
    return t(`हमारे पास ये श्रेणियां हैं: ${cats}। होम स्क्रीन पर ऊपर चिप्स से चुन सकते हैं।`, `We have these categories: ${cats}. Select them from the chips at the top of the home screen.`);
  }

  // Human help / helpline
  if(/इंसान|एजेंट|मदद चाहिए|human|agent|customer care|कस्टमर केयर|talk to (a )?person/i.test(low)){
    return t(
      'कोई बात नहीं, मैं आपको किसान कॉल सेंटर से जोड़ सकता हूं जहां असली व्यक्ति आपकी भाषा में मदद करेगा। नीचे दिया नंबर दबाकर सीधे कॉल करें — 1800-180-1551 (टोल-फ्री, हर दिन उपलब्ध)।',
      "No problem, I can connect you to the Kisan Call Centre where a real person will help in your language. Tap the number below to call directly — 1800-180-1551 (toll-free, available every day)."
    );
  }

  // Fallback
  return t(
    'माफ़ कीजिए, मैं ठीक से समझ नहीं पाया। आप नीचे दिए सुझावों में से चुन सकते हैं, बोलकर भी पूछ सकते हैं (🎤), या दाम, सरकारी मंडी भाव, ऑर्डर, पेमेंट, डिलीवरी, फसल बेचने या लॉगिन के बारे में पूछें। अगर किसी इंसान से बात करनी है तो बताइए, मैं कॉल सेंटर से जोड़ दूंगा।',
    "Sorry, I didn't quite get that. You can pick a suggestion below, ask by voice (🎤), or ask about prices, official govt mandi rates, orders, payment, delivery, selling crops, or login. If you'd like to talk to a person, just say so and I'll connect you to the call centre."
  );
}

/* ---------------- INIT ---------------- */
state.govtRates = loadGovtRates();
renderChips();
renderProducts();
updateCartBadges();
goScreen('home');

(function initAuth(){
  try{
    const saved = localStorage.getItem('ks_user');
    if(saved){
      const user = JSON.parse(saved);
      state.user = user;
      document.getElementById('loginOverlay').classList.add('hidden');
      setRole(user.role || 'buyer');
      return;
    }
  }catch(e){}
  document.getElementById('loginOverlay').classList.remove('hidden');
})();
                                                                                         
