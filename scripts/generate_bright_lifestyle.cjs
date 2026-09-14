const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_bright_lifestyle');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderBrightLifestyle(product, heroImagePath, outputPath) {
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
    background: radial-gradient(circle at 75% 20%, #ffffff 0%, #fbfbfc 50%, #f1f5f9 100%);
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
    color: #3b82f6;
  }
  .lifestyle-badge {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
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
    color: #3b82f6;
    margin-bottom: 4px;
  }
  .product-main-title {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
  }

  .stage-environment {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    margin: 16px 0;
    border-radius: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.08);
  }

  .product-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    position: relative;
  }
  .product-img {
    max-width: 82%;
    max-height: 82%;
    object-fit: contain;
    filter: drop-shadow(0 25px 30px rgba(0, 0, 0, 0.12));
    z-index: 2;
  }

  .in-use-pill-left {
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1.5px solid #cbd5e1;
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 5;
  }
  .in-use-pill-right {
    position: absolute;
    top: 24px;
    right: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border: 1.5px solid #bfdbfe;
    padding: 8px 16px;
    border-radius: 999px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
    font-size: 12.5px;
    font-weight: 700;
    color: #1d4ed8;
    z-index: 5;
  }

  .bottom-trust-bar {
    border-top: 1.5px solid #e2e8f0;
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
    color: #2563eb;
    font-weight: 900;
  }
</style>
</head>
<body>
  <div class="top-header">
    <div class="brand-logo">eShop<span>Store</span> • En Situation</div>
    <div class="lifestyle-badge">🌿 Usage & Ergonomie Quotidienne</div>
  </div>

  <div class="title-block">
    <div class="category-subtitle">${categoryLabel} • Confort au Quotidien</div>
    <div class="product-main-title">${product.name}</div>
  </div>

  <div class="stage-environment">
    <div class="in-use-pill-right">Prise en main immédiate & intuitive</div>
    
    <div class="product-wrap">
      <img class="product-img" src="${heroFileUrl}" alt="${product.name}" />
    </div>

    <div class="in-use-pill-left">
      <span>✓</span>
      <span>Conçu pour s'intégrer harmonieusement à votre quotidien</span>
    </div>
  </div>

  <div class="bottom-trust-bar">
    <div class="trust-point"><span class="check">✓</span> Pratique au quotidien</div>
    <div class="trust-point"><span class="check">✓</span> Format nomade ou maison</div>
    <div class="trust-point"><span class="check">✓</span> Finition soignée</div>
    <div class="trust-point"><span class="check">✓</span> Qualité certifiée</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_bright_life_${product.id}.html`);
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

module.exports = { renderBrightLifestyle };
