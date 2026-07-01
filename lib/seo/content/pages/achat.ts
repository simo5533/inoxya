import type { SeoContentPage } from '../types'

const P = '2025-01-15'
const U = '2026-06-17'
const cta = {
  primaryPath: '/bijoux',
  primaryLabel: 'Commander',
  secondaryPath: '/faq',
  secondaryLabel: 'FAQ',
}

export const achatPages: Record<string, SeoContentPage> = {
  'livraison-bijoux-maroc': {
    slug: 'livraison-bijoux-maroc',
    cluster: 'achat',
    keyword: 'livraison bijoux Maroc',
    title: 'Livraison bijoux INOXYA partout au Maroc',
    metaDescription:
      'Livraison bijoux INOXYA au Maroc : délais, villes, frais, gratuit dès 200 MAD. Casablanca, Rabat, Marrakech et plus.',
    h1: 'Livraison de bijoux INOXYA au Maroc',
    intro:
      'Vous commandez des bijoux en ligne et vous vous demandez si INOXYA livre dans votre ville ? Ce guide détaille la livraison nationale, les frais, le seuil de gratuité et les bonnes pratiques pour recevoir votre colis sereinement.',
    sections: [
      {
        h2: 'Zones desservies',
        paragraphs: [
          'INOXYA livre dans les principales villes du Maroc : Casablanca, Rabat, Marrakech, Fès, Agadir, Tanger, Meknès, Oujda, Kénitra, Tétouan et bien d\'autres. Indiquez une adresse complète et un numéro de téléphone joignable lors de la commande.',
          'Les délais varient selon la destination et la charge logistique. L\'équipe peut vous contacter par téléphone ou WhatsApp pour confirmer les détails.',
        ],
      },
      {
        h2: 'Frais et livraison gratuite',
        paragraphs: [
          'La livraison est gratuite à partir de 200 MAD d\'achat. En dessous de ce seuil, des frais peuvent s\'appliquer selon la ville — le montant exact est indiqué avant validation de commande.',
        ],
        table: {
          caption: 'Récapitulatif livraison',
          headers: ['Montant commande', 'Livraison', 'Paiement'],
          rows: [
            ['≥ 200 MAD', 'Gratuite (selon ville)', 'À la livraison'],
            ['< 200 MAD', 'Selon ville', 'À la livraison'],
          ],
        },
      },
    ],
    faq: [
      { question: 'Livraison à la campagne ?', answer: 'Contactez-nous pour vérifier la faisabilité dans votre zone.' },
      { question: 'Suivi de colis ?', answer: 'Vous êtes contacté par le livreur pour la remise.' },
    ],
    relatedSlugs: ['paiement-livraison-bijoux-maroc', 'bijoux-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Boutique', path: '/bijoux' }],
    cta: { title: 'Passer commande', description: 'Livraison nationale INOXYA.', ...cta },
    publishedAt: P,
    updatedAt: U,
  },
  'paiement-livraison-bijoux-maroc': {
    slug: 'paiement-livraison-bijoux-maroc',
    cluster: 'achat',
    keyword: 'paiement à la livraison bijoux',
    title: 'Paiement à la livraison bijoux INOXYA',
    metaDescription:
      'Payer vos bijoux INOXYA à la livraison au Maroc : mode de paiement, sécurité, étapes de commande.',
    h1: 'Paiement à la livraison : comment ça marche',
    intro:
      'INOXYA propose le paiement à la livraison pour simplifier l\'achat de bijoux en ligne au Maroc. Vous réglez en espèces à la réception du colis, sans obligation de carte bancaire en ligne.',
    sections: [
      {
        h2: 'Étapes de la commande',
        paragraphs: [
          'Ajoutez vos bijoux au panier, renseignez nom, téléphone, ville et adresse, choisissez le paiement à la livraison et validez. Préparez le montant exact ou à proximité lors de la remise du colis.',
          'Vérifiez le contenu devant le livreur si possible. En cas de problème, contactez le service client INOXYA rapidement.',
        ],
      },
      {
        h2: 'Pourquoi ce mode rassure',
        paragraphs: [
          'Beaucoup d\'acheteurs marocains préfèrent voir le produit avant de payer. Le paiement à la livraison réduit la friction et renforce la confiance, surtout pour un premier achat sur une marque en ligne.',
        ],
      },
    ],
    faq: [
      { question: 'Carte bancaire en ligne ?', answer: 'Le site met en avant le paiement à la livraison pour les commandes standard.' },
      { question: 'Facture ?', answer: 'Conservez le récapitulatif de commande reçu par l\'équipe.' },
    ],
    relatedSlugs: ['livraison-bijoux-maroc', 'packs-cadeaux-bijoux-maroc'],
    collectionLinks: [{ label: 'Panier', path: '/panier' }],
    cta: { title: 'Acheter en confiance', description: 'Paiement à la livraison INOXYA.', ...cta },
    publishedAt: P,
    updatedAt: U,
  },
  'cadeau-bijoux-femme-maroc': {
    slug: 'cadeau-bijoux-femme-maroc',
    cluster: 'achat',
    keyword: 'cadeau bijoux femme Maroc',
    title: 'Cadeau bijoux femme au Maroc — idées INOXYA',
    metaDescription:
      'Idées cadeaux bijoux femme au Maroc : packs, boucles, bagues 316L INOXYA. Livraison et paiement à la livraison.',
    h1: 'Quels bijoux offrir à une femme au Maroc',
    intro:
      'Un anniversaire, une fête, un remerciement : offrir un bijou reste un geste universel. INOXYA facilite les cadeaux grâce aux packs assortis, aux boucles d\'oreilles polyvalentes et à la livraison nationale avec paiement à la livraison.',
    sections: [
      {
        h2: 'Top idées cadeaux',
        subsections: [
          {
            h3: 'Packs INOXYA',
            paragraphs: [
              'Plusieurs pièces coordonnées à prix avantageux — idéal quand on veut un effet « coffret » sans composer soi-même la sélection.',
            ],
          },
          {
            h3: 'Boucles d\'oreilles',
            paragraphs: [
              'Peu dépendantes de la taille, elles conviennent à un large public. Créoles dorées ou puces discrètes : deux valeurs sûres.',
            ],
          },
          {
            h3: 'Bagues ajustables',
            paragraphs: [
              'Si la taille de doigt est inconnue, privilégiez un modèle ajustable ou orientez-vous vers collier ou bracelet.',
            ],
          },
        ],
        image: { src: '/images/categories/packs.jpg', alt: 'Packs cadeaux bijoux INOXYA Maroc' },
      },
    ],
    faq: [
      { question: 'Sans connaître la taille ?', answer: 'Boucles, colliers ajustables ou packs.' },
      { question: 'Emballage cadeau ?', answer: 'Précisez dans les notes de commande.' },
    ],
    relatedSlugs: ['packs-cadeaux-bijoux-maroc', 'boucles-oreilles-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Packs', path: '/packs' }],
    cta: { title: 'Offrir un bijou INOXYA', description: 'Packs et pièces en 316L.', primaryPath: '/packs', primaryLabel: 'Voir les packs', secondaryPath: '/bijoux', secondaryLabel: 'Collection' },
    publishedAt: P,
    updatedAt: U,
  },
  'packs-cadeaux-bijoux-maroc': {
    slug: 'packs-cadeaux-bijoux-maroc',
    cluster: 'achat',
    keyword: 'packs cadeaux bijoux Maroc',
    title: 'Packs cadeaux bijoux INOXYA Maroc',
    metaDescription:
      'Packs bijoux INOXYA en acier 316L : ensembles cadeaux, prix avantageux, livraison Maroc, paiement à la livraison.',
    h1: 'Packs cadeaux bijoux en acier inoxydable',
    intro:
      'Les packs INOXYA regroupent plusieurs bijoux en acier 316L à tarif préférentiel. Parfaits pour offrir ou constituer une collection cohérente dès le premier achat.',
    sections: [
      {
        h2: 'Avantages d\'un pack',
        paragraphs: [
          'Harmonie visuelle entre les pièces, prix inférieur à l\'achat séparé, présentation soignée pour un cadeau réussi. Chaque pack détaille le contenu sur sa fiche produit.',
        ],
      },
      {
        h2: 'Commander un pack',
        paragraphs: [
          'Parcourez la page Packs, choisissez votre ensemble, commandez avec paiement à la livraison. Livraison gratuite dès 200 MAD.',
        ],
      },
    ],
    faq: [
      { question: 'Contenu du pack ?', answer: 'Listé sur chaque fiche pack du site.' },
      { question: 'Retour pack ?', answer: 'Retour gratuit 30 jours selon conditions site.' },
    ],
    relatedSlugs: ['cadeau-bijoux-femme-maroc', 'bijoux-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Tous les packs', path: '/packs' }],
    cta: { title: 'Découvrir les packs', description: 'Ensembles INOXYA en 316L.', primaryPath: '/packs', primaryLabel: 'Voir les packs' },
    publishedAt: P,
    updatedAt: U,
  },
  'comment-choisir-bague-acier-inoxydable': {
    slug: 'comment-choisir-bague-acier-inoxydable',
    cluster: 'achat',
    keyword: 'choisir bague acier inoxydable',
    title: 'Choisir une bague acier inoxydable — guide',
    metaDescription:
      'Taille, style, finition dorée ou argentée : guide pour choisir votre bague 316L INOXYA au Maroc.',
    h1: 'Comment choisir une bague en acier inoxydable',
    intro:
      'La bague doit être belle, confortable et durable. Ce guide INOXYA vous aide à trouver la taille, le style et la finition adaptés à votre main et à votre quotidien au Maroc.',
    sections: [
      {
        h2: 'Mesurer sa taille',
        paragraphs: [
          'Utilisez un baguier ou une bande de papier au niveau du phalange. Mesurez en fin de journée. Entre deux tailles, choisissez la plus grande.',
        ],
      },
      {
        h2: 'Style et finition',
        paragraphs: [
          'Doré : réchauffe le teint, idéal cérémonies. Argenté : minimaliste, polyvalent. Motifs marocains : caractère et originalité.',
        ],
        table: {
          headers: ['Style', 'Occasion', 'Entretien'],
          rows: [
            ['Jonc fin', 'Quotidien', 'Minimal'],
            ['Doré large', 'Fête', 'Rinçage après eau'],
            ['Ajustable', 'Cadeau', 'Standard'],
          ],
        },
      },
    ],
    faq: [
      { question: 'Bague qui tourne au doigt ?', answer: 'Taille trop grande — réduisez d\'une taille.' },
      { question: 'Doré ou argenté ?', answer: 'Question de teint et de garde-robe ; les deux sont en 316L.' },
    ],
    relatedSlugs: ['bagues-acier-inoxydable-maroc', 'bijoux-hypoallergeniques'],
    collectionLinks: [{ label: 'Bagues', path: '/bijoux/bagues' }],
    cta: { title: 'Voir les bagues INOXYA', description: '316L, livraison Maroc.', primaryPath: '/bijoux/bagues', primaryLabel: 'Collection bagues', secondaryPath: '/bijoux', secondaryLabel: 'Tout voir' },
    publishedAt: P,
    updatedAt: U,
  },
  'bijoux-style-marocain-acier': {
    slug: 'bijoux-style-marocain-acier',
    cluster: 'achat',
    keyword: 'bijoux style marocain acier',
    title: 'Bijoux style marocain en acier 316L',
    metaDescription:
      'Bijoux inspiration marocaine INOXYA en acier inoxydable 316L : élégance berbère, moderne, livraison Maroc.',
    h1: 'Bijoux d\'inspiration marocaine en acier inoxydable',
    intro:
      'INOXYA célèbre l\'élégance marocaine à travers des bijoux contemporains en 316L : motifs géométriques, finitions dorées chaudes et lignes inspirées de l\'artisanat local — sans compromis sur la durabilité moderne.',
    sections: [
      {
        h2: 'Tradition et modernité',
        paragraphs: [
          'L\'acier inoxydable permet de porter au quotidien des formes inspirées de bijoux traditionnels, avec une résistance supérieure à de nombreux métaux non précieux. INOXYA propose des pièces qui honorent l\'esthétique marocaine dans un format accessible.',
        ],
        image: {
          src: '/images/categories/colliers.jpg',
          alt: 'Bijoux style marocain acier inoxydable INOXYA',
        },
      },
      {
        h2: 'Porter ses bijoux marocains au quotidien',
        paragraphs: [
          'Associez un collier statement à une tenue sobre, ou des boucles discrètes à un caftan moderne. Le 316L supporte les journées longues et les climats variés du royaume.',
        ],
      },
    ],
    faq: [
      { question: 'Bijoux berbères en 316L ?', answer: 'Oui, inspirations marocaines sur base 316L INOXYA.' },
    ],
    relatedSlugs: ['bijoux-acier-inoxydable-maroc', 'colliers-acier-inoxydable-maroc'],
    collectionLinks: [{ label: 'Colliers', path: '/bijoux/colliers' }, { label: 'Bagues', path: '/bijoux/bagues' }],
    cta: { title: 'Collection marocaine INOXYA', description: '316L premium.', ...cta },
    publishedAt: P,
    updatedAt: U,
  },
}
