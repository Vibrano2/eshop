const https = require('https');

function checkUrl(url) {
  return new Promise(resolve => {
    https.request(url, { method: 'HEAD' }, res => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false)).end();
  });
}

const candidates = {
  'distributeur-sacs-dejections': [
    'photo-1587300003388-59208cc962cb', // dog leash and poop bag pouch
    'photo-1601758228041-f3b2795255f1',
    'photo-1535294435445-d7249524ef2e'
  ],
  'jouet-distributeur-friandises': [
    'photo-1535294435445-d7249524ef2e', // dog rubber ball / toy
    'photo-1541599540903-216a46ca1dc0',
    'photo-1583511655857-d19b40a7a54e'
  ],
  'tapis-gamelle-silicone': [
    'photo-1601758228041-f3b2795255f1', // pet bowls
    'photo-1583511655857-d19b40a7a54e',
    'photo-1548767797-d8c844163c4c'
  ],
  'coupe-griffes-led-animaux': [
    'photo-1516734212186-a967f81ad0d7', // pet grooming tool
    'photo-1583337130417-3346a1be7dee'
  ],
  'organisateur-dossier-siege-auto': [
    'photo-1549399542-7e3f8b79c341',
    'photo-1503376780353-7e6692767b70', // car interior back seat
    'photo-1552519507-da3b142c6e3d'
  ],
  'mini-poubelle-voiture-etanche': [
    'photo-1563720223185-11003d516935',
    'photo-1508974239320-0a029497e820'
  ],
  'pare-soleil-retractable-parebrise': [
    'photo-1503376780353-7e6692767b70',
    'photo-1552519507-da3b142c6e3d'
  ],
  'brosse-nettoyage-electrique': [
    'photo-1581578731548-c64695cc6952',
    'photo-1563453392212-326f5e854473'
  ],
  'masseur-cuir-chevelu': [
    'photo-1522337360788-8b13dee7a37e', // scalp care / beauty tool
    'photo-1535585209827-a15fcdbc4c2d'  // hair care brush
  ],
  'miroir-led-tactile': [
    'photo-1522337360788-8b13dee7a37e',
    'photo-1596462502278-27bfdc403348'
  ],
  'chaussures-marche-legeres': [
    'photo-1542291026-7eec264c27ff', // red walking/running sneaker 3/4 angle
    'photo-1595950653106-6c9ebd614d3a', // white casual sneaker
    'photo-1560769629-975ec94e6a86'  // walking shoes
  ],
  'pantalon-large-fluide': [
    'photo-1509631179647-0177331693ae', // wide leg flowing pants
    'photo-1551803091-e20673f15770', // palazzo pants woman
    'photo-1515886657613-9f3515b0c78f'
  ]
};

async function main() {
  for (const [key, ids] of Object.entries(candidates)) {
    console.log(`Checking ${key}:`);
    for (const id of ids) {
      const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
      const ok = await checkUrl(url);
      console.log(`   ${id} => ${ok ? 'VALID (200 OK)' : 'FAILED'}`);
    }
  }
}

main();
