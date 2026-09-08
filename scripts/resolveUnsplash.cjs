const https = require('https');

function resolvePhoto(slug) {
  return new Promise(resolve => {
    const url = 'https://unsplash.com/photos/' + slug;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const m = d.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9_-]+/);
        resolve(m ? m[0] : null);
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  const img = await resolvePhoto('woman-holding-jump-rope-in-workout-9Hn_4K76YWE');
  console.log('Resolved image:', img);
})();
