# Indexation GSC — correctifs (2026-07-31)

## Problèmes Search Console traités

| Rapport GSC | Cause | Correctif code |
|-------------|--------|----------------|
| Page en double sans URL canonique | `/fr` vs `/fr/`, guides morts, lag hreflang | Canonical sans slash final ; redirects guide |
| Exclue par noindex | Soft 404 / erreur DB → noindex ; URLs `&` | 410 junk ; noindex seulement si produit absent ; index explicite si OK |
| Exploré non indexé (AR) | Contenu proche FR + délai Google | Titles AR via `name_ar` ; hreflang déjà en place |
| Page avec redirection `/faq` | Redirect voulu `/faq` → `/fr/faq` | **Normal** — ne pas supprimer |
| Détectée non indexée | Sitemap parfois incomplet au build | Sitemap `force-dynamic` + dédup |

## Actions manuelles après déploiement

1. Search Console → **Valider la correction** sur chaque rapport.
2. Soumettre à nouveau `https://inoxya.ma/sitemap.xml`.
3. Inspection d’URL : `/fr`, `/fr/faq`, `/fr/bijoux/bracelets`, `/fr/bijoux/7`, `/ar/faq`.
4. Ignorer `/faq` (redirect) — Google indexe `/fr/faq`.
5. Attendre 3–14 jours pour « détectée / explorée non indexée » (budget crawl).
