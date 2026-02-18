# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - INOXYA BIJOUX

**Date:** 2025-01-15  
**Version:** 1.0  
**Objectif:** Déployer INOXYA BIJOUX en production de manière sécurisée

---

## 📋 PRÉREQUIS

### 1. Comptes et Services Requis

- [ ] Compte sur plateforme de déploiement (Vercel, Railway, etc.)
- [ ] Base de données PostgreSQL (Supabase, Railway, ou VPS)
- [ ] Domaine personnalisé (optionnel mais recommandé)
- [ ] Service email SMTP (optionnel, pour notifications)

### 2. Outils Locaux

- [ ] Node.js 18+ installé
- [ ] Git installé
- [ ] Accès SSH à serveur (si VPS)

---

## 🔧 ÉTAPE 1: CONFIGURATION LOCALE

### 1.1 Créer `.env.local`

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local
```

### 1.2 Générer JWT_SECRET

```bash
# Générer une clé sécurisée de 64 caractères
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copier le résultat dans `.env.local`:
```env
JWT_SECRET=<votre-clé-générée>
```

### 1.3 Configurer Variables d'Environnement

Éditer `.env.local` avec vos valeurs:

```env
# OBLIGATOIRE
JWT_SECRET=<votre-clé-64-caractères>
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votredomaine.com

# BASE DE DONNÉES (PostgreSQL recommandé)
DATABASE_URL=postgresql://user:password@host:5432/inoxya_bijoux

# EMAIL (Optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@votredomaine.com
```

---

## 🗄️ ÉTAPE 2: CONFIGURATION BASE DE DONNÉES

### Option A: Supabase (Recommandé - Gratuit jusqu'à 500MB)

1. **Créer un projet Supabase:**
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet
   - Noter l'URL et la clé anonyme

2. **Configurer la connexion:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

3. **Exécuter les migrations:**
   - Ouvrir SQL Editor dans Supabase
   - Exécuter les scripts SQL depuis `scripts/`

### Option B: Railway (Recommandé - Simple)

