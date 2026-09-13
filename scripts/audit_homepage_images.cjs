const fs = require('fs');
const { PRODUCTS } = require('../src/data/products.js');
const { MAIN_CATEGORIES } = require('../src/data/categories.js');

console.log('===============================================================');
console.log('FINAL HOMEPAGE IMAGE CONSISTENCY AUDIT');
console.log('===============================================================\n');

let issues = 0;

// 1. Hero Featured Product
console.log('1. HERO FEATURED PRODUCT:');
const heroProductId = 'batterie-externe-compacte-10000';
const heroProduct = PRODUCTS.find(p => p.id === heroProductId);
const heroBannerFile = fs.readFileSync('./src/components/HeroBanner.jsx', 'utf8');
const heroImgMatch = heroBannerFile.match(/src="(\/products\/[^"]+)"/);
const heroBannerImg = heroImgMatch ? heroImgMatch[1] : null;

console.log('   Target Product:', heroProduct.name, `(${heroProduct.id})`);
console.log('   Product Hero Image:', heroProduct.image);
console.log('   HeroBanner.jsx Image:', heroBannerImg);
if (heroBannerImg !== heroProduct.image) {
  console.error('   ❌ MISMATCH: HeroBanner image does not match product.image!');
  issues++;
} else {
  console.log('   ✅ MATCH: HeroBanner uses approved Image 1 hero image.');
}

// Check file on disk
if (fs.existsSync('./public' + heroProduct.image)) {
  const size = Math.round(fs.statSync('./public' + heroProduct.image).size / 1024);
  console.log('   ✅ Disk file verified:', heroProduct.image, `(${size} KB)`);
} else {
  console.error('   ❌ File missing on disk:', heroProduct.image);
  issues++;
}

// 2. Collection Cards
console.log('\n2. COLLECTION CARDS (MAIN_CATEGORIES):');
MAIN_CATEGORIES.forEach(cat => {
  const fileExists = fs.existsSync('./public' + cat.image);
  const size = fileExists ? Math.round(fs.statSync('./public' + cat.image).size / 1024) : 0;
  console.log(`   [${cat.name}]: ${cat.image} - ${fileExists ? `EXISTS (${size} KB)` : 'MISSING'}`);
  if (!fileExists) {
    issues++;
  }
});

// Helper for section audits
function auditSection(name, ids) {
  console.log(`\n${name}:`);
  ids.forEach(id => {
    const p = PRODUCTS.find(prod => prod.id === id);
    if (!p) {
      console.error(`   ❌ Product ID not found in catalog: ${id}`);
      issues++;
      return;
    }

    const fileExists = fs.existsSync('./public' + p.image);
    const size = fileExists ? Math.round(fs.statSync('./public' + p.image).size / 1024) : 0;
    const gallery0Match = p.gallery && p.gallery[0] === p.image;

    console.log(`   - ${p.name} (${p.id}):`);
    console.log(`     Hero: ${p.image} | Size: ${size} KB | Gallery[0] sync: ${gallery0Match ? 'YES' : 'NO'}`);
    
    if (!fileExists) {
      console.error(`     ❌ File missing on disk!`);
      issues++;
    }
    if (!gallery0Match) {
      console.error(`     ❌ gallery[0] does not match image!`);
      issues++;
    }
  });
}

// 3. Best Sellers
auditSection('3. BEST SELLERS', [
  'batterie-externe-compacte-10000',
  'blender-portable-rechargeable',
  'rouleau-boucles-sans-chaleur',
  'aspirateur-voiture-sans-fil'
]);

// 4. Trending Products
auditSection('4. TRENDING PRODUCTS', [
  'support-telephone-voiture',
  'brosse-nettoyage-electrique',
  'rouleau-glace-visage',
  'cubes-rangement-valise'
]);

// 5. New Arrivals
auditSection('5. NEW ARRIVALS', [
  'mini-imprimante-thermique-bluetooth',
  'lunch-box-electrique-chauffante',
  'defroisseur-vapeur-portable',
  'ventilateur-cou-rechargeable'
]);

console.log('\n===============================================================');
if (issues === 0) {
  console.log('✅ ALL HOMEPAGE SECTIONS FULLY CONSISTENT & AUDITED (0 ISSUES)');
} else {
  console.error(`❌ FOUND ${issues} ISSUE(S)`);
}
console.log('===============================================================\n');
