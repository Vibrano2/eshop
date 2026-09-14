const https = require('https');
const fs = require('fs');
const path = require('path');

function searchWikimedia(term, limit = 10) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(term);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${q}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json`;
    https.get(url, { headers: { 'User-Agent': 'EshopCatalogQA/1.0 (contact@eshopstore.shop)' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (!json.query || !json.query.pages) return resolve([]);
          const pages = Object.values(json.query.pages);
          const results = pages.map(p => {
            const info = (p.imageinfo && p.imageinfo[0]) || {};
            const meta = info.extmetadata || {};
            return {
              title: p.title,
              url: info.url,
              mime: info.mime,
              width: info.width,
              height: info.height,
              size: info.size,
              desc: meta.ObjectName ? meta.ObjectName.value : (meta.ImageDescription ? meta.ImageDescription.value : '')
            };
          }).filter(r => r.mime && (r.mime === 'image/jpeg' || r.mime === 'image/png'));
          resolve(results);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    function fetch(u, redirectCount = 0) {
      if (redirectCount > 5) return resolve(false);
      const proto = u.startsWith('https') ? require('https') : require('http');
      proto.get(u, { headers: { 'User-Agent': 'EshopCatalogQA/1.0 (contact@eshopstore.shop)' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : 'https:' + res.headers.location;
          res.resume();
          return fetch(next, redirectCount + 1);
        }
        if (res.statusCode !== 200) { res.resume(); return resolve(false); }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(dest).size;
          if (size < 10000) { fs.unlinkSync(dest); return resolve(false); }
          resolve(true);
        });
      }).on('error', () => resolve(false));
    }
    fetch(url);
  });
}

const queries = {
  tshirt: ['White T-shirt isolated', 'Crew neck t-shirt', 'Plain white t-shirt', 'T-shirt flat lay'],
  poopbag: ['Dog poop bag', 'Dog waste bag dispenser', 'Pet waste bag holder'],
  dogball: ['Dog treat ball', 'Dog toy ball', 'Rubber dog ball', 'Interactive dog toy ball'],
  bracelet: ['Silver cuff bracelet', 'Steel bangle bracelet', 'Stainless steel cuff', 'Minimalist cuff bracelet'],
  gloves: ['Weightlifting gloves', 'Fitness gloves', 'Gym workout gloves', 'Training gloves wrist wrap'],
  duffel: ['Gym duffel bag shoe', 'Sports duffel bag', 'Sports gym bag', 'Duffel bag shoes'],
  umbrella: ['Folding umbrella compact', 'Pocket umbrella black', 'Compact umbrella', 'Folded umbrella']
};

async function run() {
  for (const [target, terms] of Object.entries(queries)) {
    console.log(`\n=================== TARGET: ${target} ===================`);
    let found = [];
    for (const term of terms) {
      const res = await searchWikimedia(term, 8);
      console.log(`Query "${term}" -> ${res.length} results`);
      found.push(...res);
    }
    // Dedup by url
    const unique = [];
    const urls = new Set();
    for (const r of found) {
      if (!urls.has(r.url)) {
        urls.add(r.url);
        unique.push(r);
      }
    }
    console.log(`Unique candidates for ${target}: ${unique.length}`);
    let downloadedCount = 0;
    for (let i = 0; i < unique.length && downloadedCount < 4; i++) {
      const item = unique[i];
      const ext = item.mime === 'image/png' ? '.png' : '.jpg';
      const dest = `./public/products/cand_${target}_${downloadedCount}${ext}`;
      process.stdout.write(`Downloading ${item.title.slice(0, 45)}... `);
      const ok = await download(item.url, dest);
      if (ok) {
        console.log(`OK (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
        downloadedCount++;
      } else {
        console.log(`FAILED`);
      }
    }
  }
}

run();
