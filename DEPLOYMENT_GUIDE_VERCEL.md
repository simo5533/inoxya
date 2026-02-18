# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - INOXYA BIJOUX

**Date:** 2025-01-XX  
**Version:** Production Ready ✅

---

## 📋 PRÉ-REQUIS

- Compte Vercel (gratuit ou Pro)
- Repository Git (GitHub, GitLab, ou Bitbucket)
- Accès à la base SQLite locale pour migration

---

## 🔧 ÉTAPE 1 : PRÉPARATION DU PROJET

### 1.1 Vérifier le Build Local

```bash
npm run build
```

✅ **Résultat attendu:** Build réussi, aucune erreur TypeScript

### 1.2 Vérifier les Tests (si disponibles)

```bash
npm run test
```

---

## 🌐 ÉTAPE 2 : CRÉER LES INTÉGRATIONS VERCEL

### 2.1 Vercel Postgres

1. **Dashboard Vercel** → Votre projet → **Storage** → **Create Database**
2. Sélectionner **Postgres**
3. Choisir un nom (ex: `inoxya-postgres`)
4. Région: Choisir la plus proche (ex: `fra1` pour Europe)
5. Cliquer **Create**

**Résultat:** `DATABASE_URL` sera automatiquement ajouté aux variables d'environnement

### 2.2 Vercel Blob Storage

1. **Dashboard Vercel** → Votre projet → **Storage** → **Create Database**
2. Sélectionner **Blob**
3. Choisir un nom (ex: `inoxya-blob`)
4. Cliquer **Create**

**Résultat:** `BLOB_READ_WRITE_TOKEN` sera automatiquement ajouté aux variables d'environnement

### 2.3 Upstash Redis (Optionnel - pour rate limiting)

