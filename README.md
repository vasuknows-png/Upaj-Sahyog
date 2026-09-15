# Upaj Sahyog — Full-stack agricultural marketplace

The supplied `index.html`, `style.css`, and `script.js` are now the website's primary frontend. The visual design is preserved while authentication, listings, orders and payments are connected to the backend.

## Run

Requires Node 22.5+ (built-in SQLite):

```bash
npm start
# open http://localhost:3000
npm test
```

## Included

- Mobile-first bilingual buyer/farmer interface supplied by the user
- Node REST API + persistent SQLite database
- Live marketplace listings and farmer listing creation
- Consent-gated Aadhaar OTP flow (simulator works locally)
- Cart, address, order creation, payment verification and escrow status
- Demand forecasts, tracking, route optimization, health checks
- Docker deployment configuration

## Demo

- Aadhaar simulator: any non-repeating 12-digit number, OTP `123456`
- Password accounts (`demo123`): farmer `9000000001`, buyer `9000000003`, admin `9000000004`

## Important production note

There is no unrestricted public UIDAI OTP API. Real Aadhaar OTP/e-KYC requires a licensed AUA/KUA, ASA/KSA connectivity, consent and compliant cryptographic infrastructure. Set `AADHAAR_PROVIDER=gateway` only after contracting an approved provider and configuring `AADHAAR_GATEWAY_URL`/credentials. The bundled simulator is for development and SIH demonstration only.

Payments default to a simulator. Add Razorpay credentials and complete provider order creation/webhook handling before accepting production payments. Always deploy over HTTPS, replace `AADHAAR_HASH_SALT`, keep `.env` private, and move to managed PostgreSQL for multi-instance production traffic.
