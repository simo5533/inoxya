# 🚀 Guide de Déploiement - INOXYA BIJOUX

**PHASE 5 - Database & Deployment**

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Base de Données](#configuration-base-de-données)
3. [Migration SQLite → PostgreSQL](#migration-sqlite--postgresql)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Déploiement](#déploiement)
6. [Vérification Post-Déploiement](#vérification-post-déploiement)

---

## 🔧 Prérequis

### Outils requis
- Node.js 18+ 
- npm ou yarn
- Docker et Docker Compose (pour PostgreSQL local)
- Git

### Comptes requis (selon option)
- Vercel (déploiement Next.js)
- Supabase / Railway / DigitalOcean (base de données PostgreSQL)

---

## 🗄️ Configuration Base de Données

### Option 1: PostgreSQL Local (Développement)

```bash
# Démarrer PostgreSQL avec Docker
npm run db:start

# Vérifier la connexion
npm run db:verify

# Initialiser la base de données (si nécessaire)
npm run db:setup
```

### Option 2: Supabase (Recommandé - Gratuit jusqu'à 500MB)

1. **Créer un projet Supabase:**
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet
   - Noter l'URL et le mot de passe

2. **Configurer la connexion:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

3. **Exécuter les migrations:**
   - Ouvrir SQL Editor dans Supabase
   - Exécuter `scripts/setup-local-database.sql`

### Option 3: Railway

1. **Créer une base PostgreSQL:**
   - Aller sur [railway.app](https://railway.app)
   - Créer un nouveau projet
   - Ajouter PostgreSQL
   - Noter les variables de connexion

2. **Configurer:**
   ```env
   DATABASE_URL=<URL fournie par Railway>
   ```

### Option 4: VPS avec Docker

```bash
# Utiliser docker-compose
docker-compose up -d

# Configurer
DATABASE_URL=postgresql://inoxya_user:password@localhost:5432/inoxya_bijoux
```

---

## 🔄 Migration SQLite → PostgreSQL

Si vous avez des données dans SQLite à migrer vers PostgreSQL:

```bash
# 1. Démarrer PostgreSQL
npm run db:start

# 2. Vérifier la connexion
npm run db:verify

# 3. Exécuter la migration
npm run db:migrate
```

Le script de migration va:
- ✅ Migrer toutes les tables (users, categories, products, packs, orders, etc.)
- ✅ Préserver les IDs existants
- ✅ Gérer les doublons automatiquement
- ✅ Afficher un résumé détaillé

**Note:** Le script utilise `ON CONFLICT` pour éviter les doublons, donc il est sûr de l'exécuter plusieurs fois.

---

## 🔐 Variables d'Environnement

### Fichier `.env.local` (Développement)

```env
# Base de données
DATABASE_URL=postgresql://inoxya_user:inoxya_password_2024@localhost:5432/inoxya_bijoux
# OU variables séparées:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inoxya_bijoux
DB_USER=inoxya_user
DB_PASSWORD=inoxya_password_2024

# JWT (OBLIGATOIRE en production)
JWT_SECRET=votre-cle-secrete-minimum-32-caracteres

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@inoxya-bijoux.com
```

### Variables Production (OBLIGATOIRES)

```env
JWT_SECRET=<clé-64-caractères-minimum>
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votredomaine.com
DATABASE_URL=<URL PostgreSQL>
```

**⚠️ IMPORTANT:** 
- Ne jamais commiter `.env.local` dans Git
- Utiliser les variables d'environnement de votre plateforme de déploiement
- `JWT_SECRET` doit être unique et sécurisé (minimum 32 caractères)

---

## 🚀 Déploiement

### Option A: Vercel (Recommandé pour Next.js)

#### Étapes:

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
   vercel --prod
   ```

4. **Configurer les variables d'environnement:**
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionner votre projet
   - Settings → Environment Variables
   - Ajouter toutes les variables requises (voir [Variables pour Vercel](#variables-pour-vercel-redeploy) ci-dessous)

5. **Configurer la base de données:**
   - ⚠️ **IMPORTANT:** SQLite ne fonctionne pas sur Vercel (système de fichiers éphémère)
   - Utiliser **Supabase** (recommandé) ou **PostgreSQL** externe
   - Supabase : définir `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
   - Sinon : définir `DATABASE_URL` (postgresql://...)

#### Redeploy (un clic)

Une fois le projet connecté à Vercel et les variables configurées :

1. **Build command** (par défaut) : `npm run build` — ne rien changer sauf besoin spécifique.
2. **Variables d'environnement** : Vérifier que toutes sont définies (voir section ci-dessous).
3. **Redeploy** : Deployments → menu (⋯) sur le dernier déploiement → **Redeploy**.
4. Attendre la fin du build ; l’URL de preview ou de production sera mise à jour.

#### Variables pour Vercel (Redeploy)

À définir dans **Settings → Environment Variables** (Production + Preview si besoin) :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `JWT_SECRET` | Oui | Clé secrète JWT, min. 32 caractères |
| `NEXT_PUBLIC_SITE_URL` | Oui | URL du site (ex. `https://votresite.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Oui* | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui* | Clé "service role" Supabase |
| `DATABASE_URL` | Oui** | URL PostgreSQL (si pas Supabase) |

\* Si vous utilisez Supabase (recommandé sur Vercel).  
\** Si vous n’utilisez pas Supabase, fournir une URL PostgreSQL (Railway, Neon, etc.).

#### Avantages:
- ✅ Support Next.js natif
- ✅ Déploiement automatique depuis Git
- ✅ HTTPS automatique
- ✅ CDN global

### Option B: VPS (Railway, DigitalOcean, etc.)

1. **Créer un nouveau projet:**
   ```bash
   git clone <votre-repo>
   cd inoxya-bijoux
   ```

2. **Installer les dépendances:**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement:**
   - Créer `.env.local` avec toutes les variables

4. **Démarrer PostgreSQL:**
   ```bash
   npm run db:start
   ```

5. **Initialiser la base de données:**
   ```bash
   npm run db:setup
   ```

6. **Build et démarrage:**
   ```bash
   npm run build
   npm start
   ```

#### Avantages:
- ✅ Contrôle total
- ✅ PostgreSQL via Docker
- ✅ Persistance des données

---

## ✅ Vérification Post-Déploiement

### 1. Vérifier la connexion PostgreSQL

```bash
npm run db:verify
```

### 2. Tester les routes API

```bash
# Test CRUD
npm run test:crud

# Test APIs
npm run test:apis

# Test complet
npm run test:all
```

### 3. Checklist manuelle

- [ ] Page d'accueil charge correctement
- [ ] Authentification admin fonctionne
- [ ] Création de produit fonctionne
- [ ] Processus de commande complet fonctionne
- [ ] Notifications admin fonctionnent
- [ ] Images s'affichent correctement
- [ ] HTTPS activé (production)
- [ ] Variables d'environnement configurées

### 4. Vérifier les logs

```bash
# Logs PostgreSQL
npm run db:logs

# Logs application (Vercel)
vercel logs

# Logs application (VPS)
pm2 logs
```

---

## 🔧 Dépannage

### Erreur: "Cannot connect to PostgreSQL"

**Solutions:**
1. Vérifier que PostgreSQL est démarré: `npm run db:start`
2. Vérifier les variables d'environnement: `npm run db:verify`
3. Vérifier les credentials dans `.env.local`
4. Vérifier que le port 5432 n'est pas utilisé par un autre service

### Erreur: "JWT_SECRET must be set"

**Solution:**
- Configurer `JWT_SECRET` dans les variables d'environnement (minimum 32 caractères)

### Erreur: "Table does not exist"

**Solution:**
- Exécuter `npm run db:setup` pour initialiser les tables
- Ou exécuter `scripts/setup-local-database.sql` manuellement

### Erreur: "Rate limit exceeded"

**Solution:**
- Attendre 15 minutes (blocage temporaire)
- Vérifier les logs pour identifier la source

---

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Supabase](https://supabase.com/docs)

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs: `npm run db:logs`
2. Vérifier la connexion: `npm run db:verify`
3. Consulter la documentation
4. Créer une issue sur le repository

---

**Dernière mise à jour:** 2025-01-27  
**Version:** PHASE 5 - Database & Deployment

