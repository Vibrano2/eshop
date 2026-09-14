const fs = require('fs');
const path = require('path');
const { renderBrightInfographic } = require('./generate_bright_infographics.cjs');
const { renderBrightCloseup } = require('./generate_bright_closeups.cjs');
const { renderBrightLifestyle } = require('./generate_bright_lifestyle.cjs');

const productsFilePath = path.resolve('./src/data/products.js');
const { PRODUCTS } = require(productsFilePath);

console.log('=== STARTING FULL CATALOG POWER-BANK BENCHMARK STANDARDIZATION ===');
console.log(`Processing all ${PRODUCTS.length} products...`);

// Verified genuine secondary photography mapping
const GENUINE_SECONDARY_PHOTOS = {
  'batterie-externe-compacte-10000': {
    lifestyle: '/products/batterie-externe-compacte-lifestyle.jpg',
    closeup: '/products/batterie-externe-compacte-closeup.jpg'
  },
  'organisateur-cables': {
    lifestyle: '/products/organisateur-cables.jpg'
  },
  'repose-pieds-ergonomique': {
    lifestyle: '/products/repose-pieds-ergonomique-setup.jpg'
  },
  'sac-sport-compact': {
    lifestyle: '/products/sac-sport.jpg'
  },
  'organisateur-entre-sieges': {
    lifestyle: '/products/organisateur-entre-sieges-lifestyle.jpg'
  },
  'oreiller-voyage-memoire': {
    lifestyle: '/products/oreiller-voyage-memoire-lifestyle.jpg'
  },
  'parapluie-compact': {
    lifestyle: '/products/parapluie-compact.jpg'
  },
  'mini-microphone-sans-fil': {
    lifestyle: '/products/mini-microphone-sans-fil.jpg'
  },
  'tapis-souris-xxl-ergonomique': {
    lifestyle: '/products/tapis-souris-xxl-ergonomique.jpg'
  },
  'lampe-led-bureau-tactile': {
    lifestyle: '/products/lampe-led-bureau-tactile.jpg'
  },
  't-shirt-classique-homme': {
    lifestyle: '/products/t-shirt-classique-homme.jpg'
  },
  'boites-hermetiques-lot4': {
    lifestyle: '/products/boites-hermetiques-lot4.jpg'
  },
  'jouet-distributeur-friandises': {
    lifestyle: '/products/jouet-distributeur-friandises.jpg'
  },
  'distributeur-sacs-dejections': {
    lifestyle: '/products/distributeur-sacs-dejections.jpg'
  },
  'chiffons-microfibres-auto-lot3': {
    lifestyle: '/products/chiffons-microfibres-auto-lifestyle.jpg'
  },
  'pare-soleil-retractable-parebrise': {
    lifestyle: '/products/pare-soleil-retractable-parebrise.jpg'
  },
  'gants-fitness-respirants': {
    lifestyle: '/products/gants-fitness-respirants.jpg'
  },
  'ceinture-cuir-automatique': {
    lifestyle: '/products/ceinture-cuir.jpg'
  },
  'bracelet-jonc-acier-inoxydable': {
    lifestyle: '/products/bracelet-jonc-acier-inoxydable.jpg'
  },
  'souffleur-air-electrique-rechargeable': {
    lifestyle: '/products/souffleur-air-electrique.jpg'
  },
  'mini-machine-sceller-sachets': {
    lifestyle: '/products/mini-machine-sceller.jpg'
  },
  'blender-portable-rechargeable': {
    lifestyle: '/products/blender-portable.jpg'
  },
  'lunch-box-electrique-chauffante': {
    lifestyle: '/products/lunch-box-electrique.jpg'
  },
  'brosse-nettoyage-electrique': {
    lifestyle: '/products/brosse-nettoyage-electrique.jpg'
  },
  'defroisseur-vapeur-portable': {
    lifestyle: '/products/defroisseur-vapeur.jpg'
  },
  'sac-voyage-pliable-extensible': {
    lifestyle: '/products/sac-voyage-pliable.jpg'
  },
  'ventilateur-cou-rechargeable': {
    lifestyle: '/products/ventilateur-cou-rechargeable-hero.jpg'
  },
  'trousse-maquillage-voyage': {
    lifestyle: '/products/trousse-maquillage.jpg'
  }
};

let brightInfographicsCount = 0;
let brightCloseupsCount = 0;
let brightLifestyleCount = 0;

