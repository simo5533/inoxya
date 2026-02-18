# 💎 INOXYA BIJOUX - E-commerce de Bijoux Premium

**Embellie ton âme** - Collection exclusive de bijoux en acier inoxydable premium

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-green)](https://tailwindcss.com/)

---

## 📋 Table des matières

1. [Présentation](#présentation)
2. [Fonctionnalités](#fonctionnalités)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Développement](#développement)
6. [Déploiement](#déploiement)
7. [Documentation](#documentation)
8. [Support](#support)

---

## 🎯 Présentation

INOXYA BIJOUX est une plateforme e-commerce moderne pour la vente de bijoux en acier inoxydable premium. Le site propose une collection exclusive de bijoux berbères authentiques avec une interface utilisateur élégante et premium.

### Technologies

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **Base de données:** SQLite (dev) / PostgreSQL (production)
- **Validation:** Zod
- **Sécurité:** CSRF, CSP, Validation stricte
- **SEO:** Metadata optimisées, Structured Data, Sitemap

---

## ✨ Fonctionnalités

### 🛍️ E-commerce
- ✅ Catalogue produits avec filtres et recherche
- ✅ Pages détail produits avec galerie d'images
- ✅ Système de packs/collections
- ✅ Panier persistant
- ✅ Favoris utilisateur
- ✅ Checkout sécurisé
- ✅ Gestion des commandes

### 👤 Authentification
- ✅ Inscription/Connexion par téléphone
- ✅ Système de rôles (user, moderator, admin)
- ✅ Sessions sécurisées (JWT, cookies httpOnly)
- ✅ Protection CSRF

### 🎨 Interface
- ✅ Design premium (palette noir/ivoire/or)
- ✅ Responsive (mobile, tablette, desktop)
- ✅ Animations fluides
- ✅ Accessibilité améliorée

### 🔒 Sécurité
- ✅ Validation Zod sur toutes les routes API
- ✅ Protection CSRF
- ✅ Headers de sécurité (CSP, HSTS, etc.)
- ✅ Sanitization des entrées
- ✅ Rate limiting

### 📊 Administration
- ✅ Dashboard admin complet
- ✅ Gestion produits (CRUD)
- ✅ Gestion packs
- ✅ Gestion commandes
- ✅ Statistiques

### 🔍 SEO
- ✅ Metadata optimisées
- ✅ Structured Data (JSON-LD)
- ✅ Sitemap dynamique
- ✅ robots.txt
- ✅ OpenGraph et Twitter Cards

---

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Git

### Étapes

1. **Cloner le repository:**
   ```bash
   git clone <repository-url>
   cd inoxya-bijoux
   ```

2. **Installer les dépendances:**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement:**
   ```bash
   cp .env.example .env.local
   # Éditer .env.local avec vos valeurs
   ```

4. **Initialiser la base de données:**
   ```bash
   # Pour SQLite (développement)
   npm run db:seed
   
   # Pour PostgreSQL (production)
   npm run db:start
   npm run db:seed
   ```

5. **Lancer le serveur de développement:**
   ```bash
   npm run dev
   ```

6. **Ouvrir dans le navigateur:**
   ```
   http://localhost:3000
   ```

---

## ⚙️ Configuration

### Variables d'Environnement

Voir `.env.example` pour la liste complète des variables.

**Variables obligatoires:**
- `JWT_SECRET` - Clé secrète pour JWT (minimum 32 caractères)
- `NEXT_PUBLIC_SITE_URL` - URL du site
- `NODE_ENV` - `development` ou `production`

**Base de données:**
- SQLite (développement): Aucune configuration requise
- PostgreSQL (production): Voir `docs/DEPLOYMENT.md`

### Comptes par défaut

Après le seed:
- **Admin:** `phone=admin`, `password=Admin123!`
- **Modérateur:** `phone=0698765432`, `password=password`
- **Utilisateur:** `phone=0612345678`, `password=password`

---

## 💻 Développement

### Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linter

# Base de données
npm run db:start     # Démarrer PostgreSQL (Docker)
npm run db:stop      # Arrêter PostgreSQL
npm run db:verify    # Vérifier connexion PostgreSQL
npm run db:migrate   # Migrer SQLite → PostgreSQL
npm run db:seed      # Seed PostgreSQL

# Tests
npm run test:crud    # Tests CRUD
npm run test:apis    # Tests APIs
npm run test:all     # Tous les tests
```

### Structure du projet

```
inoxya-bijoux/
├── app/                 # Pages Next.js (App Router)
│   ├── api/            # Routes API
│   ├── admin/          # Pages admin
│   ├── bijoux/         # Pages produits
│   └── packs/          # Pages packs
├── components/          # Composants React
│   ├── ui/             # Composants shadcn/ui
│   └── admin/          # Composants admin
├── lib/                 # Utilitaires
│   ├── database.ts     # Accès données
│   ├── security.ts     # Sécurité
│   ├── validations.ts  # Schémas Zod
│   └── ...
├── scripts/             # Scripts utilitaires
├── public/              # Assets statiques
└── docs/                # Documentation
```

---

## 🚀 Déploiement

### Options de déploiement

1. **Vercel** (Recommandé pour Next.js)
   - Support Next.js natif
   - Déploiement automatique depuis Git
   - HTTPS automatique

2. **VPS** (Railway, DigitalOcean, etc.)
   - Contrôle total
   - PostgreSQL via Docker
   - Persistance des données

### Guide complet

Voir `docs/DEPLOYMENT.md` pour les instructions détaillées de déploiement.

### Checklist pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL configurée
- [ ] `JWT_SECRET` défini (minimum 32 caractères)
- [ ] `NEXT_PUBLIC_SITE_URL` défini
- [ ] Build réussi (`npm run build`)
- [ ] Tests passés (`npm run test:all`)

---

## 📚 Documentation

### Documentation disponible

- **`docs/CHANGELOG.md`** - Historique des changements
- **`docs/DEPLOYMENT.md`** - Guide de déploiement
- **`docs/PHASE_4_SUMMARY.md`** - Résumé sécurité
- **`docs/PHASE_5_SUMMARY.md`** - Résumé déploiement

### Phases de développement

- ✅ **PHASE 0** - Baseline & Inventory
- ✅ **PHASE 1** - Fix Product Photos
- ✅ **PHASE 2** - Luxury UI/UX Rebrand
- ✅ **PHASE 3** - SEO + Social Sharing
- ✅ **PHASE 4** - Security Hardening
- ✅ **PHASE 5** - Database & Deployment

---

## 🛠️ Technologies utilisées

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### Backend
- Next.js API Routes
- SQLite / PostgreSQL
- Zod (validation)
- bcryptjs (hachage)
- jsonwebtoken (sessions)

### Sécurité
- CSRF Protection
- Content Security Policy
- Headers de sécurité
- Validation stricte (Zod)
- Rate limiting

---

## 📊 Statistiques

- **9 routes API** sécurisées avec Zod
- **3 routes** protégées avec CSRF
- **Validation** sur toutes les entrées
- **SEO** optimisé (metadata, structured data)
- **Performance** optimisée (Next.js Image, lazy loading)

---

## 🆘 Support

### Problèmes courants

**Erreur: "Cannot connect to PostgreSQL"**
```bash
npm run db:start
npm run db:verify
```

**Erreur: "JWT_SECRET must be set"**
- Configurer `JWT_SECRET` dans `.env.local` (minimum 32 caractères)

**Erreur: "Table does not exist"**
```bash
npm run db:seed
```

### Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)

---

## 📝 Licence

Propriétaire - INOXYA BIJOUX

---

## 👥 Équipe

Développé avec ❤️ pour INOXYA BIJOUX

---

**Dernière mise à jour:** 2025-01-27  
**Version:** 1.0.0
