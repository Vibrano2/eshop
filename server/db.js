import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'eshop.db');

export const db = new DatabaseSync(DB_PATH);

// Initialize schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 50,
      rating REAL DEFAULT 4.8,
      reviews_count INTEGER DEFAULT 120,
      image TEXT NOT NULL,
      image_display_mode TEXT DEFAULT 'contain',
      is_best_seller INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      short_description TEXT,
      details_json TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_number TEXT PRIMARY KEY,
      customer_email TEXT NOT NULL,
      customer_first_name TEXT,
      customer_last_name TEXT,
      shipping_address TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      city TEXT NOT NULL,
      country_code TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      discount_code TEXT,
      shipping_fee REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      carrier TEXT NOT NULL,
      estimated_delivery TEXT NOT NULL,
      status TEXT NOT NULL,
      tracking_steps_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      variant TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_number) REFERENCES orders (order_number)
    );

    CREATE TABLE IF NOT EXISTS loyalty_accounts (
      referral_code TEXT PRIMARY KEY,
      email TEXT,
      points INTEGER DEFAULT 50,
      referrals_count INTEGER DEFAULT 0,
      claimed_coupons_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loyalty_history (
      id TEXT PRIMARY KEY,
      referral_code TEXT NOT NULL,
      label TEXT NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (referral_code) REFERENCES loyalty_accounts (referral_code)
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER,
      fixed_discount REAL,
      min_amount REAL,
      is_free_shipping INTEGER DEFAULT 0,
      description TEXT,
      badge TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      promo_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      postal_code TEXT DEFAULT '',
      city TEXT DEFAULT '',
      country_code TEXT DEFAULT 'FR',
      role TEXT DEFAULT 'customer',
      loyalty_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT NOT NULL,
      is_verified_buyer INTEGER DEFAULT 1,
      order_number TEXT,
      helpful_count INTEGER DEFAULT 0,
      country_code TEXT DEFAULT 'FR',
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
  `);
}
