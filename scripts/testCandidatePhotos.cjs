const https = require('https');

function checkUrl(url) {
  return new Promise(resolve => {
    https.request(url, { method: 'HEAD' }, res => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false)).end();
  });
}

const candidates = {
  'kit-pinceaux-maquillage': [
    'photo-1596462502278-27bfdc403348', // Makeup brush set flat lay
    'photo-1527799820374-dcf8d9d4a388',
    'photo-1512496015851-a90fb38ba796',
    'photo-1583241800698-e8ab01c85b27'
  ],
  'parapluie-compact': [
    'photo-1534353436294-0dbd4bdac845', // black umbrella
    'photo-1556909114-f6e7ad7d3136', // yellow umbrella
    'photo-1514565131-fce0801e5785'  // umbrella
  ],
  't-shirt-classique-homme': [
    'photo-1581655353564-df123a1eb820', // white t-shirt flat lay
    'photo-1521572267360-ee0c2909d518',
    'photo-1618354691373-d851c5c3a990'  // t-shirt isolated
  ],
  'shaker-sport-inox': [
    'photo-1593095948071-474c5cc2989d', // protein shaker bottle
    'photo-1579722821273-0f6c7d44362f',
    'photo-1546483875-ad9014c88eba'
  ],
  'rouleau-massage-mousse-muscle': [
    'photo-1600618528240-fb9fc964b853', // foam roller
    'photo-1598289431512-b97b0917affc',
    'photo-1518611012118-696072aa579a'
  ],
  'chiffons-microfibres-auto-lot3': [
    'photo-1563453392212-326f5e854473', // cleaning microfiber cloths
    'photo-1584992236310-6edddc08acff'
  ],
  'gants-fitness-respirants': [
    'photo-1583454110551-21f2fa2afe61',
    'photo-1517838277536-f5f99be501cd'
  ],
  'legging-sport-gainant': [
    'photo-1506619216599-9d16d0903dfd',
    'photo-1538805060514-97d9cc17730c', // fitness leggings woman
    'photo-1518611012118-696072aa579a'
  ]
};

async function main() {
  for (const [key, ids] of Object.entries(candidates)) {
    console.log(`Checking ${key}:`);
    for (const id of ids) {
      const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
      const ok = await checkUrl(url);
      console.log(`   ${id} => ${ok ? 'VALID (200 OK)' : 'FAILED'}`);
    }
  }
}

main();
