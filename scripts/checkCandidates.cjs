const https = require('https');

const candidates = [
  { id: 'pare-soleil-retractable-parebrise', photo: 'photo-1503376780353-7e6692767b70' },
  { id: 'ceinture-securite-chien-auto', photo: 'photo-1535294435445-d7249524ef2e' },
  { id: 'coupe-griffes-led-animaux', photo: 'photo-1516734212186-a967f81ad0d7' },
  { id: 'brosse-nettoyage-electrique', photo: 'photo-1581578731548-c64695cc6952' },
  { id: 'balle-interactive-chat', photo: 'photo-1545249390-6bdfa286032f' },
  { id: 'reglette-led-detecteur-mouvement', photo: 'photo-1540932239986-30128078f3c5' },
  { id: 'detecteur-ouverture-porte-fenetre', photo: 'photo-1558002038-1055907df827' },
  { id: 'bonnet-satin-cheveux', photo: 'photo-1527799820374-dcf8d9d4a388' },
  { id: 'corde-a-sauter-roulements-acier', photo: 'photo-1540497077202-7c8a3999166f' },
  { id: 'boites-hermetiques-lot4', photo: 'photo-1590794056226-79ef3a8147e1' }
];

candidates.forEach(c => {
  https.get(`https://unsplash.com/photos/${c.photo}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      console.log(`${c.id}: ${match ? match[1] : 'Unknown'}`);
    });
  }).on('error', err => console.log(c.id, err.message));
});
