# PHASE 0 — BASELINE MAP (READ-ONLY) — INOXYA BIJOUX

**Date** : Baseline avant audit production  
**Règle** : Aucune modification de code avant publication de ce rapport.

---

## 0.1 Repo map

### Racine
- **app/** — App Router Next.js (pages, layouts, API routes)
- **components/** — Composants React (ui/, admin/, sur-mesure/, layout)
- **lib/** — Logique métier (db/, database.ts, auth.ts, cart-favorites.ts, validations, security, env, site-url, etc.)
- **scripts/** — Scripts npm (dev-server.js, start-server.js, health-check.ts, deploy.js, DB, tests)
- **i18n/** — next-intl (request.ts, routing.ts)
- **messages/** — fr.json, ar.json
- **public/** — Assets statiques
- **styles/** — globals.css
- **middleware.ts** — next-intl middleware
- **next.config.mjs** — Config Next (pas d’experimental.dynamicIO / cacheComponents)
- **vercel.json** — framework nextjs, buildCommand, outputDirectory
- **package.json** — scripts, deps (Next 15, React 19, Supabase, zod, etc.)
- **tsconfig.json** — paths @/*, strict
- **.env.example** — Template variables d’environnement

### Fichiers critiques
- **middleware.ts** : `createMiddleware(routing)` next-intl ; matcher exclut api, _next, favicon, fichiers avec extension, _next, **admin**.
- **next.config.mjs** : Pas de `experimental.dynamicIO` ni `experimental.cacheComponents` → build stable Next 15.5.x.
- **lib/site-url.ts** : getSiteUrl, getSiteUrlSync, getSiteUrlSafe ; fallback prod = `https://inoxya-bijoux.vercel.app` ; **pas de VERCEL_URL** pour preview.
- **lib/env-validator.ts** : NEXT_PUBLIC_SITE_URL **obligatoire en production** (ligne 95–96) ; ensureValidEnvironment() **skippée au build** (NEXT_PHASE).
- **lib/db/index.ts** : Priorité Supabase → Postgres → SQLite (dev uniquement) ; timeout 10s ; pas de SQLite en prod.

---

## 0.2 Critical flows

| Flow | Fichiers / routes |
|------|-------------------|
| **Browse products/packs/categories** | app/[locale]/bijoux, app/[locale]/packs, lib/database.ts (getAllBijoux, getPacks), adapter getProducts/getPacks, API GET /api/products, /api/packs, /api/categories |
| **Cart + favorites** | lib/cart-favorites.ts (localStorage + sync), API /api/cart, /api/favorites, app/[locale]/panier, app/[locale]/favoris |
| **Auth** | lib/auth.ts (login, register, getCurrentUser), API /api/auth/login, logout, register, me ; cookies JWT |
| **Checkout → orders + order_items + payments + notifications** | app/api/checkout/route.ts, lib/database.ts (createOrder, createOrderItem, createPayment), adapter Supabase (orders, order_items, payments), notifications |
| **Admin** | app/admin/*, lib/admin-auth.ts, API /api/admin/* (products, packs, orders, payments, settings, upload-image, etc.) |

---

## 0.3 Critical infra

| Composant | Détail |
|-----------|--------|
| **DB adapter** | lib/db/index.ts : Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) → Postgres (DATABASE_URL) → SQLite (dev only). |
| **Rate limiting** | lib/rate-limit-adapter.ts (mémoire / Upstash Redis optionnel). |
| **CSRF** | lib/security.ts requireCSRF ; utilisé sur mutations (favoris, cart, checkout, custom-requests). |
| **JWT cookies** | lib/auth.ts ; cookie httpOnly, sameSite lax. |
| **Headers** | next.config headers (X-Content-Type-Options, X-Frame-Options, etc.). |
| **Uploads** | @vercel/blob optionnel ; API admin/upload-image ; Supabase storage (images remotePatterns). |
| **SEO** | metadata dans pages ; lib/site-url getSiteUrlSafe ; sitemap.xml, robots.txt. |

---

## 0.4 Vercel risk points

| Risque | État actuel |
|--------|-------------|
| **Next.js experimental flags** | Aucun dans next.config.mjs → **OK** (pas de canary requis). |
| **Middleware** | next-intl uniquement ; pas de try/catch explicite → si next-intl lance, risque MIDDLEWARE_INVOCATION_FAILED. |
| **Runtime nodejs** | Routes API utilisent `export const runtime = 'nodejs'` où nécessaire (ex. auth, checkout). |
| **Env validation** | ensureValidEnvironment() ne s’exécute pas au build (NEXT_PHASE). En **runtime production**, si NEXT_PUBLIC_SITE_URL manque → **throw** (env-validator). |
| **NEXT_PUBLIC_SITE_URL** | En Preview Vercel sans cette var → getSiteUrlSafe retourne `https://inoxya-bijoux.vercel.app`. env-validator en prod exige la var → **à assouplir** si Option A (domaine par défaut) sans var. |
| **SQLite en prod** | lib/db/index.ts n’utilise SQLite que si !IS_PRODUCTION → **OK**. |

---

## 0.5 Baseline commands (captured)

- **node -v** : v24.12.0  
- **npm -v** : 11.6.2  
- **npm run type-check** : exit 0  
- **npm run build** : exit 0 (Next.js 15.5.12, 29 pages, toutes les routes API compilées)

**Conclusion Phase 0** : Aucun flag expérimental bloquant. Build et type-check passent. Risques identifiés : (1) middleware sans try/catch, (2) NEXT_PUBLIC_SITE_URL obligatoire en prod alors qu’Option A peut utiliser VERCEL_URL, (3) site-url sans fallback VERCEL_URL pour les previews.

---

*Fin du rapport Phase 0. Aucune modification de code n’a été effectuée.*
