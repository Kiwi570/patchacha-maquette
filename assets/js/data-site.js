/* Contenus repris du site actuel atelierpatchacha.fr (relevé du 23 octobre 2026).
   Tout ce qui manque est marqué « à compléter ». Les dates sont triées automatiquement en « à venir » et « passées ». */
window.PATCHACHA_SITE = {
  contact: {
    email: 'contact@atelierpatchacha.fr',
    ville: 'Quimper',
    atelier: 'Atelier à Quimper, visites sur rendez-vous',
    telephone: null, // à compléter : aucun numéro sur le site actuel
    instagram: 'https://www.instagram.com/atelierpatchacha',
    instagramNom: '@atelierpatchacha',
    facebook: 'https://www.facebook.com/61579602512744',
    etsy: 'https://www.etsy.com/fr/shop/PatchachaCreations',
    siteActuel: 'https://www.atelierpatchacha.fr'
  },

  temoignages: [
    { nom: 'Marie', ville: 'Fouesnant', texte: 'Des tableaux, doux, aériens, qui portent un message fort. Vraiment original' },
    { nom: 'Philippe', ville: 'Pont-Croix', texte: 'Très joli, tant au niveau de l’effet produit que de la réalisation. La texture est magnifique. Un tableau qui attire le regard !' },
    { nom: 'Anne', ville: 'Paris', texte: 'Ce tableau est fin, élégant. Il dégage une atmosphère mystérieuse et paisible à la fois, que je vais avoir plaisir à retrouver dans mon salon.' }
  ],

  // Coordonnées approximatives des communes, pour la carte des rendez-vous.
  lieux: {
    quimper: { nom: 'Quimper', lat: 47.996, lon: -4.102 },
    concarneau: { nom: 'Concarneau', lat: 47.873, lon: -3.920 },
    fouesnant: { nom: 'Fouesnant', lat: 47.894, lon: -3.992 },
    garennes: { nom: 'Clohars-Fouesnant', lat: 47.889, lon: -4.075 },
    chateaulin: { nom: 'Châteaulin', lat: 48.197, lon: -4.090 },
    pontivy: { nom: 'Pontivy', lat: 48.068, lon: -2.963 },
    audierne: { nom: 'Audierne', lat: 48.022, lon: -4.540 },
    foret: { nom: 'La Forêt-Fouesnant', lat: 47.911, lon: -3.979 },
    pontcroix: { nom: 'Pont-Croix', lat: 48.041, lon: -4.487 },
    paris: { nom: 'Paris', lat: 48.857, lon: 2.352 }
  },

  rendezvous: [
    { titre: 'Marché d’automne au château des Garennes', debut: '2026-11-08', fin: '2026-11-08', lieu: 'garennes',
      adresse: 'Lieu-dit les Garennes, Clohars-Fouesnant', horaires: '10 h – 18 h, sous chapiteau chauffé, entrée gratuite',
      texte: 'Sélection d’œuvres (tableaux et textiles d’art) autour de l’automne. Manifestation reportée au 8 novembre : trop de vent le 25 octobre.',
      photo: 'chateau-garennes' },
    { titre: 'Salon Artisan’Art', debut: '2026-11-20', fin: '2026-11-21', lieu: 'chateaulin',
      adresse: 'Espace Coatigrac’h, Châteaulin', horaires: 'Samedi 14 h – 19 h, dimanche 10 h – 18 h',
      texte: 'Tableaux et textiles d’art à offrir ou à s’offrir.' },
    { titre: 'Marché de Noël', debut: '2026-11-29', fin: '2026-11-29', lieu: 'pontivy',
      adresse: 'Palais des Congrès de Pontivy', horaires: '10 h – 18 h', texte: '' },
    { titre: 'Marché d’art et de créateurs', debut: '2026-12-12', fin: '2026-12-13', lieu: 'audierne',
      adresse: 'Salle de l’Inscription Maritime, 1 rue Lamartine, Audierne', horaires: 'Samedi 10 h – 19 h, dimanche 10 h – 18 h', texte: '' },
    { titre: 'Chapelle Saint-Fiacre', debut: '2026-09-28', fin: '2026-10-04', lieu: 'concarneau',
      texte: 'Sélection d’œuvres autour de l’arbre.', photo: 'expo-st-fiacre' },
    { titre: 'Le BioRestau', debut: '2026-06-21', fin: '2026-09-22', periode: 'Été 2026', lieu: 'quimper',
      texte: 'Exposition d’œuvres « Mémoire des arbres ».' },
    { titre: 'Galerie Le Grand Atelier', debut: '2026-04-20', fin: '2026-05-10', lieu: 'quimper',
      texte: 'Le rendez-vous 2026 au Grand Atelier, avec une exposition essentiellement centrée sur les arbres.', photo: 'expo-grand-atelier-entree' },
    { titre: 'Chapelle Saint-Fiacre', debut: '2025-09-22', fin: '2025-09-28', lieu: 'concarneau',
      texte: 'J’ai pu y accrocher mes œuvres en volume.', photo: 'expo-concarneau' },
    { titre: 'Chapelle de Kerbader', debut: '2025-08-11', fin: '2025-08-18', lieu: 'fouesnant',
      texte: 'La série des miniatures : des œuvres 10 × 10 cm, encadrées 20 × 20 cm.', photo: 'expo-kerbader' },
    { titre: 'Galerie Le Grand Atelier', debut: '2025-05-01', fin: '2025-05-31', periode: 'Mai 2025', lieu: 'quimper',
      texte: 'Un rendez-vous régulier, chaque année, dans ce joli lieu.', photo: 'expo-grand-atelier' }
  ],

  // Lieux cités sur la page « L’artiste », sans date.
  autresLieux: [
    { titre: 'Exposition', lieu: 'foret', note: 'date à compléter' },
    { titre: 'Exposition', lieu: 'pontcroix', note: 'date à compléter' },
    { titre: 'Le Prieuré', lieu: 'quimper', note: 'date à compléter' }
  ],

  formations: [
    'Paysages et textiles contemporains', 'Collagraphie et gravure', 'Monotypes et compositions de paysages',
    'Dessin modèle vivant et perspective', 'Techniques mixtes et composition sur papier',
    'Teintures et encres naturelles', 'Broderie contemporaine et travail de la fibre'
  ],

  // Images Grok reçues : vide pour la v1, les visuels provisoires sont dessinés en code.
  grok: {}
};
