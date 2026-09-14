import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DB_PATH || new URL('./data/upaj-sahyog.db', import.meta.url).pathname;
mkdirSync(dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
export const hashPassword = (value) => createHash('sha256').update(value).digest('hex');
export const now = () => new Date().toISOString();

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('farmer','fpo','buyer','admin','transporter')),
      district TEXT NOT NULL, state TEXT NOT NULL, language TEXT DEFAULT 'en', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY, seller_id TEXT NOT NULL REFERENCES users(id), crop TEXT NOT NULL,
      variety TEXT, grade TEXT NOT NULL, quantity_kg REAL NOT NULL CHECK(quantity_kg>0),
      available_kg REAL NOT NULL CHECK(available_kg>=0), price_per_kg REAL NOT NULL CHECK(price_per_kg>0),
      harvest_date TEXT NOT NULL, district TEXT NOT NULL, state TEXT NOT NULL,
      latitude REAL, longitude REAL, organic INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS demands (
      id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL REFERENCES users(id), crop TEXT NOT NULL,
      grade TEXT, quantity_kg REAL NOT NULL CHECK(quantity_kg>0), max_price REAL NOT NULL,
      required_by TEXT NOT NULL, district TEXT NOT NULL, state TEXT NOT NULL,
      latitude REAL, longitude REAL, status TEXT DEFAULT 'open', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id), buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES users(id), quantity_kg REAL NOT NULL, price_per_kg REAL NOT NULL,
      platform_fee REAL NOT NULL DEFAULT 0, logistics_fee REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed', pickup_date TEXT, delivery_date TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id),
      status TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS forecasts (
      id TEXT PRIMARY KEY, crop TEXT NOT NULL, district TEXT NOT NULL, forecast_date TEXT NOT NULL,
      demand_kg REAL NOT NULL, confidence REAL NOT NULL, suggested_price REAL NOT NULL, trend TEXT NOT NULL,
      factors TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_listings_crop_status ON listings(crop,status);
    CREATE INDEX IF NOT EXISTS idx_demands_crop_status ON demands(crop,status);
    CREATE TABLE IF NOT EXISTS aadhaar_sessions (
      txn TEXT PRIMARY KEY, uid_hash TEXT NOT NULL, uid_last4 TEXT NOT NULL, otp_hash TEXT,
      provider TEXT NOT NULL, purpose TEXT NOT NULL, consent_at TEXT NOT NULL, expires_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0, status TEXT NOT NULL, verified_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS aadhaar_audit (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, ref_id TEXT, uid_last4 TEXT,
      status TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kyc_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id), uid_hash TEXT NOT NULL, uid_last4 TEXT NOT NULL,
      name TEXT, gender TEXT, district TEXT, state TEXT, pincode TEXT, mode TEXT NOT NULL,
      reference_id TEXT, verified_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), buyer_id TEXT,
      provider TEXT NOT NULL, provider_ref TEXT, provider_payment_id TEXT,
      amount_paise INTEGER NOT NULL, method TEXT, status TEXT NOT NULL,
      escrow_status TEXT DEFAULT 'holding', payout_ref TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, listing_id TEXT NOT NULL REFERENCES listings(id),
      quantity_kg REAL NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id,listing_id)
    );
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id,created_at);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);
}

export function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count) return;
  const users = [
    ['u-farmer','Ramesh Patil','9000000001','farmer','Nashik','Maharashtra'],
    ['u-fpo','Sahyadri FPO','9000000002','fpo','Nashik','Maharashtra'],
    ['u-buyer','FreshMart Retail','9000000003','buyer','Pune','Maharashtra'],
    ['u-admin','Upaj Sahyog Admin','9000000004','admin','New Delhi','Delhi'],
    ['u-driver','Setu Logistics','9000000005','transporter','Pune','Maharashtra']
  ];
  const iu = db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)');
  for (const [id,name,phone,role,district,state] of users) iu.run(id,name,phone,hashPassword('demo123'),role,district,state,'en',now());
  const il = db.prepare(`INSERT INTO listings
    (id,seller_id,crop,variety,grade,quantity_kg,available_kg,price_per_kg,harvest_date,district,state,latitude,longitude,organic,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const listings = [
    ['l1','u-fpo','Tomato','Abhinav','A',5000,4200,30,'2026-09-12','Nashik','Maharashtra',20.0059,73.7900,0],
    ['l2','u-farmer','Onion','Red Nashik','A',2800,2800,24,'2026-09-15','Nashik','Maharashtra',20.0110,73.7550,0],
    ['l3','u-fpo','Grapes','Thompson','Premium',1600,1100,68,'2026-09-13','Nashik','Maharashtra',20.1100,73.7250,1],
    ['l4','u-fpo','Potato','Kufri Jyoti','B',4000,4000,22,'2026-09-18','Ahmednagar','Maharashtra',19.0952,74.7496,0],
    ['l5','u-farmer','Pomegranate','Bhagwa','Premium',900,750,115,'2026-09-16','Solapur','Maharashtra',17.6599,75.9064,1]
  ];
  for (const r of listings) il.run(...r,'active',now());
  const idm = db.prepare(`INSERT INTO demands
    (id,buyer_id,crop,grade,quantity_kg,max_price,required_by,district,state,latitude,longitude,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const demands = [
    ['d1','u-buyer','Tomato','A',2200,34,'2026-09-14','Pune','Maharashtra',18.5204,73.8567],
    ['d2','u-buyer','Onion','A',1800,27,'2026-09-17','Mumbai','Maharashtra',19.0760,72.8777],
    ['d3','u-buyer','Grapes','Premium',700,75,'2026-09-15','Pune','Maharashtra',18.5204,73.8567]
  ];
  for (const r of demands) idm.run(...r,'open',now());
  const ifc = db.prepare('INSERT INTO forecasts VALUES (?,?,?,?,?,?,?,?,?,?)');
  const f = [
    ['f1','Tomato','Nashik','2026-09-15',7200,.86,32,'up','festival demand, rainfall risk, retail orders'],
    ['f2','Onion','Nashik','2026-09-15',9100,.81,26,'stable','steady institutional demand, normal arrivals'],
    ['f3','Grapes','Nashik','2026-09-15',2600,.78,72,'up','premium retail demand, limited harvest window'],
    ['f4','Potato','Ahmednagar','2026-09-18',5400,.74,23,'stable','balanced arrivals and wholesale demand']
  ];
  for (const r of f) ifc.run(...r,now());
}

export const id = (prefix) => `${prefix}-${randomUUID().slice(0,8)}`;
export function initDb(){ migrate(); seed(); }
