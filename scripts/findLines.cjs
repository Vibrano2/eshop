const fs = require('fs');
const content = fs.readFileSync('src/data/products.js', 'utf8');
const lines = content.split('\n');

const targets = [
  'distributeur-savon-automatique',
  'range-epices-rotatif',
  'separateurs-tiroirs-modulables',
  'porte-eponge-evier-inox',
  'pese-bagages-electronique',
  'masque-sommeil-3d-occultant',
  'organisateur-electronique-voyage',
  'etiquettes-bagages-cuir-lot2',
  'webcam-full-hd-1080p',
  'chargeur-sans-fil-induction',
  'ampoule-connectee-wifi-rgb',
  'mini-camera-surveillance-aimant',
  'gua-sha-quartz-rose',
  'kit-pinceaux-maquillage',
  'parapluie-compact',
  't-shirt-classique-homme',
  'shaker-sport-inox',
  'rouleau-massage-mousse-muscle',
  'chiffons-microfibres-auto-lot3',
  'gants-fitness-respirants',
  'legging-sport-gainant',
  'masseur-cuir-chevelu',
  'miroir-led-tactile',
  'chaussures-marche-legeres',
  'pantalon-large-fluide',
  'distributeur-sacs-dejections',
  'jouet-distributeur-friandises',
  'tapis-gamelle-silicone',
  'coupe-griffes-led-animaux',
  'organisateur-dossier-siege-auto',
  'mini-poubelle-voiture-etanche',
  'pare-soleil-retractable-parebrise',
  'brosse-nettoyage-electrique',
  'organisateur-cables',
  'bracelet-jonc-acier-inoxydable'
];

targets.forEach(id => {
  lines.forEach((l, i) => {
    if (l.includes("id: '" + id + "'")) {
      console.log(id, 'line:', i + 1);
      for (let j = i; j < i + 25 && j < lines.length; j++) {
        if (lines[j].includes('image:')) console.log('   ' + lines[j].trim());
      }
    }
  });
});
