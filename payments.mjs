/**
 * Payment gateway module. One interface, three providers:
 *   PAYMENT_PROVIDER=simulator (default) local escrow simulation
 *   PAYMENT_PROVIDER=razorpay  live Razorpay Orders + UPI/cards + webhook + payout
 *   PAYMENT_PROVIDER=cashfree  live Cashfree Orders API
 * Money is held against the order and released to the farmer/FPO after
 * delivery confirmation (escrow-style settlement).
 */
import { createHmac, randomUUID } from 'node:crypto';
import { db, now } from './db.mjs';

const PROVIDER = process.env.PAYMENT_PROVIDER || 'simulator';
const basicAuth = () => 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

export function publicConfig() {
  return {
    provider: PROVIDER,
    methods: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
    currency: 'INR',
    razorpayKeyId: PROVIDER === 'razorpay' ? process.env.RAZORPAY_KEY_ID : undefined,
    checkoutScript: PROVIDER === 'razorpay' ? 'https://checkout.razorpay.com/v1/checkout.js' : undefined,
    escrow: true
  };
}

export async function createPayment({ orderId, amountPaise, buyerId, method = 'upi', notes = {} }) {
  if (!orderId || !amountPaise || amountPaise < 100) throw Error('A valid order and amount (min ₹1) are required');
  const receipt = 'ks_' + randomUUID().slice(0, 12);
  let providerRef = receipt, providerPayload = {};

  if (PROVIDER === 'razorpay') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw Error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST', headers: { authorization: basicAuth(), 'content-type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes: { orderId, ...notes } })
    });
    providerPayload = await r.json();
    if (!r.ok) throw Error(providerPayload.error?.description || 'Razorpay order creation failed');
    providerRef = providerPayload.id;
  } else if (PROVIDER === 'cashfree') {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) throw Error('Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY');
    const r = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-version': '2023-08-01', 'x-client-id': process.env.CASHFREE_APP_ID, 'x-client-secret': process.env.CASHFREE_SECRET_KEY },
      body: JSON.stringify({ order_id: receipt, order_amount: amountPaise / 100, order_currency: 'INR', customer_details: { customer_id: buyerId || 'guest', customer_phone: notes.phone || '9999999999' } })
    });
    providerPayload = await r.json();
    if (!r.ok) throw Error(providerPayload.message || 'Cashfree order creation failed');
    providerRef = providerPayload.order_id;
  }

  const id = 'pay-' + randomUUID().slice(0, 8);
  db.prepare(`INSERT INTO payments(id,order_id,buyer_id,provider,provider_ref,amount_paise,method,status,escrow_status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(id, orderId, buyerId || null, PROVIDER, providerRef, amountPaise, method, 'created', 'holding', now(), now());
  return { id, provider: PROVIDER, providerRef, amountPaise, method, status: 'created', checkout: publicConfig(), providerPayload: PROVIDER === 'simulator' ? { simulated: true } : providerPayload };
}

export function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (PROVIDER !== 'razorpay') return true;
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  return expected === razorpay_signature;
}

export function verifyWebhook(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (PROVIDER !== 'razorpay' || !secret) return true;
  return createHmac('sha256', secret).update(rawBody).digest('hex') === signature;
}

export function confirmPayment({ paymentId, providerPaymentId, status = 'captured' }) {
  const p = db.prepare('SELECT * FROM payments WHERE id=? OR provider_ref=?').get(paymentId, paymentId);
  if (!p) throw Error('Payment not found');
  db.prepare('UPDATE payments SET status=?,provider_payment_id=?,updated_at=? WHERE id=?').run(status, providerPaymentId || null, now(), p.id);
  if (status === 'captured') {
    db.prepare("UPDATE orders SET payment_status='paid_in_escrow',updated_at=? WHERE id=?").run(now(), p.order_id);
    db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(p.order_id, 'payment_captured', `Payment ${p.id} captured and held in escrow`, now());
  }
  return db.prepare('SELECT * FROM payments WHERE id=?').get(p.id);
}

/** Release escrow to the farmer/FPO after delivery, minus platform fee. */
export async function settlePayout({ orderId }) {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  if (!o) throw Error('Order not found');
  if (o.status !== 'delivered') throw Error('Payout is released only after delivery is confirmed');
  const p = db.prepare("SELECT * FROM payments WHERE order_id=? AND status='captured'").get(orderId);
  if (!p) throw Error('No captured payment for this order');
  const gross = o.quantity_kg * o.price_per_kg;
  const payout = Math.round((gross - o.platform_fee) * 100);
  let ref = 'sim-payout-' + randomUUID().slice(0, 8);

  if (PROVIDER === 'razorpay' && process.env.RAZORPAY_ACCOUNT_NUMBER) {
    const r = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST', headers: { authorization: basicAuth(), 'content-type': 'application/json' },
      body: JSON.stringify({ account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, amount: payout, currency: 'INR', mode: 'UPI', purpose: 'payout', queue_if_low_balance: true, reference_id: orderId, narration: 'Upaj Sahyog farmer settlement' })
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error?.description || 'Payout failed');
    ref = d.id;
  }

  db.prepare('UPDATE payments SET escrow_status=?,payout_ref=?,updated_at=? WHERE id=?').run('released', ref, now(), p.id);
  db.prepare("UPDATE orders SET payment_status='settled',updated_at=? WHERE id=?").run(now(), orderId);
  db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(orderId, 'settled', `Farmer payout ${ref} released (${payout / 100} INR)`, now());
  return { orderId, payoutRef: ref, farmerAmount: payout / 100, platformFee: o.platform_fee, provider: PROVIDER };
}

export const listPayments = (orderId) => db.prepare('SELECT * FROM payments WHERE (?1 IS NULL OR order_id=?1) ORDER BY created_at DESC').all(orderId || null);
