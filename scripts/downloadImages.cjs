const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EshopCatalogAuditor/1.0 (auditor@eshop-store.eu)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EshopCatalogAuditor/1.0 (auditor@eshop-store.eu)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        console.log('HTTP', res.statusCode, 'for', url);
        return resolve(false);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', reject);
  });
}

async function searchAndDownload(query, filename) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|size&format=json`;
  try {
    const data = await fetchJson(apiUrl);
    const pages = Object.values(data.query?.pages || {});
    let downloaded = 0;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const imgUrl = p.imageinfo?.[0]?.url;
      if (imgUrl && /\.(jpe?g|png)$/i.test(imgUrl)) {
        const dest = path.join(__dirname, '..', 'temp_audit', `${filename}_${downloaded}.jpg`);
        console.log(`Downloading [${filename}_${downloaded}]: ${p.title}`);
        const ok = await downloadFile(imgUrl, dest);
        if (ok) downloaded++;
        if (downloaded >= 2) break;
      }
    }
  } catch (err) {
    console.error('Error in search:', query, err.message);
  }
}

async function main() {
  await searchAndDownload('resistance bands', 'wm_band');
  await searchAndDownload('foam roller exercise', 'wm_foam');
  await searchAndDownload('jump rope exercise', 'wm_rope');
  await searchAndDownload('water bottle gym', 'wm_bottle');
  await searchAndDownload('duffel bag sport', 'wm_duffel');
  await searchAndDownload('car charger usb-c', 'wm_carchg');
  console.log('ALL DOWNLOADS COMPLETE');
}

main();
