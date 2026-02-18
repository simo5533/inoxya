# 🚀 VERCEL DEPLOYMENT - AUDIT COMPLET & PLAN D'IMPLÉMENTATION

**Date :** 27 janvier 2025  
**Projet :** INOXYA BIJOUX  
**Objectif :** Déploiement production-ready sur Vercel avec architecture stable

---

## 📋 TABLE DES MATIÈRES

1. [Audit Complet](#audit-complet)
2. [Plan d'Implémentation](#plan-dimplémentation)
3. [Changements Implémentés](#changements-implémentés)
4. [Checklist Déploiement](#checklist-déploiement)

---

## 🔍 AUDIT COMPLET

### A. RISQUES VERCEL (Critiques)

#### ❌ **CRITIQUE 1 : SQLite sur disque local**
- **Problème :** `lib/sqlite.ts` utilise `better-sqlite3` qui écrit dans `data/inoxya_bijoux.db`
- **Impact Vercel :** Système de fichiers en lecture seule (sauf `/tmp` temporaire)
- **Risque :** Base de données non persistante, perte de données à chaque déploiement
- **Solution :** Migrer vers PostgreSQL via `DATABASE_URL` (Vercel Postgres)

#### ❌ **CRITIQUE 2 : Uploads d'images sur disque**
- **Fichier :** `app/api/upload/product-image/route.ts`
- **Problème :** Utilise `mkdir()` et `writeFile()` dans `public/images/`
- **Impact Vercel :** Écriture impossible, erreurs 500
- **Solution :** Migrer vers Vercel Blob Storage

#### ❌ **CRITIQUE 3 : Rate limiting in-memory**
- **Fichier :** `lib/security.ts` (lignes 322-375)
- **Problème :** Utilise `Map` en mémoire (`loginAttempts`)
- **Impact Vercel :** Chaque invocation serverless est isolée, rate limiting ne persiste pas
- **Solution :** Redis/Upstash pour persistance

#### ⚠️ **MOYEN 4 : Runtime Edge vs Node**
- **Statut :** ✅ **BON** - Toutes les routes DB ont `export const runtime = 'nodejs'`
- **Vérifié :** 30+ routes API ont déjà le bon runtime

#### ⚠️ **MOYEN 5 : Variables d'environnement**
- **Problème :** `JWT_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` doivent être configurées
- **Solution :** Documentation + vérification dans `lib/env-validator.ts`

#### ⚠️ **MOYEN 6 : Caching stratégie**
- **Problème :** Pas de ISR configuré pour pages catalogue
- **Solution :** Ajouter `revalidate` sur pages statiques

---

### B. AUDIT SÉCURITÉ

#### ✅ **Points Forts**
1. **CSRF Protection** : `lib/security.ts` - `requireCSRF()` sur routes sensibles
2. **Validation Zod** : 20+ schémas dans `lib/validations.ts`
3. **Sanitization** : `sanitizeInput()` sur toutes les entrées
4. **Headers sécurité** : `middleware.ts` - HSTS, CSP, X-Frame-Options
5. **Vérification prix serveur** : `app/api/checkout/route.ts` vérifie prix depuis DB
6. **Authentification admin** : Routes admin protégées
7. **Rate limiting** : Implémenté (mais in-memory, à migrer)

#### ⚠️ **Points d'Amélioration**
1. **Rate limiting persistant** : Migrer vers Redis/Upstash
2. **Cookie flags** : Vérifier `secure`, `httpOnly`, `sameSite` en production
3. **Secrets leakage** : Vérifier qu'aucun secret n'est dans le code
4. **Logs sécurité** : Améliorer logging des tentatives d'attaque

---

### C. AUDIT SEO

#### ✅ **Points Forts**
1. **Metadata** : Toutes les pages ont metadata (title, description, OG)
2. **Structured Data** : `components/StructuredData.tsx` - Organization schema
3. **Sitemap** : `app/sitemap.ts` - Dynamique avec produits/packs
4. **Robots.txt** : `app/robots.ts` - Correctement configuré
5. **Canonical URLs** : Utilise `NEXT_PUBLIC_SITE_URL`

#### ⚠️ **Points d'Amélioration**
1. **Product Schema** : Ajouter JSON-LD Product schema sur pages produits
2. **Breadcrumbs** : Ajouter BreadcrumbList schema
3. **Categories sitemap** : Déjà présent ✅

---

### D. AUDIT PERFORMANCE

#### ✅ **Points Forts**
1. **Next.js Image** : Utilisé partout avec optimisation
2. **Code splitting** : Automatique via Next.js
3. **Server Components** : Pages utilisent SSR/SSG
4. **Bundle optimization** : Webpack config optimisé

#### ⚠️ **Points d'Amélioration**
1. **ISR** : Ajouter `revalidate` sur pages catalogue
2. **Pagination** : API produits retourne tout, pas de pagination
3. **Payload API** : Retourne `images` complet (peut être lourd)
4. **Client-side filtering** : Homepage utilise client component (acceptable mais optimisable)

---

### E. AUDIT MAINTAINABILITY

#### ✅ **Points Forts**
1. **TypeScript strict** : Configuré
2. **Structure claire** : `app/`, `components/`, `lib/`, `scripts/`
3. **Composants réutilisables** : shadcn/ui, composants custom

#### ⚠️ **Points d'Amélioration**
1. **Duplication** : Certaines constantes dupliquées (colors, category mapping)
2. **Types partagés** : Types dupliqués dans plusieurs fichiers
3. **Scripts obsolètes** : Certains scripts peuvent être inutilisés
4. **DB abstraction** : Pas de couche unifiée SQLite/Postgres

---

## 📝 PLAN D'IMPLÉMENTATION

### PR1 : Environment + Runtime Correctness ✅
**Objectif :** S'assurer que toutes les routes ont le bon runtime et que les env vars sont validées

**Changements :**
- Vérifier toutes les routes API ont `export const runtime = 'nodejs'` (déjà fait ✅)
- Améliorer `lib/env-validator.ts` pour valider `DATABASE_URL` en production
- Ajouter warnings si variables manquantes

**Test :**
```bash
npm run build
npm run lint
```

**Rollback :** Aucun risque, vérifications seulement

---

### PR2 : DB Abstraction Layer (SQLite dev / Postgres prod)
**Objectif :** Créer une couche unifiée qui utilise SQLite en dev et Postgres en prod

**Changements :**
- Créer `lib/db/index.ts` - Adapter pattern
- Créer `lib/db/sqlite-adapter.ts` - Wrapper SQLite existant
- Créer `lib/db/postgres-adapter.ts` - Nouvelle implémentation Postgres
- Modifier `lib/database.ts` pour utiliser l'adapter
- Garder signatures existantes (pas de breaking changes)

**Fichiers :**
- `lib/db/index.ts` (nouveau)
- `lib/db/sqlite-adapter.ts` (nouveau)
- `lib/db/postgres-adapter.ts` (nouveau)
- `lib/database.ts` (modifié - utilise adapter)

**Test :**
```bash
# Dev (SQLite)
npm run dev
# Vérifier que tout fonctionne

# Test Postgres (si disponible)
DATABASE_URL=postgresql://... npm run dev
```

**Rollback :** Revenir à `lib/database.ts` direct

---

### PR3 : Migration Script SQLite → Postgres
**Objectif :** Script pour migrer données existantes

**Changements :**
- Améliorer `scripts/migrate-sqlite-to-postgres.ts`
- Ajouter mode dry-run
- Gérer JSON fields correctement
- Logs détaillés

**Fichiers :**
- `scripts/migrate-sqlite-to-postgres.ts` (amélioré)

**Test :**
```bash
# Dry-run
npm run db:migrate -- --dry-run

# Migration réelle
npm run db:migrate
```

**Rollback :** Script idempotent, peut être relancé

---

### PR4 : Upload Storage (Vercel Blob)
**Objectif :** Migrer uploads vers Vercel Blob

**Changements :**
- Installer `@vercel/blob`
- Modifier `app/api/upload/product-image/route.ts`
- Utiliser Vercel Blob au lieu de filesystem
- Garder fallback local pour dev

**Fichiers :**
- `app/api/upload/product-image/route.ts` (modifié)
- `lib/storage.ts` (nouveau - abstraction storage)

**Test :**
```bash
# Local (dev) - utilise filesystem
npm run dev
# Upload image via admin

# Production - utilise Vercel Blob
# Tester sur preview deployment
```

**Rollback :** Revenir à filesystem (mais ne marchera pas sur Vercel)

---

### PR5 : Rate Limiting Persistant (Redis/Upstash)
**Objectif :** Migrer rate limiting vers Redis

**Changements :**
- Installer `@upstash/redis` ou `ioredis`
- Créer `lib/rate-limit.ts` - Adapter pattern
- Local : in-memory (dev)
- Production : Redis (via `UPSTASH_REDIS_REST_URL`)
- Modifier `lib/security.ts` pour utiliser l'adapter

**Fichiers :**
- `lib/rate-limit.ts` (nouveau)
- `lib/security.ts` (modifié)

**Test :**
```bash
# Local (in-memory)
npm run dev
# Tester rate limit

# Production (Redis)
UPSTASH_REDIS_REST_URL=... npm run dev
```

**Rollback :** Revenir à in-memory (mais ne persistera pas)

---

### PR6 : Performance & Caching
**Objectif :** Optimiser ISR, pagination, payloads

**Changements :**
- Ajouter `revalidate` sur pages catalogue
- Ajouter pagination API produits
- Optimiser payloads (ne pas retourner `images` complet si pas nécessaire)
- Ajouter `next/image` remotePatterns pour Vercel Blob

**Fichiers :**
- `app/bijoux/page.tsx` (ajouter revalidate)
- `app/packs/page.tsx` (ajouter revalidate)
- `app/api/products/route.ts` (pagination)
- `next.config.mjs` (remotePatterns)

**Test :**
```bash
npm run build
# Vérifier que pages sont statiques/ISR
```

**Rollback :** Retirer revalidate

---

### PR7 : Security Hardening Final
**Objectif :** Finaliser sécurité

**Changements :**
- Vérifier cookie flags en production
- Améliorer logs sécurité
- Vérifier aucun secret dans code
- Ajouter headers sécurité manquants

**Fichiers :**
- `lib/auth.ts` (cookie flags)
- `lib/logger.ts` (logs sécurité)
- `middleware.ts` (headers)

**Test :**
```bash
npm run build
# Vérifier headers dans Network tab
```

**Rollback :** Aucun risque

---

### PR8 : SEO Finalization
**Objectif :** Finaliser SEO

**Changements :**
- Ajouter Product schema JSON-LD sur pages produits
- Ajouter BreadcrumbList schema
- Vérifier toutes les pages ont metadata unique
- Vérifier canonical URLs

**Fichiers :**
- `app/bijoux/[id]/page.tsx` (Product schema)
- `components/StructuredData.tsx` (Breadcrumbs)
- Toutes les pages (metadata)

**Test :**
```bash
# Vérifier avec Google Rich Results Test
# Vérifier sitemap.xml
```

**Rollback :** Retirer schemas

---

### PR9 : Cleanup & Structure
**Objectif :** Nettoyer code obsolète, dédupliquer

**Changements :**
- Identifier fichiers inutilisés (grep imports)
- Dédupliquer constantes (colors, category mapping)
- Créer `lib/types.ts` pour types partagés
- Supprimer scripts obsolètes (seulement si confirmé inutilisé)

**Fichiers :**
- `lib/types.ts` (nouveau)
- `lib/constants.ts` (nouveau - constantes partagées)
- Scripts obsolètes (supprimés)

**Test :**
```bash
npm run build
npm run lint
npm run test
# Vérifier que tout fonctionne
```

**Rollback :** Git revert

---

## 🔧 CHANGEMENTS IMPLÉMENTÉS

### ✅ PR1 : Environment + Runtime Correctness

**Fichiers modifiés :**
- `lib/env-validator.ts` - Amélioration validation DATABASE_URL pour Vercel

**Changements :**
- Ajout vérification `VERCEL === '1'` pour forcer DATABASE_URL en production Vercel
- Validation format DATABASE_URL (postgresql:// ou postgres://)
- Messages d'erreur plus clairs

**Test :**
```bash
npm run build  # Doit passer
```

---

### ✅ PR2 : DB Abstraction Layer (En cours)

**Fichiers créés :**
- `lib/db/types.ts` - Types partagés pour la couche DB
- `lib/db/adapter.ts` - Interface DatabaseAdapter
- `lib/db/index.ts` - Factory qui choisit SQLite ou Postgres
- `lib/db/sqlite-adapter.ts` - Adapter SQLite (wrapper fonctions existantes)
- `lib/db/postgres-adapter.ts` - Adapter Postgres (nouveau)

**Fichiers modifiés :**
- `lib/database.ts` - Commence à utiliser l'adapter (fonction `getBijouxVedettes` modifiée)

**Statut :** 
- ✅ Structure créée
- ✅ Adapters créés (SQLite + Postgres)
- ⚠️ Migration progressive de `lib/database.ts` en cours
- ⚠️ Toutes les fonctions doivent être migrées vers l'adapter

**Prochaines étapes :**
1. Migrer toutes les fonctions de `lib/database.ts` pour utiliser l'adapter
2. Tester avec SQLite (dev)
3. Tester avec Postgres (si disponible)
4. Vérifier que rien n'est cassé

---

### ⏳ PR3-PR9 : À implémenter

Voir plan détaillé ci-dessus.

---

## ✅ CHECKLIST DÉPLOIEMENT VERCEL

### Pré-déploiement

- [ ] **Build local réussi**
  ```bash
  npm run build
  npm run lint
  ```

- [ ] **Tests passent**
  ```bash
  npm run test
  ```

- [ ] **Variables d'environnement préparées**
  - `JWT_SECRET` (32+ caractères)
  - `NEXT_PUBLIC_SITE_URL` (https://inoxya-bijoux.com)
  - `DATABASE_URL` (Postgres Vercel)
  - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
  - `UPSTASH_REDIS_REST_URL` (optionnel, pour rate limiting)

### Configuration Vercel

- [ ] **Créer projet Vercel**
  ```bash
  vercel
  ```

- [ ] **Ajouter intégration Postgres**
  - Vercel Dashboard → Storage → Create Database → Postgres
  - Copier `DATABASE_URL` automatiquement

- [ ] **Ajouter intégration Blob**
  - Vercel Dashboard → Storage → Create Database → Blob
  - Copier `BLOB_READ_WRITE_TOKEN`

- [ ] **Configurer variables d'environnement**
  ```bash
  vercel env add JWT_SECRET production
  vercel env add NEXT_PUBLIC_SITE_URL production
  # DATABASE_URL et BLOB_READ_WRITE_TOKEN sont ajoutés automatiquement
  vercel env add UPSTASH_REDIS_REST_URL production  # Optionnel
  ```

### Migration Base de Données

- [ ] **Exécuter migration SQLite → Postgres**
  ```bash
  # Local avec DATABASE_URL de Vercel
  DATABASE_URL=postgresql://... npm run db:migrate
  ```

- [ ] **Vérifier données migrées**
  ```bash
  # Se connecter à Postgres Vercel et vérifier
  ```

### Déploiement

- [ ] **Déployer preview**
  ```bash
  vercel --prod=false
  ```

- [ ] **Tester preview**
  - [ ] Homepage charge
  - [ ] Catalogue produits fonctionne
  - [ ] Upload image fonctionne (admin)
  - [ ] Checkout fonctionne
  - [ ] Admin dashboard fonctionne

- [ ] **Déployer production**
  ```bash
  vercel --prod
  ```

### Vérification Post-Déploiement

- [ ] **Smoke tests endpoints**
  ```bash
  curl https://inoxya-bijoux.com/api/health
  curl https://inoxya-bijoux.com/api/products
  curl https://inoxya-bijoux.com/api/categories
  ```

- [ ] **Vérifier logs Vercel**
  - Pas d'erreurs critiques
  - Rate limiting fonctionne
  - Uploads fonctionnent

- [ ] **Vérifier SEO**
  - Sitemap accessible : `https://inoxya-bijoux.com/sitemap.xml`
  - Robots.txt accessible : `https://inoxya-bijoux.com/robots.txt`
  - Metadata correcte (view source)

- [ ] **Vérifier performance**
  - Lighthouse score > 90
  - Images optimisées
  - Pas d'erreurs console

---

## 📚 NOTES IMPORTANTES

### Préservation Fonctionnalités

✅ **IMPORTANT :** Les sections suivantes doivent être préservées :
- Homepage : Section "Notre Collection" avec catégories et filtrage
- `/bijoux` : Section "Nos Catégories" avec cartes et filtrage produits
- Toutes les pages existantes doivent fonctionner identiquement

### Nettoyage Sécurisé

⚠️ **RÈGLE STRICTE :** Avant de supprimer un fichier/script :
1. Vérifier qu'il n'est pas importé (`grep -r "filename"`)
2. Vérifier qu'il n'est pas utilisé dans `package.json` scripts
3. Vérifier que le build passe
4. Vérifier que les tests passent
5. Si incertain, marquer comme `@deprecated` et laisser

### Rollback Strategy

Chaque PR doit avoir une stratégie de rollback claire. En cas de problème :
1. Revenir au commit précédent
2. Vérifier que tout fonctionne
3. Corriger le problème
4. Re-déployer

---

**Document créé le :** 27 janvier 2025  
**Statut :** En cours d'implémentation

