/* Upaj Sahyog backend adapter — preserves the supplied frontend and connects it to the REST API. */
const US={
  token:localStorage.getItem('us_token')||'',
  transactionId:'',
  api:async(path,options={})=>{
    const headers={'content-type':'application/json',...(options.headers||{})};
    if(US.token)headers.authorization='Bearer '+US.token;
    const r=await fetch(path,{...options,headers});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(data.error||`Request failed (${r.status})`);
    return data;
  }
};

function apiProduct(l){
  const unitMap={kg:'किलो',quintal:'क्विंटल',dozen:'दर्जन',basket:'टोकरी'};
  return {id:Number(l.id),cat:l.category||'veg',emoji:l.emoji||'🌾',nameHi:l.crop_hi||l.crop,nameEn:l.crop,farmer:[l.farmer,l.location].filter(Boolean).join(', '),price:Number(l.price),unit:unitMap[l.unit]||l.unit,highDemand:!!l.high_demand,stock:Number(l.quantity)};
}
async function loadApiListings(){
  try{
    const list=await US.api('/api/listings');
    PRODUCTS.splice(0,PRODUCTS.length,...list.map(apiProduct));
    renderProducts(); renderCart();
  }catch(e){showToast('API: '+e.message)}
}

// Add an explicit Aadhaar consent control without changing the supplied layout.
(function addConsent(){
  const mobile=document.getElementById('loginMobile');
  if(!mobile||document.getElementById('aadhaarConsent'))return;
  const wrap=document.createElement('label');
  wrap.style.cssText='display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:11px;line-height:1.35;color:#52645a;cursor:pointer';
  wrap.innerHTML='<input id="aadhaarConsent" type="checkbox" style="margin-top:2px;accent-color:#16834b"> <span>मैं पहचान सत्यापन हेतु आधार OTP के उपयोग की सहमति देता/देती हूँ। / I consent to Aadhaar OTP use for identity verification.</span>';
  mobile.parentElement.appendChild(wrap);
})();

sendOtp=async function(){
  const name=document.getElementById('loginName').value.trim();
  const aadhaar=document.getElementById('loginMobile').value.replace(/\D/g,'');
  const consent=!!document.getElementById('aadhaarConsent')?.checked;
  if(name.length<2)return showToast(t('कृपया अपना नाम डालें','Please enter your name'));
  if(aadhaar.length!==12)return showToast(t('12 अंकों का सही आधार नंबर डालें','Enter a valid 12-digit Aadhaar number'));
  if(!consent)return showToast(t('कृपया आधार सहमति स्वीकार करें','Please accept Aadhaar consent'));
  const btn=document.getElementById('sendOtpBtn');btn.disabled=true;
  try{
    const d=await US.api('/api/auth/aadhaar/otp',{method:'POST',body:JSON.stringify({aadhaar,consent:true,name,role:state.loginRoleChoice})});
    US.transactionId=d.transactionId;
    document.getElementById('loginStep1').classList.add('hidden');
    document.getElementById('loginStep2').classList.remove('hidden');
    const hint=document.getElementById('otpSentHint');
    hint.textContent=t(`OTP ${d.maskedAadhaar} से जुड़े मोबाइल पर भेजा गया${d.demoOtp?' — डेमो OTP: '+d.demoOtp:''}`,`OTP sent for ${d.maskedAadhaar}${d.demoOtp?' — demo OTP: '+d.demoOtp:''}`);
    showToast(t('OTP भेजा गया ✓','OTP sent ✓'));
  }catch(e){showToast(e.message)}finally{btn.disabled=false}
};

verifyOtp=async function(){
  const otp=document.getElementById('loginOtp').value.trim();
  if(!/^\d{6}$/.test(otp))return showToast(t('6 अंकों का OTP डालें','Enter the 6-digit OTP'));
  try{
    const d=await US.api('/api/auth/aadhaar/verify',{method:'POST',body:JSON.stringify({transactionId:US.transactionId,otp,name:document.getElementById('loginName').value.trim(),role:state.loginRoleChoice})});
    US.token=d.token;localStorage.setItem('us_token',d.token);
    completeLogin({...d.user,aadhaar:d.user.aadhaarLast4?`XXXX-XXXX-${d.user.aadhaarLast4}`:'',guest:false});
    await loadApiListings();
  }catch(e){showToast(e.message)}
};

