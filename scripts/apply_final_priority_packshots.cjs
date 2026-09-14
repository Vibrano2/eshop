const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\69741afb-48dc-49a4-9a61-2f7fefd759fd\\';
const publicDir = './public/products/';

// Generated files to copy
const copies = [
  // 12. Aspirateur de bureau compact
  ['aspirateur_bureau_hero_1789361566234.jpg', 'aspirateur-bureau-compact-hero.jpg'],
  // 1. Chargeur 3-en-1
  ['chargeur_3en1_foldable_1789361586886.jpg', 'chargeur-magnetique-3-en-1-hero.jpg'],
  // 2. T-shirt classique homme
  ['tshirt_classique_hero_1789361607791.jpg', 't-shirt-classique-homme-hero.jpg'],
  // 3. Distributeur sacs déjections 6 rouleaux
  ['distributeur_sacs_6rouleaux_1789361629740.jpg', 'distributeur-sacs-dejections-hero.jpg'],
  // 4. Balle friandises chien
  ['balle_friandises_chien_1789361654257.jpg', 'jouet-distributeur-friandises-hero.jpg'],
  // 5. Bracelet jonc ouvert inox
  ['bracelet_jonc_inox_1789361680710.jpg', 'bracelet-jonc-acier-inoxydable-hero.jpg'],
  // 6. Gants fitness avec protège-poignets
  ['gants_fitness_hero_1789361709335.jpg', 'gants-fitness-respirants-hero.jpg'],
  // 7. Sac de sport avec compartiment chaussures
  ['sac_sport_chaussures_1789361740297.jpg', 'sac-sport-compact-hero.jpg'],
  // 8. Parapluie compact coupe-vent plié + ouvert
  ['parapluie_compact_hero_1789361774199.jpg', 'parapluie-compact-hero.jpg'],
  // 19. Repose-pieds ergonomique bureau
  ['repose_pieds_hero_1789361816374.jpg', 'repose-pieds-ergonomique.jpg'],
  // 20. Oreiller de voyage ergonomique
  ['oreiller_voyage_hero_1789361855066.jpg', 'oreiller-voyage-memoire.jpg']
];

for (const [srcName, destName] of copies) {
  const src = path.join(brainDir, srcName);
  const dest = path.join(publicDir, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${srcName} -> ${destName} (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
  } else {
    console.error(`❌ Source not found: ${src}`);
  }
}

// Update products.js
const updates = {
  'aspirateur-bureau-compact': {
    image: '/products/aspirateur-bureau-compact-hero.jpg',
    gallery: [
      '/products/aspirateur-bureau-compact-hero.jpg',
      '/products/aspirateur-bureau-compact-features.jpg',
      '/products/aspirateur-bureau-compact-details.jpg'
    ]
  },
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
  'repose-pieds-ergonomique': {
    image: '/products/repose-pieds-ergonomique.jpg',
    gallery: [
      '/products/repose-pieds-ergonomique.jpg',
      '/products/repose-pieds-ergonomique-setup.jpg',
      '/products/repose-pieds-ergonomique-features.jpg',
      '/products/repose-pieds-ergonomique-details.jpg'
    ]
  },
  'oreiller-voyage-memoire': {
    image: '/products/oreiller-voyage-memoire.jpg',
    gallery: [
      '/products/oreiller-voyage-memoire.jpg',
      '/products/oreiller-voyage-memoire-lifestyle.jpg',
      '/products/oreiller-voyage-memoire-features.jpg',
      '/products/oreiller-voyage-memoire-details.jpg'
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

  console.log(`✅ Updated ${id} in src/data/products.js`);
}

fs.writeFileSync('./src/data/products.js', content, 'utf8');
console.log('\nFinished updating src/data/products.js!');
