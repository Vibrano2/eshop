import crypto from 'node:crypto';
import { db, initDatabase } from './db.js';
import { PRODUCTS } from '../src/data/products.js';
import { PROMO_CODES } from '../src/data/promoCodes.js';

console.log('--- Seeding SQLite Database for eshop-store.eu ---');

initDatabase();

// Clear existing tables
db.exec(`
  DELETE FROM products;
  DELETE FROM promo_codes;
`);

// Helper to hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

// 1. Seed Products
const insertProductStmt = db.prepare(`
  INSERT INTO products (
    id, sku, name, category, subcategory, price, original_price,
    stock, rating, reviews_count, image, image_display_mode,
    is_best_seller, is_new, short_description, details_json
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?
  )
`);

let insertedProducts = 0;
for (const p of PRODUCTS) {
  const details = {
    shortDescription: p.shortDescription || '',
    bulletPoints: p.bulletPoints || [],
    highlights: p.highlights || [],
    specifications: p.specifications || {},
    faq: p.faq || [],
    customerReviews: p.customerReviews || []
  };

  insertProductStmt.run(
    p.id,
    p.sku || `SKU-${p.id}`,
    p.name,
    p.category,
    p.subcategory || '',
    Number(p.price) || 0,
    p.originalPrice ? Number(p.originalPrice) : null,
    p.stock !== undefined ? p.stock : 50,
    Number(p.rating) || 4.8,
    Number(p.reviewsCount) || 120,
    p.image,
    p.imageDisplayMode || (p.isFashion ? 'cover' : 'contain'),
    p.isBestSeller ? 1 : 0,
    p.isNew ? 1 : 0,
    p.shortDescription || '',
    JSON.stringify(details)
  );
  insertedProducts++;
}

console.log(`✓ Inserted ${insertedProducts} products into SQLite database.`);

// 2. Seed Promo Codes
const insertPromoStmt = db.prepare(`
  INSERT INTO promo_codes (
    code, discount_percent, fixed_discount, min_amount, is_free_shipping, description, badge, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`);

let insertedPromos = 0;
for (const promo of PROMO_CODES) {
  insertPromoStmt.run(
    promo.code,
    promo.discountPercent || null,
    promo.fixedDiscount || null,
    promo.minAmount || 0,
    promo.freeShipping ? 1 : 0,
    promo.description || '',
    promo.badge || ''
  );
  insertedPromos++;
}

console.log(`✓ Inserted ${insertedPromos} promo codes into SQLite database.`);

// 3. Seed Default Loyalty Account if not existing
const checkLoyaltyStmt = db.prepare(`SELECT count(*) as count FROM loyalty_accounts WHERE referral_code = 'ESHOP-EU4821'`);
const res = checkLoyaltyStmt.get();
if (res.count === 0) {
  db.prepare(`
    INSERT INTO loyalty_accounts (referral_code, email, points, referrals_count, claimed_coupons_json, created_at)
    VALUES ('ESHOP-EU4821', 'client@eshop-store.eu', 50, 0, '[]', datetime('now'))
  `).run();

  db.prepare(`
    INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
    VALUES ('h-welcome', 'ESHOP-EU4821', 'Cadeau de bienvenue', 50, 'credit', date('now'))
  `).run();

  console.log('✓ Created initial loyalty account (ESHOP-EU4821 with 50 points).');
}

// 4. Seed Demo User Account
const checkUserStmt = db.prepare(`SELECT count(*) as count FROM users WHERE email = 'demo@eshop-store.eu'`);
const userRes = checkUserStmt.get();
if (userRes.count === 0) {
  const { salt, hash } = hashPassword('Eshop2026!');
  db.prepare(`
    INSERT INTO users (
      email, password_hash, salt, first_name, last_name, phone,
      shipping_address, postal_code, city, country_code, role, loyalty_code, created_at
    ) VALUES (
      'demo@eshop-store.eu', ?, ?, 'Claire', 'Laurent', '+33 6 12 34 56 78',
      '15 Rue de Rivoli', '75001', 'Paris', 'FR', 'customer', 'ESHOP-EU4821', datetime('now')
    )
  `).run(hash, salt);

  console.log('✓ Created demo user account: demo@eshop-store.eu (Password: Eshop2026!).');
}

console.log('--- Seeding Completed Successfully! ---');
