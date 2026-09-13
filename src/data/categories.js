export const MAIN_CATEGORIES = [
  {
    id: 'tech',
    name: 'Tech & Gadgets',
    slug: 'tech',
    aliases: ['technologie', 'gadgets'],
    itemCount: '5 essentiels',
    image: '/products/batterie-externe-compacte-10000-hero-v2.jpg',
    description: 'Batteries magnétiques, imprimantes nomades, chargeurs GaN et accessoires connectés pour votre quotidien digital.',
    subcategories: [
      { id: 'charge-energie', name: 'Charge & Énergie' },
      { id: 'impression-nomade', name: 'Impression nomade' },
      { id: 'accessoires-pc-mobile', name: 'Accessoires PC & Mobile' },
      { id: 'gadgets-intelligents', name: 'Gadgets intelligents' }
    ]
  },
  {
    id: 'maison',
    name: 'Maison & Cuisine',
    slug: 'maison',
    aliases: ['cuisine', 'maison-cuisine'],
    itemCount: '5 essentiels',
    image: '/products/brosse-nettoyage-electrique-hero.jpg',
    description: 'Blenders nomades, brosses rotatives, boîtes repas chauffantes et éclairages automatiques pour faciliter votre foyer.',
    subcategories: [
      { id: 'cuisine-nomade', name: 'Cuisine nomade' },
      { id: 'conservation', name: 'Conservation & Repas' },
      { id: 'nettoyage-intelligent', name: 'Nettoyage intelligent' },
      { id: 'eclairage-led', name: 'Éclairage LED & Confort' }
    ]
  },
  {
    id: 'beaute',
    name: 'Beauté & Lifestyle',
    slug: 'beaute',
    aliases: ['lifestyle', 'beaute-lifestyle'],
    itemCount: '5 essentiels',
    image: '/products/rouleau-glace-visage.jpg',
    description: 'Soins visage rafraîchissants, boucles sans chaleur, masseurs capillaires et défroisseurs portables pour sublimer votre allure.',
    subcategories: [
      { id: 'soins-visage', name: 'Soins visage & cryo' },
      { id: 'coiffure-soin', name: 'Coiffure & Cuir chevelu' },
      { id: 'textile-soin', name: 'Entretien textile & Vêtements' }
    ]
  },
  {
    id: 'voyage-auto',
    name: 'Voyage, Auto & Outdoor',
    slug: 'voyage-auto',
    aliases: ['voyage', 'auto', 'outdoor'],
    itemCount: '5 essentiels',
    image: '/products/cubes-rangement-valise.jpg',
    description: 'Aspirateurs auto sans fil, sacs compressibles, pèse-bagages et ventilateurs de cou pour voyager sereinement.',
    subcategories: [
      { id: 'entretien-auto', name: 'Entretien & Confort Auto' },
      { id: 'organisation-valise', name: 'Organisation & Bagagerie' },
      { id: 'outdoor-confort', name: 'Confort Outdoor & Nomade' }
    ]
  }
];

export const ALL_CATEGORY_IDS = MAIN_CATEGORIES.map((c) => c.id);

export function getCategoryById(id) {
  if (!id) return null;
  return (
    MAIN_CATEGORIES.find((c) => c.id === id || (c.aliases && c.aliases.includes(id))) ||
    null
  );
}

