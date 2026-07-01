import type { SeoContentPage } from '../types'

const P = '2025-01-15'
const U = '2026-06-17'

const baseCta = {
  primaryPath: '/bijoux',
  primaryLabel: 'Voir la collection',
  secondaryPath: '/packs',
  secondaryLabel: 'Packs cadeaux',
}

export const matierePages: Record<string, SeoContentPage> = {
  'acier-inoxydable-316l-bijoux': {
    slug: 'acier-inoxydable-316l-bijoux',
    cluster: 'matiere',
    keyword: 'acier inoxydable 316L bijoux',
    title: 'Acier inoxydable 316L : guide bijoux INOXYA',
    metaDescription:
      'Qu\'est-ce que l\'acier 316L ? Composition, avantages, comparaison et bijoux INOXYA au Maroc. Matière premium hypoallergénique.',
    h1: 'Acier inoxydable 316L : la matière des bijoux INOXYA',
    intro:
      'Le 316L n\'est pas un simple « acier argenté » de bijouterie discount. C\'est un alliage inoxydable de qualité supérieure, reconnu pour sa résistance à la corrosion et sa stabilité au contact de la peau. INOXYA BIJOUX l\'a choisi comme base unique de ses collections au Maroc. Ce guide explique ce que recouvre ce label, pourquoi il compte pour votre quotidien et comment le comparer à d\'autres matériaux.',
    sections: [
      {
        h2: 'Composition et propriétés du 316L',
        paragraphs: [
          'L\'acier 316L est un acier inoxydable austénitique contenant du chrome, du nickel et surtout du molybdène — élément clé qui améliore la résistance à la corrosion, notamment face à l\'eau salée et à l\'humidité. Le « L » signifie faible teneur en carbone, ce qui renforce la résistance aux fissures et à la déformation lors de la fabrication de pièces fines comme les bagues ou les chaînes.',
          'En bijouterie contemporaine, le 316L permet des finitions précises : poli miroir, brossé, doré par dépôt ou placage de qualité. La matière conserve une structure stable : elle ne se déforme pas facilement au quotidien et supporte les micro-rayures mieux que des alliages trop mous.',
        ],
        subsections: [
          {
            h3: 'Pourquoi INOXYA standardise sur le 316L',
            paragraphs: [
              'Standardiser une matière, c\'est garantir une expérience cohérente sur toute la boutique. Que vous achetiez une bague à Rabat ou un bracelet à Marrakech, la base métallique reste la même. Cela simplifie l\'entretien, les conseils client et la durabilité attendue.',
              'INOXYA ne prétend pas que le 316L est « indestructible » : les finitions dorées peuvent s\'user si l\'on expose le bijou à des produits chimiques agressifs. En revanche, le métal sous-jacent ne rouille pas comme le fer ou le laiton — un avantage décisif au Maroc.',
            ],
          },
        ],
        image: {
          src: '/images/categories/bracelets.jpg',
          alt: 'Bracelets acier inoxydable 316L INOXYA Maroc',
          caption: 'Bracelets INOXYA — base acier 316L, finitions soignées.',
        },
      },
      {
        h2: '316L face aux autres matériaux',
        table: {
          caption: 'Tableau comparatif des matières bijoux',
          headers: ['Matière', 'Durabilité', 'Entretien', 'Prix'],
          rows: [
            ['Acier 316L', 'Excellente', 'Simple', 'Accessible premium'],
            ['Argent 925', 'Bonne si rhodié', 'Polissage régulier', 'Moyen à élevé'],
            ['Laiton plaqué', 'Faible', 'Délicat', 'Bas'],
            ['Or massif', 'Excellente', 'Professionnel', 'Élevé'],
          ],
        },
      },
      {
        h2: 'Usage quotidien au Maroc',
        paragraphs: [
          'Chaleur, transpiration, poussière des villes côtières : le 316L encaisse ces contraintes sans demander une attention constante. Après une journée à Agadir ou Tanger, un rinçage à l\'eau claire suffit souvent à raviver le bijou.',
          'Pour les peaux sensibles, le 316L est généralement bien toléré. Si vous avez des antécédents d\'allergie au nickel, surveillez tout de même les premiers jours de port et privilégiez des finitions lisses.',
        ],
      },
    ],
    faq: [
      { question: 'Le 316L rouille-t-il ?', answer: 'Non en usage normal. Un entretien minimal après mer ou chlore préserve les finitions.' },
      { question: '316L et hypoallergénique ?', answer: 'Bonne tolérance cutanée pour la majorité ; chaque peau reste unique.' },
      { question: 'Peut-on le porter sous la douche ?', answer: 'Oui occasionnellement ; séchez ensuite pour préserver le doré.' },
    ],
    relatedSlugs: ['bijoux-hypoallergeniques', 'bijoux-acier-inoxydable-maroc', 'entretien-bijoux-acier-inoxydable'],
    collectionLinks: [{ label: 'Collection', path: '/bijoux' }],
    cta: { title: 'Bijoux en 316L INOXYA', description: 'Découvrez la collection complète.', ...baseCta },
    publishedAt: P,
    updatedAt: U,
  },
  'bijoux-hypoallergeniques': {
    slug: 'bijoux-hypoallergeniques',
    cluster: 'matiere',
    keyword: 'bijoux hypoallergéniques Maroc',
    title: 'Bijoux hypoallergéniques 316L au Maroc',
    metaDescription:
      'Bijoux hypoallergéniques INOXYA en acier 316L : peaux sensibles, nickel, conseils de choix et confort au quotidien au Maroc.',
    h1: 'Bijoux hypoallergéniques : pourquoi l\'acier 316L rassure',
    intro:
      'Rougeurs, démangeaisons, traces au poignet ou à l\'oreille : beaucoup de porteurs associent les bijoux à une gêne cutanée. Souvent, le coupable est un alliage bon marché ou un nickel libéré trop rapidement. Les bijoux INOXYA en acier inoxydable 316L visent un confort durable pour la majorité des peaux sensibles au Maroc.',
    sections: [
      {
        h2: 'Comprendre les réactions cutanées',
        paragraphs: [
          'Une « allergie aux bijoux » pointe fréquemment vers le nickel, utilisé dans de nombreux alliages pour durcir le métal. Le contact prolongé, surtout avec la transpiration, peut libérer des ions irritants. Le 316L, correctement fini, limite ce risque grâce à sa couche passive de chrome et à une structure stable.',
          'Hypoallergénique ne signifie pas universel : une minorité de personnes réagit encore à certains composants. En cas de doute, testez un bijou quelques heures, retirez-le en cas de rougeur et consultez un professionnel de santé si les symptômes persistent.',
        ],
        subsections: [
          {
            h3: 'Quels modèles INOXYA privilégier',
            paragraphs: [
              'Les boucles d\'oreilles à tige lisse, les joncs polis et les chaînes sans maillons agressifs sont les plus confortables. Évitez les zones où la peau est déjà irritée ou une plaie en cicatrisation.',
              'Pour les enfants, choisissez des pièces sans petites pièces détachables et un port supervisé.',
            ],
          },
        ],
        image: {
          src: '/images/categories/boucles-oreilles.jpg',
          alt: 'Boucles d\'oreilles hypoallergéniques acier 316L INOXYA',
        },
      },
      {
        h2: 'Entretien et hygiène',
        paragraphs: [
          'Nettoyez régulièrement vos bijoux à l\'eau tiède savonneuse pour retirer crèmes, parfums et résidus. Séchez avant de ranger. Un bijou propre irrite moins la peau qu\'un bijou encrassé.',
        ],
      },
    ],
    comparison: {
      title: 'Acier 316L vs bijoux fantaisie',
      headers: ['Critère', 'INOXYA 316L', 'Fantaisie'],
      rows: [
        { label: 'Irritation', acier316l: 'Risque réduit', autre: 'Fréquent' },
        { label: 'Nickel libre variable', acier316l: 'Alliage contrôlé', autre: 'Souvent élevé' },
      ],
    },
    faq: [
      { question: 'Les bijoux INOXYA conviennent aux enfants ?', answer: 'Oui sous surveillance, modèles adaptés sans petites pièces.' },
      { question: 'Oreilles très sensibles ?', answer: 'Commencez par des puces lisses en 316L, port court puis prolongé.' },
    ],
    relatedSlugs: ['acier-inoxydable-316l-bijoux', 'boucles-oreilles-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Boucles d\'oreilles', path: '/bijoux/boucles-oreilles' }],
    cta: { title: 'Bijoux confort INOXYA', description: '316L pour peaux exigeantes.', ...baseCta },
    publishedAt: P,
    updatedAt: U,
  },
  'bijoux-resistants-eau-maroc': {
    slug: 'bijoux-resistants-eau-maroc',
    cluster: 'matiere',
    keyword: 'bijoux résistants eau Maroc',
    title: 'Bijoux résistants à l\'eau — INOXYA Maroc',
    metaDescription:
      'Bijoux INOXYA résistants à l\'eau en 316L : mer, douche, sport. Conseils d\'usage au Maroc (Agadir, Casablanca, Tanger).',
    h1: 'Bijoux résistants à l\'eau : guide pratique au Maroc',
    intro:
      'Entre l\'Atlantique, la Méditerranée et les piscines d\'hôtel, le Maroc invite à la baignade une grande partie de l\'année. Vos bijoux peuvent-ils suivre ? Avec l\'acier 316L INOXYA, la réponse est largement positive — à condition de respecter quelques réflexes simples après l\'eau salée ou chlorée.',
    sections: [
      {
        h2: 'Ce que résiste vraiment le 316L',
        paragraphs: [
          'Le métal ne rouille pas comme l\'acier ordinaire. L\'eau douce, la transpiration et les éclaboussures quotidiennes ne posent pas de problème structurel. En revanche, les finitions décoratives — doré, pierres synthétiques, inserts — méritent un rinçage et un séchage pour éviter un ternissement progressif.',
          'Après la mer à Essaouira ou Dakhla, passez le bijou sous l\'eau claire. Après la piscine, même principe : le chlore est plus agressif que l\'eau du robinet sur le long terme.',
        ],
        image: {
          src: '/images/categories/montres.jpg',
          alt: 'Montres et bijoux résistants eau INOXYA Maroc',
        },
      },
      {
        h2: 'Sport, douche et quotidien',
        subsections: [
          {
            h3: 'Peut-on garder ses bijoux à la plage ?',
            paragraphs: [
              'Oui pour le 316L, en évitant le sable abrasif sur les finitions polies. Retirez les pièces fragiles avant un match intensif ou musculation avec charges pour ne pas les déformer.',
            ],
          },
          {
            h3: 'Douche quotidienne',
            paragraphs: [
              'Occasionnellement acceptable. Le savon et le shampoing peuvent laisser un film : rincez et séchez. Pour préserver un doré éclatant des années durant, retirez le bijou avant la douche quotidienne.',
            ],
          },
        ],
      },
    ],
    faq: [
      { question: 'Piscine chlorée ?', answer: 'Rincez immédiatement après ; limitez la durée de contact.' },
      { question: 'Bracelet à la plage ?', answer: 'Oui, rinçage eau douce recommandé.' },
    ],
    relatedSlugs: ['entretien-bijoux-acier-inoxydable', 'bijoux-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Bracelets', path: '/bijoux/bracelets' }],
    cta: { title: 'Bijoux tout-terrain INOXYA', description: '316L pour votre quotidien marocain.', ...baseCta },
    publishedAt: P,
    updatedAt: U,
  },
}
