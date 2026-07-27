# SEO URL Migration — INOXYA

**Domaine canonique production :** `https://inoxya.ma`

## Formats d’URL produit

| Type | Pattern | Canonical |
|------|---------|-----------|
| FR | `/fr/bijoux/{id}` | Auto-référent FR |
| AR | `/ar/bijoux/{id}` | Auto-référent AR |
| Sans locale | `/bijoux` → `/fr/bijoux` | Redirect 301 (`next.config.mjs`) |
| FAQ | `/faq` → `/fr/faq` | Redirect 301 |
| Packs | `/packs` → `/fr/packs` ; `/packs/:id` → `/fr/packs/:id` | Redirect 301 |
| Admin | `/fr/admin` → `/admin` | Redirect 301 |

## Ancien domaine Vercel

| Ancienne référence | Action |
|--------------------|--------|
| `inoxya-bijoux.vercel.app` dans `geo-qa.ts` / `pillar.ts` | Remplacé par `https://inoxya.ma` |
| Preview `*.vercel.app` via `NEXT_PUBLIC_SITE_URL` en prod | Forcé vers `inoxya.ma` (`lib/site-url.ts`) |

## Hreflang

Pour chaque path (ex. `/bijoux/10`) :

| Clé | URL |
|-----|-----|
| `fr` / `fr-MA` | `https://inoxya.ma/fr/bijoux/10` |
| `ar` / `ar-MA` | `https://inoxya.ma/ar/bijoux/10` |
| `x-default` | `https://inoxya.ma/fr/bijoux/10` |
| `canonical` | URL de la locale courante |

## Doublons / IDs

Les produits utilisent un **id numérique stable** dans l’URL (`/bijoux/10`).  
Pas de slug produit séparé documenté comme second URL indexable.  
Si d’anciennes URLs `prod-xxxxx` existent hors repo, les rediriger en 301 vers `/fr/bijoux/{id}` (action manuelle Search Console / logs).

## Sitemap

`app/sitemap.ts` : locales `fr` + `ar`, produits actifs, packs, guides, catégories.

## Actions manuelles éventuelles

1. Dans Search Console : fixer la propriété `inoxya.ma`, demander indexation des sitemaps.
2. Vérifier le rapport « pages avec redirection » pour d’éventuels `vercel.app`.
3. Si d’anciennes URLs produit apparaissent dans Coverage, ajouter redirects ciblés.
