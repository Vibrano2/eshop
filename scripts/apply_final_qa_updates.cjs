const fs = require('fs');

const updates = {
  'reveil-lumineux-simulateur-aube': {
    image: '/products/reveil-lumineux-simulateur-aube-hero.jpg',
    gallery: [
      '/products/reveil-lumineux-simulateur-aube-hero.jpg',
      '/products/reveil-lumineux-simulateur-aube-features.jpg',
      '/products/reveil-lumineux-simulateur-aube-details.jpg'
    ]
  },
  'bouteille-eau-intelligente': {
    image: '/products/bouteille-eau-intelligente-hero.jpg',
    gallery: [
      '/products/bouteille-eau-intelligente-hero.jpg',
      '/products/bouteille-eau-intelligente-features.jpg',
      '/products/bouteille-eau-intelligente-details.jpg'
    ]
  },
  'organisateur-cables': {
    image: '/products/organisateur-cables-hero.jpg',
    gallery: [
      '/products/organisateur-cables-hero.jpg',
      '/products/organisateur-cables-features.jpg',
      '/products/organisateur-cables-details.jpg'
    ]
  },
  'boites-hermetiques-lot4': {
    image: '/products/boites-hermetiques-lot4-hero.jpg',
    gallery: [
      '/products/boites-hermetiques-lot4-hero.jpg',
      '/products/boites-hermetiques-lot4-features.jpg',
      '/products/boites-hermetiques-lot4-details.jpg'
    ]
  },
  'mini-microphone-sans-fil': {
    image: '/products/mini-microphone-sans-fil-hero.jpg',
    gallery: [
      '/products/mini-microphone-sans-fil-hero.jpg',
      '/products/mini-microphone-sans-fil-features.jpg',
      '/products/mini-microphone-sans-fil-details.jpg'
    ]
  },
  'mini-machine-sceller-sachets': {
    image: '/products/mini-machine-sceller-sachets-hero.jpg',
    gallery: [
      '/products/mini-machine-sceller-sachets-hero.jpg',
      '/products/mini-machine-sceller-sachets-features.jpg',
      '/products/mini-machine-sceller-sachets-details.jpg'
    ]
  },
  'pare-soleil-retractable-parebrise': {
    image: '/products/pare-soleil-retractable-parebrise-installed.jpg',
    gallery: [
      '/products/pare-soleil-retractable-parebrise-installed.jpg',
      '/products/pare-soleil-retractable-parebrise-features.jpg',
      '/products/pare-soleil-retractable-parebrise-details.jpg'
    ]
  },
  'trousse-maquillage-voyage': {
    image: '/products/trousse-maquillage-voyage-open.jpg',
    gallery: [
      '/products/trousse-maquillage-voyage-open.jpg',
      '/products/trousse-maquillage-voyage-features.jpg',
      '/products/trousse-maquillage-voyage-details.jpg'
    ]
  },
  'lampe-led-bureau-tactile': {
    image: '/products/lampe-led-bureau-tactile-hero.jpg',
    gallery: [
      '/products/lampe-led-bureau-tactile-hero.jpg',
      '/products/lampe-led-bureau-tactile-features.jpg',
      '/products/lampe-led-bureau-tactile-details.jpg'
    ]
  },
  'tapis-souris-xxl-ergonomique': {
    image: '/products/tapis-souris-xxl-ergonomique-setup.jpg',
    gallery: [
      '/products/tapis-souris-xxl-ergonomique-setup.jpg',
      '/products/tapis-souris-xxl-ergonomique-features.jpg',
      '/products/tapis-souris-xxl-ergonomique-details.jpg'
    ]
  },
  'repose-pieds-ergonomique': {
    image: '/products/repose-pieds-ergonomique.jpg',
    gallery: [
      '/products/repose-pieds-ergonomique.jpg',
      '/products/repose-pieds-ergonomique-setup.jpg',
      '/products/repose-pieds-ergonomique-features.jpg',
      '/products/repose-pieds-ergonomique-details.jpg'
    ]
  },
  'chiffons-microfibres-auto-lot3': {
    image: '/products/chiffons-microfibres-auto-lot3.jpg',
    gallery: [
      '/products/chiffons-microfibres-auto-lot3.jpg',
      '/products/chiffons-microfibres-auto-lifestyle.jpg',
      '/products/chiffons-microfibres-auto-lot3-features.jpg',
      '/products/chiffons-microfibres-auto-lot3-details.jpg'
    ]
  },
  'organisateur-entre-sieges': {
    image: '/products/organisateur-entre-sieges.jpg',
    gallery: [
      '/products/organisateur-entre-sieges.jpg',
      '/products/organisateur-entre-sieges-lifestyle.jpg',
      '/products/organisateur-entre-sieges-features.jpg',
      '/products/organisateur-entre-sieges-details.jpg'
    ]
  },
  'oreiller-voyage-memoire': {
    image: '/products/oreiller-voyage-memoire.jpg',
    gallery: [
      '/products/oreiller-voyage-memoire.jpg',
      '/products/oreiller-voyage-memoire-lifestyle.jpg',
      '/products/oreiller-voyage-memoire-features.jpg',
      '/products/oreiller-voyage-memoire-details.jpg'
    ]
  }
};

let content = fs.readFileSync('./src/data/products.js', 'utf8');

for (const [id, data] of Object.entries(updates)) {
  const idRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"image":\\s*")[^"]+(")`);
  if (!idRegex.test(content)) {
    console.error(`Could not match image for product ${id}`);
    continue;
  }
  content = content.replace(idRegex, `$1${data.image}$2`);

  const galleryRegex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"gallery":\\s*\\[)[\\s\\S]*?(\\])`);
  if (!galleryRegex.test(content)) {
    console.error(`Could not match gallery for product ${id}`);
    continue;
  }
  const formattedGallery = '\n' + data.gallery.map(g => `      "${g}"`).join(',\n') + '\n    ';
  content = content.replace(galleryRegex, `$1${formattedGallery}$2`);

  console.log(`Updated product ${id}`);
}

fs.writeFileSync('./src/data/products.js', content, 'utf8');
console.log('Finished updating src/data/products.js');
