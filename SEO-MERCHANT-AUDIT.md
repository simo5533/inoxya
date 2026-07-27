# SEO Merchant Audit — INOXYA (inoxya.ma)

**Date :** 2026-07-27  
**Site :** https://inoxya.ma  
**Stack vérifiée :** Next.js App Router, next-intl (fr/ar), Postgres/Supabase/SQLite adapters, MAD

---

## Architecture (vérifiée)

| Élément | Réalité code |
|---------|----------------|
| Framework | Next.js App Router (`app/[locale]/...`) |
| Produits | `lib/database.ts` → adapters Postgres / Supabase / SQLite |
| Page produit | `app/[locale]/bijoux/[id]/page.tsx` |
| JSON-LD actif | `components/SEOJsonLd.tsx` + `lib/seo/merchant-offer.ts` |
| JSON-LD legacy (non branché) | `components/StructuredData.tsx` |
| SEO texte produit | `lib/seo/product/generator.ts` |
| Avis | `lib/reviews.ts` + `/api/reviews` |
| URL canonique | `lib/site-url.ts` → `PRODUCTION_SITE_URL = https://inoxya.ma` |
| Meta | `lib/seo/config.ts` → `seoPageMetadata` / `seoAlternates` |

---

## Problèmes détectés

### P1 — Critique Merchant / Search

| ID | Problème | Fichiers | Risque |
|----|----------|----------|--------|
| M1 | `returnFees: FreeReturn` alors que FAQ : frais de retour à charge client (sauf défaut) | `merchant-offer.ts`, `SEOJsonLd.tsx`, `messages/fr.json` a5 | Incohérence Merchant / rejet politique |
| M2 | `shippingRate.value: "0"` pour tous les prix alors que gratuité dès 200 MAD | `merchant-offer.ts` | Fausse gratuité systématique |
| M3 | Canonical toujours `/fr/...` même sur pages `/ar/...` | `seoAlternates()` | Hreflang / canonical AR incorrects |
| M4 | FAQ body `ssr: false` → HTML initial = « Chargement… » | `FAQWrapper.tsx` | Contenu FAQ non indexable |
| M5 | Descriptions SEO générées avec pluriel catégorie → « Ce montres », « montress » | `generator.ts` | Qualité SEO / UX |
| M6 | Mapping DB Montres↔Colliers (corrigé partiellement) | `generator.ts` + `category-mapping.ts` | Descriptions croisées |

### P2 — Important

| ID | Problème | Fichiers | Risque |
|----|----------|----------|--------|
| M7 | Pas de `@id` Product/Offer stables | `SEOJsonLd.tsx` | Liaison d’entités faible |
| M8 | SKU/MPN = `product.id` (OK comme ID interne, pas de faux GTIN) | `SEOJsonLd.tsx` | Acceptable ; documenter |
| M9 | Pas de GTIN en base | validations / adapters | Ne pas inventer |
| M10 | AggregateRating seulement si avis > 0 (OK) ; défaut SQLite `rating: 4.5` latent | `sqlite.ts`, ProductJsonLd | Surveiller |
| M11 | `inoxya-bijoux.vercel.app` dans contenus SEO | `geo-qa.ts`, `pillar.ts` | Signal domaine obsolète |
| M12 | Pas de FAQPage JSON-LD sur `/faq` | `faq/page.tsx` | Opportunité rich result |
| M13 | OnlineStore absent (Organization/JewelryStore présent) | `SEOJsonLd.tsx` | Enrichissement |
| M14 | SEO produit FR même sur `/ar` (`name_ar` non utilisé dans buildProductSeo) | `generator.ts` | Multilingue incomplet |

### P3 — Mineur / dette

| ID | Problème | Fichiers |
|----|----------|----------|
| M15 | `StructuredData.tsx` legacy non importé | à ne pas réactiver tel quel |
| M16 | CollectionPage force `inStock: true` | `SEOJsonLd.tsx` |
| M17 | Packs `inStock: true` hardcodé | `packs/[id]/page.tsx` |

---

## Champs JSON-LD Product — état actuel

| Champ | Présent | Source | Notes |
|-------|---------|--------|-------|
| name | Oui | produit | |
| description | Oui | SEO généré ou fallback générique | Doit préférer description réelle produit |
| image | Oui | absolues | |
| sku | Oui | `product.id` | Stable |
| mpn | Oui | `product.id` | Même valeur — pas de faux GTIN |
| gtin* | Non | — | **Ne pas inventer** |
| brand | Oui | INOXYA BIJOUX | |
| offers.price | Oui | réel | |
| offers.priceCurrency | Oui | MAD | |
| offers.availability | Oui | `is_available` | À lier aussi au stock numérique |
| offers.hasMerchantReturnPolicy | Oui | inline | À aligner FAQ + @id |
| offers.shippingDetails | Oui | inline | À aligner seuil 200 MAD + @id |
| aggregateRating | Conditionnel | avis réels | OK si count > 0 |
| Review[] | Non | — | Optionnel si avis listés |

---

## Incohérences UI ↔ JSON-LD

| UI / FAQ | JSON-LD | Action |
|----------|---------|--------|
| Retour : frais client sauf défaut | FreeReturn | → `ReturnShippingFees` |
| Livraison gratuite dès 200 MAD | rate toujours 0 | → rate 0 si prix ≥ 200 ; sinon détail honnête |
| Stock affiché via `is_available` | idem | → `getSchemaAvailability` (stock + flag) |
| Avis réels (étoiles) | AggregateRating si count > 0 | Conserver |
| Banner « Retour gratuit 30 j » | FreeReturn | Alignement marketing vs FAQ documenté |

---

## Décision identifiants (Phase 4)

- **GTIN :** absent en DB → ne jamais générer.
- **SKU / MPN :** `String(product.id)` unique et stable → conservé.
- **Brand :** `INOXYA BIJOUX` / short `INOXYA`.
- Pas de migration DB pour cette itération (contrainte : ne pas modifier la DB).

---

## Politique retour (vérifiée)

- Fenêtre : **30 jours** (`SEO_RETURN_DAYS`)
- Pays : **MA**
- Méthode : retour par courrier / à charge client sauf défaut (FAQ `a5`)
- Schema : `MerchantReturnFiniteReturnWindow` + `ReturnShippingFees`

## Livraison (vérifiée)

- Destination : **MA**
- Gratuite dès **200 MAD**
- Délai FAQ : **2–5 jours** ouvrés ; handling 0–1 j, transit 1–5 j (déjà en schema)
- Frais sous 200 MAD : **non chiffrés** dans le code → ne pas inventer un montant

---

## Corrections prévues (implémentation)

1. `buildProductStructuredData` + `getSchemaAvailability` + JSON-LD safe
2. Offers avec `@id` return/shipping policies ; returnFees corrigé ; shipping conditionnel
3. Canonical locale-aware + `fr-MA` / `ar-MA` / `x-default`
4. FAQ SSR + FAQPage JSON-LD
5. Grammaire produit (singulier / genre)
6. Remplacer vercel.app dans contenus SEO prod
7. Tests Vitest + rapports `SEO-URL-MIGRATION.md` / `SEO-FIX-REPORT.md`

---

## Non-objectifs (contraintes utilisateur)

Ne pas modifier : design, images, prix, stocks DB, noms produits, panier, paiement, auth, routing métier, animations, responsivité.
