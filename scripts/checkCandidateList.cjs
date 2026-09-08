const https = require('https');

function checkUrl(id) {
  return new Promise(resolve => {
    const url = 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=800&q=80';
    https.request(url, { method: 'HEAD' }, res => {
      resolve({ id, status: res.statusCode });
    }).on('error', () => resolve({ id, status: 500 })).end();
  });
}

const list = [
  'photo-1512496015851-a90fb38ba796', // makeup palette
  'photo-1522337360788-8b13dee7a37e', // beauty spa
  'photo-1527799820374-dcf8d9d4a388', // sleep / satin hair
  'photo-1584917865442-de89df76afd3', // bag travel
  'photo-1592945403244-b3fbafd7f539', // perfume bottle
  'photo-1535585209827-a15fcdbc4c2d', // hair brush
  'photo-1583863788434-e58a36330cf0', // charger wall
  'photo-1598550476439-6847785fcea6', // microphone
  'photo-1586953208448-b95a79798f07', // phone stand
  'photo-1618005182384-a83a8bd57fbe', // desk mat
  'photo-1507473885765-e6ed057f782c', // desk lamp
  'photo-1590794056226-79ef3a8147e1', // food containers
  'photo-1540932239986-30128078f3c5', // led light
  'photo-1558002038-1055907df827', // sensor
  'photo-1523362628745-0c100150b504', // water bottle
  'photo-1545249390-6bdfa286032f', // cat
  'photo-1560769629-975ec94e6a86'  // shoes
];

async function main() {
  const results = await Promise.all(list.map(checkUrl));
  results.forEach(r => console.log(r.id, '=>', r.status));
}

main();
