# SEO URL Migration — INOXYA

**Domaine canonique production :** `https://inoxya.ma`

## Formats d’URL produit (2026-11)

| Type | Pattern | Canonical |
|------|---------|-----------|
| FR | `/fr/bijoux/{slug}` | Auto-référent FR |
| AR | `/ar/bijoux/{slug}` | Auto-référent AR |
| Ancien id | `/fr/bijoux/{id}` ou `prod-*` | **308** → `/fr/bijoux/{slug}` si produit existe |
| Produit absent | toute URL | **404** + noindex (pas de redirect vers un autre produit) |
| Sans locale | `/bijoux` → `/fr/bijoux` | Redirect 301 (`next.config.mjs`) |
| FAQ | `/faq` → `/fr/faq` | Redirect 301 |
| Packs | `/packs` → `/fr/packs` ; `/packs/:id` → `/fr/packs/:id` | Redirect 301 |
| Admin | `/fr/admin` → `/admin` | Redirect 301 |

## Slugs

- Colonne `products.slug` (migration `scripts/migrations/002_add_product_slug.sql`)
- Générés depuis le nom (sans accents), uniques ; suffixe id court si collision / réservé
- **Persistants** : ne changent pas si le nom produit est modifié après stockage
- Les ids internes restent inchangés

## Hreflang

Pour chaque path (ex. `/bijoux/fleur-de-grace`) :

| Clé | URL |
|-----|-----|
| `fr` / `fr-MA` | `https://inoxya.ma/fr/bijoux/fleur-de-grace` |
| `ar` / `ar-MA` | `https://inoxya.ma/ar/bijoux/fleur-de-grace` |
| `x-default` | URL FR |
| `canonical` | URL de la locale courante |

## Sitemap / robots

- Sitemap : slugs produits + catégories + guides + packs
- `Allow: /api/shop-blob` pour images ; reste de `/api/` disallow
- Junk `/&`, `/%26` : 410

Voir aussi `SEO-URL-INDEXING-FIX.md`.
