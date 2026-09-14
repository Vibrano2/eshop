import fs from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from '../src/data/products.js';
import { PROMO_CODES } from '../src/data/promoCodes.js';

const serverDataDir = path.resolve('server/data');
if (!fs.existsSync(serverDataDir)) {
  fs.mkdirSync(serverDataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(serverDataDir, 'products.json'),
  JSON.stringify(PRODUCTS, null, 2),
  'utf-8'
);

fs.writeFileSync(
  path.join(serverDataDir, 'promoCodes.json'),
  JSON.stringify(PROMO_CODES, null, 2),
  'utf-8'
);

console.log(`✓ Exported ${PRODUCTS.length} products to server/data/products.json`);
console.log(`✓ Exported ${PROMO_CODES.length} promo codes to server/data/promoCodes.json`);
