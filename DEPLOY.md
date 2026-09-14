# Hosting Upaj Sahyog

The app is one Node process with no npm dependencies and a SQLite file. Two rules matter:

1. The host must run **Node 22.5+** (the built-in `node:sqlite` driver).
2. SQLite writes to disk, so the host needs a **persistent volume** (or move to Postgres). Serverless platforms (Vercel/Netlify functions, Cloudflare Workers) reset the filesystem on every request, so use a container/VM host instead.

---

## Option 1 - Render.com (easiest free-ish path)

1. Push the folder to GitHub.
2. Render → **New → Web Service** → pick the repo.
3. Settings: Environment **Node**, Build command `echo no build`, Start command `node --no-warnings server.mjs`.
4. Add a **Disk**: mount path `/opt/render/project/src/data`, size 1 GB.
5. Environment variables:
   ```
   NODE_VERSION=22.5.0
   PORT=10000
   DB_PATH=/opt/render/project/src/data/upaj-sahyog.db
   AADHAAR_PROVIDER=simulator
   PAYMENT_PROVIDER=simulator
   AADHAAR_HASH_SALT=<random string>
   ```
6. Deploy → you get `https://upaj-sahyog.onrender.com`. HTTPS is automatic.

`render.yaml` in this repo does all of the above automatically (Render → New → Blueprint).

## Option 2 - Railway / Fly.io / Koyeb (Docker)

```bash
docker build -t upaj-sahyog .
docker run -p 3000:3000 -v upaj-data:/app/data upaj-sahyog
```

- **Railway**: New Project → Deploy from GitHub → it detects the Dockerfile → add a Volume mounted at `/app/data`.
- **Fly.io**: `fly launch` → `fly volumes create upaj_data --size 1` → mount at `/app/data` → `fly deploy`.

## Option 3 - Any VPS (DigitalOcean / AWS EC2 / Hostinger) - full control, best for a demo you own

```bash
# on Ubuntu 24.04
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
git clone <your-repo> /var/www/upaj-sahyog && cd /var/www/upaj-sahyog
cp .env.example .env && nano .env      # set salt, provider keys

# run as a service
sudo tee /etc/systemd/system/upaj-sahyog.service >/dev/null <<'EOF'
[Unit]
Description=Upaj Sahyog
After=network.target
[Service]
WorkingDirectory=/var/www/upaj-sahyog
EnvironmentFile=/var/www/upaj-sahyog/.env
ExecStart=/usr/bin/node --no-warnings server.mjs
Restart=always
User=www-data
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now upaj-sahyog
```

Nginx reverse proxy + free HTTPS:

```nginx
server {
  server_name upajsahyog.example.in;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; }
}
```

```bash
sudo certbot --nginx -d upajsahyog.example.in
```

## Option 4 - Government / campus demo (SIH)

For the SIH demo you often cannot rely on internet: run `npm start` on a laptop and open `http://<laptop-ip>:3000/shop.html` on judges' phones over the same Wi-Fi/hotspot. For a public link during practice, `npx localtunnel --port 3000` or `cloudflared tunnel --url http://localhost:3000` gives an instant HTTPS URL.

---

## Before going live

| Item | Action |
|---|---|
| Secrets | Set `AADHAAR_HASH_SALT` to a long random value; never commit `.env` |
| Payments | Set `PAYMENT_PROVIDER=razorpay` + `RAZORPAY_KEY_ID/SECRET`; add webhook `https://<domain>/api/payments/webhook` with `RAZORPAY_WEBHOOK_SECRET` |
| Aadhaar | Keep `simulator` until you have AUA/KUA licence; offline e-KYC works publicly today |
| Database | For real traffic, migrate SQLite → Postgres and keep nightly backups (`sqlite3 data/upaj-sahyog.db ".backup backup.db"`) |
| HTTPS | Mandatory before handling any Aadhaar or payment data |
| Scaling | One process is fine to ~200 concurrent users; beyond that move to Postgres + multiple instances behind a load balancer |
