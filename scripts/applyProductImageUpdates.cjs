const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/products.js');
let code = fs.readFileSync(filePath, 'utf8');

const updates = [
  {
    id: 'distributeur-savon-automatique',
    image: '/products/distributeur-savon-automatique.jpg',
    gallery: ["/products/distributeur-savon-automatique.jpg"]
  },
  {
    id: 'range-epices-rotatif',
    image: '/products/range-epices-rotatif.jpg',
    gallery: ["/products/range-epices-rotatif.jpg"]
  },
  {
    id: 'separateurs-tiroirs-modulables',
    image: '/products/separateurs-tiroirs-modulables.jpg',
    gallery: ["/products/separateurs-tiroirs-modulables.jpg"]
  },
  {
    id: 'porte-eponge-evier-inox',
    image: '/products/porte-eponge-evier-inox.jpg',
    gallery: ["/products/porte-eponge-evier-inox.jpg"]
  },
  {
    id: 'pese-bagages-electronique',
    image: '/products/pese-bagages-electronique.jpg',
    gallery: ["/products/pese-bagages-electronique.jpg"]
  },
  {
    id: 'masque-sommeil-3d-occultant',
    image: '/products/masque-sommeil-3d-occultant.jpg',
    gallery: ["/products/masque-sommeil-3d-occultant.jpg"]
  },
  {
    id: 'organisateur-electronique-voyage',
    image: '/products/organisateur-electronique-voyage.jpg',
    gallery: ["/products/organisateur-electronique-voyage.jpg"]
  },
  {
    id: 'etiquettes-bagages-cuir-lot2',
    image: '/products/etiquettes-bagages-cuir.jpg',
    gallery: ["/products/etiquettes-bagages-cuir.jpg"]
  },
  {
    id: 'webcam-full-hd-1080p',
    image: '/products/webcam-full-hd-1080p.jpg',
    gallery: ["/products/webcam-full-hd-1080p.jpg"]
  },
  {
    id: 'chargeur-sans-fil-induction',
    image: '/products/chargeur-sans-fil-induction.jpg',
    gallery: ["/products/chargeur-sans-fil-induction.jpg"]
  },
  {
    id: 'ampoule-connectee-wifi-rgb',
    image: '/products/ampoule-connectee-wifi-rgb.jpg',
    gallery: ["/products/ampoule-connectee-wifi-rgb.jpg"]
  },
  {
    id: 'mini-camera-surveillance-aimant',
    image: '/products/mini-camera-surveillance-aimant.jpg',
    gallery: ["/products/mini-camera-surveillance-aimant.jpg"]
  },
  {
    id: 'gua-sha-quartz-rose',
    image: '/products/gua-sha-quartz-rose.jpg',
    gallery: ["/products/gua-sha-quartz-rose.jpg"]
  },
  {
    id: 'kit-pinceaux-maquillage',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'parapluie-compact',
    image: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 't-shirt-classique-homme',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'shaker-sport-inox',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'rouleau-massage-mousse-muscle',
    image: 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'chiffons-microfibres-auto-lot3',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'gants-fitness-respirants',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'legging-sport-gainant',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'bracelet-jonc-acier-inoxydable',
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'masseur-cuir-chevelu',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80']
  }
];

let replacedCount = 0;

updates.forEach(u => {
  // Regex to match the product object block by ID
  // Find id: 'u.id'
  const idPattern = new RegExp(`id:\\s*['"]${u.id}['"]([\\s\\S]*?)(?=id:|\\n\\s*\\{\\s*id:|\\n\\])`);
  const match = code.match(idPattern);
  if (match) {
    let block = match[0];
    
    // Replace image: ...
    const imgRegex = /image:\s*['"][^'"]+['"]/;
    block = block.replace(imgRegex, `image: '${u.image}'`);
    
    // Replace gallery: ...
    const galRegex = /gallery:\s*\[[^\]]+\]/;
    const galString = `gallery: ${JSON.stringify(u.gallery)}`;
    block = block.replace(galRegex, galString);
    
    code = code.replace(match[0], block);
    replacedCount++;
    console.log(`Updated [${u.id}] => ${u.image}`);
  } else {
    console.warn(`COULD NOT FIND BLOCK FOR: ${u.id}`);
  }
});

fs.writeFileSync(filePath, code);
console.log(`Successfully applied ${replacedCount} product image updates to products.js.`);
