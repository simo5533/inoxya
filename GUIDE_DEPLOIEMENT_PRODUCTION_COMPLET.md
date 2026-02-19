# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION COMPLET

**Date:** 2025-01-27  
**Projet:** INOXYA BIJOUX  
**Objectif:** Déployer le projet en production avec toutes les optimisations

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Configuration PostgreSQL](#1-configuration-postgresql)
3. [Configuration Upstash Redis](#2-configuration-upstash-redis)
4. [Configuration SMTP](#3-configuration-smtp)
5. [Optimisation des Images](#4-optimisation-des-images)
6. [Déploiement sur Vercel](#5-déploiement-sur-vercel)
7. [Vérification Post-Déploiement](#6-vérification-post-déploiement)

---

## 📦 PRÉREQUIS

- ✅ Compte Vercel (gratuit)
- ✅ Compte Upstash (gratuit jusqu'à 10K requêtes/jour)
- ✅ Compte email SMTP (Gmail, SendGrid, etc.)
- ✅ Base de données PostgreSQL (Vercel Postgres, Supabase, etc.)

---

## 1. CONFIGURATION POSTGRESQL

### Option A: Vercel Postgres (Recommandé pour Vercel)

1. **Créer une base Postgres:**
   - Allez sur https://vercel.com/dashboard
   - Créez un projet ou ouvrez votre projet
   - Onglet "Storage" → "Create Database" → "Postgres"
   - Choisissez un nom (ex: `inoxya-bijoux-db`)

2. **Récupérer DATABASE_URL:**
   - Dans l'onglet "Storage", cliquez sur votre base
   - Onglet ".env.local" → Copiez `POSTGRES_URL`
   - Format: `postgres://user:password@host:5432/database`

3. **Migration des données:**
   ```bash
   # Exporter depuis SQLite
   npm run db:migrate:execute
   
   # Ou utiliser le script de migration
   npm run db:migrate
   ```

### Option B: Supabase (Gratuit jusqu'à 500MB)

1. **Créer un projet:**
   - Allez sur https://supabase.com
   - Créez un nouveau projet
   - Attendez la création (2-3 minutes)

2. **Récupérer DATABASE_URL:**
   - Settings → Database → Connection string
   - Copiez "URI" (format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)

3. **Créer les tables:**
   - SQL Editor → Exécutez le schéma SQLite converti
   - Ou utilisez le script de migration

### Option C: Autre Service (Railway, Render, etc.)

1. **Créer une base PostgreSQL**
2. **Récupérer DATABASE_URL**
3. **Exécuter les migrations**

### Configuration dans .env.production

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Test de Connexion

```bash
npm run test:production
```

---

## 2. CONFIGURATION UPSTASH REDIS

### Pourquoi Upstash Redis?

- ✅ Rate limiting distribué (partagé entre instances)
- ✅ Cache pour améliorer les performances
- ✅ Gratuit jusqu'à 10K requêtes/jour
- ✅ Serverless (pas de serveur à gérer)

### Étapes

1. **Créer un compte:**
   - Allez sur https://upstash.com
   - Créez un compte gratuit
   - Vérifiez votre email

2. **Créer une base Redis:**
   - Dashboard → "Create Database"
   - Choisissez une région proche (ex: `eu-west-1`)
   - Type: "Regional" (gratuit)
   - Nom: `inoxya-bijoux-redis`

3. **Récupérer les credentials:**
   - Cliquez sur votre base
   - Onglet ".env" → Copiez:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

### Configuration dans .env.production

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Test de Connexion

```bash
npm run test:production
```

### Installation (Optionnel)

Si vous voulez installer `@upstash/redis` localement:

```bash
npm install @upstash/redis
```

**Note:** Le projet fonctionne sans cette dépendance (fallback mémoire), mais Redis est recommandé en production.

---

## 3. CONFIGURATION SMTP

### Option A: Gmail (Gratuit)

1. **Activer l'authentification à 2 facteurs:**
   - Gmail → Paramètres → Sécurité
   - Activez "Validation en deux étapes"

2. **Générer un mot de passe d'application:**
   - Google Account → Sécurité → "Mots de passe des applications"
   - Sélectionnez "Autre" → Nom: "INOXYA BIJOUX"
   - Copiez le mot de passe généré (16 caractères)

3. **Configuration:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=mot-de-passe-application-16-chars
   ADMIN_EMAIL=votre-email@gmail.com
   ```

### Option B: SendGrid (Gratuit jusqu'à 100 emails/jour)

1. **Créer un compte:**
   - https://sendgrid.com
   - Créez un compte gratuit

2. **Créer une API Key:**
   - Settings → API Keys → "Create API Key"
   - Permissions: "Full Access" ou "Mail Send"
   - Copiez la clé

3. **Configuration:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=votre-api-key-sendgrid
   ADMIN_EMAIL=votre-email@domain.com
   ```

### Option C: Mailgun, Outlook, etc.

Consultez la documentation de votre fournisseur SMTP.

### Test de Connexion

```bash
npm run test:production
```

---

## 4. OPTIMISATION DES IMAGES

### Pourquoi Optimiser?

- ✅ Réduction de la taille des fichiers (50-80%)
- ✅ Amélioration du temps de chargement
- ✅ Meilleure expérience utilisateur
- ✅ Réduction des coûts de bande passante

### Configuration Actuelle

Le projet utilise déjà:
- ✅ **Sharp** pour le traitement d'images
- ✅ **WebP** pour la compression
- ✅ **Next.js Image** pour l'optimisation automatique

### Optimisation Automatique

```bash
# Optimiser toutes les images
npm run optimize:images
```

Ce script:
- Convertit toutes les images en WebP
- Optimise la compression (qualité 85%)
- Réduit la taille de 50-80%
- Conserve les originaux

### Configuration dans next.config.mjs

```javascript
images: {
  formats: ['image/avif', 'image/webp'], // Formats modernes
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

### Qualité des Images

- **Production:** Qualité 85% (bon compromis)
- **Développement:** Qualité 90% (meilleure qualité)

Modifiable dans `lib/process-product-image.ts`:

```typescript
const quality = process.env.NODE_ENV === 'production' ? 85 : 90
```

---

## 5. DÉPLOIEMENT SUR VERCEL

### Étape 1: Préparer le Projet

```bash
# Vérifier que tout fonctionne
npm run build

# Tester localement
npm run start
```

### Étape 2: Connecter à Vercel

1. **Installer Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter:**
   ```bash
   vercel login
   ```

3. **Déployer:**
   ```bash
   vercel
   ```

### Étape 3: Configurer les Variables d'Environnement

Sur Vercel Dashboard:

1. **Ouvrez votre projet**
2. **Settings → Environment Variables**
3. **Ajoutez toutes les variables:**

```env
# OBLIGATOIRE
NEXT_PUBLIC_SITE_URL=https://votre-domaine.vercel.app
JWT_SECRET=votre-secret-64-caracteres
DATABASE_URL=postgresql://...

# RECOMMANDÉ
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
ADMIN_EMAIL=...

# OPTIONNEL
BLOB_READ_WRITE_TOKEN=...
```

4. **Redeployez:**
   ```bash
   vercel --prod
   ```

### Étape 4: Configurer le Domaine

1. **Settings → Domains**
2. **Ajoutez votre domaine personnalisé**
3. **Suivez les instructions DNS**

---

## 6. VÉRIFICATION POST-DÉPLOIEMENT

### Tests Automatiques

```bash
# Tester la configuration
npm run test:production

# Tester les routes API
npm run test:api
```

### Vérifications Manuelles

1. **Site Web:**
   - ✅ Page d'accueil charge
   - ✅ Images s'affichent
   - ✅ Navigation fonctionne
   - ✅ i18n (FR/AR) fonctionne

2. **API:**
   - ✅ `/api/health` répond
   - ✅ `/api/products` retourne des produits
   - ✅ `/api/categories` retourne des catégories

3. **Base de Données:**
   - ✅ Connexion PostgreSQL réussie
   - ✅ Tables créées
   - ✅ Données migrées

4. **Redis:**
   - ✅ Rate limiting fonctionne
   - ✅ Pas d'erreurs dans les logs

5. **SMTP:**
   - ✅ Test d'envoi d'email réussi
   - ✅ Emails reçus

---

## 📊 CHECKLIST DE DÉPLOIEMENT

### Avant le Déploiement

- [ ] `.env.production` configuré
- [ ] PostgreSQL configuré et testé
- [ ] Upstash Redis configuré (optionnel mais recommandé)
- [ ] SMTP configuré (optionnel)
- [ ] Images optimisées
- [ ] Build réussi (`npm run build`)
- [ ] Tests passés

### Variables d'Environnement Vercel

- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `JWT_SECRET`
- [ ] `DATABASE_URL`
- [ ] `UPSTASH_REDIS_REST_URL` (optionnel)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (optionnel)
- [ ] `SMTP_HOST` (optionnel)
- [ ] `SMTP_PORT` (optionnel)
- [ ] `SMTP_USER` (optionnel)
- [ ] `SMTP_PASS` (optionnel)
- [ ] `ADMIN_EMAIL` (optionnel)

### Post-Déploiement

- [ ] Site accessible
- [ ] Base de données connectée
- [ ] Routes API fonctionnelles
- [ ] Images chargent correctement
- [ ] i18n fonctionne
- [ ] Emails envoyés (si SMTP configuré)

---

## 🛠️ SCRIPTS DISPONIBLES

```bash
# Configuration interactive
npm run setup:production

# Test de la configuration
npm run test:production

# Optimisation des images
npm run optimize:images

# Test des routes API
npm run test:api
```

---

## 📚 RESSOURCES

- **Vercel Postgres:** https://vercel.com/docs/storage/vercel-postgres
- **Upstash Redis:** https://docs.upstash.com/redis
- **SendGrid:** https://docs.sendgrid.com
- **Gmail SMTP:** https://support.google.com/accounts/answer/185833

---

## ⚠️ NOTES IMPORTANTES

1. **Ne jamais commiter `.env.production`** dans Git
2. **Générer un nouveau JWT_SECRET** pour chaque environnement
3. **Backup régulier** de la base de données
4. **Surveiller les quotas** (Upstash, SendGrid, etc.)
5. **Tester en staging** avant production

---

## ✅ RÉSULTAT ATTENDU

Après avoir suivi ce guide:

- ✅ **PostgreSQL** configuré et fonctionnel
- ✅ **Upstash Redis** configuré (optionnel)
- ✅ **SMTP** configuré (optionnel)
- ✅ **Images optimisées** (WebP, compression)
- ✅ **Déployé sur Vercel** avec toutes les variables
- ✅ **Site fonctionnel** en production

---

**🎉 Félicitations ! Votre projet est prêt pour la production !**

