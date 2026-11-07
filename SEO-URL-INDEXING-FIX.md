# Correction URL produits & indexation SEO — INOXYA (2026-11-07)

## Produits GSC (exemples / export local)

| Ancienne URL | Nouvelle URL (slug) | Produit (export `produits-reels`) |
|--------------|---------------------|-----------------------------------|
| `/fr/bijoux/18` | `/fr/bijoux/fleur-de-grace` | Fleur de Grâce |
| `/fr/bijoux/40` | `/fr/bijoux/bague-glamour` | Bague Glamour |
| `/fr/bijoux/15` | `/fr/bijoux/royal-touch` | Royal Touch |
| `/fr/bijoux/16` | `/fr/bijoux/porte-al-mansour` | Porte Al-Mansour |
| `/fr/bijoux/prod-1782845038534-rn3ou6d` | `/fr/bijoux/{slug-nom}` (ex. `aurea-luxe` si nom Auréa Luxe) | Prod DB (souvent Neon) |
| `/fr/bijoux/20` | `/fr/bijoux/porte-al-medina` | Porte Al-Medina |
| `/fr/bijoux/7` | `/fr/bijoux/luna-chic` | Luna Chic |
| `/ar/bijoux/13` | `/ar/bijoux/radko-traditionnel` | Radko Traditionnel |
| `/ar/bijoux/16` | `/ar/bijoux/porte-al-mansour` | Porte Al-Mansour |

Tous les produits actifs suivent `/fr|ar/bijoux/{slug}` (pas seulement ces IDs).

## Correctifs

1. **Slugs persistants** (`lib/product-slug.ts`, colonne `products.slug`, migration `scripts/migrations/002_add_product_slug.sql`)
2. **Redirect 308** id / `prod-*` → slug si le produit existe ; **404/noindex** si absent
3. **Liens** ProductCard, BijouCard, favoris, similaires, catégories, sitemap, JSON-LD, canonical/OG
4. **Doublons catégories / guides / home** : canonicals auto-référents FR/AR ; redirects guide + `/bijoux` + `/faq` conservés
5. **Junk** `/&`, `/%26` : 410 + robots disallow
6. **robots.txt** : `Allow: /api/shop-blob` (images) tout en gardant `Disallow: /api/`
7. **SearchAction** retiré (évite `/fr/bijoux?search={search_term_string}`) ; pages `?search=` en **noindex**

## Fichiers principaux

- `lib/product-slug.ts`, `lib/database.ts`, `lib/db/*`
- `app/[locale]/bijoux/[id]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`
- `components/ProductCard.tsx`, `BijouCard.tsx`, `SEOJsonLd.tsx`, `seo/CategorySeoPage.tsx`
- `tests/lib/product-slug.test.ts`, `tests/lib/seo-merchant.test.ts`

## Action manuelle production

1. Exécuter `scripts/migrations/002_add_product_slug.sql` sur Neon/Supabase.
2. Déployer, puis dans GSC : Valider correction + demander indexation des nouvelles URLs.
3. Inspecter manuellement : `/fr`, `/ar/bijoux/bagues`, `/ar/bijoux/boucles-oreilles`, `/fr/guide/entretien-bijoux-acier-inoxydable`, une fiche slug FR + AR.
