# 🚀 GUIDE DE DÉPLOIEMENT FINAL - INOXYA BIJOUX

**Date:** 2025-01-27  
**Version:** 2.0  
**Statut:** ✅ PRÊT POUR PRODUCTION

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Configuration Locale](#configuration-locale)
3. [Tests Pré-Déploiement](#tests-pré-déploiement)
4. [Configuration Production](#configuration-production)
5. [Déploiement](#déploiement)
6. [Vérifications Post-Déploiement](#vérifications-post-déploiement)
7. [Maintenance](#maintenance)

---

## 1. PRÉREQUIS

### 1.1 Comptes et Services

- [ ] Compte sur plateforme de déploiement (Vercel, Railway, DigitalOcean, etc.)
- [ ] Base de données PostgreSQL (Supabase, Railway, ou VPS)
- [ ] Domaine personnalisé (optionnel mais recommandé)
- [ ] Service email SMTP (optionnel, pour notifications)

### 1.2 Outils Locaux

- [ ] Node.js 18+ installé
- [ ] Git installé
- [ ] Accès SSH à serveur (si VPS)
- [ ] Accès à la plateforme de déploiement

---

## 2. CONFIGURATION LOCALE

### 2.1 Cloner et Installer

```bash
# Cloner le projet (si pas déjà fait)
git clone <votre-repo>
cd inoxya-bijoux

# Installer les dépendances
npm install
```

### 2.2 Créer `.env.local`

```bash
# Générer automatiquement
npm run setup

# OU créer manuellement
cp env.example .env.local
```

### 2.3 Configurer les Variables d'Environnement

Éditer `.env.local` avec vos valeurs:

```env
# ==================== OBLIGATOIRE ====================
JWT_SECRET=<clé-64-caractères-générée-automatiquement>
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votredomaine.com

# ==================== BASE DE DONNÉES ====================
# Option 1: PostgreSQL (RECOMMANDÉ pour production)
DATABASE_URL=postgresql://user:password@host:5432/inoxya_bijoux

# OU variables séparées:
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=inoxya_bijoux
DB_USER=inoxya_user
DB_PASSWORD=your-secure-password

# Option 2: SQLite (développement uniquement - NE PAS UTILISER sur Vercel)
USE_LOCAL_DB=true
DB_PATH=./data/inoxya_bijoux.db

# ==================== EMAIL (Optionnel) ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@votredomaine.com
```

### 2.4 Générer JWT_SECRET

```bash
# Générer une clé sécurisée
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copier le résultat dans `.env.local` comme valeur de `JWT_SECRET`.

---

## 3. TESTS PRÉ-DÉPLOIEMENT

### 3.1 Tests CRUD

```bash
# Tester toutes les opérations CRUD
node scripts/test-complete-crud.js
```

**Résultat attendu:** ✅ 15/15 tests réussis (100%)

### 3.2 Tests APIs

```bash
# Démarrer le serveur de développement
npm run dev

# Dans un autre terminal, tester les APIs
node scripts/test-all-apis.js
```

**Résultat attendu:** ✅ Tous les tests passent

### 3.3 Tests Manuels

1. **Se connecter en admin:**
   - Aller sur http://localhost:3000/login
   - Téléphone: `0612345678`
   - Mot de passe: `Admin123!`
   - Vérifier la redirection vers `/admin`

2. **Tester CRUD Produits:**
   - Créer un produit → Vérifier qu'il apparaît
   - Modifier un produit → Vérifier les changements
   - Supprimer un produit → Vérifier la suppression

3. **Tester le Checkout:**
   - Ajouter des produits au panier
   - Aller au checkout
   - Créer une commande
   - Vérifier dans `/admin/orders` que la commande apparaît
   - Vérifier dans `/admin/payments` que le paiement est créé
   - Vérifier dans `/admin/notifications` que la notification est créée

4. **Tester les Modifications de Statut:**
   - Modifier le statut d'une commande
   - Modifier le statut d'un paiement
   - Vérifier que les changements sont enregistrés

### 3.4 Build de Production

```bash
# Tester le build de production
npm run build

# Vérifier qu'il n'y a pas d'erreurs
# Le build doit se terminer avec succès
```

---

## 4. CONFIGURATION PRODUCTION

### 4.1 Base de Données PostgreSQL

#### Option A: Supabase (Recommandé - Gratuit jusqu'à 500MB)

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
   - Exécuter le script de création des tables (voir `scripts/setup-local-database.sql`)

#### Option B: Railway

1. **Créer une base PostgreSQL:**
   - Aller sur [railway.app](https://railway.app)
   - Créer un nouveau projet
   - Ajouter PostgreSQL
   - Noter les variables de connexion

2. **Configurer:**
   ```env
   DATABASE_URL=<URL fournie par Railway>
   ```

#### Option C: VPS avec Docker

1. **Utiliser docker-compose:**
   ```bash
   docker-compose up -d
   ```

2. **Configurer:**
   ```env
   DATABASE_URL=postgresql://inoxya_user:password@localhost:5432/inoxya_bijoux
   ```

### 4.2 Variables d'Environnement en Production

**⚠️ IMPORTANT:** Configurer toutes les variables sur votre plateforme de déploiement:

- `JWT_SECRET` (obligatoire)
- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL` (votre domaine)
- `DATABASE_URL` (PostgreSQL)
- `SMTP_*` (si emails activés)

---

## 5. DÉPLOIEMENT

### 5.1 Option A: Vercel (Recommandé pour Next.js)

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
   - Aller dans Settings → Environment Variables
   - Ajouter toutes les variables nécessaires

5. **⚠️ IMPORTANT - Base de Données:**
   - SQLite ne fonctionne PAS sur Vercel (système de fichiers éphémère)
   - Utiliser PostgreSQL externe (Supabase, Railway, etc.)
   - Configurer `DATABASE_URL` dans les variables d'environnement

#### Configuration `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

### 5.2 Option B: Railway

1. **Connecter votre repo GitHub**
2. **Railway détecte automatiquement Next.js**
3. **Ajouter PostgreSQL:**
   - Cliquer sur "New" → "Database" → "PostgreSQL"
4. **Configurer les variables:**
   - Railway crée automatiquement `DATABASE_URL`
   - Ajouter les autres variables manuellement

### 5.3 Option C: VPS (DigitalOcean, AWS, etc.)

1. **Se connecter en SSH:**
   ```bash
   ssh user@your-server.com
   ```

2. **Installer Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Cloner le projet:**
   ```bash
   git clone <votre-repo>
   cd inoxya-bijoux
   ```

4. **Installer les dépendances:**
   ```bash
   npm install
   ```

5. **Configurer `.env.local`:**
   ```bash
   nano .env.local
   # Ajouter toutes les variables
   ```

6. **Build et démarrer:**
   ```bash
   npm run build
   npm start
   ```

7. **Utiliser PM2 pour la production:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "inoxya-bijoux" -- start
   pm2 save
   pm2 startup
   ```

---

## 6. VÉRIFICATIONS POST-DÉPLOIEMENT

### 6.1 Vérifications de Base

- [ ] Site accessible sur votre domaine
- [ ] HTTPS activé (certificat SSL)
- [ ] Redirection HTTP → HTTPS fonctionnelle

### 6.2 Vérifications Fonctionnelles

- [ ] Page d'accueil charge correctement
- [ ] Produits s'affichent
- [ ] Connexion admin fonctionne
- [ ] Interface admin accessible
- [ ] CRUD produits fonctionne
- [ ] Checkout fonctionne
- [ ] Commandes s'enregistrent
- [ ] Paiements s'enregistrent
- [ ] Notifications admin fonctionnent

### 6.3 Vérifications de Sécurité

- [ ] Headers de sécurité présents (vérifier avec [securityheaders.com](https://securityheaders.com))
- [ ] Cookies httpOnly et sécurisés
- [ ] JWT_SECRET configuré (pas de placeholder)
- [ ] Base de données accessible uniquement depuis le serveur
- [ ] Variables d'environnement non exposées

### 6.4 Tests de Performance

- [ ] Temps de chargement < 3 secondes
- [ ] Images optimisées
- [ ] Build de production optimisé

---

## 7. MAINTENANCE

### 7.1 Sauvegardes

**Base de Données:**
- Configurer des sauvegardes automatiques quotidiennes
- Tester la restauration régulièrement

**Code:**
- Utiliser Git pour versionner
- Créer des tags pour les versions

### 7.2 Monitoring

- Configurer des alertes pour les erreurs
- Monitorer les performances
- Surveiller l'utilisation de la base de données

### 7.3 Mises à Jour

- Mettre à jour les dépendances régulièrement
- Tester en local avant de déployer
- Utiliser un environnement de staging si possible

---

## ✅ CHECKLIST FINALE

### Avant le Déploiement
- [ ] Tous les tests passent (CRUD + APIs)
- [ ] Build de production réussi
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL configurée
- [ ] JWT_SECRET généré et configuré
- [ ] Domaine configuré (si applicable)

### Après le Déploiement
- [ ] Site accessible
- [ ] HTTPS activé
- [ ] Connexion admin fonctionne
- [ ] CRUD fonctionne
- [ ] Checkout fonctionne
- [ ] Commandes s'enregistrent
- [ ] Sécurité vérifiée

---

## 🆘 DÉPANNAGE

### Problème: Erreur 503 - Base de données indisponible

**Solution:**
- Vérifier que `DATABASE_URL` est correctement configuré
- Vérifier que la base de données est accessible
- Vérifier les credentials

### Problème: Erreur JWT_SECRET manquant

**Solution:**
- Vérifier que `JWT_SECRET` est configuré dans les variables d'environnement
- Régénérer une nouvelle clé si nécessaire

### Problème: Images ne s'affichent pas

**Solution:**
- Vérifier les chemins d'images
- Vérifier la configuration Next.js Image
- Vérifier les permissions des fichiers

---

## 📞 SUPPORT

Pour toute question ou problème:
1. Vérifier les logs de l'application
2. Vérifier les logs de la base de données
3. Consulter la documentation
4. Vérifier les issues GitHub (si applicable)

---

**🎉 FÉLICITATIONS ! Votre projet est déployé et prêt pour la production !**

