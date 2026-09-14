const fs = require('fs');
const path = require('path');
const { renderCloseupCard } = require('./generate_closeup_cards.cjs');

const productsFilePath = path.resolve('./src/data/products.js');
let fileContent = fs.readFileSync(productsFilePath, 'utf8');

// Require the current PRODUCTS array
const { PRODUCTS } = require(productsFilePath);
const allPublicFiles = fs.readdirSync(path.resolve('./public/products'));

console.log('--- STARTING CATALOG BENCHMARK STANDARDIZATION (123 PRODUCTS) ---');

// Specific curated mappings for known products
const KNOWN_SECONDARY_PHOTOS = {
  'batterie-externe-compacte-10000': {
    gallery: [
      '/products/batterie-externe-compacte-10000-hero-v2.jpg',
      '/products/batterie-externe-compacte-lifestyle.jpg',
      '/products/batterie-externe-compacte-10000-details.jpg',
      '/products/batterie-externe-compacte-closeup.jpg'
    ]
  },
  'souffleur-air-electrique-rechargeable': {
    secPhoto: '/products/souffleur-air-electrique.jpg'
  },
  'mini-machine-sceller-sachets': {
    secPhoto: '/products/mini-machine-sceller.jpg'
  },
  'blender-portable-rechargeable': {
    secPhoto: '/products/blender-portable.jpg'
  },
  'lunch-box-electrique-chauffante': {
    secPhoto: '/products/lunch-box-electrique.jpg'
  },
  'brosse-nettoyage-electrique': {
    secPhoto: '/products/brosse-nettoyage-electrique.jpg'
  },
  'defroisseur-vapeur-portable': {
    secPhoto: '/products/defroisseur-vapeur.jpg'
  },
  'sac-voyage-pliable-extensible': {
    secPhoto: '/products/sac-voyage-pliable.jpg'
  },
  'ventilateur-cou-rechargeable': {
    secPhoto: '/products/ventilateur-cou-rechargeable-hero.jpg'
  },
  'organisateur-cables': {
    secPhoto: '/products/organisateur-cables.jpg'
  },
  'repose-pieds-ergonomique': {
    secPhoto: '/products/repose-pieds-ergonomique-setup.jpg'
  },
  'sac-sport-compact': {
    secPhoto: '/products/sac-sport.jpg'
  },
  'organisateur-entre-sieges': {
    secPhoto: '/products/organisateur-entre-sieges-lifestyle.jpg'
  },
  'oreiller-voyage-memoire': {
    secPhoto: '/products/oreiller-voyage-memoire-lifestyle.jpg'
  },
  'parapluie-compact': {
    secPhoto: '/products/parapluie-compact.jpg'
  },
  'mini-microphone-sans-fil': {
    secPhoto: '/products/mini-microphone-sans-fil.jpg'
  },
  'tapis-souris-xxl-ergonomique': {
    secPhoto: '/products/tapis-souris-xxl-ergonomique.jpg'
  },
  'lampe-led-bureau-tactile': {
    secPhoto: '/products/lampe-led-bureau-tactile.jpg'
  },
  'trousse-maquillage-voyage': {
    secPhoto: '/products/trousse-maquillage.jpg'
  },
  't-shirt-classique-homme': {
    secPhoto: '/products/t-shirt-classique-homme.jpg'
  },
  'boites-hermetiques-lot4': {
    secPhoto: '/products/boites-hermetiques-lot4.jpg'
  },
  'jouet-distributeur-friandises': {
    secPhoto: '/products/jouet-distributeur-friandises.jpg'
  },
  'distributeur-sacs-dejections': {
    secPhoto: '/products/distributeur-sacs-dejections.jpg'
  },
  'chiffons-microfibres-auto-lot3': {
    secPhoto: '/products/chiffons-microfibres-auto-lifestyle.jpg'
  },
  'pare-soleil-retractable-parebrise': {
    secPhoto: '/products/pare-soleil-retractable-parebrise.jpg'
  },
  'gants-fitness-respirants': {
    secPhoto: '/products/gants-fitness-respirants.jpg'
  },
  'ceinture-cuir-automatique': {
    secPhoto: '/products/ceinture-cuir.jpg'
  },
  'bracelet-jonc-acier-inoxydable': {
    secPhoto: '/products/bracelet-jonc-acier-inoxydable.jpg'
  }
};

let closeupGeneratedCount = 0;
let updatedProductsCount = 0;

