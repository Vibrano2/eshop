const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_infographic_profile');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderInfographic(product, outputPath) {
  const specItems = Object.entries(product.specs || {})
    .slice(0, 5)
    .map(([key, val]) => `        <div class="spec-item"><span class="spec-label">${key}</span><span class="spec-val">${val}</span></div>`)
    .join('\n');

  const benefitItems = (product.benefits || [])
    .slice(0, 4)
    .map(b => `        <div class="benefit-item"><span class="check-mark">✓</span><span>${b}</span></div>`)
    .join('\n');

  const categoryTitle = product.categoryLabel || product.category || 'eShopStore';

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  html, body { width: 100vw; height: 100vh; overflow: hidden; }
  body {
    background: radial-gradient(circle at 85% 15%, rgba(37, 99, 235, 0.28) 0%, rgba(9, 16, 29, 0) 50%),
                radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.2) 0%, rgba(9, 16, 29, 0) 50%),
                linear-gradient(150deg, #09101d 0%, #0e1726 50%, #080d17 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 36px 40px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    padding-bottom: 14px;
    flex-shrink: 0;
  }
  .brand {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 2.2px;
    color: #38bdf8;
    text-transform: uppercase;
  }
  .badge-ue {
    background: rgba(5, 150, 105, 0.22);
    color: #34d399;
    font-size: 12.5px;
    font-weight: 700;
    padding: 5px 13px;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.4);
  }
  
  .title-block {
    margin-top: 14px;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .subtitle {
    font-size: 12.5px;
    text-transform: uppercase;
    letter-spacing: 1.6px;
    color: #94a3b8;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
  }
  
  .grid-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    flex: 1;
    margin-bottom: 18px;
  }
  
  .card {
    background: rgba(255, 255, 255, 0.035);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .card-title {
    font-size: 15px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  
  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    flex: 1;
  }
  
  .spec-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-size: 13.5px;
  }
  .spec-item:last-child {
    border-bottom: none;
  }
  .spec-label {
    color: #94a3b8;
    font-weight: 500;
  }
  .spec-val {
    color: #f8fafc;
    font-weight: 700;
    text-align: right;
    max-width: 60%;
  }
  
  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 13.5px;
    line-height: 1.4;
    color: #e2e8f0;
    padding: 5px 0;
  }
  .check-mark {
    background: #10b981;
    color: #ffffff;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    flex-shrink: 0;
    margin-top: 1px;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 13px 22px;
    flex-shrink: 0;
  }
  .trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .trust-icon {
    font-size: 16px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">eShopStore • Fiche Produit</div>
    <div class="badge-ue">✓ Conforme Normes Européennes</div>
  </div>

  <div class="title-block">
    <div class="subtitle">${categoryTitle} • Spécifications Certifiées</div>
    <div class="title">${product.name}</div>
  </div>

  <div class="grid-content">
    <div class="card">
      <div class="card-title">⚙️ Caractéristiques Techniques</div>
      <div class="card-body">
${specItems}
      </div>
    </div>

    <div class="card">
      <div class="card-title">⭐ Avantages & Conception</div>
      <div class="card-body">
${benefitItems}
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="trust-item"><span class="trust-icon">🛡️</span> Garantie constructeur 2 ans</div>
    <div class="trust-item"><span class="trust-icon">⚡</span> Expédition rapide sous 24h</div>
    <div class="trust-item"><span class="trust-icon">↩️</span> Retours 14j garantis</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_${product.id}.html`);
  fs.writeFileSync(tmpHtml, htmlContent, 'utf-8');

  try {
    const fileUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');
    const cmd = `"${binary}" --headless=new --user-data-dir="${tmpUserDataDir}" --disable-gpu --hide-scrollbars --window-size=1000,1000 --screenshot="${outputPath}" "${fileUrl}"`;
    execSync(cmd, { stdio: 'pipe' });
  } catch (err) {
    console.error('Error rendering with binary:', err.message);
    throw err;
  } finally {
    if (fs.existsSync(tmpHtml)) {
      fs.unlinkSync(tmpHtml);
    }
  }
}

module.exports = { renderInfographic };

if (require.main === module) {
  const { PRODUCTS } = require('../src/data/products.js');
  const p = PRODUCTS.find(x => x.id === 'batterie-externe-compacte-10000');
  const out = path.resolve('./public/products/batterie-externe-compacte-10000-details.jpg');
  renderInfographic(p, out);
  console.log('Finished rendering! File exists:', fs.existsSync(out), 'Size:', fs.statSync(out).size);
}
