import type { SeoContentPage } from '../types'

const P = '2025-01-15'
const U = '2026-06-17'

export const entretienPages: Record<string, SeoContentPage> = {
  'entretien-bijoux-acier-inoxydable': {
    slug: 'entretien-bijoux-acier-inoxydable',
    cluster: 'entretien',
    keyword: 'entretien bijoux acier inoxydable',
    title: 'Entretien bijoux acier inoxydable 316L',
    metaDescription:
      'Nettoyage, eau, mer, rangement : entretien complet des bijoux 316L INOXYA. Guide pratique pour le Maroc.',
    h1: 'Comment entretenir un bijou en acier inoxydable 316L',
    intro:
      'Un bijou INOXYA en acier 316L est conçu pour durer, mais un entretien simple préserve son éclat des années durant. Ce guide détaille le nettoyage quotidien, les précautions à la mer, le rangement et les erreurs à éviter au Maroc.',
    sections: [
      {
        h2: 'Nettoyage quotidien en 4 étapes',
        paragraphs: [
          '1. Rincez à l\'eau tiède pour retirer poussière et résidus de crème solaire. 2. Ajoutez une goutte de savon doux si nécessaire. 3. Brossez délicatement les zones texturées avec une brosse souple. 4. Séchez avec un chiffon microfibre sans peluches.',
          'Évitez les éponges abrasives et les produits ménagers agressifs : ils rayent les finitions dorées et altèrent les inserts décoratifs.',
        ],
        subsections: [
          {
            h3: 'Produits à éviter',
            paragraphs: [
              'Javel, ammoniaque, dissolvants, parfums pulvérés directement sur le bijou. Appliquez parfum et crème avant de mettre vos bijoux, pas après.',
            ],
          },
        ],
        image: {
          src: '/images/categories/bagues.jpg',
          alt: 'Entretien bagues acier inoxydable INOXYA',
          caption: 'Un chiffon doux suffit pour l\'entretien courant.',
        },
      },
      {
        h2: 'Mer, piscine et douche',
        paragraphs: [
          'Le 316L résiste à l\'eau douce. Après la mer, rincez abondamment : le sel peut ternir les finitions sur le long terme. Après la piscine, même principe avec le chlore.',
          'La douche occasionnelle ne pose pas de problème structurel ; retirez vos bijoux dorés si vous souhaitez maximiser la durée du placage.',
        ],
        table: {
          caption: 'Entretien selon l\'exposition',
          headers: ['Situation', 'Action', 'Fréquence'],
          rows: [
            ['Quotidien bureau', 'Chiffon sec', 'Hebdomadaire'],
            ['Mer / plage', 'Rinçage eau claire', 'Après chaque baignade'],
            ['Sport intensif', 'Retirer bijou fragile', 'À chaque séance'],
            ['Rangement', 'Pochette séparée', 'Systématique'],
          ],
        },
      },
      {
        h2: 'Rangement et voyage',
        paragraphs: [
          'Rangez chaque pièce séparément pour éviter les rayures entre métaux. Évitez la salle de bain humide pour le stockage. En voyage, un petit étui rigide protège les formes délicates dans le sac.',
        ],
      },
      {
        h2: 'Quand faire appel à un professionnel',
        paragraphs: [
          'Si une pierre se décolle, un fermoir casse ou une déformation apparaît, contactez le service INOXYA plutôt que de forcer le mécanisme. Un entretien précoce évite des réparations coûteuses.',
        ],
      },
    ],
    comparison: {
      title: 'Bon vs mauvais entretien',
      headers: ['Pratique', 'Recommandé', 'À éviter'],
      rows: [
        { label: 'Nettoyage', acier316l: 'Eau tiède + savon doux', autre: 'Produits abrasifs' },
        { label: 'Séchage', acier316l: 'Microfibre', autre: 'Air humide prolongé' },
        { label: 'Stockage', acier316l: 'Pochette individuelle', autre: 'Tiroir en vrac' },
      ],
    },
    faq: [
      { question: 'Dormir avec ses bijoux ?', answer: 'Possible pour modèles robustes ; retirez les pièces fragiles.' },
      { question: 'Le doré ternit-il ?', answer: 'Avec entretien correct, la finition dure longtemps.' },
      { question: 'Alcool isopropylique ?', answer: 'Occasionnel sur surfaces lisses ; pas sur pierres fragiles.' },
      { question: 'Bijou noir ou terne ?', answer: 'Nettoyage en profondeur ; contactez INOXYA si persistant.' },
    ],
    relatedSlugs: ['bijoux-resistants-eau-maroc', 'acier-inoxydable-316l-bijoux', 'bijoux-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Collection', path: '/bijoux' }],
    cta: {
      title: 'Bijoux faciles à entretenir',
      description: 'Acier 316L INOXYA — durables au Maroc.',
      primaryPath: '/bijoux',
      primaryLabel: 'Voir les bijoux',
      secondaryPath: '/guide/bijoux-resistants-eau-maroc',
      secondaryLabel: 'Résistance à l\'eau',
    },
    publishedAt: P,
    updatedAt: U,
  },
}
