import { categoryDbValueToDisplayName } from '@/lib/category-mapping'
import {
  SEO_BRAND,
  SEO_FREE_SHIPPING_THRESHOLD,
  SEO_MATERIAL,
  SEO_RETURN_DAYS,
} from '@/lib/seo/config'
import type { ProductSeoInput, ProductSeoPackage } from './types'

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length]
}

function trimMeta(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

function countWords(text: string): number {
  return text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
}

type CategoryKey = 'bagues' | 'colliers' | 'bracelets' | 'boucles' | 'montres' | 'ensemble' | 'default'

function resolveCategoryKey(raw?: string): CategoryKey {
  const c = (raw || '').toLowerCase()
  if (c.includes('bague')) return 'bagues'
  if (c.includes('boucle') || c.includes('oreille')) return 'boucles'
  if (c.includes('bracelet')) return 'bracelets'
  if (c.includes('montre') || c.includes('parure')) return 'montres'
  if (c.includes('collier') || c.includes('ensemble')) return c.includes('ensemble') ? 'ensemble' : 'colliers'
  return 'default'
}

const INTRO_POOL: Record<CategoryKey, string[]> = {
  bagues: [
    'Cette bague INOXYA en acier inoxydable 316L allie présence et confort pour un port quotidien au Maroc.',
    'Pensée pour sublimer la main sans compromis sur la durabilité, cette pièce incarne l\'élégance accessible INOXYA.',
  ],
  colliers: [
    'Ce collier INOXYA structure votre silhouette avec une finition soignée en acier 316L.',
    'Un collier pensé pour accompagner vos tenues du matin au soir, avec l\'éclat durable de l\'acier inoxydable.',
  ],
  ensemble: [
    'Cet ensemble INOXYA coordonne plusieurs bijoux en acier 316L pour un look harmonieux immédiat.',
    'Offrez-vous ou offrez un ensemble pensé pour matcher sans effort : qualité INOXYA, style marocain contemporain.',
  ],
  bracelets: [
    'Ce bracelet INOXYA accompagne chaque geste avec légèreté et résistance — acier 316L premium.',
    'Au poignet, ce bijou affirme votre style tout en résistant à l\'humidité et au quotidien actif.',
  ],
  boucles: [
    'Ces boucles d\'oreilles INOXYA illuminent le visage avec une finition précise en acier hypoallergénique.',
    'Légères et confortables, elles conviennent aux peaux sensibles et aux longues journées.',
  ],
  montres: [
    'Cette montre INOXYA associe design épuré et acier 316L pour un accessoire fiable au quotidien.',
    'Un modèle qui complète votre garde-robe bijoux avec précision et élégance discrète.',
  ],
  default: [
    'Ce bijou INOXYA en acier inoxydable 316L reflète notre exigence qualité : durable, élégant, pensé pour le Maroc.',
  ],
}

function buildLongParagraphs(
  name: string,
  categoryLabel: string,
  price: number,
  seed: number
): string[] {
  const finish = pick(['dorée chaleureuse', 'argentée lumineuse', 'polie miroir', 'brossée moderne'], seed, 1)
  return [
    `${name} est fabriqué en ${SEO_MATERIAL}, matière reconnue pour sa résistance à l'oxydation et son confort sur la peau. Chez ${SEO_BRAND}, chaque pièce est sélectionnée pour sa tenue dans le temps : vous profitez d'un bijou premium sans l'entretien exigeant de l'argent non rhodié ou des alliages bon marché.`,
    `La finition ${finish} de ce ${categoryLabel.toLowerCase()} met en valeur les détails sans ostentation. Que vous soyez à Casablanca, Rabat, Marrakech ou en voyage côtier, l'acier 316L supporte humidité, chaleur et port répété — à condition d'un rinçage à l'eau claire après contact prolongé avec l'eau salée.`,
    `Au prix de ${Math.round(price)} MAD, ${name} propose un excellent rapport qualité-élégance. Livraison partout au Maroc, paiement à la livraison et livraison gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD. Retour gratuit sous ${SEO_RETURN_DAYS} jours selon les conditions affichées sur le site : vous commandez en confiance.`,
    `Les clientes INOXYA apprécient la cohérence entre photos, description et produit reçu. Ce ${categoryLabel.toLowerCase()} s'accorde avec d'autres pièces de la collection — bagues, bracelets ou colliers — pour composer un ensemble personnel. Consultez nos packs si vous souhaitez offrir plusieurs bijoux assortis à prix avantageux.`,
    `Pour les peaux sensibles, le 316L limite les risques d'irritation par rapport aux bijoux fantaisie. Si vous débutez avec l'acier inoxydable, ${name} est une entrée idéale dans l'univers INOXYA : qualité visible, confort au quotidien, style inspiré de l'élégance marocaine.`,
    `Entretien simple : eau tiède, savon doux, chiffon microfibre. Évitez parfums et produits abrasifs sur les zones dorées. Rangez séparément des autres bijoux pour préserver le brillant. Avec ces gestes, ${name} reste un compagnon durable de vos sorties, cérémonies et moments du quotidien.`,
    `${SEO_BRAND} s'engage sur la transparence : le prix affiché de ${Math.round(price)} MAD correspond au produit décrit, sans frais cachés au checkout. Le paiement à la livraison vous permet de commander sereinement, y compris si vous découvrez la marque via Instagram, TikTok ou la recommandation d'une amie.`,
    `Vous hésitez entre plusieurs modèles ? Comparez les finitions sur la boutique : doré pour réchauffer le teint, argenté pour un look minimaliste. ${name} s'intègre aussi bien à une tenue traditionnelle qu'à un style urbain contemporain — c'est l'une des forces de l'acier 316L chez INOXYA.`,
    `Chaque ${categoryLabel.toLowerCase()} est contrôlé avant expédition. Notre équipe reste joignable par téléphone ou WhatsApp pour toute question sur la taille, la disponibilité ou la livraison dans votre ville. Commander ${name}, c'est rejoindre une communauté de clientes marocaines qui privilégient bijoux durables et élégance accessible.`,
    `L'acier inoxydable 316L utilisé pour ${name} répond aux attentes des clientes exigeantes : tenue de la couleur, absence de ternissement rapide et confort au contact de la peau. Contrairement aux bijoux fantaisie en laiton ou en alliage nickelé, cette matière conserve son aspect premium après des mois de port régulier, y compris dans un climat marocain où chaleur et humidité mettent les accessoires à l'épreuve.`,
    `Vous cherchez un cadeau qui fait plaisir sans compromettre la qualité ? ${name} arrive dans un emballage soigné INOXYA, prêt à offrir pour un anniversaire, une fête religieuse ou simplement pour dire merci. Le paiement à la livraison rassure celles qui commandent en ligne pour la première fois : vous vérifiez le bijou avant de régler le livreur.`,
    `Pour composer un look coordonné, associez ${name} à d'autres pièces de la même finition — dorée ou argentée — disponibles dans notre catalogue ${categoryLabel.toLowerCase()}s et parures. Les influenceuses et clientes fidèles INOXYA partagent régulièrement leurs combinaisons sur les réseaux sociaux : une source d'inspiration pour porter ce bijou avec caftan, robe de soirée ou tenue casual chic.`,
  ]
}

function buildFaq(
  name: string,
  categoryLabel: string,
  _price: number
): ProductSeoPackage['faq'] {
  return [
    {
      question: `${name} est-il en acier inoxydable 316L ?`,
      answer: `Oui. ${SEO_BRAND} utilise l'acier inoxydable 316L pour sa durabilité, sa résistance à l'eau et son confort.`,
    },
    {
      question: 'Puis-je payer à la livraison au Maroc ?',
      answer: 'Oui, le paiement à la livraison est disponible pour votre commande INOXYA.',
    },
    {
      question: `Ce ${categoryLabel.toLowerCase()} convient-il aux peaux sensibles ?`,
      answer: 'Le 316L est généralement bien toléré. En cas de réaction, retirez le bijou et consultez un professionnel.',
    },
    {
      question: 'Quel est le délai de livraison ?',
      answer: 'INOXYA livre dans les principales villes du Maroc. Vous serez contacté pour la remise du colis.',
    },
    {
      question: `Puis-je porter ${name} à la plage ?`,
      answer: 'Oui, rincez à l\'eau douce après la mer pour préserver l\'éclat des finitions.',
    },
    {
      question: 'Y a-t-il une garantie ou un retour ?',
      answer: `Retour gratuit sous ${SEO_RETURN_DAYS} jours selon les conditions du site. Livraison gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD.`,
    },
    {
      question: `Comment entretenir ${name} au quotidien ?`,
      answer: `Rincez à l'eau tiède après la mer ou la piscine, séchez avec un chiffon doux et rangez ${name} à l'abri des parfums concentrés. Un entretien simple suffit pour garder l'éclat du 316L.`,
    },
    {
      question: `${name} est-il adapté comme cadeau ?`,
      answer: `Oui. ${name} est un ${categoryLabel.toLowerCase()} premium INOXYA, livré au Maroc avec paiement à la livraison — idéal pour offrir en toute confiance.`,
    },
  ]
}

export function buildProductSeo(product: ProductSeoInput): ProductSeoPackage {
  const seed = hashSeed(product.id + product.name)
  const categoryRaw = product.category_id || product.category || ''
  const categoryLabel = categoryDbValueToDisplayName(String(categoryRaw)) || 'Bijou'
  const catKey = resolveCategoryKey(String(categoryRaw))
  const price = Number(product.price) || 0

  const seoTitle = trimMeta(
    `${product.name} — ${categoryLabel} acier 316L | ${SEO_BRAND}`,
    68
  )

  const metaDescription = trimMeta(
    `${product.name} en ${SEO_MATERIAL} : ${categoryLabel} hypoallergénique INOXYA. Livraison Maroc, paiement à la livraison, retour ${SEO_RETURN_DAYS} jours. Dès ${Math.round(price)} MAD.`,
    160
  )

  const h1 =
    categoryLabel && categoryLabel !== 'Bijou'
      ? `${product.name} — ${categoryLabel}`
      : product.name

  const shortDescription = trimMeta(
    pick(INTRO_POOL[catKey], seed) +
      ` ${SEO_MATERIAL}, livraison Maroc, paiement à la livraison.`,
    220
  )

  const intro = pick(INTRO_POOL[catKey], seed)
  const paragraphs = buildLongParagraphs(product.name, categoryLabel, price, seed)
  const whyChoose = paragraphs[0]
  const conclusion = paragraphs[paragraphs.length - 1]

  const characteristics = [
    `Matière : ${SEO_MATERIAL}`,
    `Catégorie : ${categoryLabel}`,
    `Marque : ${SEO_BRAND}`,
    'Finition : premium dorée ou argentée selon modèle',
    'Hypoallergénique : acier 316L adapté aux peaux sensibles',
    'Résistance à l\'eau : port quotidien, rinçage conseillé après mer',
    product.is_available !== false ? 'Disponibilité : en stock' : 'Disponibilité : sur commande',
    `Prix : ${Math.round(price)} MAD`,
  ]

  const advantages = [
    'Ne rouille pas comme les alliages bon marché',
    'Confortable pour un port prolongé',
    'Rapport qualité-prix premium accessible',
    `Livraison gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD`,
    'Paiement à la livraison partout au Maroc',
    `Retour gratuit sous ${SEO_RETURN_DAYS} jours`,
  ]

  const usageTips = [
    'Portez seul pour un look minimaliste ou associez à d\'autres pièces INOXYA',
    'Appliquez parfum et crème avant de mettre le bijou',
    'Retirez avant sport intense ou travaux manuels',
  ]

  const careTips = [
    'Nettoyage à l\'eau tiède et savon doux',
    'Séchage immédiat avec chiffon microfibre',
    'Rangement dans pochette individuelle',
    'Éviter chlore prolongé et produits abrasifs',
  ]

  const occasions = pick(
    [
      ['Quotidien bureau', 'Sorties entre amis', 'Cadeau anniversaire', 'Fêtes familiales'],
      ['Mariage invité', 'Aid et célébrations', 'Saint-Valentin', 'Remise de diplôme'],
      ['Week-end plage', 'Dîner élégant', 'Cadeau maman', 'Auto-cadeau'],
    ],
    seed,
    2
  ) as string[]

  const faq = buildFaq(product.name, categoryLabel, price)

  const primary = [
    `${categoryLabel.toLowerCase()} acier inoxydable Maroc`,
    product.name,
    `${SEO_BRAND} ${categoryLabel.toLowerCase()}`,
  ]
  const secondary = [
    'bijou hypoallergénique 316L',
    'paiement à la livraison bijoux',
    'livraison bijoux Maroc',
    `${categoryLabel.toLowerCase()} femme`,
  ]
  const searchVariants = [
    `acheter ${product.name} Maroc`,
    `${categoryLabel.toLowerCase()} inoxydable pas cher`,
    `bijou ${SEO_BRAND} ${Math.round(price)} MAD`,
    `${categoryLabel.toLowerCase()} cadeau femme Maroc`,
  ]
  const synonyms = [
    'acier inox',
    'stainless steel 316L',
    'bijou durable',
    'bijou résistant eau',
  ]

  const longBody = [
    intro,
    ...paragraphs.slice(1, -1),
    conclusion,
  ].join('\n\n')

  const longDescriptionHtml = `
<p>${intro}</p>
<h2>Pourquoi choisir ${product.name}</h2>
<p>${whyChoose}</p>
${paragraphs.slice(1, 4).map((p) => `<p>${p}</p>`).join('\n')}
<h2>Caractéristiques et avantages</h2>
<p>${paragraphs[4]}</p>
<h2>Conseils d'utilisation et d'entretien</h2>
<p>${paragraphs[5]}</p>
<p>${conclusion}</p>
`.trim()

  const imageAlts = [
    `${product.name} — ${categoryLabel} ${SEO_MATERIAL} INOXYA Maroc`,
    `${product.name} — vue détail bijou acier inoxydable ${SEO_BRAND}`,
    `${categoryLabel} ${product.name} — bijou premium hypoallergénique`,
  ]

  const allText = [shortDescription, longBody, faq.map((f) => f.answer).join(' ')].join(' ')
  const wordCount = countWords(allText)

  const missingFields: string[] = []
  if (!product.main_image && !product.images?.length) missingFields.push('image')
  if (!product.name?.trim()) missingFields.push('name')
  if (price <= 0) missingFields.push('price')
  if (wordCount < 600) missingFields.push('word_count_below_600')

  return {
    seoTitle,
    metaDescription,
    h1,
    shortDescription,
    longDescriptionHtml,
    sections: {
      introduction: intro,
      whyChoose,
      characteristics,
      advantages,
      usageTips,
      careTips,
      occasions,
      conclusion,
    },
    faq,
    keywords: { primary, secondary, searchVariants, synonyms },
    imageAlts,
    wordCount,
    isComplete: missingFields.length === 0 && wordCount >= 600,
    missingFields,
  }
}
