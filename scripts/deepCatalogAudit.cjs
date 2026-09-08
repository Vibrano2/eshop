const { PRODUCTS } = require('../src/data/products.js');
const fs = require('fs');

console.log('Auditing', PRODUCTS.length, 'products...');

// Mapping of known products to their expected physical visual subject
const auditItems = PRODUCTS.map((p, idx) => {
  return {
    index: idx + 1,
    id: p.id,
    sku: p.sku || 'N/A',
    slug: p.slug || p.id,
    name: p.name,
    category: p.category,
    image: p.image,
    displayMode: p.imageDisplayMode || 'auto',
    scale: p.imageScale || 1,
    position: p.imagePosition || 'center'
  };
});

fs.writeFileSync('./scripts/deep_audit.json', JSON.stringify(auditItems, null, 2));
console.log('Saved deep_audit.json with', auditItems.length, 'records.');
