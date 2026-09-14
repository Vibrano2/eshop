const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_bright_infographics');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderBrightInfographic(product, heroImagePath, outputPath) {
  const heroFileUrl = 'file:///' + path.resolve(heroImagePath).replace(/\\/g, '/');
  const categoryLabel = product.categoryLabel || product.category || 'eShopStore';

  const benefits = (product.benefits && product.benefits.length > 0)
    ? product.benefits.slice(0, 4)
    : [
        'Format compact et ergonomique',
        'Matériaux résistants et durables',
        'Utilisation simple et intuitive'
      ];

  const calloutBadges = benefits.map((b, idx) => `
    <div class="callout-pill pill-${idx + 1}">
      <span class="callout-check">✓</span>
      <span class="callout-text">${b}</span>
    </div>
  `).join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  html, body { width: 1000px; height: 1000px; overflow: hidden; }
  body {
    width: 1000px;
    height: 1000px;
    background: radial-gradient(circle at 50% 30%, #ffffff 0%, #f8fafc 65%, #edf2f7 100%);
    color: #0f172a;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px;
    position: relative;
  }

  .top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 18px;
  }
  .brand-logo {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #0f172a;
    text-transform: uppercase;
  }
  .brand-logo span {
    color: #2563eb;
  }
  .eu-compliance-badge {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .title-block {
    margin-top: 14px;
    margin-bottom: 10px;
    text-align: center;
  }
  .category-subtitle {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #2563eb;
    margin-bottom: 4px;
  }
  .product-main-title {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
    max-width: 850px;
    margin: 0 auto;
  }

  .visual-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: 10px 0;
  }
  .product-centerpiece {
    max-width: 580px;
    max-height: 520px;
    object-fit: contain;
    filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.12));
    z-index: 2;
  }

  /* Callout Pills */
  .callouts-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 3;
  }
  .callout-pill {
    position: absolute;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
    border-radius: 999px;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 360px;
  }
  .callout-check {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #2563eb;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .callout-text {
    font-size: 13.5px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
  }

  .pill-1 { top: 12%; left: 2%; }
  .pill-2 { top: 12%; right: 2%; }
  .pill-3 { bottom: 12%; left: 2%; }
  .pill-4 { bottom: 12%; right: 2%; }

  .bottom-trust-bar {
    border-top: 1.5px solid #e2e8f0;
    padding-top: 16px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
  }
  .trust-point {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trust-point span.check {
    color: #16a34a;
    font-weight: 900;
  }
</style>
</head>
<body>
  <div class="top-header">
    <div class="brand-logo">eShop<span>Store</span> • Fiche Produit</div>
    <div class="eu-compliance-badge">✓ Normes CE & Garantie UE</div>
  </div>

  <div class="title-block">
    <div class="category-subtitle">${categoryLabel} • Caractéristiques Vérifiées</div>
    <div class="product-main-title">${product.name}</div>
  </div>

  <div class="visual-stage">
    <img class="product-centerpiece" src="${heroFileUrl}" alt="${product.name}" />
    
    <div class="callouts-container">
      ${calloutBadges}
    </div>
  </div>

  <div class="bottom-trust-bar">
    <div class="trust-point"><span class="check">✓</span> Garantie Sérénité 2 Ans</div>
    <div class="trust-point"><span class="check">✓</span> Expédié sous 24h d'Europe</div>
    <div class="trust-point"><span class="check">✓</span> Contrôle Qualité Réalisé</div>
    <div class="trust-point"><span class="check">✓</span> Service Client 7j/7</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_bright_info_${product.id}.html`);
  fs.writeFileSync(tmpHtml, htmlContent, 'utf-8');

  try {
    const fileUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');
    const cmd = `"${binary}" --headless=new --user-data-dir="${tmpUserDataDir}" --disable-gpu --hide-scrollbars --window-size=1000,1000 --screenshot="${outputPath}" "${fileUrl}"`;
    execSync(cmd, { stdio: 'pipe' });
  } finally {
    if (fs.existsSync(tmpHtml)) {
      fs.unlinkSync(tmpHtml);
    }
  }
}

module.exports = { renderBrightInfographic };
