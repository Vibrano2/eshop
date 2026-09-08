const fs = require('fs');
const path = require('path');
const pPath = path.join(__dirname, '../src/data/products.js');
let code = fs.readFileSync(pPath, 'utf8');

// Update corde-a-sauter-roulements-acier to photo-1540497077202-7c8a3999166f
const idPattern1 = /(id:\s*['"]corde-a-sauter-roulements-acier['"][\s\S]*?)(image:\s*['"][^'"]+['"])/;
code = code.replace(idPattern1, "$1image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'");

const galPattern1 = /(id:\s*['"]corde-a-sauter-roulements-acier['"][\s\S]*?)(gallery:\s*\[[^\]]+\])/;
code = code.replace(galPattern1, "$1gallery: ['https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80']");

// Update masseur-cuir-chevelu to photo-1519699047748-de8e457a634e
const idPattern2 = /(id:\s*['"]masseur-cuir-chevelu['"][\s\S]*?)(image:\s*['"][^'"]+['"])/;
code = code.replace(idPattern2, "$1image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80'");

const galPattern2 = /(id:\s*['"]masseur-cuir-chevelu['"][\s\S]*?)(gallery:\s*\[[^\]]+\])/;
code = code.replace(galPattern2, "$1gallery: ['https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80']");

fs.writeFileSync(pPath, code);
console.log('Fixed duplicate images for corde-a-sauter and masseur-cuir-chevelu.');
