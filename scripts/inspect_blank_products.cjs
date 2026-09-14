const fs = require('fs');
const { PRODUCTS } = require('../src/data/products.js');

const targetNames = [
  'Réveil Lumineux Simulateur d\'Aube',
  'Bouteille d\'Eau Intelligente avec Affichage Température',
  'Aspirateur'
];

targetNames.forEach(name => {
  const p = PRODUCTS.find(x => x.name.toLowerCase().includes(name.toLowerCase().slice(0, 10)));
  if (p) {
    console.log('--------------------------------------------------');
    console.log('ID:', p.id);
    console.log('Name:', p.name);
    console.log('Category:', p.category);
    console.log('Image:', p.image);
    console.log('Image exists on disk:', fs.existsSync('./public' + p.image));
    if (fs.existsSync('./public' + p.image)) {
      console.log('Image size:', fs.statSync('./public' + p.image).size);
    }
    console.log('Gallery:', p.gallery);
    if (p.gallery) {
      p.gallery.forEach((g, i) => {
        console.log(`  Gallery[${i}] (${fs.existsSync('./public' + g)}): ${g}`);
      });
    }
  } else {
    console.log('NOT FOUND:', name);
  }
});
