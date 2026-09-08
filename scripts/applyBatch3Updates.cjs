const fs = require('fs');

const updates = {
  'pare-soleil-retractable-parebrise': '/products/pare-soleil-retractable-parebrise.jpg',
  'ceinture-securite-chien-auto': '/products/ceinture-securite-chien-auto.jpg',
  'coupe-griffes-led-animaux': '/products/coupe-griffes-led-animaux.jpg',
  'brosse-nettoyage-electrique': '/products/brosse-nettoyage-electrique.jpg',
  'balle-interactive-chat': '/products/balle-interactive-chat.jpg',
  'reglette-led-detecteur-mouvement': '/products/reglette-led-detecteur-mouvement.jpg',
  'detecteur-ouverture-porte-fenetre': '/products/detecteur-ouverture-porte-fenetre.jpg',
  'bonnet-satin-cheveux': '/products/bonnet-satin-cheveux.jpg',
  'legging-sport-gainant': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80',
  'bouteille-eau-pliable': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'
};

let code = fs.readFileSync('./src/data/products.js', 'utf8');

for (const [id, img] of Object.entries(updates)) {
  const regex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?image:\\s*['"])([^'"]+)(['"])`);
  const match = code.match(regex);
  if (match) {
    code = code.replace(regex, `$1${img}$3`);
    console.log(`Updated image for ${id} -> ${img}`);
  } else {
    console.log(`Could not find ${id}`);
  }

  // Also check gallery
  const galleryRegex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?gallery:\\s*\\[\\s*['"])([^'"]+)(['"])`);
  const gMatch = code.match(galleryRegex);
  if (gMatch) {
    code = code.replace(galleryRegex, `$1${img}$3`);
  }
}

fs.writeFileSync('./src/data/products.js', code, 'utf8');
console.log('Finished updating products.js with Batch 3 packshots');
