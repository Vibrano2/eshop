const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/products.js');
let code = fs.readFileSync(filePath, 'utf8');

const updates = [
  {
    id: 'distributeur-sacs-dejections',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'jouet-distributeur-friandises',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'tapis-gamelle-silicone',
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'organisateur-dossier-siege-auto',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'mini-poubelle-voiture-etanche',
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'pantalon-large-fluide',
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80']
  }
];

let count = 0;

updates.forEach(u => {
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
    count++;
    console.log(`Updated [${u.id}] => ${u.image}`);
  } else {
    console.warn(`COULD NOT FIND BLOCK FOR: ${u.id}`);
  }
});

fs.writeFileSync(filePath, code);
console.log(`Successfully applied ${count} Batch 2 updates to products.js.`);
