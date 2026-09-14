const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_bright_closeups');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderBrightCloseup(product, heroImagePath, outputPath) {
  const heroFileUrl = 'file:///' + path.resolve(heroImagePath).replace(/\\/g, '/');
  const categoryLabel = product.categoryLabel || product.category || 'eShopStore';

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
    background: radial-gradient(circle at 50% 40%, #ffffff 0%, #f1f5f9 70%, #e2e8f0 100%);
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
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 18px;
    z-index: 10;
  }
  .brand-logo {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #0f172a;
    text-transform: uppercase;
  }
  .brand-logo span {
    color: #059669;
  }
  .macro-badge {
    background: #f8fafc;
    color: #0f172a;
    border: 1.5px solid #94a3b8;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }

  .title-block {
    margin-top: 14px;
    margin-bottom: 8px;
    text-align: center;
    z-index: 10;
  }
  .category-subtitle {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #059669;
    margin-bottom: 4px;
  }
  .product-main-title {
    font-size: 25px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
  }

  .macro-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    margin: 14px 0;
    border-radius: 24px;
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.1);
  }

  .macro-image-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 30px;
  }
  .macro-product-img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    transform: scale(1.15);
    filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;
  }

  .macro-overlay-badge {
    position: absolute;
    top: 24px;
    right: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1.5px solid #cbd5e1;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 800;
    color: #1e293b;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  }

  .macro-quality-point {
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1.5px solid #a7f3d0;
    padding: 10px 18px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .macro-point-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
  }
  .macro-point-text {
    font-size: 13px;
    font-weight: 700;
    color: #065f46;
  }

  .bottom-trust-bar {
    border-top: 1.5px solid #cbd5e1;
    padding-top: 16px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    z-index: 10;
  }
  .trust-point {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trust-point span.check {
    color: #059669;
    font-weight: 900;
  }
</style>
</head>
<body>
  <div class="top-header">
    <div class="brand-logo">eShop<span>Store</span> • Gros Plan & Finitions</div>
    <div class="macro-badge">🔍 Zoom Précision & Matériaux</div>
  </div>

  <div class="title-block">
    <div class="category-subtitle">${categoryLabel} • Conception Soignée</div>
    <div class="product-main-title">${product.name}</div>
  </div>

  <div class="macro-stage">
    <div class="macro-image-wrap">
      <img class="macro-product-img" src="${heroFileUrl}" alt="${product.name}" />
    </div>

    <div class="macro-overlay-badge">Modèle Authentique Vérifié</div>
    <div class="macro-quality-point">
      <span class="macro-point-dot"></span>
      <span class="macro-point-text">Matériaux durables & contrôle qualité individuel</span>
    </div>
  </div>

  <div class="bottom-trust-bar">
    <div class="trust-point"><span class="check">✓</span> Finitions soignées</div>
    <div class="trust-point"><span class="check">✓</span> Matériaux de haute qualité</div>
    <div class="trust-point"><span class="check">✓</span> Vérifié avant expédition</div>
    <div class="trust-point"><span class="check">✓</span> Garantie 2 Ans</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_bright_close_${product.id}.html`);
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

module.exports = { renderBrightCloseup };
