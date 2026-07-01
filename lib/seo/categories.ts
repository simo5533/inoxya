/**
 * Contenu SEO par catégorie (FR) — pages /fr/bijoux/{slug}
 */
export type CategorySeoEntry = {
  slug: string
  dbSlug: string
  h1: string
  title: string
  description: string
  intro: string
  body: string
}

export const CATEGORY_SEO_PAGES: Record<string, CategorySeoEntry> = {
  bagues: {
    slug: 'bagues',
    dbSlug: 'bagues',
    h1: 'Bagues en acier inoxydable au Maroc',
    title: 'Bagues acier inoxydable 316L au Maroc',
    description:
      'Bagues en acier inoxydable 316L INOXYA : dorées, argentées, berbères et modernes. Hypoallergéniques, résistantes à l’eau. Livraison partout au Maroc.',
    intro:
      'Découvrez nos bagues en acier inoxydable 316L, conçues pour un port quotidien au Maroc : élégantes, durables et confortables.',
    body: `Les bagues INOXYA sont fabriquées en acier inoxydable 316L, une matière reconnue pour sa résistance à l’oxydation, à l’humidité et au contact avec la peau. Que vous cherchiez une bague discrète pour le quotidien, un modèle doré pour une occasion spéciale ou une pièce inspirée de l’artisanat marocain, notre collection répond aux attentes des femmes exigeantes.

Chaque bague est sélectionnée pour son fini premium, sa tenue dans le temps et son confort. L’acier 316L est hypoallergénique pour la majorité des peaux sensibles. Vous pouvez porter vos bijoux sous la douche, à la plage ou au bureau sans craindre qu’ils perdent leur éclat.

INOXYA livre partout au Maroc avec paiement à la livraison. Profitez de la livraison gratuite dès 200 MAD et du retour gratuit sous 30 jours. Parcourez nos modèles ci-dessous et trouvez la bague qui complétera votre style.`,
  },
  'boucles-oreilles': {
    slug: 'boucles-oreilles',
    dbSlug: 'boucles-oreilles',
    h1: "Boucles d'oreilles en acier inoxydable au Maroc",
    title: "Boucles d'oreilles acier inoxydable Maroc",
    description:
      "Boucles d'oreilles en acier inoxydable 316L : créoles, puces et modèles dorés INOXYA. Hypoallergéniques, résistantes à l'eau. Livraison Maroc.",
    intro:
      "Des boucles d'oreilles élégantes en acier inoxydable 316L, légères et confortables pour un port prolongé.",
    body: `Nos boucles d'oreilles en acier inoxydable 316L allient style marocain et finitions soignées. Créoles, puces, pendantes ou dorées : chaque modèle est pensé pour sublimer le visage sans irriter les oreilles sensibles.

L’acier 316L résiste à l’eau, à la transpiration et au quotidien actif. C’est le choix idéal si vous recherchez des bijoux hypoallergéniques, faciles à entretenir et toujours brillants. INOXYA propose une sélection variée pour le travail, les sorties ou les cadeaux.

Commandez en ligne avec paiement à la livraison sur tout le territoire marocain. Livraison gratuite dès 200 MAD et retour gratuit sous 30 jours.`,
  },
  bracelets: {
    slug: 'bracelets',
    dbSlug: 'bracelets',
    h1: 'Bracelets en acier inoxydable au Maroc',
    title: 'Bracelets acier inoxydable 316L Maroc',
    description:
      'Bracelets en acier inoxydable 316L INOXYA : joncs, chaînes et modèles berbères. Résistants à l’eau, hypoallergéniques. Livraison au Maroc.',
    intro:
      'Bracelets premium en acier inoxydable 316L : robustes, élégants et adaptés au climat marocain.',
    body: `Les bracelets INOXYA en acier inoxydable 316L offrent un excellent rapport entre élégance et durabilité. Joncs rigides, bracelets chaîne ou pièces inspirées de motifs marocains : notre gamme convient aux femmes qui veulent un bijou visible, résistant et facile à assortir.

L’acier inoxydable ne rouille pas et conserve son éclat même en cas d’exposition à l’eau ou à la chaleur. Nos bracelets sont confortables au poignet et adaptés à un port quotidien. Matière hypoallergénique pour limiter les réactions cutanées.

Découvrez les modèles disponibles ci-dessous. Paiement à la livraison, livraison gratuite dès 200 MAD, retour gratuit sous 30 jours partout au Maroc.`,
  },
  colliers: {
    slug: 'colliers',
    dbSlug: 'colliers',
    h1: 'Ensemble bijoux en acier inoxydable au Maroc',
    title: 'Ensemble acier inoxydable 316L INOXYA Maroc',
    description:
      'Ensembles de bijoux en acier inoxydable 316L INOXYA. Style marocain, hypoallergéniques, livraison Maroc, paiement à la livraison.',
    intro:
      'Ensembles assortis en acier inoxydable 316L pour un look harmonieux et durable.',
    body: `Nos ensembles INOXYA en acier inoxydable 316L associent plusieurs pièces coordonnées pour un style marocain raffiné. Idéal pour offrir ou pour compléter votre collection sans chercher chaque bijou séparément.

L’acier 316L résiste à l’eau et convient aux peaux sensibles. Livraison partout au Maroc, paiement à la livraison, livraison gratuite dès 200 MAD et retour sous 30 jours.`,
  },
  montres: {
    slug: 'montres',
    dbSlug: 'montres',
    h1: 'Colliers en acier inoxydable au Maroc',
    title: 'Colliers acier inoxydable 316L au Maroc',
    description:
      'Colliers en acier inoxydable 316L INOXYA. Style berbère et contemporain. Hypoallergéniques, livraison Maroc, paiement à la livraison.',
    intro:
      'Colliers élégants en acier inoxydable 316L pour sublimer votre cou au quotidien.',
    body: `Nos colliers en acier inoxydable 316L mettent en valeur le cou avec des finitions premium inspirées de l’élégance marocaine. Pendentifs discrets, chaînes dorées ou pièces contemporaines : chaque modèle est conçu pour durer.

L’acier 316L est résistant à l’eau et adapté aux peaux sensibles. Livraison partout au Maroc, paiement à la livraison, livraison gratuite dès 200 MAD.`,
  },
  parures: {
    slug: 'parures',
    dbSlug: 'parures',
    h1: 'Montres en acier inoxydable au Maroc',
    title: 'Montres acier inoxydable INOXYA Maroc',
    description:
      'Montres en acier inoxydable 316L INOXYA. Style premium, résistance à l’eau. Livraison au Maroc, paiement à la livraison.',
    intro:
      'Montres élégantes en acier inoxydable 316L pour un style précis et durable.',
    body: `La sélection montres INOXYA propose des pièces en acier inoxydable 316L au design soigné. Élégance discrète, finitions durables et confort au poignet.

Comme l’ensemble de la collection INOXYA, ces pièces résistent à l’eau et conviennent à un usage quotidien au Maroc. Livraison nationale avec paiement à la livraison.`,
  },
}

export const CATEGORY_SEO_SLUGS = Object.keys(CATEGORY_SEO_PAGES)

export function getCategorySeo(slug: string): CategorySeoEntry | null {
  return CATEGORY_SEO_PAGES[slug] ?? null
}
