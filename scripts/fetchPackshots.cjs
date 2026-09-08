const https = require('https');
const fs = require('fs');
const path = require('path');

function searchOpenverse(query) {
  return new Promise(resolve => {
    const url = 'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(query) + '&page_size=5';
    https.get(url, { headers: { 'User-Agent': 'EshopAuditor/1.0 (catalog@eshop.eu)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const items = (j.results || []).map(r => ({
            id: r.id,
            title: r.title,
            url: r.url,
            creator: r.creator,
            source: r.source
          }));
          resolve(items);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

const queries = {
  'kit-pinceaux-maquillage': 'makeup brush set',
  'shaker-sport-inox': 'shaker bottle gym',
  'rouleau-massage-mousse-muscle': 'foam roller exercise',
  'gants-fitness-respirants': 'weightlifting gloves fitness',
  'distributeur-sacs-dejections': 'dog poop bag dispenser',
  'jouet-distributeur-friandises': 'dog treat ball dispenser toy',
  'tapis-gamelle-silicone': 'silicone pet feeding mat',
  'coupe-griffes-led-animaux': 'pet nail clipper',
  'mini-poubelle-voiture-etanche': 'car trash can bin',
  'organisateur-dossier-siege-auto': 'car seat back organizer',
  'pare-soleil-retractable-parebrise': 'car windshield umbrella sunshade',
  'chiffons-microfibres-auto-lot3': 'microfiber towels folded',
  'brosse-nettoyage-electrique': 'electric spin scrubber brush',
  'masseur-cuir-chevelu': 'scalp massager brush silicone',
  'parapluie-compact': 'compact folding umbrella',
  'miroir-led-tactile': 'led makeup mirror vanity',
  't-shirt-classique-homme': 'plain white t-shirt isolated',
  'legging-sport-gainant': 'black athletic leggings woman',
  'organisateur-cables': 'cable organizer clips desktop',
  'chaussures-marche-legeres': 'running walking shoes pair isolated'
};

async function main() {
  const results = {};
  for (const [id, q] of Object.entries(queries)) {
    const hits = await searchOpenverse(q);
    results[id] = hits;
    console.log(`[${id}] (${q}) => ${hits.length} hits`);
    if (hits.length > 0) {
      console.log(`   Top 1: "${hits[0].title}" -> ${hits[0].url}`);
    }
  }
  fs.writeFileSync('./scripts/openverse_results.json', JSON.stringify(results, null, 2));
  console.log('Finished Openverse search. Saved to ./scripts/openverse_results.json');
}

main();
