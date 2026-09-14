const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('../src/data/products.js');

const targetIds = [
  'chargeur-magnetique-3-en-1',
  't-shirt-classique-homme',
  'distributeur-sacs-dejections',
  'jouet-distributeur-friandises',
  'bracelet-jonc-acier-inoxydable',
  'gants-fitness-respirants',
  'sac-sport-compact',
  'parapluie-compact',
  'pare-soleil-retractable-parebrise'
];

targetIds.forEach((id, i) => {
  const p = PRODUCTS.find(x => x.id === id);
  console.log(`\n${i + 1}. [${p.id}] ${p.name}`);
  console.log(`   Hero Image: ${p.image} (exists: ${fs.existsSync(path.join('./public', p.image))})`);
  console.log(`   Gallery Length: ${p.gallery.length}`);
  console.log(`   Gallery[0] === Image: ${p.gallery[0] === p.image}`);
  p.gallery.forEach((g, idx) => {
    console.log(`     [${idx}] ${g} (exists: ${fs.existsSync(path.join('./public', g))})`);
  });
});
