# Upaj Sahyog — Farmer-to-Consumer Direct Marketplace

SIH 2026 · PS **26033** · Ministry of Consumer Affairs, Food & Public Distribution (DoCA) · Team **SAARTHI**

A complete, running full-stack product: SQLite database → Node REST API → two web front-ends → Aadhaar e-KYC login → payment gateway with escrow settlement → AI matching, demand forecasting and route optimisation.

## Run it

```bash
node --version          # needs Node 22.5+ (uses the built-in node:sqlite driver)
cp .env.example .env    # optional; simulator mode works with zero config
npm start               # http://localhost:3000
npm test                # 24-check end-to-end API suite
npm run reset-db        # wipe + reseed
```

| Surface | URL |
|---|---|
| Operations console (dashboard, market, matches, logistics, impact) | `/` |
| Upaj Sahyog mobile marketplace (the supplied UI, rebranded + live data) | `/shop.html` |
| API health | `/api/health` |

Demo logins (password `demo123`): `9000000001` farmer · `9000000002` FPO · `9000000003` buyer · `9000000004` admin · `9000000005` transporter. Or log in with Aadhaar OTP on `/shop.html`.

## Tech stack

- **Runtime**: Node.js 22 ESM, zero runtime dependencies (`node:http`, `node:sqlite`, `node:crypto`)
- **Database**: SQLite in WAL mode, foreign keys on, transactional order placement — 11 tables: `users, listings, demands, orders, order_events, forecasts, cart_items, payments, aadhaar_sessions, aadhaar_audit, kyc_profiles`
- **Auth**: bearer-token sessions + Aadhaar OTP e-KYC (pluggable provider)
- **Payments**: Razorpay / Cashfree adapters + escrow simulator, HMAC signature & webhook verification, farmer payouts
- **Intelligence**: supply↔demand match scoring, Haversine geo-distance, nearest-neighbour route optimiser, demand/price forecast store
- **Front-end**: the supplied mobile UI (rebranded to **Upaj Sahyog / उपज सहयोग**) wired to the REST API, plus a responsive desktop console

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | service + DB status |
| POST | `/api/auth/login` | phone + password session |
| GET | `/api/auth/aadhaar/status` | active Aadhaar provider & compliance flags |
| POST | `/api/auth/aadhaar/otp` | send Aadhaar OTP (consent required) |
| POST | `/api/auth/aadhaar/verify` | verify OTP, auto-create KYC user, issue token |
| POST | `/api/auth/aadhaar/offline-ekyc` | verify UIDAI paperless offline e-KYC ZIP + share code |
| GET | `/api/me`, `/api/dashboard` | session and aggregate metrics |
| GET/POST | `/api/listings` · PATCH `/api/listings/:id` | farmer/FPO produce lots |
| GET/POST | `/api/demands` | buyer requirements |
| GET | `/api/matches` | AI-scored farmer↔buyer matches |
| GET/POST/DELETE | `/api/cart`, `/api/cart/:listingId` | server-side cart |
| GET/POST | `/api/orders` · PATCH `/api/orders/:id` | orders + lifecycle |
| GET | `/api/orders/:id/track` | order, event trail, payments |
| GET | `/api/payments/config` | provider + enabled methods |
| POST | `/api/payments/order` | create gateway order (UPI/card/netbanking/wallet) |
| POST | `/api/payments/verify` | HMAC signature check + capture into escrow |
| POST | `/api/payments/webhook` | Razorpay webhook (signature verified) |
| POST | `/api/payments/settle` | release escrow payout to farmer after delivery |
| GET | `/api/forecasts` · POST `/api/routes/optimize` | demand forecasting, route optimisation |

## Aadhaar login — what is real, and what a licence unlocks

UIDAI does **not** publish an open public OTP API. Live Aadhaar OTP/e-KYC may legally be called only by a UIDAI-licensed **AUA/KUA**, over an **ASA/KSA** network, with an AUA code, licence keys and an HSM that encrypts the PID block and signs the auth XML. So this project ships one interface with three providers, switched by `AADHAAR_PROVIDER`:

| Mode | Works today | Notes |
|---|---|---|
| `simulator` (default) | ✅ fully working | OTP generated and verified locally; complete flow, no data leaves the machine |
| `uidai` | needs licence | Real UIDAI OTP 2.5 + e-KYC 2.5 calls via your ASA URL, AUA code, licence keys, `UIDAI_SIGNER_URL` |
| `gateway` | needs credentials | Licensed KUA aggregator / UIDAI sandbox REST gateway |
| Paperless **offline e-KYC** | ✅ works with no licence | Resident's ZIP from `myaadhaar.uidai.gov.in/offline-ekyc` + share code is unzipped, parsed and returned via `/api/auth/aadhaar/offline-ekyc` |

Compliance built into the code: explicit consent is mandatory before any OTP request, the full Aadhaar/VID is **never stored** (only a salted HMAC hash + last 4 digits), OTPs are stored hashed and wiped on verification, OTP expiry (10 min) and a 3-attempt lockout apply, and every request is written to `aadhaar_audit`.

## Payments

`PAYMENT_PROVIDER=simulator|razorpay|cashfree`. Simulator runs the full escrow lifecycle offline. Add `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (and `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_ACCOUNT_NUMBER` for payouts) and the same code path opens real Razorpay Checkout in `/shop.html`, verifies the `order_id|payment_id` HMAC signature, captures into escrow, and releases the farmer payout via RazorpayX after delivery is confirmed. Cashfree Orders API is wired the same way.

Money flow: buyer pays → held in escrow (`payment_status=paid_in_escrow`) → order delivered → `/api/payments/settle` pays the farmer gross minus a 1.5% platform fee (`payment_status=settled`), with every step appended to `order_events`.

## Production hardening roadmap

JWT + refresh tokens and Redis-backed sessions, Postgres/PostGIS instead of SQLite, rate limiting and WAF, HTTPS/HSTS, UIDAI HSM signer service, DPDP Act data-retention policy, OSRM/Google Directions for real road routing, and an ML forecasting service replacing the seeded forecast table.
