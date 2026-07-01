import type { SeoContentPage } from '../types'

const P = '2025-01-15'
const U = '2026-06-17'
const cta = {
  primaryPath: '/bijoux',
  primaryLabel: 'Voir la collection',
  secondaryPath: '/packs',
  secondaryLabel: 'Packs cadeaux',
}

function categoryPage(
  slug: string,
  keyword: string,
  title: string,
  meta: string,
  h1: string,
  intro: string,
  path: string,
  image: string,
  alt: string,
  extraSections: SeoContentPage['sections'],
  related: string[]
): SeoContentPage {
  return {
    slug,
    cluster: 'categorie',
    keyword,
    title,
    metaDescription: meta,
    h1,
    intro,
    sections: [
      {
        h2: `Pourquoi choisir ${keyword.split(' ')[0]} en acier 316L`,
        paragraphs: [
          `Les ${keyword} INOXYA allient finitions premium et acier inoxydable 316L pour un port quotidien au Maroc. Résistance à l'humidité, confort sur la peau et designs inspirés de l'élégance marocaine : chaque pièce est pensée pour durer au-delà d'une saison.`,
          `Que vous cherchiez un modèle discret pour le bureau ou une pièce plus affirmée pour une cérémonie, la collection propose des finitions dorées et argentées coordonnables entre elles.`,
        ],
        image: { src: image, alt },
      },
      ...extraSections,
      {
        h2: 'Livraison et paiement au Maroc',
        paragraphs: [
          'Commandez en ligne avec livraison dans les principales villes du royaume. Paiement à la livraison disponible. Livraison gratuite dès 200 MAD. Retour gratuit sous 30 jours selon conditions du site.',
        ],
      },
    ],
    faq: [
      { question: 'Matériau des bijoux INOXYA ?', answer: 'Acier inoxydable 316L sur toute la collection.' },
      { question: 'Livraison au Maroc ?', answer: 'Oui, partout dans les principales villes.' },
      { question: 'Paiement à la livraison ?', answer: 'Oui, proposé sur les commandes.' },
    ],
    relatedSlugs: related,
    collectionLinks: [{ label: 'Voir la catégorie', path }],
    cta: { title: `Shop ${h1.split(' ')[0]}`, description: 'Collection INOXYA en 316L.', ...cta },
    publishedAt: P,
    updatedAt: U,
  }
}

export const categoryPages: Record<string, SeoContentPage> = {
  'bagues-acier-inoxydable-maroc': categoryPage(
    'bagues-acier-inoxydable-maroc',
    'bagues acier inoxydable Maroc',
    'Bagues acier inoxydable 316L Maroc',
    'Bagues en acier inoxydable 316L INOXYA : dorées, argentées, berbères. Tailles, styles, livraison Maroc.',
    'Bagues en acier inoxydable au Maroc',
    'La bague est souvent le premier bijou qu\'on porte au quotidien. INOXYA propose des bagues en 316L résistantes à l\'eau et à l\'usure, avec des lignes inspirées du Maroc et des finitions soignées.',
    '/bijoux/bagues',
    '/images/categories/bagues.jpg',
    'Bagues acier inoxydable 316L INOXYA Maroc',
    [
      {
        h2: 'Choisir la bonne taille',
        paragraphs: [
          'Mesurez votre tour de doigt en fin de journée. Entre deux tailles, prenez la plus grande. Les bagues ajustables conviennent aux cadeaux lorsque la taille exacte est inconnue.',
        ],
        subsections: [
          {
            h3: 'Styles disponibles',
            paragraphs: [
              'Jonc fin minimaliste, bague dorée statement, motifs géométriques ou inspiration artisanale marocaine : parcourez la fiche de chaque modèle pour le détail des finitions.',
            ],
          },
        ],
      },
    ],
    ['comment-choisir-bague-acier-inoxydable', 'bijoux-acier-inoxydable-maroc']
  ),
  'colliers-acier-inoxydable-maroc': categoryPage(
    'colliers-acier-inoxydable-maroc',
    'colliers acier inoxydable Maroc',
    'Colliers acier inoxydable 316L Maroc',
    'Colliers et ensembles INOXYA en acier 316L. Chaînes, pendentifs, style marocain. Livraison nationale.',
    'Colliers en acier inoxydable au Maroc',
    'Un collier structure votre silhouette et complète une tenue sans effort. Les colliers INOXYA en 316L offrent éclat durable et confort au cou, du ras-de-cou moderne au pendentif traditionnel.',
    '/bijoux/colliers',
    '/images/categories/colliers.jpg',
    'Colliers acier inoxydable INOXYA Maroc',
    [
      {
        h2: 'Longueur et morphologie',
        paragraphs: [
          'Un ras-de-cou met en valeur le port de tête ; une chaîne longue allonge la silhouette. Testez devant un miroir ou consultez nos ensembles pour un look coordonné bague + collier.',
        ],
      },
    ],
    ['bagues-acier-inoxydable-maroc', 'cadeau-bijoux-femme-maroc']
  ),
  'bracelets-acier-inoxydable-maroc': categoryPage(
    'bracelets-acier-inoxydable-maroc',
    'bracelets acier inoxydable Maroc',
    'Bracelets acier inoxydable 316L Maroc',
    'Bracelets INOXYA en 316L : joncs, chaînes, style premium. Résistants, livraison Maroc.',
    'Bracelets en acier inoxydable au Maroc',
    'Au poignet, le bijou bouge, frotte, s\'expose. Les bracelets INOXYA en acier 316L sont conçus pour ce mouvement constant : solidité, brillance et fermoirs fiables.',
    '/bijoux/bracelets',
    '/images/categories/bracelets.jpg',
    'Bracelets acier inoxydable INOXYA',
    [
      {
        h2: 'Jonc ou chaîne ?',
        paragraphs: [
          'Le jonc rigide affirme le style ; la chaîne reste légère et discrète. Les deux se superposent pour un effet tendance sans surcharge visuelle.',
        ],
      },
    ],
    ['bijoux-resistants-eau-maroc', 'bijoux-acier-inoxydable-maroc']
  ),
  'boucles-oreilles-acier-inoxydable-maroc': categoryPage(
    'boucles-oreilles-acier-inoxydable-maroc',
    'boucles d\'oreilles acier inoxydable Maroc',
    'Boucles d\'oreilles acier 316L Maroc',
    'Boucles d\'oreilles INOXYA en 316L : créoles, puces, dorées. Hypoallergéniques, livraison Maroc.',
    'Boucles d\'oreilles en acier inoxydable au Maroc',
    'Les boucles d\'oreilles illuminent le visage. INOXYA propose créoles, puces et modèles pendantes en 316L — idéal pour les peaux sensibles et les cadeaux sans taille à deviner.',
    '/bijoux/boucles-oreilles',
    '/images/categories/boucles-oreilles.jpg',
    'Boucles d\'oreilles acier inoxydable INOXYA',
    [
      {
        h2: 'Créoles, puces ou pendantes',
        paragraphs: [
          'Les puces conviennent au quotidien discret. Les créoles moyennes structurent le visage. Les pendantes ajoutent du mouvement pour les occasions.',
        ],
      },
    ],
    ['bijoux-hypoallergeniques', 'cadeau-bijoux-femme-maroc']
  ),
}
