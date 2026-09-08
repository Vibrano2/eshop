const https = require('https');

function searchWiki(term) {
  return new Promise(resolve => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(term) + '&namespace=6&limit=6&format=json';
    https.get(url, { headers: { 'User-Agent': 'EshopPackshots/1.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const titles = j[1] || [];
          const links = j[3] || [];
          resolve(titles.map((t, idx) => ({ title: t, link: links[idx] })));
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  const terms = [
    'perfume atomizer',
    'lavalier microphone',
    'desk lamp led',
    'hair bonnet',
    'food container',
    'cosmetic bag',
    'hairbrush',
    'phone stand',
    'desk mat',
    'collapsible bottle'
  ];
  for (const t of terms) {
    const res = await searchWiki(t);
    console.log(`=== ${t} (${res.length}) ===`);
    res.slice(0, 3).forEach(r => console.log('  ', r.title, '->', r.link));
  }
}

main();
