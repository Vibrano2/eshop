const { PRODUCTS } = require('../src/data/products.js');

const LOCKED_KEYWORDS = [
  'doublures-silicone-airfryer',
  'rouleau-boucles-sans-chaleur',
  'organisateur-maquillage',
  'bandes-resistance',
  'pulverisateur-huile',
  'support-ordinateur-portable',
  'housse-siege-animaux',
  'baskets-casual-respirantes',
  'support-telephone-voiture',
  'organisateur-sous-evier',
  'camera-surveillance-wifi',
  'trousse-toilette-suspendue',
  'brosse-anti-poils',
  'robe-fluide-ete',
  'repose-pieds-ergonomique',
  'hub-usb-c-7en1',
  'accessoires-airfryer',
  'gourde-portable-chiens',
  'ceinture-course',
  'tapis-yoga-antiderapant-tpe',
  'nettoyeur-pattes-chiens',
  'ecouteurs-bluetooth-pro',
  'sonnette-video-connectee',
  'chaussures-marche-legeres',
  'ampoule-connectee-wifi-rgb',
  'lunettes-soleil-polarisees-classiques',
  'sac-bandouliere-demi-lune',
  'lampe-led-bureau-tactile',
  'organisateur-coffre',
  'rouleau-glace-visage',
  'sac-a-dos-urbain-pc',
  'webcam-full-hd-1080p',
  'detecteur-mouvement-connecte',
  'organisateur-bureau',
  'gamelle-pliable',
  'souris-sans-fil-ergonomique',
  'jean-slim-confort',
  'pantalon-chino-stretch',
  'pantalon-cargo-homme',
  'polo-coton-homme',
  'ensemble-lounge-confort',
  'sandales-cuir-plates',
  'aspirateur-voiture-sans-fil',
  'cubes-rangement-valise',
  'oreiller-voyage-memoire',
  'prise-connectee-wifi',
  'porte-cartes-aluminium-anti-rfid',
  'ceinture-cuir-automatique',
  'rouleau-anti-peluches',
  'sacoche-velo',
  't-shirt-oversize-coton',
  'chemise-lin-homme',
  'brosse-nettoyante-visage'
];

console.log('Auditing products against LOCKED list...');

const locked = [];
const unlocked = [];

PRODUCTS.forEach(p => {
  if (LOCKED_KEYWORDS.includes(p.id)) {
    locked.push(p);
  } else {
    unlocked.push(p);
  }
});

console.log(`Total: ${PRODUCTS.length} products`);
console.log(`IMAGE_LOCKED: ${locked.length} products`);
console.log(`UNLOCKED to review: ${unlocked.length} products`);

console.log('\n--- UNLOCKED PRODUCTS LIST ---');
unlocked.forEach((p, i) => {
  console.log(`${(i+1).toString().padStart(2, ' ')}. [${p.id}] (${p.category}) : "${p.name}"`);
  console.log(`    Image: ${p.image}`);
});
