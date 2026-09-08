const { PRODUCTS } = require('../src/data/products.js');

console.log('====================================================');
console.log('FULL AUDIT OF ALL 110 PRODUCTS IN CATALOG');
console.log('====================================================');

const audited = PRODUCTS.map((p, i) => {
  const isLocal = p.image.startsWith('/products/');
  return {
    index: i + 1,
    id: p.id,
    sku: p.sku || 'N/A',
    category: p.category,
    name: p.name,
    image: p.image,
    isLocalPackshot: isLocal,
    displayMode: p.imageDisplayMode || (p.isFashion ? 'cover' : 'contain')
  };
});

// Summary by category
const byCat = {};
audited.forEach(a => {
  if (!byCat[a.category]) byCat[a.category] = [];
  byCat[a.category].push(a);
});

for (const [cat, items] of Object.entries(byCat)) {
  console.log(`\n### [CATEGORY: ${cat.toUpperCase()}] (${items.length} products)`);
  items.forEach(item => {
    const srcType = item.isLocalPackshot ? '[LOCAL PACKSHOT]' : '[CURATED CLOUD]';
    console.log(`${item.index.toString().padStart(3, ' ')}. [${item.id}] ${srcType} (mode: ${item.displayMode})`);
    console.log(`     Title: "${item.name}"`);
    console.log(`     Image: ${item.image}`);
  });
}