1. Aller sur [upstash.com](https://upstash.com)
2. Créer un compte (gratuit)
3. Créer une base Redis
4. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
5. Les ajouter manuellement dans Vercel (voir Étape 3)

---

## 🔐 ÉTAPE 3 : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### 3.1 Variables Automatiques (déjà ajoutées par Vercel)

Ces variables sont automatiquement ajoutées par Vercel lors de la création des intégrations:

- ✅ `DATABASE_URL` (Postgres)
- ✅ `BLOB_READ_WRITE_TOKEN` (Blob Storage)

### 3.2 Variables à Ajouter Manuellement

**Dashboard Vercel** → Votre projet → **Settings** → **Environment Variables**

| Variable | Type | Valeur | Description |
|----------|------|--------|-------------|
| `NODE_ENV` | Production, Preview, Development | `production` | Environnement |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | `https://votre-domaine.com` | **⚠️ À définir après déploiement** |
| `JWT_SECRET` | Production, Preview, Development | `[générer 32+ caractères]` | Secret JWT (voir ci-dessous) |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | `[URL Upstash]` | Optionnel - Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | `[Token Upstash]` | Optionnel - Rate limiting |
| `SMTP_HOST` | Production | `[smtp.example.com]` | Optionnel - Email |
| `SMTP_PORT` | Production | `587` | Optionnel - Email |
| `SMTP_USER` | Production | `[user@example.com]` | Optionnel - Email |
| `SMTP_PASS` | Production | `[password]` | Optionnel - Email |
| `ADMIN_EMAIL` | Production | `[admin@example.com]` | Optionnel - Email admin |

### 3.3 Générer JWT_SECRET

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: En ligne
# https://generate-secret.vercel.app/32
```

**Exemple:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## 📦 ÉTAPE 4 : MIGRATION SQLITE → POSTGRES

### 4.1 Préparer la Migration Locale

```bash
# 1. Installer les dépendances si nécessaire
npm install

# 2. Tester la connexion Postgres (dry-run)
npm run db:migrate
```

**Résultat attendu:**
```
📊 RAPPORT DE MIGRATION
==================================================
Mode: DRY-RUN (aucune modification)
Durée: X.XXs
Total lignes source: XXX
Total erreurs: 0

Détails par table:
  categories: X/X
  users: X/X
  products: X/X
  ...
```

### 4.2 Exécuter la Migration

⚠️ **IMPORTANT:** Vérifiez d'abord le dry-run avant d'exécuter!

```bash
# Migration réelle
npm run db:migrate:execute
```

**Résultat attendu:**
```
✅ Migration terminée avec succès!
```

### 4.3 Vérifier la Migration

```bash
# Option 1: Via Vercel Dashboard
# Storage → Postgres → Data → Voir les tables

# Option 2: Via script (si disponible)
npm run db:verify
```

---

## 🚀 ÉTAPE 5 : DÉPLOYER SUR VERCEL

### 5.1 Connecter le Repository

1. **Dashboard Vercel** → **Add New Project**
2. Importer depuis Git (GitHub/GitLab/Bitbucket)
3. Sélectionner le repository `inoxya-bijoux`
4. Cliquer **Import**

### 5.2 Configuration du Projet

Vercel détecte automatiquement Next.js. Vérifiez:

- **Framework Preset:** `Next.js`
- **Root Directory:** `./` (ou laisser vide)
- **Build Command:** `npm run build` (défaut)
- **Output Directory:** `.next` (défaut)
- **Install Command:** `npm install` (défaut)

### 5.3 Premier Déploiement (Preview)

1. Cliquer **Deploy**
2. Attendre la fin du build
3. Vérifier les logs pour erreurs

**URL Preview:** `https://inoxya-bijoux-xxx.vercel.app`

### 5.4 Vérifier le Déploiement Preview

```bash
# Tests à effectuer:
✅ Homepage charge
✅ Page produits charge
✅ Page packs charge
✅ Images se chargent (Vercel Blob)
✅ Admin login fonctionne
✅ Panier fonctionne
```

---

## 🌍 ÉTAPE 6 : CONFIGURER LE DOMAINE

### 6.1 Ajouter le Domaine sur Vercel

1. **Dashboard Vercel** → Votre projet → **Settings** → **Domains**
2. Cliquer **Add Domain**
3. Entrer votre domaine (ex: `www.inoxya-bijoux.com`)
4. Suivre les instructions DNS

### 6.2 Mettre à Jour NEXT_PUBLIC_SITE_URL

⚠️ **ATTENTION:** Ne définissez cette variable qu'après avoir configuré le domaine!

1. **Dashboard Vercel** → Votre projet → **Settings** → **Environment Variables**
2. Modifier `NEXT_PUBLIC_SITE_URL`:
   - **Production:** `https://www.inoxya-bijoux.com` (votre domaine final)
   - **Preview:** `https://inoxya-bijoux-xxx.vercel.app` (domaine preview)
3. **Redeploy** le projet pour appliquer les changements

---

## ✅ ÉTAPE 7 : VÉRIFICATIONS POST-DÉPLOIEMENT

### 7.1 Tests Fonctionnels

- [ ] **Homepage:** `/` charge correctement
- [ ] **Produits:** `/bijoux` affiche les produits
- [ ] **Packs:** `/packs` affiche les packs
- [ ] **Catégories:** Filtrage par catégorie fonctionne
- [ ] **Panier:** Ajout au panier fonctionne
- [ ] **Checkout:** Processus de commande complet
- [ ] **Admin:** Interface admin accessible (login requis)
- [ ] **Images:** Toutes les images se chargent (Vercel Blob)

### 7.2 Tests de Performance

- [ ] **Lighthouse:** Score > 90
- [ ] **Images:** Format WebP/AVIF activé
- [ ] **Bundle Size:** < 500 KB First Load JS ✅

### 7.3 Tests de Sécurité

- [ ] **HTTPS:** Forcé en production
- [ ] **Headers:** Security headers présents
- [ ] **CSRF:** Protection active sur mutations
- [ ] **Rate Limiting:** Fonctionne (si Redis configuré)

---

## 🔄 ROLLBACK STRATEGY

### Si Déploiement Échoue

1. **Vercel Dashboard** → **Deployments**
2. Sélectionner la version précédente
3. Cliquer **Promote to Production**

### Si Migration Échoue

1. Les données SQLite restent intactes (source)
2. Vider les tables Postgres si nécessaire
3. Relancer la migration

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Métriques à Surveiller

1. **Performance**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

2. **Erreurs**
   - Vercel Logs → Erreurs 500
   - Vercel Analytics → Erreurs frontend

3. **Base de Données**
   - Vercel Dashboard → Storage → Postgres → Metrics
   - Connexions actives
   - Temps de requête

---

## 🆘 DÉPANNAGE

### Problème: Build échoue

**Solution:**
1. Vérifier les logs Vercel
2. Vérifier `npm run build` localement
3. Vérifier les variables d'environnement

### Problème: Images ne se chargent pas

**Solution:**
1. Vérifier `BLOB_READ_WRITE_TOKEN` est défini
2. Vérifier `next.config.mjs` → `remotePatterns` inclut Vercel Blob
3. Vérifier les images sont uploadées sur Vercel Blob

### Problème: Base de données non accessible

**Solution:**
1. Vérifier `DATABASE_URL` est défini
2. Vérifier la connexion Postgres dans Vercel Dashboard
3. Vérifier les migrations sont exécutées

### Problème: Rate limiting ne fonctionne pas

**Solution:**
1. Vérifier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont définis
2. Vérifier Upstash Redis est actif
3. Le système utilise un fallback en mémoire si Redis n'est pas disponible

---

## ✅ CHECKLIST FINALE

### Avant Production
- [x] ✅ Build réussi localement
- [x] ✅ Variables d'environnement configurées
- [x] ✅ Vercel Postgres créé
- [x] ✅ Vercel Blob créé
- [x] ✅ Migration SQLite → Postgres exécutée
- [x] ✅ Preview déployé et testé
- [ ] ⚠️ Domaine configuré
- [ ] ⚠️ `NEXT_PUBLIC_SITE_URL` mis à jour avec le domaine final

### Après Production
- [ ] ⚠️ Smoke tests passent
- [ ] ⚠️ Monitoring configuré
- [ ] ⚠️ Backup automatique configuré (Vercel Postgres)

---

## 📝 NOTES IMPORTANTES

1. **Domain:** Ne définissez `NEXT_PUBLIC_SITE_URL` qu'après avoir configuré le domaine sur Vercel
2. **Migration:** Exécutez toujours un dry-run avant la migration réelle
3. **Backup:** Vercel Postgres inclut des backups automatiques (vérifier dans Dashboard)
4. **Monitoring:** Activez Vercel Analytics pour le monitoring en production

---

## 🎯 PROCHAINE ÉTAPE

**Une fois le domaine configuré, mettez à jour `NEXT_PUBLIC_SITE_URL` et redéployez.**

Le projet est maintenant prêt pour la production! 🚀