PRODUCTS.forEach((p, idx) => {
  const id = p.id;
  
  // 1. Build 4-Image Gallery
  if (KNOWN_SECONDARY_PHOTOS[id]?.gallery) {
    p.gallery = KNOWN_SECONDARY_PHOTOS[id].gallery;
  } else if (KNOWN_SECONDARY_PHOTOS[id]?.secPhoto && fs.existsSync(path.resolve('./public' + KNOWN_SECONDARY_PHOTOS[id].secPhoto))) {
    p.gallery = [
      p.image,
      KNOWN_SECONDARY_PHOTOS[id].secPhoto,
      `/products/${id}-features.jpg`,
      `/products/${id}-details.jpg`
    ];
  } else {
    // Check if closeup exists or needs generation
    const closeupFile = `${id}-closeup.jpg`;
    const closeupPath = path.resolve(`./public/products/${closeupFile}`);
    if (!fs.existsSync(closeupPath)) {
      const heroAbsPath = path.resolve('./public' + p.image);
      try {
        renderCloseupCard(p, heroAbsPath, closeupPath);
        closeupGeneratedCount++;
      } catch (err) {
        console.warn(`Could not render closeup for ${id}:`, err.message);
      }
    }
    
    if (fs.existsSync(closeupPath)) {
      p.gallery = [
        p.image,
        `/products/${id}-features.jpg`,
        `/products/${id}-details.jpg`,
        `/products/${id}-closeup.jpg`
      ];
    } else {
      p.gallery = [
        p.image,
        `/products/${id}-features.jpg`,
        `/products/${id}-details.jpg`
      ];
    }
  }

  // 2. Sanitize unverified claims in benefits and shortDescription
  if (p.benefits && Array.isArray(p.benefits)) {
    p.benefits = p.benefits.map(b => {
      let clean = b
        .replace(/100\s?000\s?tr\/min/gi, 'haute performance réglable')
        .replace(/100%\s?étanche/gi, 'conception étanche')
        .replace(/100%\s?sûr/gi, 'testé et conforme')
        .replace(/100%\s?silencieux/gi, 'fonctionnement silencieux')
        .replace(/100%\s?hypoallergénique/gi, 'hypoallergénique')
        .replace(/infaillible/gi, 'efficace et fiable')
        .replace(/20W\s?Power\s?Delivery/gi, 'charge rapide USB-C')
        .replace(/15W\s?Qi/gi, 'charge sans fil rapide')
        .replace(/titane\s?argenté/gi, 'réflecteur de chaleur')
        .replace(/acier\s?chirurgical\s?316L/gi, 'acier inoxydable durable')
        .replace(/Oxford\s?600D\s?ultra-résistant/gi, 'tissu résistant et déperlant')
        .replace(/indestructible/gi, 'ultra-résistant')
        .replace(/zéro\s?défaut/gi, 'qualité contrôlée')
        .replace(/tête thermique haute résolution 203 DPI/gi, "tête thermique haute résolution sans encre")
        .replace(/Batterie rechargeable 1200 mAh/gi, "Batterie rechargeable intégrée");
      return clean;
    });
    // Ensure exactly 3 concise benefits
    p.benefits = p.benefits.slice(0, 3);
  }

  if (p.shortDescription) {
    p.shortDescription = p.shortDescription
      .replace(/100\s?000\s?tr\/min/gi, 'haute performance')
      .replace(/100%\s?étanche/gi, 'étanche')
      .replace(/infaillible/gi, 'efficace')
      .replace(/20W\s?Power\s?Delivery/gi, 'charge rapide')
      .replace(/15W\s?Qi/gi, 'charge sans fil')
      .replace(/titane\s?argenté/gi, 'réflecteur de chaleur')
      .replace(/acier\s?chirurgical/gi, 'acier inoxydable');
  }

  // 3. Clean unverified specs
  if (p.specs && typeof p.specs === 'object') {
    Object.keys(p.specs).forEach(k => {
      const val = p.specs[k];
      if (typeof val === 'string') {
        p.specs[k] = val
          .replace(/100\s?000\s?tr\/min/gi, 'Variable haute performance')
          .replace(/100%\s?étanche/gi, 'Étanche')
          .replace(/100%\s?sûr/gi, 'Conforme CE')
          .replace(/100%\s?hypoallergénique/gi, 'Hypoallergénique');
      }
    });
  }

  updatedProductsCount++;
});

console.log(`✓ Updated ${updatedProductsCount} products.`);
console.log(`✓ Generated ${closeupGeneratedCount} new close-up cards.`);

// Write back to products.js
const updatedContent = `// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires
export const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};
`;

fs.writeFileSync(productsFilePath, updatedContent, 'utf8');
console.log('✓ Successfully wrote updated PRODUCTS to src/data/products.js');
