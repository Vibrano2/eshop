const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_features_profile');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderFeatureCard(product, heroImagePath, outputPath) {
  const heroFileUrl = 'file:///' + path.resolve(heroImagePath).replace(/\\/g, '/');

  const benefitItems = (product.benefits || [])
    .slice(0, 3)
    .map((b, i) => `
      <div class="highlight-item">
        <div class="highlight-num">0${i + 1}</div>
        <div class="highlight-text">
          <div class="highlight-desc">${b}</div>
        </div>
      </div>
    `).join('\n');

  const specHighlights = Object.entries(product.specs || {})
    .slice(0, 3)
    .map(([k, v]) => `
      <div class="mini-spec">
        <span class="mini-k">${k}</span>
        <span class="mini-v">${v}</span>
      </div>
    `).join('\n');

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
    background: radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.22) 0%, rgba(15, 23, 42, 0) 50%),
                radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0) 50%),
                linear-gradient(145deg, #0b1120 0%, #0f172a 50%, #070c18 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 16px;
  }
  .brand {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #38bdf8;
    text-transform: uppercase;
  }
  .tag {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(56, 189, 248, 0.35);
  }

  .title-section {
    margin-top: 14px;
    margin-bottom: 16px;
  }
  .subtitle {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    color: #94a3b8;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .title {
    font-size: 27px;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
  }

  .main-split {
    display: grid;
    grid-template-columns: 460px 440px;
    gap: 20px;
    align-items: center;
    flex: 1;
    margin-bottom: 18px;
  }

  .photo-frame {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    height: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
  }
  .product-img {
    max-width: 100%;
    max-height: 380px;
    object-fit: contain;
    border-radius: 12px;
  }
  .frame-badge {
    margin-top: 14px;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }

  .content-side {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .section-label {
    font-size: 14px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }

  .highlight-item {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px 16px;
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .highlight-num {
    font-size: 18px;
    font-weight: 800;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.15);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .highlight-desc {
    font-size: 13.5px;
    color: #e2e8f0;
    line-height: 1.35;
    font-weight: 500;
  }

  .specs-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 4px;
  }
  .mini-spec {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 8px;
    text-align: center;
  }
  .mini-k {
    display: block;
    font-size: 10.5px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mini-v {
    display: block;
    font-size: 12px;
    color: #f8fafc;
    font-weight: 700;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 14px 24px;
  }
  .bottom-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">eShopStore • Zoom Produit</div>
    <div class="tag">Points Forts & Utilisation</div>
  </div>

  <div class="title-section">
    <div class="subtitle">${categoryLabel} • Ergonomie & Prise en Main</div>
    <div class="title">${product.name}</div>
  </div>

  <div class="main-split">
    <div class="photo-frame">
      <img class="product-img" src="${heroFileUrl}" alt="${product.name}" />
      <div class="frame-badge"><span class="dot"></span> Modèle Authentique Vérifié</div>
    </div>

    <div class="content-side">
      <div class="section-label">Avantages Clés au Quotidien</div>
      ${benefitItems}
      
      <div class="section-label" style="margin-top: 6px;">Spécifications Essentielles</div>
      <div class="specs-strip">
        ${specHighlights}
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="bottom-item">✓ Finition soignée & durable</div>
    <div class="bottom-item">✓ Contrôle qualité avant expédition</div>
    <div class="bottom-item">✓ Support client 7j/7</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_feat_${product.id}.html`);
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

module.exports = { renderFeatureCard };

if (require.main === module) {
  const { PRODUCTS } = require('../src/data/products.js');
  const p = PRODUCTS.find(x => x.id === 'montre-quartz-minimaliste');
  const hero = path.resolve('./public/products/montre-quartz-minimaliste.jpg');
  const out = path.resolve('./public/products/montre-quartz-minimaliste-features.jpg');
  renderFeatureCard(p, hero, out);
  console.log('Finished rendering! Exists:', fs.existsSync(out), 'Size:', fs.statSync(out).size);
}
