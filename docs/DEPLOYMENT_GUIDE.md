# 🚀 GUIDE DE DÉPLOIEMENT - INOXYA BIJOUX

**Date:** 2025-02-14  
**Version:** Production Ready

---

## 📋 PRÉREQUIS

- Node.js 18+ installé
- Base de données SQLite (dev) ou PostgreSQL (production)
- Variables d'environnement configurées

---

## 🔧 ÉTAPE 1: CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

### Créer `.env.local` (copier depuis `env.example`)

```bash
# OBLIGATOIRE
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votredomaine.com
JWT_SECRET=<généré-avec-openssl-rand-base64-32>

# BASE DE DONNÉES (Production: PostgreSQL recommandé)
DATABASE_URL=postgresql://user:password@host:5432/database

# OPTIONNEL (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@inoxya-bijoux.com
SMTP_PASS=<app-password>
ADMIN_EMAIL=admin@inoxya-bijoux.com

# IMPORTANT: En production, ces variables doivent être à 0 ou non définies
ENABLE_FALLBACK=0
ENABLE_DEMO_SEED=0
```

### Générer JWT_SECRET

```bash
openssl rand -base64 32
```

---

## 🗄️ ÉTAPE 2: BASE DE DONNÉES

### Option A: SQLite (Développement)

Aucune configuration requise. La base sera créée dans `data/inoxya_bijoux.db`.

### Option B: PostgreSQL (Production recommandé)

1. Créer la base de données:
```sql
CREATE DATABASE inoxya_bijoux;
```

2. Configurer `DATABASE_URL` dans `.env.local`

3. Les tables seront créées automatiquement au premier démarrage

---

## 👤 ÉTAPE 3: CRÉER L'UTILISATEUR ADMIN

```bash
npm run admin:create
```

Ou manuellement via SQL:
```bash
npm run admin:sql
# Puis exécuter le SQL généré dans scripts/create-admin.sql
```

**Identifiants par défaut:**
- Téléphone: `0612345678` ou `admin_phone`
- Mot de passe: `Admin123!`

⚠️ **CHANGEZ LE MOT DE PASSE EN PRODUCTION!**

---

## 🏗️ ÉTAPE 4: BUILD ET DÉPLOIEMENT

### Build de production

```bash
npm install
npm run build
```

### Vérification avant déploiement

```bash
npm run verify:all
npm run smoke:test
```

### Démarrer le serveur

```bash
npm start
```

---

## 🌐 OPTIONS DE DÉPLOIEMENT

### Option 1: Vercel (Recommandé)

1. Connecter votre repo GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel Dashboard
3. Déployer automatiquement

**Variables à configurer dans Vercel:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://votredomaine.com`
- `JWT_SECRET=<votre-secret>`
- `DATABASE_URL=<postgresql-url>`
- `ENABLE_FALLBACK` (non défini ou 0)
- `ENABLE_DEMO_SEED` (non défini ou 0)

### Option 2: VPS (Docker)

1. Créer `Dockerfile` (déjà présent)
2. Build l'image:
```bash
docker build -t inoxya-bijoux .
```

3. Run le container:
```bash
docker run -p 3000:3000 --env-file .env.local inoxya-bijoux
```

### Option 3: VPS (Direct)

1. Installer Node.js 18+ sur le VPS
2. Cloner le repo
3. Configurer `.env.local`
4. `npm install && npm run build && npm start`

---

## ✅ POST-DÉPLOIEMENT

### Vérifications

1. **Site accessible:** `https://votredomaine.com`
2. **Pages principales fonctionnelles:**
   - `/` (homepage)
   - `/bijoux` (collection)
   - `/packs` (packs)
   - `/admin` (interface admin)
3. **API fonctionnelles:**
   - `GET /api/products`
   - `GET /api/packs`
   - `GET /api/categories`
4. **Admin accessible:**
   - Connexion fonctionne
   - CRUD produits fonctionne
   - CRUD packs fonctionne

### Monitoring

- Vérifier les logs serveur pour erreurs
- Vérifier que les images s'affichent correctement
- Tester le processus de commande complet

---

## 🔒 SÉCURITÉ EN PRODUCTION

- ✅ HTTPS activé (Vercel le fait automatiquement)
- ✅ Headers de sécurité configurés dans `next.config.mjs`
- ✅ CSRF protection activée
- ✅ Rate limiting sur auth
- ✅ Validation Zod sur toutes les entrées
- ✅ Cookies httpOnly, secure, sameSite strict

---

## 📝 NOTES IMPORTANTES

1. **ENABLE_FALLBACK:** Ne JAMAIS activer en production. Le fallback génère des produits demo depuis les images.

2. **ENABLE_DEMO_SEED:** Ne JAMAIS activer en production. Le seed insère des données demo.

3. **JWT_SECRET:** Doit être unique et sécurisé (64+ caractères recommandé).

4. **Base de données:** En production, utilisez PostgreSQL pour la scalabilité.

5. **Backup:** Configurez des backups automatiques de la base de données.

---

**Fin du guide**