PRODUCTS.forEach((p, idx) => {
  const id = p.id;
  const heroAbsPath = path.resolve('./public' + p.image);

  // 1. IMAGE 1: Hero packshot (clean studio packshot)
  const img1 = p.image;

  // 2. IMAGE 2: Real lifestyle / in-use image of exact same product
  let img2 = '';
  if (GENUINE_SECONDARY_PHOTOS[id]?.lifestyle && fs.existsSync(path.resolve('./public' + GENUINE_SECONDARY_PHOTOS[id].lifestyle))) {
    img2 = GENUINE_SECONDARY_PHOTOS[id].lifestyle;
  } else {
    const lifestyleFile = `${id}-lifestyle.jpg`;
    const lifestylePath = path.resolve(`./public/products/${lifestyleFile}`);
    try {
      renderBrightLifestyle(p, heroAbsPath, lifestylePath);
      brightLifestyleCount++;
    } catch (err) {
      console.warn(`Error generating bright lifestyle for ${id}:`, err.message);
    }
    img2 = `/products/${lifestyleFile}`;
  }

  // 3. IMAGE 3: Clean French product-details infographic (bright, clean, light background)
  let img3 = '';
  if (id === 'batterie-externe-compacte-10000') {
    img3 = '/products/batterie-externe-compacte-10000-details.jpg';
  } else {
    const detailsFile = `${id}-details.jpg`;
    const detailsPath = path.resolve(`./public/products/${detailsFile}`);
    try {
      renderBrightInfographic(p, heroAbsPath, detailsPath);
      brightInfographicsCount++;
    } catch (err) {
      console.warn(`Error generating bright infographic for ${id}:`, err.message);
    }
    img3 = `/products/${detailsFile}`;
  }

  // 4. IMAGE 4: Secondary product visual / macro close-up / alternate angle
  let img4 = '';
  if (GENUINE_SECONDARY_PHOTOS[id]?.closeup && fs.existsSync(path.resolve('./public' + GENUINE_SECONDARY_PHOTOS[id].closeup))) {
    img4 = GENUINE_SECONDARY_PHOTOS[id].closeup;
  } else {
    const closeupFile = `${id}-closeup.jpg`;
    const closeupPath = path.resolve(`./public/products/${closeupFile}`);
    try {
      renderBrightCloseup(p, heroAbsPath, closeupPath);
      brightCloseupsCount++;
    } catch (err) {
      console.warn(`Error generating bright closeup for ${id}:`, err.message);
    }
    img4 = `/products/${closeupFile}`;
  }

  // Set standard 4-image gallery
  p.gallery = [img1, img2, img3, img4];

  // 5. Clean and simplify copy
  if (p.benefits && Array.isArray(p.benefits)) {
    p.benefits = p.benefits.slice(0, 3).map(b => {
      return b
        .replace(/100\s?000\s?tr\/min/gi, 'haute performance réglable')
        .replace(/100%\s?étanche/gi, 'conception étanche')
        .replace(/100%\s?sûr/gi, 'testé et certifié')
        .replace(/100%\s?silencieux/gi, 'fonctionnement silencieux')
        .replace(/100%\s?hypoallergénique/gi, 'hypoallergénique')
        .replace(/infaillible/gi, 'efficace et fiable')
        .replace(/20W\s?Power\s?Delivery/gi, 'charge rapide USB-C')
        .replace(/15W\s?Qi/gi, 'charge sans fil rapide')
        .replace(/titane\s?argenté/gi, 'réflecteur de chaleur')
        .replace(/acier\s?chirurgical\s?316L/gi, 'acier inoxydable durable')
        .replace(/indestructible/gi, 'ultra-résistant')
        .replace(/zéro\s?défaut/gi, 'qualité contrôlée');
    });
  }

  if (p.shortDescription) {
    p.shortDescription = p.shortDescription
      .replace(/100\s?000\s?tr\/min/gi, 'haute performance')
      .replace(/100%\s?étanche/gi, 'étanche')
      .replace(/infaillible/gi, 'efficace')
      .replace(/20W\s?Power\s?Delivery/gi, 'charge rapide')
      .replace(/15W\s?Qi/gi, 'charge sans fil');
  }

  if ((idx + 1) % 25 === 0 || idx === PRODUCTS.length - 1) {
    console.log(`Progress: ${idx + 1} / ${PRODUCTS.length} products standardized.`);
  }
});

console.log('✓ Rendered Bright Infographics:', brightInfographicsCount);
console.log('✓ Rendered Bright Lifestyles:', brightLifestyleCount);
console.log('✓ Rendered Bright Closeups:', brightCloseupsCount);

// Save back to products.js
const updatedContent = `// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires
export const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};
`;

fs.writeFileSync(productsFilePath, updatedContent, 'utf8');
console.log('✓ Successfully saved updated PRODUCTS to src/data/products.js');
