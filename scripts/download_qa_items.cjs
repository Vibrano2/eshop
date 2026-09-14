const https = require('https');
const http = require('http');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve) => {
    function fetch(u, redirectCount = 0) {
      if (redirectCount > 5) return resolve({ ok: false, size: 0 });
      const proto = u.startsWith('https') ? https : http;
      proto.get(u, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : 'https:' + res.headers.location;
          res.resume();
          return fetch(next, redirectCount + 1);
        }
        if (res.statusCode !== 200) { 
          res.resume(); 
          return resolve({ ok: false, size: 0, status: res.statusCode }); 
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(dest).size;
          if (size < 20000) { 
            fs.unlinkSync(dest); 
            return resolve({ ok: false, size }); 
          }
          resolve({ ok: true, size });
        });
      }).on('error', (e) => resolve({ ok: false, error: e.message }));
    }
    fetch(url);
  });
}

const items = [
  {
    name: 'chiffons-microfibres-auto-lifestyle.jpg',
    dest: './public/products/chiffons-microfibres-auto-lifestyle.jpg',
    urls: [
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=85'
    ]
  },
  {
    name: 'organisateur-entre-sieges-lifestyle.jpg',
    dest: './public/products/organisateur-entre-sieges-lifestyle.jpg',
    urls: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85'
    ]
  },
  {
    name: 'oreiller-voyage-memoire-lifestyle.jpg',
    dest: './public/products/oreiller-voyage-memoire-lifestyle.jpg',
    urls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85'
    ]
  },
  {
    name: 'repose-pieds-ergonomique-setup.jpg',
    dest: './public/products/repose-pieds-ergonomique-setup.jpg',
    urls: [
      'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=85'
    ]
  }
];

async function run() {
  for (const it of items) {
    let ok = false;
    for (const u of it.urls) {
      console.log(`Trying ${it.name} from ${u.slice(0, 55)}...`);
      const res = await download(u, it.dest);
      if (res.ok) {
        console.log(`✅ Saved ${it.name} (${Math.round(res.size/1024)} KB)`);
        ok = true;
        break;
      } else {
        console.log(`❌ Failed with status ${res.status || res.error}`);
      }
    }
    if (!ok) console.error(`⚠️ ALL failed for ${it.name}`);
  }
  console.log('Finished downloading QA lifestyle items.');
}

run();
