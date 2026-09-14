const fs = require('fs');

const files = [
  'batterie-externe-compacte-10000-hero-v2.jpg',
  'batterie-externe-compacte.jpg',
  'defroisseur-vapeur-portable-hero-v2.jpg',
  'defroisseur-vapeur.jpg',
  'ventilateur-cou-rechargeable-hero-v2.jpg',
  'ventilateur-cou-rechargeable-hero.jpg',
  'ventilateur-cou.jpg',
  'lunch-box-electrique-chauffante-hero-v2.jpg',
  'lunch-box-electrique.jpg',
  'brosse-nettoyage-electrique.jpg',
  'brosse-nettoyage-electrique-features.jpg',
  'blender-portable.jpg',
  'blender-portable-rechargeable-features.jpg',
  'test_blender.jpg'
];

const cards = files.map(f => {
  const p = './public/products/' + f;
  const exists = fs.existsSync(p);
  const size = exists ? Math.round(fs.statSync(p).size / 1024) + ' KB' : 'MISSING';
  return `  <div class="card">
    <img src="/products/${f}" alt="${f}" />
    <h3>${f}</h3>
    <p>${size}</p>
  </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Priority Images Audit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    h1 { font-size: 22px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; padding: 12px; border: 1px solid #334155; }
    img { width: 100%; height: 220px; object-fit: contain; background: #ffffff; border-radius: 8px; }
    h3 { margin: 10px 0 4px; font-size: 13px; word-break: break-all; color: #e2e8f0; }
    p { margin: 0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Priority Product Images Audit</h1>
  <div class="grid">
${cards}
  </div>
</body>
</html>`;

fs.writeFileSync('./public/priority_audit.html', html);
console.log('Created public/priority_audit.html');
