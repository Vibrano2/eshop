import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from '../db.js';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../../src/data/products.js';
import { PROMO_CODES as FALLBACK_PROMOS } from '../../src/data/promoCodes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAuthoritativeProducts() {
  const jsonPath = path.resolve(__dirname, '../data/products.json');
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (e) {
      console.warn('[CatalogSync] Failed to read server/data/products.json:', e.message);
    }
  }
  return FALLBACK_PRODUCTS;
}

function getAuthoritativePromoCodes() {
  const jsonPath = path.resolve(__dirname, '../data/promoCodes.json');
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (e) {
      console.warn('[CatalogSync] Failed to read server/data/promoCodes.json:', e.message);
    }
  }
  return FALLBACK_PROMOS;
}

// Helper to hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Authoritative Catalog Synchronization & Self-Healing Service
 * Guarantees that the SQLite database always contains the full, up-to-date catalog of 123 products,
 * active promo codes, and administrative accounts across all environments (dev, prod, cPanel, cloud).
 */
export function syncCatalog({ force = false } = {}) {
  initDatabase();

  const productsList = getAuthoritativeProducts() || FALLBACK_PRODUCTS;
  const promosList = getAuthoritativePromoCodes() || FALLBACK_PROMOS;

  const countRow = db.prepare('SELECT count(*) as count FROM products').get();
  const currentCount = countRow ? countRow.count : 0;

  // Sync if database is empty, has fewer products than the catalog, or if forced
  if (!force && currentCount >= productsList.length) {
    return { synced: false, count: currentCount, message: 'Catalog already in sync' };
  }

  console.log(`[CatalogSync] Synchronizing SQLite catalog (${currentCount} -> ${productsList.length} products)...`);

  const insertProductStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, sku, slug, name, category, subcategory, price, original_price,
      stock, rating, reviews_count, image, image_display_mode,
      is_best_seller, is_new, short_description, details_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  let syncedProducts = 0;
  for (const p of productsList) {
    const details = {
      shortDescription: p.shortDescription || '',
      shortName: p.shortName || p.name,
      categoryLabel: p.categoryLabel || p.category,
      badge: p.badge || null,
      isCurated: p.isCurated ?? false,
      curatedOrder: p.curatedOrder ?? 999,
      status: p.status || 'active',
      benefits: p.benefits || p.bulletPoints || [],
      specs: p.specs || p.specifications || {},
      faq: p.faq || [],
      customerReviews: p.customerReviews || [],
      compareAtPrice: p.compareAtPrice || p.originalPrice || null
    };

    insertProductStmt.run(
      p.id,
      p.sku || `SKU-${p.id.toUpperCase()}`,
      p.slug || p.id,
      p.name,
      p.category,
      p.subcategory || '',
      Number(p.price) || 0,
      p.compareAtPrice ? Number(p.compareAtPrice) : (p.originalPrice ? Number(p.originalPrice) : null),
      p.stock !== undefined ? p.stock : 50,
      Number(p.rating) || 4.8,
      Number(p.reviewsCount || p.reviewCount) || 120,
      p.image,
      p.imageDisplayMode || (p.isFashion ? 'cover' : 'contain'),
      p.isBestSeller ? 1 : 0,
      p.isNew ? 1 : 0,
      p.shortDescription || '',
      JSON.stringify(details)
    );
    syncedProducts++;
  }

  // 2. Synchronize Promo Codes if empty
  const promoCountRow = db.prepare('SELECT count(*) as count FROM promo_codes').get();
  if (!promoCountRow || promoCountRow.count === 0) {
    const insertPromoStmt = db.prepare(`
      INSERT OR REPLACE INTO promo_codes (
        code, discount_percent, fixed_discount, min_amount, is_free_shipping, description, badge, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const promo of promosList) {
      insertPromoStmt.run(
        promo.code,
        promo.discountPercent || null,
        promo.fixedDiscount || null,
        promo.minAmount || 0,
        promo.freeShipping ? 1 : 0,
        promo.description || '',
        promo.badge || ''
      );
    }
    console.log(`[CatalogSync] Seeded ${promosList.length} promo codes.`);
  }

  // 3. Ensure default admin user exists
  const adminCheck = db.prepare(`SELECT count(*) as count FROM users WHERE role = 'admin'`).get();
  if (!adminCheck || adminCheck.count === 0) {
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
    console.log('[CatalogSync] Created default admin account (admin@eshopstore.shop).');
  }

  console.log(`[CatalogSync] Successfully synchronized ${syncedProducts} products into SQLite database.`);
  return { synced: true, count: syncedProducts };
}
