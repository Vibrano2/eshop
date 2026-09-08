const report = require('./audit_report.json');
console.log('Total audited products:', report.length);

const localPackshots = report.filter(p => p.image.startsWith('/products/')).length;
const unsplashCurated = report.filter(p => p.image.includes('images.unsplash.com')).length;
console.log('Local isolated packshots:', localPackshots);
console.log('Curated high-res imagery:', unsplashCurated);

const categories = [...new Set(report.map(p => p.category))];
categories.forEach(c => {
  const items = report.filter(p => p.category === c);
  const loc = items.filter(p => p.image.startsWith('/products/')).length;
  console.log(`  - ${c.toUpperCase()}: ${items.length} products (${loc} local isolated packshots, ${items.length - loc} curated high-conversion images)`);
});
