const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('../src/data/products.js');

const queryMap = [
  { num: 1, key: 'chargeur-magnetique-3-en-1', label: 'Chargeur 3-en-1' },
  { num: 2, key: 't-shirt-classique-homme', label: 'T-shirt classique' },
  { num: 3, key: 'distributeur-sacs-dejections', label: 'Distributeur sacs déjections' },
  { num: 4, key: 'jouet-distributeur-friandises', label: 'Balle friandises' },
  { num: 5, key: 'bracelet-jonc-acier-inoxydable', label: 'Bracelet jonc' },
  { num: 6, key: 'gants-fitness-respirants', label: 'Gants fitness' },
  { num: 7, key: 'sac-sport-compact', label: 'Sac de sport' },
  { num: 8, key: 'parapluie-compact', label: 'Parapluie compact' },
  { num: 9, key: 'organisateur-cables', label: 'Organisateur câbles magnétique' },
  { num: 10, key: 'reveil-lumineux-simulateur-aube', label: 'Réveil lumineux simulateur aube' },
  { num: 11, key: 'bouteille-eau-intelligente', label: 'Bouteille eau intelligente' },
  { num: 12, key: 'aspirateur-bureau-compact', label: 'Aspirateur bureau compact' },
  { num: 13, key: 'boites-hermetiques-lot4', label: 'Boîtes hermétiques lot 4' },
  { num: 14, key: 'mini-microphone-sans-fil', label: 'Mini micro cravate' },
  { num: 15, key: 'trousse-maquillage-voyage', label: 'Trousse maquillage compartimentée' },
  { num: 16, key: 'pare-soleil-retractable-parebrise', label: 'Pare-soleil parebrise' },
  { num: 17, key: 'mini-machine-sceller-sachets', label: 'Mini machine sceller sachets' },
  { num: 18, key: 'tapis-souris-xxl-ergonomique', label: 'Tapis souris XXL' },
  { num: 19, key: 'repose-pieds-ergonomique', label: 'Repose-pieds bureau' },
  { num: 20, key: 'oreiller-voyage-memoire', label: 'Oreiller voyage mémoire' }
];

console.log('=== STATUS OF 20 PRIORITY PRODUCTS ===\n');

queryMap.forEach(item => {
  const p = PRODUCTS.find(x => x.id === item.key);
  if (!p) {
    console.log(`${item.num}. [NOT FOUND] ${item.key}`);
    return;
  }
  const heroOnDisk = fs.existsSync('./public' + p.image);
  const heroSize = heroOnDisk ? Math.round(fs.statSync('./public' + p.image).size / 1024) + 'KB' : 'MISSING';
  console.log(`${item.num}. [${p.id}] ${p.name}`);
  console.log(`   Hero: ${p.image} (${heroSize})`);
  console.log(`   Gallery [${p.gallery ? p.gallery.length : 0} items]:`);
  if (p.gallery) {
    p.gallery.forEach((g, i) => {
      const gOnDisk = fs.existsSync('./public' + g);
      const gSize = gOnDisk ? Math.round(fs.statSync('./public' + g).size / 1024) + 'KB' : 'MISSING';
      console.log(`     (${i + 1}) ${g} [${gSize}]`);
    });
  }
  console.log('');
});
