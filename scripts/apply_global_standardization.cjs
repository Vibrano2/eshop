const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { renderFeatureCard } = require('./generate_feature_cards.cjs');

const productsFilePath = path.resolve(__dirname, '../src/data/products.js');
const { PRODUCTS } = require('../src/data/products.js');

const productsDir = path.resolve(__dirname, '../public/products');

console.log(`Auditing and standardizing galleries for all ${PRODUCTS.length} products...`);

// Dedicated verified photography overrides
const secondaryPhotoOverrides = {
  'batterie-externe-compacte-10000': ['/products/batterie-externe-compacte.jpg'],
  'defroisseur-vapeur-portable': ['/products/defroisseur-vapeur.jpg'],
  'sac-voyage-pliable-extensible': ['/products/sac-voyage-pliable.jpg'],
  'ventilateur-cou-rechargeable': ['/products/ventilateur-cou-rechargeable-hero.jpg']
};

let generatedCards = 0;

PRODUCTS.forEach((p, idx) => {
  // 1. Ensure local hero image
  if (p.image.startsWith('http')) {
    const localHeroFile = `${p.id}.jpg`;
    if (fs.existsSync(path.join(productsDir, localHeroFile))) {
      p.image = `/products/${localHeroFile}`;
    }
  }

  const localHeroRelative = p.image.startsWith('/') ? p.image.slice(1) : p.image;
  const fullHeroPath = path.resolve(__dirname, '../public', localHeroRelative);

  // 2. Prepare Details Infographic path
  const detailsInfographic = `/products/${p.id}-details.jpg`;

  // 3. Prepare Feature / Secondary Image
  let secondaryImage = null;

  if (secondaryPhotoOverrides[p.id]) {
    secondaryImage = secondaryPhotoOverrides[p.id][0];
  } else {
    const featureCardFilename = `${p.id}-features.jpg`;
    const fullFeaturePath = path.join(productsDir, featureCardFilename);
    if (!fs.existsSync(fullFeaturePath)) {
      try {
        console.log(`[${idx + 1}/${PRODUCTS.length}] Generating feature card for: ${p.name}`);
        renderFeatureCard(p, fullHeroPath, fullFeaturePath);
        generatedCards++;
      } catch (err) {
        console.error(`Failed feature card for ${p.id}:`, err.message);
      }
    }
    if (fs.existsSync(fullFeaturePath)) {
      secondaryImage = `/products/${featureCardFilename}`;
    }
  }

  // 4. Construct guaranteed 3-image gallery
  const gallery = [p.image];
  if (secondaryImage && !gallery.includes(secondaryImage)) {
    gallery.push(secondaryImage);
  }
  if (fs.existsSync(path.join(productsDir, `${p.id}-details.jpg`)) && !gallery.includes(detailsInfographic)) {
    gallery.push(detailsInfographic);
  }

  p.gallery = gallery;
});

console.log(`Generated ${generatedCards} new feature cards.`);

// Write back to products.js
const updatedContent = `// Catégories disponibles : tech, maison, beaute, voyage-auto, mode, animaux, sport, securite, accessoires
export const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};
`;

fs.writeFileSync(productsFilePath, updatedContent, 'utf-8');
console.log('src/data/products.js successfully updated!');

// Re-seed DB
console.log('Re-seeding database...');
execSync('node server/seed.js', { stdio: 'inherit' });
console.log('Global catalog standardization complete!');
