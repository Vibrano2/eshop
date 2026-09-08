const { PRODUCTS } = require('../src/data/products.js');
const fs = require('fs');

const report = PRODUCTS.map((p, i) => {
  return {
    index: i + 1,
    id: p.id,
    category: p.category,
    name: p.name,
    image: p.image,
    displayMode: p.imageDisplayMode || 'auto',
    scale: p.imageScale || 1
  };
});

fs.writeFileSync('./scripts/audit_report.json', JSON.stringify(report, null, 2));
console.log('Audited', report.length, 'products. Saved to ./scripts/audit_report.json');
