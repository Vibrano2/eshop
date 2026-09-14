import { PRODUCTS } from '../src/data/products.js';
import { db, initDatabase } from '../server/db.js';
import { syncCatalog } from '../server/services/catalogSync.js';
import { buildAndSavePendingOrder } from '../server/routes/payment.js';

console.log('====================================================');
console.log('🏁 FULL CATALOG & CHECKOUT INTEGRITY AUDIT');
console.log('====================================================');

initDatabase();
syncCatalog({ force: true });

console.log(`Auditing all ${PRODUCTS.length} products...`);

let successes = 0;
let failures = 0;
const issues = [];

for (let idx = 0; idx < PRODUCTS.length; idx++) {
  const p = PRODUCTS[idx];

  // 1. Verify Catalog Record Structure
  if (!p.id || typeof p.id !== 'string') {
    failures++;
    issues.push({ id: p.id, error: 'Missing or invalid id' });
    continue;
  }
  if (!p.sku) {
    failures++;
    issues.push({ id: p.id, error: 'Missing sku' });
    continue;
  }
  if (!p.slug) {
    failures++;
    issues.push({ id: p.id, error: 'Missing slug' });
    continue;
  }
  if (p.price === undefined || p.price <= 0) {
    failures++;
    issues.push({ id: p.id, error: `Invalid price: ${p.price}` });
    continue;
  }
  if (p.stock === undefined || p.stock <= 0) {
    failures++;
    issues.push({ id: p.id, error: `Invalid stock: ${p.stock}` });
    continue;
  }

  // 2. Verify Database Match
  const dbProd = db.prepare('SELECT id, sku, slug, name, price, stock FROM products WHERE id = ?').get(p.id);
  if (!dbProd) {
    failures++;
    issues.push({ id: p.id, error: 'Not found in SQLite database by ID' });
    continue;
  }
  if (dbProd.id !== p.id) {
    failures++;
    issues.push({ id: p.id, error: `ID mismatch: catalog=${p.id}, db=${dbProd.id}` });
    continue;
  }
  if (Number(dbProd.price) !== Number(p.price)) {
    failures++;
    issues.push({ id: p.id, error: `Price mismatch: catalog=${p.price}, db=${dbProd.price}` });
    continue;
  }

  // 3. Test Checkout Order Creation with Canonical ID
  try {
    const testOrder = buildAndSavePendingOrder({
      items: [{ id: p.id, quantity: 1 }],
      customer: { email: `buyer-${idx}@eshopstore.shop`, firstName: 'Test', lastName: 'Auditor' }
    });

    if (!testOrder || !testOrder.orderNumber) {
      failures++;
      issues.push({ id: p.id, error: 'Failed to generate orderNumber' });
      continue;
    }

    const item = testOrder.validatedItems[0];
    if (item.id !== p.id) {
      failures++;
      issues.push({ id: p.id, error: `Order item ID ${item.id} != canonical ID ${p.id}` });
      continue;
    }
  } catch (err) {
    failures++;
    issues.push({ id: p.id, error: `Checkout validation threw: ${err.message}` });
    continue;
  }

  // 4. Test Checkout Order Creation with Slug Fallback
  if (p.slug && p.slug !== p.id) {
    try {
      const slugOrder = buildAndSavePendingOrder({
        items: [{ id: p.slug, quantity: 1 }],
        customer: { email: `slug-${idx}@eshopstore.shop`, firstName: 'Slug', lastName: 'Test' }
      });
      if (slugOrder.validatedItems[0].id !== p.id) {
        failures++;
        issues.push({ id: p.id, error: `Slug lookup resolved to ${slugOrder.validatedItems[0].id} instead of ${p.id}` });
        continue;
      }
    } catch (err) {
      failures++;
      issues.push({ id: p.id, error: `Slug checkout validation threw: ${err.message}` });
      continue;
    }
  }

  // 5. Test Checkout Order Creation with SKU Fallback
  if (p.sku) {
    try {
      const skuOrder = buildAndSavePendingOrder({
        items: [{ id: p.sku, quantity: 1 }],
        customer: { email: `sku-${idx}@eshopstore.shop`, firstName: 'Sku', lastName: 'Test' }
      });
      if (skuOrder.validatedItems[0].id !== p.id) {
        failures++;
        issues.push({ id: p.id, error: `SKU lookup resolved to ${skuOrder.validatedItems[0].id} instead of ${p.id}` });
        continue;
      }
    } catch (err) {
      failures++;
      issues.push({ id: p.id, error: `SKU checkout validation threw: ${err.message}` });
      continue;
    }
  }

  successes++;
}

console.log('====================================================');
console.log(`✅ AUDIT RESULTS:`);
console.log(`   Total Products Audited: ${PRODUCTS.length}`);
console.log(`   Successful Validations: ${successes}`);
console.log(`   Failed Validations:     ${failures}`);
console.log(`   Inconsistencies Found:  ${issues.length}`);
if (issues.length > 0) {
  console.log('Issues:', issues);
} else {
  console.log('🎉 100% of catalog products passed full inventory and checkout validation!');
}
console.log('====================================================');