const oldLogout=logout;
logout=function(){localStorage.removeItem('us_token');US.token='';oldLogout()};

submitAddCrop=async function(){
  const nameHi=document.getElementById('acNameHi').value.trim(),nameEn=document.getElementById('acNameEn').value.trim();
  const quantity=Number(document.getElementById('acQty').value),price=Number(document.getElementById('acPrice').value);
  if(!US.token)return showToast(t('फसल लिस्ट करने के लिए किसान लॉगिन आवश्यक है','Farmer login is required to list produce'));
  if(!nameHi&&!nameEn)return showToast(t('कृपया फसल का नाम डालें','Please enter the crop name'));
  if(quantity<=0||price<=0)return showToast(t('सही मात्रा और मूल्य डालें','Enter a valid quantity and price'));
  const rawUnit=document.getElementById('acUnit').value,unit={किलो:'kg',क्विंटल:'quintal',दर्जन:'dozen',टोकरी:'basket'}[rawUnit]||rawUnit;
  try{
    await US.api('/api/listings',{method:'POST',body:JSON.stringify({crop:nameEn||nameHi,cropHi:nameHi||nameEn,category:state.acCat,quantity,unit,price,location:document.getElementById('acLoc').value.trim(),emoji:state.acEmoji,highDemand:state.acDemand,grade:document.getElementById('acNote').value.trim()||'Standard'})});
    await loadApiListings(); resetAddCropForm(); showToast(t('फसल सफलतापूर्वक लिस्ट हो गई ✓','Produce listed successfully ✓'));goScreen('farmer');
  }catch(e){showToast(e.message)}
};

placeOrder=async function(){
  if(!US.token){document.getElementById('loginOverlay').classList.remove('hidden');return showToast(t('ऑर्डर के लिए आधार लॉगिन करें','Please sign in to place an order'))}
  if(state.payMethod==='upi'&&!document.getElementById('upiId').value.trim().includes('@'))return showToast(t('कृपया सही UPI ID डालें','Please enter a valid UPI ID'));
  const ids=Object.keys(state.cart);if(!ids.length)return showToast(t('कार्ट खाली है','Cart is empty'));
  const items=ids.map(id=>({listingId:Number(id),quantity:Number(state.cart[id])}));
  try{
    const o=await US.api('/api/orders',{method:'POST',body:JSON.stringify({items,address:state.address,paymentMethod:state.payMethod})});
    let paymentStatus='cash_on_delivery';
    if(state.payMethod!=='cod'){
      const pay=await US.api('/api/payments/order',{method:'POST',body:JSON.stringify({orderId:o.id})});
      if(pay.provider==='simulator'){
        const verified=await US.api('/api/payments/verify',{method:'POST',body:JSON.stringify({orderId:o.id,paymentId:pay.paymentId})});paymentStatus=verified.status;
      }else paymentStatus='gateway_created';
    }
    const uiItems=ids.map(id=>{const p=PRODUCTS.find(x=>x.id==id),q=state.cart[id];return{nameHi:p.nameHi,nameEn:p.nameEn,unit:p.unit,price:p.price,qty:q,amount:p.price*q,farmer:p.farmer}});
    state.lastOrder={id:o.id,date:new Date(),items:uiItems,address:{...state.address},gst:state.needGstInvoice?{...state.gst}:null,subtotal:o.subtotal,delivery:o.delivery_fee,total:o.total,payMethod:state.payMethod,paymentStatus};
    document.getElementById('orderIdText').textContent='Order #'+o.id;renderInvoiceSummary();state.cart={};updateCartBadges();goScreen('success');await loadApiListings();
  }catch(e){showToast(e.message)}
};

(async function bootBackend(){
  // Fix image URLs if the supplied file contains templating braces.
  if(typeof WIKI==='function'){};
  if(US.token){try{const d=await US.api('/api/me');completeLogin({...d.user,guest:false})}catch(e){localStorage.removeItem('us_token');US.token=''}}
  await loadApiListings();
})();
