export const MAIN_CATEGORIES = [
  {
    id: 'mode',
    name: 'Mode',
    slug: 'mode',
    itemCount: '19 articles',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    description: 'Essentiels tendance pour femme et homme : vêtements, chaussures et accessoires.',
    subcategories: [
      { id: 'femme', name: 'Femme' },
      { id: 'homme', name: 'Homme' },
      { id: 'chaussures', name: 'Chaussures' },
      { id: 'sacs', name: 'Sacs' },
      { id: 'bijoux-montres', name: 'Bijoux & Montres' },
      { id: 'accessoires-mode', name: 'Accessoires de mode' }
    ],
    megaMenuGroups: [
      {
        title: 'MODE FEMME',
        subcategoryId: 'femme',
        items: ['Robes', 'T-shirts oversize', 'Jeans confort', 'Ensembles', 'Vestes légères']
      },
      {
        title: 'MODE HOMME',
        subcategoryId: 'homme',
        items: ['T-shirts coton bio', 'Polos casual', 'Chemises en lin', 'Chinos & Pantalons', 'Sweats']
      },
      {
        title: 'CHAUSSURES',
        subcategoryId: 'chaussures',
        items: ['Baskets respirantes', 'Sandales cuir', 'Mocassins casual', 'Chaussures sport']
      },
      {
        title: 'ACCESSOIRES DE MODE',
        subcategoryId: 'accessoires-mode',
        items: ['Sacs bandoulière', 'Montres minimalistes', 'Bijoux acier inoxydable', 'Ceintures']
      }
    ]
  },
  {
    id: 'beaute',
    name: 'Beauté',
    slug: 'beaute',
    itemCount: '13 articles',
    image: '/products/rouleau-boucles-sans-chaleur.jpg',
    description: 'Soins visage & cheveux, accessoires coiffure et essentiels bien-être à la maison.',
    subcategories: [
      { id: 'soins-visage', name: 'Soins du visage' },
      { id: 'soins-cheveux', name: 'Soins des cheveux' },
      { id: 'accessoires-beaute', name: 'Accessoires beauté' },
      { id: 'bien-etre', name: 'Bien-être' },
      { id: 'maquillage', name: 'Maquillage' },
      { id: 'hygiene', name: 'Hygiène personnelle' }
    ]
  },
  {
    id: 'technologie',
    name: 'Technologie',
    slug: 'technologie',
    itemCount: '14 articles',
    image: '/products/support-ordinateur-portable.jpg',
    description: 'Supports ergonomiques, chargeurs rapides GaN, hubs et accessoires informatiques indispensables.',
    subcategories: [
      { id: 'gadgets', name: 'Gadgets' },
      { id: 'telephones-accessoires', name: 'Téléphones & Accessoires' },
      { id: 'informatique', name: 'Informatique' },
      { id: 'audio', name: 'Audio' },
      { id: 'objets-connectes', name: 'Objets connectés' },
      { id: 'accessoires-electroniques', name: 'Accessoires électroniques' }
    ]
  },
  {
    id: 'maison',
    name: 'Maison',
    slug: 'maison',
    itemCount: '11 articles',
    image: '/products/doublures-silicone-airfryer.jpg',
    description: 'Accessoires cuisine, moules air fryer, brosses électriques et organisation sous-évier.',
    subcategories: [
      { id: 'cuisine', name: 'Cuisine' },
      { id: 'rangement', name: 'Rangement' },
      { id: 'nettoyage', name: 'Nettoyage' },
      { id: 'decoration', name: 'Décoration' },
      { id: 'organisation', name: 'Organisation' },
      { id: 'petit-electromenager', name: 'Petit électroménager' }
    ]
  },
  {
    id: 'animaux',
    name: 'Animaux',
    slug: 'animaux',
    itemCount: '12 articles',
    image: '/products/brosse-anti-poils.jpg',
    description: 'Brosses autonettoyantes, gourdes nomades, jouets interactifs et harnais pour chiens et chats.',
    subcategories: [
      { id: 'chiens', name: 'Chiens' },
      { id: 'chats', name: 'Chats' },
      { id: 'toilettage', name: 'Toilettage' },
      { id: 'voyage', name: 'Voyage' },
      { id: 'accessoires', name: 'Accessoires' }
    ]
  },
  {
    id: 'sport',
    name: 'Sport & Fitness',
    slug: 'sport',
    itemCount: '10 articles',
    image: '/products/ceinture-course.jpg',
    description: 'Tapis de yoga, rouleaux de massage, ceintures running et matériel d\'entraînement.',
    subcategories: [
      { id: 'fitness', name: 'Fitness' },
      { id: 'running', name: 'Running' },
      { id: 'yoga', name: 'Yoga' },
      { id: 'cyclisme', name: 'Cyclisme' },
      { id: 'accessoires-sport', name: 'Accessoires sport' }
    ]
  },
  {
    id: 'auto',
    name: 'Auto',
    slug: 'auto',
    itemCount: '9 articles',
    image: '/products/organisateur-entre-sieges.jpg',
    description: 'Supports téléphone 360°, organisateurs interstice, chargeurs 60W et mini poubelles étanches.',
    subcategories: [
      { id: 'accessoires-voiture', name: 'Accessoires voiture' },
      { id: 'organisation', name: 'Organisation' },
      { id: 'nettoyage', name: 'Nettoyage' },
      { id: 'telephone-charge', name: 'Téléphone & charge' },
      { id: 'confort', name: 'Confort' }
    ]
  },
  {
    id: 'securite',
    name: 'Sécurité',
    slug: 'securite',
    itemCount: '7 articles',
    image: '/products/camera-surveillance-wifi.jpg',
    description: 'Caméras WiFi 360°, sonnettes vidéo HD, ampoules connectées et capteurs d\'ouverture.',
    subcategories: [
      { id: 'cameras', name: 'Caméras' },
      { id: 'maison-intelligente', name: 'Maison intelligente' },
      { id: 'surveillance', name: 'Surveillance' },
      { id: 'detection', name: 'Détection' }
    ]
  },
  {
    id: 'voyage',
    name: 'Voyage',
    slug: 'voyage',
    itemCount: '7 articles',
    image: '/products/cubes-rangement-valise.jpg',
    description: 'Cubes de compression, pèse-bagages, trousses de toilette et masques de sommeil 3D.',
    subcategories: [
      { id: 'bagagerie', name: 'Bagagerie' },
      { id: 'organisation', name: 'Organisation' },
      { id: 'accessoires', name: 'Accessoires' },
      { id: 'confort', name: 'Confort' }
    ]
  },
  {
    id: 'accessoires',
    name: 'Accessoires',
    slug: 'accessoires',
    itemCount: '8 articles',
    image: '/products/porte-cartes-aluminium-anti-rfid.jpg',
    description: 'Porte-cartes anti-RFID, montres minimalistes, lunettes polarisées et ceintures automatiques.',
    subcategories: [
      { id: 'sacs', name: 'Sacs' },
      { id: 'montres', name: 'Montres' },
      { id: 'bijoux', name: 'Bijoux' },
      { id: 'lunettes', name: 'Lunettes' },
      { id: 'portefeuilles', name: 'Portefeuilles' },
      { id: 'accessoires-telephone', name: 'Accessoires téléphone' },
      { id: 'accessoires-bureau', name: 'Accessoires bureau' },
      { id: 'accessoires-lifestyle', name: 'Accessoires lifestyle' }
    ]
  }
];

export const ALL_CATEGORY_IDS = MAIN_CATEGORIES.map((c) => c.id);

export function getCategoryById(id) {
  return MAIN_CATEGORIES.find((c) => c.id === id) || null;
}
