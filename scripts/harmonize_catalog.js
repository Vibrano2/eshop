import fs from 'node:fs';
import { PRODUCTS } from '../src/data/products.js';

const catPrefixes = {
  'tech': 'TECH',
  'technologie': 'TECH',
  'maison': 'HOME',
  'beaute': 'BEA',
  'voyage-auto': 'AUTO',
  'auto': 'AUTO',
  'voyage': 'VOY',
  'mode': 'MOD',
  'animaux': 'PET',
  'sport': 'SPO',
  'securite': 'SEC',
  'accessoires': 'ACC'
};

const skus = new Set(PRODUCTS.map(p => p.sku).filter(Boolean));
const slugs = new Set(PRODUCTS.map(p => p.slug).filter(Boolean));

const harmonized = PRODUCTS.map(p => {
  const item = { ...p };
  
  // 1. Slug
  if (!item.slug) {
    item.slug = item.id;
  }
  slugs.add(item.slug);

  // 2. SKU
  if (!item.sku) {
    const prefix = catPrefixes[item.category] || 'PRD';
    const cleanId = item.id.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 15);
    let candidate = `${prefix}-${cleanId}`;
    let counter = 1;
    while (skus.has(candidate)) {
      candidate = `${prefix}-${cleanId}-${counter++}`;
    }
    item.sku = candidate;
    skus.add(candidate);
  }

  // 3. Stock
  if (item.stock === undefined || item.stock === null || item.stock <= 0) {
    item.stock = 50;
  }

  // 4. Status
  item.status = 'active';

  return item;
});

const content = `// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires
export const PRODUCTS = ${JSON.stringify(harmonized, null, 2)};
`;

fs.writeFileSync('./src/data/products.js', content, 'utf-8');
console.log(`✓ Harmonized ${harmonized.length} products in src/data/products.js`);
