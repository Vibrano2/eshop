const fs = require('fs');
const { PRODUCTS } = require('../src/data/products.js');

const allFiles = fs.readdirSync('./public/products');

const usedFiles = new Set();
PRODUCTS.forEach(p => {
  if (p.image) usedFiles.add(p.image.replace('/products/', ''));
  if (p.gallery) p.gallery.forEach(g => usedFiles.add(g.replace('/products/', '')));
});

const unusedFiles = allFiles.filter(f => !usedFiles.has(f));
console.log('Total files in public/products:', allFiles.length);
console.log('Used files in catalog:', usedFiles.size);
console.log('Unused files in public/products:', unusedFiles.length);

console.log('\n--- Unused files sample (first 100) ---');
unusedFiles.slice(0, 100).forEach(f => {
  const stat = fs.statSync('./public/products/' + f);
  console.log(f, Math.round(stat.size / 1024) + 'KB');
});