1. **Créer un projet PostgreSQL:**
   - Aller sur [railway.app](https://railway.app)
   - Créer un nouveau projet
   - Ajouter PostgreSQL
   - Copier la `DATABASE_URL`

2. **Configurer:**
   ```env
   DATABASE_URL=<railway-postgres-url>
   ```

### Option C: VPS avec Docker

1. **Installer Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Démarrer PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Configurer:**
   ```env
   DATABASE_URL=postgresql://inoxya_user:password@localhost:5432/inoxya_bijoux
   ```

---

## 🚀 ÉTAPE 3: DÉPLOIEMENT

### Option A: Vercel (Recommandé pour Next.js)

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

4. **Configurer variables d'environnement:**
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionner le projet
   - Settings → Environment Variables
   - Ajouter toutes les variables de `.env.local`

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Option B: Railway

1. **Connecter le repo:**
   - Aller sur [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Sélectionner le repo

2. **Configurer variables:**
   - Variables → Add Variable
   - Ajouter toutes les variables

3. **Déployer:**
   - Railway déploie automatiquement

### Option C: VPS (Vultr, DigitalOcean, etc.)

1. **Préparer le serveur:**
   ```bash
   # Mettre à jour
   sudo apt update && sudo apt upgrade -y
   
   # Installer Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Installer PM2
   sudo npm install -g pm2
   ```

2. **Cloner le repo:**
   ```bash
   git clone https://github.com/votre-repo/inoxya-bijoux.git
   cd inoxya-bijoux
   ```

3. **Installer dépendances:**
   ```bash
   npm install
   ```

4. **Créer `.env.local`:**
   ```bash
   nano .env.local
   # Coller les variables
   ```

5. **Build:**
   ```bash
   npm run build
   ```

6. **Démarrer avec PM2:**
   ```bash
   pm2 start npm --name "inoxya-bijoux" -- start
   pm2 save
   pm2 startup
   ```

7. **Configurer Nginx (reverse proxy):**
   ```nginx
   server {
       listen 80;
       server_name votredomaine.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **SSL avec Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d votredomaine.com
   ```

---

## ✅ ÉTAPE 4: VÉRIFICATIONS POST-DÉPLOIEMENT

### 4.1 Tests Fonctionnels

- [ ] Page d'accueil charge correctement
- [ ] Authentification fonctionne (login/register)
- [ ] Liste des produits s'affiche
- [ ] Détails produit fonctionne
- [ ] Panier fonctionne (ajout/suppression)
- [ ] Favoris fonctionne
- [ ] Checkout fonctionne
- [ ] Interface admin accessible (admin uniquement)
- [ ] CRUD produits fonctionne (admin)
- [ ] Commandes s'affichent (admin)

### 4.2 Tests Sécurité

- [ ] HTTPS forcé (redirection HTTP → HTTPS)
- [ ] Headers sécurité présents (HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting fonctionne (tester login avec 6 tentatives)
- [ ] Routes admin protégées (403 si non-admin)
- [ ] Validation inputs fonctionne
- [ ] Cookies httpOnly et Secure

### 4.3 Tests Performance

- [ ] Temps de chargement < 3s
- [ ] Images optimisées
- [ ] Bundle size acceptable
- [ ] Pas d'erreurs console

### 4.4 Tests Base de Données

- [ ] Connexion PostgreSQL réussie
- [ ] Tables créées correctement
- [ ] Données de test présentes
- [ ] Requêtes fonctionnent

---

## 🔒 ÉTAPE 5: SÉCURITÉ PRODUCTION

### 5.1 Checklist Sécurité

- [ ] `.env.local` jamais commité dans Git
- [ ] JWT_SECRET unique et sécurisé (64 caractères)
- [ ] Mots de passe BDD forts
- [ ] HTTPS activé et forcé
- [ ] Headers sécurité configurés
- [ ] Rate limiting actif
- [ ] Backup automatique BDD configuré
- [ ] Monitoring erreurs configuré (Sentry, etc.)

### 5.2 Backup Automatique

**Option A: Supabase**
- Backup automatique inclus
- Configurer backup quotidien dans settings

**Option B: Railway**
- Configurer backup automatique dans PostgreSQL service

**Option C: VPS**
```bash
# Script de backup quotidien
0 2 * * * pg_dump -U inoxya_user inoxya_bijoux > /backups/inoxya_$(date +\%Y\%m\%d).sql
```

---

## 📊 ÉTAPE 6: MONITORING

### 6.1 Logging

**Option A: Vercel**
- Logs automatiques dans dashboard
- Analytics intégrés

**Option B: Sentry**
```bash
npm install @sentry/nextjs
```

Configuration dans `sentry.client.config.ts` et `sentry.server.config.ts`

### 6.2 Analytics

**Google Analytics:**
```tsx
// app/layout.tsx
import Script from 'next/script'

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

---

## 🐛 DÉPANNAGE

### Problème: Erreur 503 - Base de données indisponible

**Solution:**
1. Vérifier `DATABASE_URL` dans variables d'environnement
2. Vérifier connexion PostgreSQL
3. Vérifier que tables sont créées

### Problème: Erreur CORS

**Solution:**
1. Vérifier `NEXT_PUBLIC_SITE_URL` dans variables
2. Vérifier configuration CORS dans middleware

### Problème: Erreur JWT

**Solution:**
1. Vérifier `JWT_SECRET` est défini (min 32 caractères)
2. Vérifier que secret est le même partout

### Problème: Images ne s'affichent pas

**Solution:**
1. Vérifier chemins images (relatifs vs absolus)
2. Vérifier configuration `next.config.mjs` pour images
3. Vérifier permissions fichiers

---

## 📞 SUPPORT

En cas de problème:

1. Vérifier les logs de déploiement
2. Vérifier les logs de la base de données
3. Vérifier les variables d'environnement
4. Consulter la documentation Next.js
5. Consulter `RAPPORT_ANALYSE_FINALE_COMPLETE.md`

---

## ✅ CHECKLIST FINALE

### Avant Déploiement
- [ ] `.env.local` créé avec toutes les variables
- [ ] JWT_SECRET généré (64 caractères)
- [ ] Base de données PostgreSQL configurée
- [ ] Tests locaux réussis (`npm run build`)

### Déploiement
- [ ] Application déployée
- [ ] Variables d'environnement configurées
- [ ] Domaine configuré (si applicable)
- [ ] SSL/TLS activé

### Post-Déploiement
- [ ] Tous les tests fonctionnels passent
- [ ] Tests sécurité passent
- [ ] Performance acceptable
- [ ] Backup configuré
- [ ] Monitoring configuré

---

**🎉 Félicitations ! Votre application INOXYA BIJOUX est maintenant en production !**

