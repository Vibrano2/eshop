const fs = require('fs');
const path = require('path');
const { renderInfographic } = require('./generate_infographics.cjs');
const { execSync } = require('child_process');

const productsFilePath = path.resolve(__dirname, '../src/data/products.js');
let content = fs.readFileSync(productsFilePath, 'utf-8');

// Require the current PRODUCTS array
const { PRODUCTS } = require('../src/data/products.js');

console.log(`Starting catalog audit and enhancement for ${PRODUCTS.length} products...`);

// 1. Precise replacements for claims and images
const claimFixes = {
  'souffleur-air-electrique-rechargeable': (p) => {
    p.shortDescription = p.shortDescription.replace(/100\s*000\s*tr\/min/gi, 'haute performance réglable');
    if (p.benefits) {
      p.benefits = p.benefits.map(b => 
        b.replace(/Puissance extrême de soufflage jusqu'à 100 000 tr\/min à 3 vitesses réglables/i, "Souffle d'air puissant et concentré avec 3 vitesses réglables")
         .replace(/Réutilisable à l'infini/i, "Réutilisable et durable")
      );
    }
    if (p.specs && p.specs['Vitesse moteur']) {
      delete p.specs['Vitesse moteur'];
      p.specs['Moteur'] = 'Turbine haute vitesse réglable (3 modes)';
    }
    p.image = '/products/souffleur-air-electrique-rechargeable-hero.jpg';
  },
  'support-telephone-voiture': (p) => {
    p.shortDescription = p.shortDescription.replace(/Maintien infaillible/i, 'Maintien ferme et stable');
  },
  'masseur-cuir-chevelu': (p) => {
    if (p.specs && p.specs['Matière']) {
      p.specs['Matière'] = 'Silicone souple de qualité alimentaire sans BPA';
    }
  },
  'gants-fitness-respirants': (p) => {
    if (p.benefits) {
      p.benefits = p.benefits.map(b => b.replace(/grip infaillible/i, 'adhérence renforcée'));
    }
  },
  'brosse-nettoyage-electrique': (p) => {
    if (p.benefits) {
      p.benefits = p.benefits.map(b => b.replace(/garantissant jusqu’à 90 minutes/i, 'offrant jusqu’à 90 minutes'));
    }
  },
  'jean-slim-confort': (p) => {
    p.shortDescription = p.shortDescription.replace(/garantissant un confort maximal/i, 'offrant un grand confort');
  },
  'boites-hermetiques-lot4': (p) => {
    p.shortDescription = p.shortDescription.replace(/Conservation hermétique garantie sans fuite ni odeur\. 100% étanches aux liquides/i, 'Conservation hermétique sans fuite ni odeur. Conception étanche aux liquides');
  },
  'shaker-sport-inox': (p) => {
    p.shortDescription = p.shortDescription.replace(/100% étanche/i, 'Système étanche anti-fuite');
    if (p.benefits) {
      p.benefits = p.benefits.map(b => 
        b.replace(/Bille shaker en acier chirurgical brisant les grumeaux en 5 secondes/i, 'Bille mélangeuse en acier inoxydable pour un shaker fluide sans grumeaux')
         .replace(/Matériau garanti sans BPA/i, 'Matériau certifié sans BPA')
      );
    }
  },
  'distributeur-sacs-dejections': (p) => {
    p.shortDescription = p.shortDescription.replace(/100% étanches/i, 'étanches aux liquides');
    p.image = '/products/distributeur-sacs-dejections.jpg';
  },
  'jouet-distributeur-friandises': (p) => {
    p.image = '/products/jouet-distributeur-friandises.jpg';
  },
  'sac-sport-compact': (p) => {
    p.image = '/products/sac-sport-compact.jpg';
  },
  'sac-banane-multipoche': (p) => {
    p.image = '/products/sac-banane.jpg';
  },
  'rouleau-anti-peluches': (p) => {
    p.image = '/products/rouleau-anti-peluches.jpg';
  },
  'sac-voyage-pliable-extensible': (p) => {
    p.image = '/products/sac-voyage-pliable-extensible-hero.jpg';
  },
  'bandeau-spa-velours': (p) => {
    p.image = '/products/bandeau-spa-velours-hero.jpg';
  },
  'miroir-led-tactile': (p) => {
    p.image = '/products/miroir-led-tactile-hero.jpg';
  },
  'mini-poubelle-voiture-etanche': (p) => {
    p.image = '/products/mini-poubelle-voiture-etanche-hero.jpg';
  }
};

// Known accurate secondary images
const secondaryImages = {
  'batterie-externe-compacte-10000': ['/products/batterie-externe-compacte.jpg'],
  'defroisseur-vapeur-portable': ['/products/defroisseur-vapeur.jpg'],
  'sac-voyage-pliable-extensible': ['/products/sac-voyage-pliable.jpg'],
  'ventilateur-cou-rechargeable': ['/products/ventilateur-cou-rechargeable-hero.jpg']
};

const productsDir = path.resolve(__dirname, '../public/products');

let renderedInfographics = 0;

PRODUCTS.forEach((p, index) => {
  // Apply claim or hero fixes
  if (claimFixes[p.id]) {
    claimFixes[p.id](p);
  }

  // Ensure French details infographic exists
  const infographicFileName = `${p.id}-details.jpg`;
  const infographicPath = path.join(productsDir, infographicFileName);
  const infographicPublicUrl = `/products/${infographicFileName}`;

  if (!fs.existsSync(infographicPath)) {
    try {
      console.log(`[${index + 1}/${PRODUCTS.length}] Rendering infographic for: ${p.name}`);
      renderInfographic(p, infographicPath);
      renderedInfographics++;
    } catch (err) {
      console.error(`Failed rendering infographic for ${p.id}:`, err.message);
    }
  }

  // Build clean, verified gallery
  const gallery = [p.image];

  // Add verified secondary lifestyle image if exists
  if (secondaryImages[p.id]) {
    secondaryImages[p.id].forEach(img => {
      if (!gallery.includes(img) && fs.existsSync(path.join(productsDir, path.basename(img)))) {
        gallery.push(img);
      }
    });
  }

  // Add French product-details infographic
  if (fs.existsSync(infographicPath) && !gallery.includes(infographicPublicUrl)) {
    gallery.push(infographicPublicUrl);
  }

  p.gallery = gallery;
});

console.log(`Rendered ${renderedInfographics} new French infographic images.`);

// Write updated PRODUCTS back to src/data/products.js
const newFileContent = `// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires
export const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};
`;

fs.writeFileSync(productsFilePath, newFileContent, 'utf-8');
console.log('Successfully updated src/data/products.js with clean galleries and audited claims!');

// Re-seed SQLite database
console.log('Re-seeding database...');
execSync('node server/seed.js', { stdio: 'inherit' });
console.log('Audit and Enhancement complete!');
