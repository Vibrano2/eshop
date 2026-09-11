import crypto from 'node:crypto';
import { db, initDatabase } from './db.js';
import { PRODUCTS } from '../src/data/products.js';
import { PROMO_CODES } from '../src/data/promoCodes.js';

console.log('--- Seeding SQLite Database for eshopstore.shop ---');

initDatabase();

// Disable foreign keys temporarily for clean seed reset
db.exec(`PRAGMA foreign_keys = OFF;`);
db.exec(`
  DELETE FROM products;
  DELETE FROM promo_codes;
`);
db.exec(`PRAGMA foreign_keys = ON;`);

// Helper to hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

// 1. Seed Products
const insertProductStmt = db.prepare(`
  INSERT OR REPLACE INTO products (
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
    VALUES ('ESHOP-EU4821', 'client@eshopstore.shop', 50, 0, '[]', datetime('now'))
  `).run();

  db.prepare(`
    INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
    VALUES ('h-welcome', 'ESHOP-EU4821', 'Cadeau de bienvenue', 50, 'credit', date('now'))
  `).run();

  console.log('✓ Created initial loyalty account (ESHOP-EU4821 with 50 points).');
}

// 4. Seed Users (Admin & Demo)
// Always ensure demo@eshopstore.shop has admin privileges for seamless testing
db.prepare(`
  UPDATE users SET role = 'admin' WHERE email = 'demo@eshopstore.shop'
`).run();

const checkAdminStmt = db.prepare(`SELECT count(*) as count FROM users WHERE email = 'admin@eshopstore.shop'`);
if (checkAdminStmt.get().count === 0) {
  const { salt, hash } = hashPassword('AdminEshop2026!');
  db.prepare(`
    INSERT INTO users (
      email, password_hash, salt, first_name, last_name, phone,
      shipping_address, postal_code, city, country_code, role, loyalty_code, created_at
    ) VALUES (
      'admin@eshopstore.shop', ?, ?, 'Admin', 'Directeur', '+33 1 40 00 00 00',
      '1 Avenue des Champs-Élysées', '75008', 'Paris', 'FR', 'admin', 'ESHOP-ADMIN', datetime('now')
    )
  `).run(hash, salt);

  console.log('✓ Created dedicated admin user: admin@eshopstore.shop (Password: AdminEshop2026!).');
}

