const fs = require('fs');
const path = require('path');
const { PRODUCTS, CATEGORIES } = require('../src/data/products.js');

console.log('Total products in catalog:', PRODUCTS.length);

let errors = [];
let categoryCounts = {};

PRODUCTS.forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;

  // Check hero image exists
  const heroPath = path.join('./public', p.image);
  if (!fs.existsSync(heroPath)) {
    errors.push(`[${p.id}] Hero missing on disk: ${p.image}`);
  }

  // Check gallery exists and has between 3 and 4 images
  if (!Array.isArray(p.gallery) || p.gallery.length < 3 || p.gallery.length > 4) {
    errors.push(`[${p.id}] Gallery count out of range (3-4): ${p.gallery ? p.gallery.length : 'none'}`);
  }

  // Check gallery[0] matches hero image
  if (p.gallery && p.gallery[0] !== p.image) {
    errors.push(`[${p.id}] Gallery[0] (${p.gallery[0]}) does not match hero image (${p.image})`);
  }

  // Check all gallery images exist
  if (p.gallery) {
    p.gallery.forEach((g, idx) => {
      const gPath = path.join('./public', g);
      if (!fs.existsSync(gPath)) {
        errors.push(`[${p.id}] Gallery[${idx}] missing on disk: ${g}`);
      }
    });

    // Check for French details infographic
    const hasDetails = p.gallery.some(g => g.endsWith('-details.jpg'));
    if (!hasDetails) {
      errors.push(`[${p.id}] Missing -details.jpg infographic in gallery`);
    }
  }
});

console.log('Category product counts:', categoryCounts);

if (errors.length > 0) {
  console.error('AUDIT FOUND ' + errors.length + ' ISSUES:');
  errors.slice(0, 30).forEach(e => console.error(' - ' + e));
  if (errors.length > 30) console.error(` ... and ${errors.length - 30} more`);
} else {
  console.log('✅ ALL 123 PRODUCTS PASSED FULL AUDIT!');
}
