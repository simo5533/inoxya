import { NextResponse } from 'next/server'
import { seoSiteUrl, SEO_BRAND, SEO_EMAIL, SEO_MATERIAL, SEO_PHONE } from '@/lib/seo/config'

export function GET() {
  const site = seoSiteUrl()
  const body = `# ${SEO_BRAND}

> Embellie ton âme — bijoux en acier inoxydable 316L au Maroc.

## À propos
${SEO_BRAND} est une boutique e-commerce marocaine de bijoux premium en ${SEO_MATERIAL} : bagues, colliers, bracelets, boucles d'oreilles, montres et packs cadeaux. Hypoallergéniques, résistants à l'eau, inspirés de l'élégance marocaine.

## Pages importantes
- Accueil : ${site}/fr
- Collection bijoux : ${site}/fr/bijoux
- Catégories : ${site}/fr/bijoux/bagues | ${site}/fr/bijoux/colliers | ${site}/fr/bijoux/bracelets | ${site}/fr/bijoux/boucles-oreilles | ${site}/fr/bijoux/montres
- Packs : ${site}/fr/packs
- FAQ : ${site}/fr/faq
- Guides SEO : ${site}/fr/guide
- Exemples guides : ${site}/fr/guide/bijoux-acier-inoxydable-maroc | ${site}/fr/guide/entretien-bijoux-acier-inoxydable
- À propos : ${site}/fr/a-propos

## Livraison
Livraison partout au Maroc. Gratuite dès 200 MAD.

## Paiement
Paiement à la livraison uniquement.

## Retours
Retour gratuit sous 30 jours (conditions sur le site).

## Matière
${SEO_MATERIAL} — durable, résistant à l'oxydation et à l'eau.

## Contact
Téléphone : ${SEO_PHONE}
Email : ${SEO_EMAIL}
Adresse : Avenue, Rue Ziri Ibn Aatia, Rabat 10020, Maroc

## Sitemap
${site}/sitemap.xml
`

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
