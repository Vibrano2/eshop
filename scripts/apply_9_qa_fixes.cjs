const fs = require('fs');
const path = require('path');

// 1. Copy verified assets to final hero filenames in public/products/
const copies = [
  ['./public/products/test_charger_0.jpg', './public/products/chargeur-magnetique-3-en-1-hero.jpg'],
  ['./public/products/test_shirt.jpg', './public/products/t-shirt-classique-homme-hero.jpg'],
  ['./public/products/cand_poopbag_1.jpg', './public/products/distributeur-sacs-dejections-hero.jpg'],
  ['./public/products/test_p_dog1.jpg', './public/products/jouet-distributeur-friandises-hero.jpg'],
  ['./public/products/cand_bracelet_0.jpg', './public/products/bracelet-jonc-acier-inoxydable-hero.jpg'],
  ['./public/products/test_pex_sport.jpg', './public/products/gants-fitness-respirants-hero.jpg'],
  ['./public/products/test_p_duffel1.jpg', './public/products/sac-sport-compact-hero.jpg'],
  ['./public/products/test_umbrella_display.jpg', './public/products/parapluie-compact-hero.jpg']
];

for (const [src, dest] of copies) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} -> ${path.basename(dest)} (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
  } else {
    console.error(`Source missing: ${src}`);
  }
}

// 2. Define updates for products.js
const updates = {
  'chargeur-magnetique-3-en-1': {
    image: '/products/chargeur-magnetique-3-en-1-hero.jpg',
    gallery: [
      '/products/chargeur-magnetique-3-en-1-hero.jpg',
      '/products/chargeur-magnetique-3-en-1-features.jpg',
      '/products/chargeur-magnetique-3-en-1-details.jpg'
    ]
  },
  't-shirt-classique-homme': {
    image: '/products/t-shirt-classique-homme-hero.jpg',
    gallery: [
      '/products/t-shirt-classique-homme-hero.jpg',
      '/products/t-shirt-classique-homme.jpg',
      '/products/t-shirt-classique-homme-features.jpg',
      '/products/t-shirt-classique-homme-details.jpg'
    ]
  },
  'distributeur-sacs-dejections': {
    image: '/products/distributeur-sacs-dejections-hero.jpg',
    gallery: [
      '/products/distributeur-sacs-dejections-hero.jpg',
      '/products/distributeur-sacs-dejections.jpg',
      '/products/distributeur-sacs-dejections-features.jpg',
      '/products/distributeur-sacs-dejections-details.jpg'
    ]
  },
  'jouet-distributeur-friandises': {
    image: '/products/jouet-distributeur-friandises-hero.jpg',
    gallery: [
      '/products/jouet-distributeur-friandises-hero.jpg',
      '/products/jouet-distributeur-friandises.jpg',
      '/products/jouet-distributeur-friandises-features.jpg',
      '/products/jouet-distributeur-friandises-details.jpg'
    ]
  },
  'bracelet-jonc-acier-inoxydable': {
    image: '/products/bracelet-jonc-acier-inoxydable-hero.jpg',
    gallery: [
      '/products/bracelet-jonc-acier-inoxydable-hero.jpg',
      '/products/bracelet-jonc-acier-inoxydable-features.jpg',
      '/products/bracelet-jonc-acier-inoxydable-details.jpg'
    ]
  },
  'gants-fitness-respirants': {
    image: '/products/gants-fitness-respirants-hero.jpg',
    gallery: [
      '/products/gants-fitness-respirants-hero.jpg',
      '/products/gants-fitness-respirants.jpg',
      '/products/gants-fitness-respirants-features.jpg',
      '/products/gants-fitness-respirants-details.jpg'
    ]
  },
  'sac-sport-compact': {
    image: '/products/sac-sport-compact-hero.jpg',
    gallery: [
      '/products/sac-sport-compact-hero.jpg',
      '/products/test_p_duffel2.jpg',
      '/products/sac-sport-compact-features.jpg',
      '/products/sac-sport-compact-details.jpg'
    ]
  },
  'parapluie-compact': {
    image: '/products/parapluie-compact-hero.jpg',
    gallery: [
      '/products/parapluie-compact-hero.jpg',
      '/products/parapluie-compact.jpg',
      '/products/parapluie-compact-features.jpg',
      '/products/parapluie-compact-details.jpg'
    ]
  },
  'pare-soleil-retractable-parebrise': {
    image: '/products/pare-soleil-retractable-parebrise-installed.jpg',
    gallery: [
      '/products/pare-soleil-retractable-parebrise-installed.jpg',
      '/products/pare-soleil-retractable-parebrise.jpg',
      '/products/pare-soleil-retractable-parebrise-features.jpg',
      '/products/pare-soleil-retractable-parebrise-details.jpg'
    ]
  }
};

let content = fs.readFileSync('./src/data/products.js', 'utf8');

for (const [id, data] of Object.entries(updates)) {
  const idRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"image":\\s*")[^"]+(")`);
  if (!idRegex.test(content)) {
    console.error(`Could not match image for product ${id}`);
    continue;
  }
  content = content.replace(idRegex, `$1${data.image}$2`);

  const galleryRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"gallery":\\s*\\[)[\\s\\S]*?(\\])`);
  if (!galleryRegex.test(content)) {
    console.error(`Could not match gallery for product ${id}`);
    continue;
  }
  const formattedGallery = '\n' + data.gallery.map(g => `      "${g}"`).join(',\n') + '\n    ';
  content = content.replace(galleryRegex, `$1${formattedGallery}$2`);

  console.log(`Updated product: ${id}`);
}

fs.writeFileSync('./src/data/products.js', content, 'utf8');
console.log('Successfully updated src/data/products.js');
