const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const binary = fs.existsSync(chromePath) ? chromePath : edgePath;
const tmpUserDataDir = path.join(os.tmpdir(), 'chrome_closeup_profile');

if (!fs.existsSync(tmpUserDataDir)) {
  fs.mkdirSync(tmpUserDataDir, { recursive: true });
}

function renderCloseupCard(product, heroImagePath, outputPath) {
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
    background: radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0) 50%),
                radial-gradient(circle at 15% 85%, rgba(56, 189, 248, 0.2) 0%, rgba(15, 23, 42, 0) 50%),
                linear-gradient(145deg, #090e1a 0%, #0f172a 50%, #060a12 100%);
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
    color: #34d399;
    text-transform: uppercase;
  }
  .tag {
    background: rgba(16, 185, 129, 0.18);
    color: #34d399;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.4);
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
    font-size: 26px;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
  }

  .main-split {
    display: grid;
    grid-template-columns: 470px 430px;
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
    padding: 24px;
    position: relative;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
  }
  .product-img {
    max-width: 100%;
    max-height: 390px;
    object-fit: contain;
    border-radius: 12px;
  }
  .frame-badge {
    margin-top: 14px;
    font-size: 12px;
    font-weight: 700;
    color: #a7f3d0;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
  }

  .content-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .section-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #6ee7b7;
  }

  .highlight-box {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .highlight-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #34d399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    flex-shrink: 0;
  }
  .highlight-title {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 3px;
  }
  .highlight-desc {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.4;
  }

  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 16px;
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .bottom-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">eShopStore • Gros Plan & Qualité</div>
    <div class="tag">Finition & Matériaux</div>
  </div>

  <div class="title-section">
    <div class="subtitle">${categoryLabel} • Conception Précise</div>
    <div class="title">${product.name}</div>
  </div>

  <div class="main-split">
    <div class="photo-frame">
      <img class="product-img" src="${heroFileUrl}" alt="${product.name}" />
      <div class="frame-badge"><span class="dot"></span> Inspection & Qualité Vérifiée</div>
    </div>

    <div class="content-side">
      <div class="section-label">Garantie d'Excellence & Détails</div>
      
      <div class="highlight-box">
        <div class="highlight-icon">✓</div>
        <div>
          <div class="highlight-title">Matériaux Sélectionnés</div>
          <div class="highlight-desc">Conception robuste et soignée, pensée pour durer et résister à l'usage quotidien.</div>
        </div>
      </div>

      <div class="highlight-box">
        <div class="highlight-icon">✓</div>
        <div>
          <div class="highlight-title">Ergonomie & Prise en Main</div>
          <div class="highlight-desc">Lignes fluides et format optimisé pour une manipulation simple et intuitive.</div>
        </div>
      </div>

      <div class="highlight-box">
        <div class="highlight-icon">✓</div>
        <div>
          <div class="highlight-title">Contrôle Qualité Strict</div>
          <div class="highlight-desc">Chaque pièce est méticuleusement vérifiée avant son expédition depuis nos stocks UE.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="bottom-item">✓ Normes Européennes (CE)</div>
    <div class="bottom-item">✓ Garantie Sérénité 2 Ans</div>
    <div class="bottom-item">✓ Expédition Sécurisée sous 24h</div>
  </div>
</body>
</html>`;

  const tmpHtml = path.resolve(`./temp_close_${product.id}.html`);
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

module.exports = { renderCloseupCard };
