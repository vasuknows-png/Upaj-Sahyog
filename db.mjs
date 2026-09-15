import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const dbPath=process.env.DB_PATH || new URL('./data/upaj-sahyog.db',import.meta.url).pathname;
mkdirSync(dirname(dbPath),{recursive:true});
export const db=new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT UNIQUE,role TEXT NOT NULL,location TEXT,aadhaar_hash TEXT,aadhaar_last4 TEXT,password_hash TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS aadhaar_sessions(id TEXT PRIMARY KEY,uid_hash TEXT NOT NULL,last4 TEXT NOT NULL,otp_hash TEXT NOT NULL,consent INTEGER NOT NULL,attempts INTEGER DEFAULT 0,expires_at TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS aadhaar_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,uid_hash TEXT,last4 TEXT,success INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS listings(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT REFERENCES users(id),crop TEXT NOT NULL,crop_hi TEXT,category TEXT,grade TEXT,quantity REAL NOT NULL,unit TEXT NOT NULL,price REAL NOT NULL,location TEXT,emoji TEXT,high_demand INTEGER DEFAULT 0,status TEXT DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,buyer_id TEXT REFERENCES users(id),subtotal REAL,delivery_fee REAL,total REAL,status TEXT DEFAULT 'confirmed',payment_status TEXT DEFAULT 'pending',payment_method TEXT,address_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT REFERENCES orders(id),listing_id INTEGER REFERENCES listings(id),quantity REAL,price REAL,amount REAL);
CREATE TABLE IF NOT EXISTS order_events(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT REFERENCES orders(id),event TEXT,detail TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,order_id TEXT REFERENCES orders(id),provider TEXT,amount REAL,status TEXT,provider_ref TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS forecasts(id INTEGER PRIMARY KEY AUTOINCREMENT,crop TEXT,region TEXT,predicted_demand REAL,confidence REAL,period TEXT);
CREATE TABLE IF NOT EXISTS cart_items(user_id TEXT REFERENCES users(id),listing_id INTEGER REFERENCES listings(id),quantity REAL,PRIMARY KEY(user_id,listing_id));`);

const hashPassword=p=>{const salt=randomBytes(16);return salt.toString('hex')+':'+scryptSync(p,salt,32).toString('hex')};
export function verifyPassword(p,stored){if(!stored)return false;const [s,h]=stored.split(':');return timingSafeEqual(Buffer.from(h,'hex'),scryptSync(p,Buffer.from(s,'hex'),32))}
const userCount=db.prepare('SELECT count(*) c FROM users').get().c;
if(!userCount){
 const u=db.prepare('INSERT INTO users(id,name,phone,role,location,password_hash) VALUES(?,?,?,?,?,?)');
 [['u-farmer','Ramesh Patil','9000000001','farmer','Nashik, Maharashtra'],['u-fpo','Sahyadri FPO','9000000002','fpo','Nashik, Maharashtra'],['u-buyer','Ananya Stores','9000000003','buyer','Pune, Maharashtra'],['u-admin','Upaj Sahyog Admin','9000000004','admin','New Delhi'],['u-logistics','Setu Logistics','9000000005','transporter','Pune, Maharashtra']].forEach(x=>u.run(...x,hashPassword('demo123')));
 const l=db.prepare('INSERT INTO listings(user_id,crop,crop_hi,category,grade,quantity,unit,price,location,emoji,high_demand) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
 [['u-farmer','Onion','प्याज़','veg','Red Nashik',200,'kg',24,'Nashik','🧅',1],['u-fpo','Grapes','अंगूर','fruit','Thompson',120,'kg',68,'Nashik','🍇',1],['u-farmer','Potato','आलू','veg','Kufri Jyoti',300,'kg',22,'Agra','🥔',0],['u-fpo','Pomegranate','अनार','fruit','Bhagwa',90,'kg',115,'Solapur','🍎',1],['u-farmer','Wheat','गेहूं','grain','HD-2967',42,'quintal',2150,'Bareilly','🌾',0],['u-fpo','Tomato','टमाटर','veg','Grade A',120,'kg',22,'Nashik','🍅',1]].forEach(x=>l.run(...x));
 const f=db.prepare('INSERT INTO forecasts(crop,region,predicted_demand,confidence,period) VALUES(?,?,?,?,?)');
 [['Onion','Pune',840,.88,'7 days'],['Tomato','Mumbai',620,.82,'7 days'],['Wheat','Delhi',410,.79,'30 days']].forEach(x=>f.run(...x));
}
export const uid=()=>randomUUID();
export const rows=(sql,...args)=>db.prepare(sql).all(...args);
export const one=(sql,...args)=>db.prepare(sql).get(...args);
export const run=(sql,...args)=>db.prepare(sql).run(...args);
