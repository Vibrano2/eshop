const https = require('https');
const fs = require('fs');

const query = process.argv[2] || 'gym-bag';

function fetchUrl(url) {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let nextUrl = res.headers.location;
      if (nextUrl.startsWith('/')) nextUrl = 'https://unsplash.com' + nextUrl;
      fetchUrl(nextUrl);
      return;
    }
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      const regex = /https:\/\/images\.unsplash\.com\/photo-([a-zA-Z0-9_-]+)/g;
      const matches = new Set();
      let m;
      while ((m = regex.exec(html)) !== null) {
        matches.add(m[0]);
      }
      console.log('Results for', query, ':', matches.size);
      const list = Array.from(matches);
      list.slice(0, 8).forEach((u, i) => console.log(`${i + 1}. ${u}?auto=format&fit=crop&w=800&q=80`));
    });
  }).on('error', err => console.error(err));
}

fetchUrl(`https://unsplash.com/s/photos/${query}`);