// 5. Seed Sample Orders for Admin Analytics
const checkOrdersStmt = db.prepare(`SELECT count(*) as count FROM orders`);
if (checkOrdersStmt.get().count < 3) {
  const sampleOrders = [
    {
      orderNumber: 'EU-849201',
      customerEmail: 'claire.laurent@example.fr',
      firstName: 'Claire',
      lastName: 'Laurent',
      address: '15 Rue de Rivoli',
      postalCode: '75001',
      city: 'Paris',
      countryCode: 'FR',
      subtotal: 59.98,
      discountAmount: 5.0,
      discountCode: 'FIDELITE5',
      shippingFee: 0.0,
      totalAmount: 54.98,
      carrier: 'Colissimo Suivi',
      estimatedDelivery: '10 sept. - 12 sept.',
      status: 'Confirmée & en préparation',
      steps: [
        { title: 'Commande confirmée', date: '08/09/2026 14:30', completed: true },
        { title: 'Préparation en entrepôt UE', date: '08/09/2026 15:45', completed: true },
        { title: 'Expédition & prise en charge Colissimo', date: 'En attente', completed: false },
        { title: 'Livraison à domicile', date: '10 sept. - 12 sept.', completed: false }
      ],
      items: [
        { productId: 'doublures-silicone-airfryer', name: 'Moules silicone pour Air Fryer (x2)', price: 17.9, quantity: 2, image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80' },
        { productId: 'pulverisateur-huile', name: 'Pulvérisateur d’Huile en Verre 200ml', price: 14.9, quantity: 1, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80' }
      ]
    },
    {
      orderNumber: 'EU-639145',
      customerEmail: 'marc.durand@bruxelles.be',
      firstName: 'Marc',
      lastName: 'Durand',
      address: '42 Rue Neuve',
      postalCode: '1000',
      city: 'Bruxelles',
      countryCode: 'BE',
      subtotal: 79.90,
      discountAmount: 0.0,
      discountCode: null,
      shippingFee: 0.0,
      totalAmount: 79.90,
      carrier: 'DHL Express Europe',
      estimatedDelivery: '09 sept. - 11 sept.',
      status: 'Expédiée',
      steps: [
        { title: 'Commande confirmée', date: '07/09/2026 11:20', completed: true },
        { title: 'Préparation en entrepôt UE', date: '07/09/2026 14:10', completed: true },
        { title: 'Expédiée via DHL Express (N° DHL-EU-948271)', date: '08/09/2026 09:15', completed: true },
        { title: 'Livraison prévue à Bruxelles', date: '09 sept. - 11 sept.', completed: false }
      ],
      items: [
        { productId: 'repose-pieds-ergonomique', name: 'Repose-pieds Ergonomique Ajustable', price: 39.9, quantity: 1, image: 'https://images.unsplash.com/photo-1580481077195-c999335f68b4?w=500&auto=format&fit=crop&q=80' },
        { productId: 'support-ordinateur-portable', name: 'Support PC Portable Aluminium Pliable', price: 29.9, quantity: 1, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=80' }
      ]
    },
    {
      orderNumber: 'EU-412980',
      customerEmail: 'sophie.muller@berlin.de',
      firstName: 'Sophie',
      lastName: 'Müller',
      address: '18 Friedrichstraße',
      postalCode: '10117',
      city: 'Berlin',
      countryCode: 'DE',
      subtotal: 129.90,
      discountAmount: 12.99,
      discountCode: 'BIENVENUE10',
      shippingFee: 0.0,
      totalAmount: 116.91,
      carrier: 'DHL Express Europe',
      estimatedDelivery: '06 sept. 2026',
      status: 'Livrée',
      steps: [
        { title: 'Commande confirmée', date: '04/09/2026 10:00', completed: true },
        { title: 'Préparation en entrepôt UE', date: '04/09/2026 13:00', completed: true },
        { title: 'Expédiée via DHL Express', date: '05/09/2026 08:30', completed: true },
        { title: 'Colis livré et réceptionné en main propre', date: '06/09/2026 14:15', completed: true }
      ],
      items: [
        { productId: 'camera-surveillance-wifi', name: 'Caméra Surveillance WiFi 360° Vision Nocturne', price: 49.9, quantity: 2, image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop&q=80' },
        { productId: 'sonnette-video-connectee', name: 'Sonnette Vidéo Sans Fil HD Interphone', price: 44.9, quantity: 1, image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&auto=format&fit=crop&q=80' }
      ]
    }
  ];

  const insertOrderStmt = db.prepare(`
    INSERT OR REPLACE INTO orders (
      order_number, customer_email, customer_first_name, customer_last_name,
      shipping_address, postal_code, city, country_code,
      subtotal, discount_amount, discount_code, shipping_fee, total_amount,
      carrier, estimated_delivery, status, tracking_steps_json, created_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, datetime('now')
    )
  `);

  const insertItemStmt = db.prepare(`
    INSERT INTO order_items (
      order_number, product_id, product_name, product_image, variant, unit_price, quantity
    ) VALUES (?, ?, ?, ?, '', ?, ?)
  `);

  for (const o of sampleOrders) {
    insertOrderStmt.run(
      o.orderNumber,
      o.customerEmail,
      o.firstName,
      o.lastName,
      o.address,
      o.postalCode,
      o.city,
      o.countryCode,
      o.subtotal,
      o.discountAmount,
      o.discountCode,
      o.shippingFee,
      o.totalAmount,
      o.carrier,
      o.estimatedDelivery,
      o.status,
      JSON.stringify(o.steps)
    );

    for (const item of o.items) {
      insertItemStmt.run(
        o.orderNumber,
        item.productId,
        item.name,
        item.image,
        item.price,
        item.quantity
      );
    }
  }

  console.log('✓ Seeded representative demo orders for Admin Dashboard analytics.');
}

console.log('--- Seeding Completed Successfully! ---');
