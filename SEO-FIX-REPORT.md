# SEO Fix Report — INOXYA

**Date :** 2026-07-27  
**Domaine :** https://inoxya.ma

---

## Résumé exécutif

Audit et correctifs Merchant / Search appliqués sans toucher au design, panier, paiement, stocks DB, ni routing métier.  
Les fiches produit exposent désormais un JSON-LD Product/Offer cohérent (disponibilité, marque, SKU, retours, livraison, avis authentiques uniquement), des canonicals par langue, une FAQ indexable, et une grammaire SEO corrigée (plus de « Ce montres »).

---

## Problèmes corrigés

| ID | Correction |
|----|------------|
| M1 | `returnFees` → `ReturnShippingFees` (aligné FAQ) |
| M2 | Shipping nommé avec seuil 200 MAD ; rate 0 contextualisé |
| M3 | Canonical auto-référent FR/AR + `fr-MA` / `ar-MA` / `x-default` |
| M4 | FAQ : SSR activé + contenu SEO + FAQPage JSON-LD |
| M5 | Grammaire singulier/genre via `product-grammar.ts` |
| M7 | `@id` Product `#product` et Offer `#offer` |
| M8/M9 | SKU = id produit ; **aucun faux GTIN** |
| M10 | AggregateRating seulement si avis réels 1–5 |
| M11 | Remplacement `vercel.app` → `inoxya.ma` dans contenus SEO |
| M12 | FAQPage JSON-LD sur `/faq` |
| M13 | `OnlineStore` JSON-LD global |
| — | `buildProductStructuredData` + `getSchemaAvailability` + JSON-LD safe |

---

## Fichiers modifiés / créés

### Créés
- `SEO-MERCHANT-AUDIT.md`
- `SEO-URL-MIGRATION.md`
- `SEO-FIX-REPORT.md`
- `lib/seo/availability.ts`
- `lib/seo/product-grammar.ts`
- `lib/seo/product-structured-data.ts`
- `app/[locale]/faq/FaqSeoContent.tsx`
- `tests/lib/seo-merchant.test.ts`

### Modifiés
- `lib/seo/merchant-offer.ts`
- `lib/seo/config.ts`
- `lib/seo/product/generator.ts`
- `lib/seo/geo-qa.ts`
- `lib/seo/content/pages/pillar.ts`
- `components/SEOJsonLd.tsx`
- `app/[locale]/bijoux/[id]/page.tsx`
- `app/[locale]/faq/page.tsx`
- `app/[locale]/faq/FAQWrapper.tsx`

---

## Données structurées ajoutées / améliorées

- Product `@id`, description réelle prioritaire, sku, brand, offers
- Offer : availability dynamique, hasMerchantReturnPolicy, shippingDetails
- OnlineStore `#store`
- FAQPage sur la page FAQ
- JSON-LD échappé (`\u003c`)

### Exemple JSON-LD produit (structure)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://inoxya.ma/fr/bijoux/42#product",
  "name": "Porte Al-Medina",
  "description": "Collier élégant en acier 316L.",
  "image": ["https://inoxya.ma/images/..."],
  "url": "https://inoxya.ma/fr/bijoux/42",
  "sku": "42",
  "mpn": "42",
  "brand": { "@type": "Brand", "name": "INOXYA BIJOUX" },
  "offers": {
    "@type": "Offer",
    "@id": "https://inoxya.ma/fr/bijoux/42#offer",
    "price": "89.00",
    "priceCurrency": "MAD",
    "availability": "https://schema.org/InStock",
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnFees": "https://schema.org/ReturnShippingFees",
      "merchantReturnDays": 30,
      "applicableCountry": "MA"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": { "addressCountry": "MA" }
    }
  }
}
```

---

## Canonicals et redirections

- Canonical = URL de la locale courante
- Alternates `fr-MA`, `ar-MA`, `x-default` → FR
- Redirects existants `/bijoux` → `/fr/bijoux`, `/faq` → `/fr/faq`, packs, etc. conservés
- Voir `SEO-URL-MIGRATION.md`

---

## Multilingue

- Canonical AR corrigé (plus forcé vers FR)
- SEO copy produit encore majoritairement FR (name_ar non utilisé dans le générateur long) — **risque restant** documenté
- FAQ métadonnées via `next-intl`

---

## FAQ

- Suppression de `dynamic(..., { ssr: false })`
- `FaqSeoContent` : Q/R dans le HTML + FAQPage JSON-LD
- Accordion client conservé pour l’UX

---

## Avis

- Pas d’AggregateRating si 0 avis
- Rating hors 1–5 ignoré
- Aligné avec `lib/reviews.ts` / UI

---

## Tests exécutés

| Commande | Résultat |
|----------|----------|
| `npx vitest run tests/lib/seo-merchant.test.ts` | **17 passed** |
| `npm run type-check` | **OK** |
| `npm run build` | (voir sortie CI / locale) |

---

## Risques restants

1. Frais de livraison **sous 200 MAD** non chiffrés dans le code → rate 0 + libellé seuil (à préciser en Merchant Center si besoin).
2. Contenu SEO long des fiches produit encore en FR sur `/ar`.
3. Banner marketing « Retour gratuit » vs FAQ « frais à charge » — schema suit la FAQ.
4. `StructuredData.tsx` legacy non utilisé (ne pas réactiver).
5. CollectionPage force encore souvent `inStock: true`.

---

## Actions Search Console (manuel)

1. Propriété `https://inoxya.ma` (domaine ou préfixe URL).
2. Soumettre `https://inoxya.ma/sitemap.xml`.
3. Inspection d’URL : une fiche produit FR + une AR + `/fr/faq`.
4. Rapport Merchant / rich results : vérifier Product, shipping, returns.
5. Supprimer / désavouer d’anciennes URLs `*.vercel.app` si encore dans Coverage.
6. Surveiller « Identifiant produit global manquant » : normal sans GTIN ; brand+sku présents.
7. Demander une réindexation après déploiement Vercel de ce commit.
