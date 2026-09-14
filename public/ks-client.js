/* Upaj Sahyog client: connects the mobile UI to the Node + SQLite REST API,
   Aadhaar e-KYC login and the payment gateway. */
const KS = {
  token: localStorage.getItem('ks_token') || null,
  user: JSON.parse(localStorage.getItem('ks_user') || 'null'),
  txn: null,
  async api(path, opts = {}) {
    const r = await fetch(path, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'content-type': 'application/json' }, this.token ? { authorization: 'Bearer ' + this.token } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('Request failed: ' + r.status));
    return d;
  }
};

const KS_EMOJI = { Tomato: '\uD83C\uDF45', Onion: '\uD83E\uDDC5', Potato: '\uD83E\uDD54', Grapes: '\uD83C\uDF47', Pomegranate: '\uD83C\uDF51', Wheat: '\uD83C\uDF3E', Maize: '\uD83C\uDF3D', Mango: '\uD83E\uDD6D' };
const KS_HI = { Tomato: '\u091F\u092E\u093E\u091F\u0930', Onion: '\u092A\u094D\u092F\u093E\u091C\u093C', Potato: '\u0906\u0932\u0942', Grapes: '\u0905\u0902\u0917\u0942\u0930', Pomegranate: '\u0905\u0928\u093E\u0930' };

async function ksLoadListings() {
  try {
    const data = await KS.api('/api/listings');
    PRODUCTS.length = 0;
    data.forEach((l, i) => PRODUCTS.push({
      id: i + 1, listingId: l.id, cat: 'veg', emoji: KS_EMOJI[l.crop] || '\uD83E\uDD66',
      nameHi: (KS_HI[l.crop] || l.crop) + (l.variety ? ' (' + l.variety + ')' : ''),
      nameEn: l.crop + (l.variety ? ' (' + l.variety + ')' : ''),
      farmer: l.seller_name + ', ' + l.district,
      price: l.price_per_kg, unit: '\u0915\u093F\u0932\u094B',
      highDemand: l.grade === 'Premium' || l.grade === 'A',
      stock: Math.round(l.available_kg)
    }));
    if (typeof renderProducts === 'function') renderProducts();
  } catch (e) { console.warn('Listing load failed:', e.message); }
}

function ksOpenAuth() {
  document.getElementById('ksAuth').style.display = 'flex';
  document.getElementById('ksAuthMsg').textContent = '';
  fetch('/api/auth/aadhaar/status').then(r => r.json()).then(s => {
    document.getElementById('ksAuthMode').textContent = s.provider === 'simulator'
      ? 'Provider: simulator \u2014 OTP is generated on this server, nothing is sent to UIDAI.'
      : 'Provider: ' + s.provider + ' \u2014 live UIDAI e-KYC through a licensed AUA/KUA.';
  }).catch(() => {});
}
function ksCloseAuth() { document.getElementById('ksAuth').style.display = 'none'; }

async function ksSendOtp() {
  const msg = document.getElementById('ksAuthMsg');
  try {
    const d = await KS.api('/api/auth/aadhaar/otp', { method: 'POST', body: {
      aadhaar: document.getElementById('ksAadhaar').value.replace(/\D/g, ''),
      consent: document.getElementById('ksConsent').checked
    }});
    KS.txn = d.txn;
    document.getElementById('ksStep1').style.display = 'none';
    document.getElementById('ksStep2').style.display = 'block';
    document.getElementById('ksMasked').textContent = d.maskedAadhaar + ' \u2014 ' + d.message;
    if (d.demoOtp) { document.getElementById('ksOtp').value = d.demoOtp; msg.textContent = 'Simulator OTP: ' + d.demoOtp; }
  } catch (e) { msg.textContent = e.message; }
}

async function ksVerifyOtp() {
  const msg = document.getElementById('ksAuthMsg');
  try {
    const d = await KS.api('/api/auth/aadhaar/verify', { method: 'POST', body: {
      txn: KS.txn, otp: document.getElementById('ksOtp').value.trim(), role: document.getElementById('ksRole').value
    }});
    KS.token = d.token; KS.user = d.user;
    localStorage.setItem('ks_token', d.token);
    localStorage.setItem('ks_user', JSON.stringify(d.user));
    ksCloseAuth();
    if (typeof showToast === 'function') showToast('\u0906\u0927\u093E\u0930 \u0938\u0924\u094D\u092F\u093E\u092A\u093F\u0924 \u2014 ' + d.user.name);
  } catch (e) { msg.textContent = e.message; }
}

/* Real checkout: order -> gateway payment -> escrow -> tracking, all server side. */
async function placeOrder() {
  if (state.payMethod === 'upi') {
    const upi = document.getElementById('upiId').value.trim();
    if (!upi.includes('@')) { showToast(t('\u0915\u0943\u092A\u092F\u093E \u0938\u0939\u0940 UPI ID \u0921\u093E\u0932\u0947\u0902', 'Please enter a valid UPI ID')); return; }
  }
  if (!KS.token) { ksOpenAuth(); return; }
  try {
    showToast(t('\u0911\u0930\u094D\u0921\u0930 \u092C\u0928 \u0930\u0939\u093E \u0939\u0948...', 'Creating order...'));
    let lastOrder = null;
    for (const pid in state.cart) {
      const p = PRODUCTS.find(x => x.id == pid);
      if (!p || !p.listingId) continue;
      const order = await KS.api('/api/orders', { method: 'POST', body: { listing_id: p.listingId, quantity_kg: state.cart[pid] } });
      const pay = await KS.api('/api/payments/order', { method: 'POST', body: { order_id: order.id, method: state.payMethod } });
      if (pay.provider === 'razorpay' && window.Razorpay) {
        await new Promise((resolve, reject) => new window.Razorpay({
          key: pay.checkout.razorpayKeyId, order_id: pay.providerRef, amount: pay.amountPaise, currency: 'INR',
          name: 'Upaj Sahyog', description: 'Order ' + order.id,
          handler: async (r) => { await KS.api('/api/payments/verify', { method: 'POST', body: r }); resolve(); },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
        }).open());
      } else {
        await KS.api('/api/payments/verify', { method: 'POST', body: { payment_id: pay.id, status: 'captured' } });
      }
      lastOrder = order;
    }
    if (!lastOrder) { showToast(t('\u0915\u093E\u0930\u094D\u091F \u0916\u093E\u0932\u0940 \u0939\u0948', 'Cart is empty')); return; }
    document.getElementById('orderIdText').textContent = 'Order #' + String(lastOrder.id).toUpperCase();
    state.cart = {}; updateCartBadges(); goScreen('success'); ksLoadListings();
  } catch (e) { showToast(e.message); }
}

window.addEventListener('DOMContentLoaded', () => {
  ksLoadListings();
  fetch('/api/payments/config').then(r => r.json()).then(c => {
    if (c.checkoutScript) { const s = document.createElement('script'); s.src = c.checkoutScript; document.head.appendChild(s); }
  }).catch(() => {});
  if (!KS.token) setTimeout(ksOpenAuth, 800);
});
