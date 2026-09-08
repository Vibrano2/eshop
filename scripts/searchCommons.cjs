const https = require('https');

async function searchCommonsImages(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=' + encodeURIComponent(query) + '&srlimit=4&format=json';
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'EshopAuditor/1.0 (contact@eshop-store.eu)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve((j.query?.search || []).map(s => s.title));
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function getImageUrl(title) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=imageinfo&iiprop=url&format=json';
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'EshopAuditor/1.0 (contact@eshop-store.eu)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const page = Object.values(j.query?.pages || {})[0];
          resolve(page?.imageinfo?.[0]?.url || null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  const queries = [
    'foam roller exercise',
    'makeup brushes cosmetic',
    'folding umbrella',
    'microfiber cloths',
    'workout gloves fitness',
    'cocktail shaker stainless'
  ];
  for (const q of queries) {
    const titles = await searchCommonsImages(q);
    console.log('Query:', q);
    for (const t of titles) {
      const u = await getImageUrl(t);
      if (u && (u.endsWith('.jpg') || u.endsWith('.png') || u.endsWith('.jpeg'))) {
        console.log('   ', t, '->', u);
      }
    }
  }
})();
