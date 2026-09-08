const https = require('https');
const fs = require('fs');
const path = require('path');

function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&format=json`;
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'EshopCatalogPackshotBot/1.0 (auditor@eshop.eu)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const pages = Object.values(j.query?.pages || {});
          const results = pages.map(p => ({
            title: p.title,
            url: p.imageinfo?.[0]?.url,
            width: p.imageinfo?.[0]?.width,
            height: p.imageinfo?.[0]?.height,
            mime: p.imageinfo?.[0]?.mime
          })).filter(r => r.url && /\.(jpg|jpeg|png)$/i.test(r.url));
          resolve(results);
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

const targetQueries = {
  'distributeur-sacs-dejections': 'dog waste bag dispenser',
  'jouet-distributeur-friandises': 'dog treat dispenser toy ball',
  'coupe-griffes-led-animaux': 'pet nail clipper',
  'tapis-gamelle-silicone': 'pet feeding mat silicone',
  'mini-poubelle-voiture-etanche': 'car trash bin',
  'organisateur-dossier-siege-auto': 'car seat organizer back',
  'pare-soleil-retractable-parebrise': 'car windshield sun shade',
  'brosse-nettoyage-electrique': 'electric spin scrubber',
  'organisateur-cables': 'magnetic cable organizer desktop',
  'support-telephone-bureau-pliable': 'cell phone stand desk adjustable aluminum',
  'lampe-led-bureau-tactile': 'desk lamp led touch',
  'mini-microphone-sans-fil': 'lavalier microphone wireless',
  'tapis-souris-xxl-ergonomique': 'mouse pad extended desk mat',
  'bouteille-eau-pliable': 'collapsible silicone water bottle',
  'detecteur-ouverture-porte-fenetre': 'door window sensor zigbee wifi',
  'reglette-led-detecteur-mouvement': 'under cabinet led light bar motion sensor',
  'boites-hermetiques-lot4': 'food storage containers airtight lids',
  'bonnet-satin-cheveux': 'satin hair bonnet',
  'trousse-maquillage-voyage': 'travel cosmetic bag makeup case',
  'vaporisateur-parfum-rechargeable': 'refillable perfume atomizer pocket',
  'brosse-demelante-anti-casse': 'detangling hair brush'
};

async function main() {
  for (const [id, q] of Object.entries(targetQueries)) {
    const hits = await searchCommons(q);
    console.log(`[${id}] (${q}) => ${hits.length} hits`);
    hits.slice(0, 3).forEach(h => {
      console.log(`   ${h.title} (${h.width}x${h.height}) -> ${h.url}`);
    });
  }
}

main();
