# ✅ CHECKLIST DÉPLOIEMENT VISUELLE
## Cochez chaque étape au fur et à mesure

**Date:** 2025-01-27  
**Temps estimé:** 10 minutes

---

## 📋 PRÉPARATION (2 minutes)

### Avant de Commencer

- [ ] **Projet sur GitHub**
  - [ ] Code poussé sur GitHub
  - [ ] Repository accessible

- [ ] **Build local réussi**
  ```bash
  npm run build
  ```
  - [ ] Build terminé sans erreur

- [ ] **Script de préparation exécuté** (optionnel)
  ```bash
  .\scripts\prepare-deployment.ps1
  ```
  - [ ] Script exécuté
  - [ ] Aucune erreur

---

## 🎯 ÉTAPE 1: COMPTE VERCEL (2 minutes)

### Créer/Connecter le Compte

- [ ] **Aller sur https://vercel.com**
- [ ] **Cliquer sur "Sign Up" ou "Get Started"**
- [ ] **Choisir "Continue with GitHub"**
- [ ] **Autoriser Vercel** (bouton "Authorize Vercel")
- [ ] **Dashboard Vercel visible** ✅

---

## 🎯 ÉTAPE 2: CRÉER PROJET (1 minute)

### Importer le Repository

- [ ] **Cliquer sur "Add New..."** (en haut)
- [ ] **Sélectionner "Project"**
- [ ] **Trouver votre repository** `inoxya-bijoux`
- [ ] **Cliquer sur "Import"**
- [ ] **Page "Configure Project" visible** ✅

---

## 🎯 ÉTAPE 3: VARIABLES D'ENVIRONNEMENT (3 minutes)

### Configurer les Variables

- [ ] **Section "Environment Variables" trouvée**
- [ ] **Cliquer sur "Add"** (nouvelle variable)

#### Variable 1: NEXT_PUBLIC_SITE_URL
- [ ] **Key:** `NEXT_PUBLIC_SITE_URL`
- [ ] **Value:** `https://inoxya-bijoux.vercel.app`
- [ ] **3 cases cochées:** Production, Preview, Development
- [ ] **Cliquer sur "Add"**

#### Variable 2: JWT_SECRET
- [ ] **JWT_SECRET généré** (terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- [ ] **Key:** `JWT_SECRET`
- [ ] **Value:** (coller la valeur générée)
- [ ] **3 cases cochées:** Production, Preview, Development
- [ ] **Cliquer sur "Add"**

#### Variable 3: NODE_ENV
- [ ] **Key:** `NODE_ENV`
- [ ] **Value:** `production`
- [ ] **3 cases cochées:** Production, Preview, Development
- [ ] **Cliquer sur "Add"**

**✅ 3 variables configurées**

---

## 🎯 ÉTAPE 4: BASE POSTGRESQL (2 minutes)

### Créer la Base

- [ ] **Menu de gauche → "Storage"**
- [ ] **Cliquer sur "Create Database"**
- [ ] **Sélectionner "Postgres"**
- [ ] **Nom:** `inoxya-bijoux-db` (ou par défaut)
- [ ] **Région:** (choisir la plus proche)
- [ ] **Plan:** `Hobby` (gratuit)
- [ ] **Cliquer sur "Create"**
- [ ] **Attendre 10-20 secondes**

### Copier DATABASE_URL

- [ ] **Base créée** ✅
- [ ] **"Connection String" ou "DATABASE_URL" trouvé**
- [ ] **Cliquer sur "Copy"** (copier l'URL)

### Ajouter DATABASE_URL

- [ ] **Retourner au projet** (Projects → Votre projet)
- [ ] **Settings → Environment Variables**
- [ ] **Cliquer sur "Add"**
- [ ] **Key:** `DATABASE_URL`
- [ ] **Value:** (coller l'URL copiée)
- [ ] **3 cases cochées:** Production, Preview, Development
- [ ] **Cliquer sur "Add"**

**✅ DATABASE_URL configuré**

---

## 🎯 ÉTAPE 5: MIGRATION BASE DE DONNÉES (2 minutes)

### Préparer la Migration

- [ ] **Terminal ouvert** dans le dossier du projet
- [ ] **Fichier `.env.local` créé** (si pas déjà)
- [ ] **Ligne ajoutée:** `DATABASE_URL=<URL_VERCEL_POSTGRES>`

### Exécuter la Migration

- [ ] **Commande exécutée:** `npm run db:migrate:sqlite-to-postgres`
- [ ] **Migration terminée** (30 secondes - 2 minutes)
- [ ] **Aucune erreur** ✅

**✅ Base de données migrée**

---

## 🎯 ÉTAPE 6: DÉPLOIEMENT (1 minute)

### Lancer le Déploiement

- [ ] **Dashboard Vercel → Votre projet**
- [ ] **Cliquer sur "Deploy"** (bouton bleu)
- [ ] **Build en cours** (logs visibles)
- [ ] **Attendre 2-3 minutes**
- [ ] **"Ready" ou "Deployed" visible** (vert) ✅

**✅ Site déployé !**

---

## 🎯 ÉTAPE 7: CRÉER ADMIN (1 minute)

### Préparer

- [ ] **Terminal ouvert** dans le dossier du projet
- [ ] **`.env.local` contient:** `DATABASE_URL=<URL_VERCEL_POSTGRES>`

### Créer l'Admin

- [ ] **Commande exécutée:** `npm run admin:create`
- [ ] **Téléphone saisi:** `admin` (ou votre choix)
- [ ] **Mot de passe saisi:** `Admin123!` (ou votre choix)
- [ ] **Admin créé** ✅

**✅ Utilisateur admin créé**

---

## ✅ VÉRIFICATION FINALE

### Tests

- [ ] **Site accessible**
  - [ ] URL: `https://votre-projet.vercel.app`
  - [ ] Page d'accueil charge
  - [ ] Aucune erreur 500

- [ ] **Admin accessible**
  - [ ] URL: `https://votre-projet.vercel.app/admin`
  - [ ] Page de login visible

- [ ] **Connexion admin**
  - [ ] Téléphone: `admin` (ou celui créé)
  - [ ] Mot de passe: `Admin123!` (ou celui créé)
  - [ ] Dashboard admin accessible ✅

- [ ] **Produits visibles**
  - [ ] URL: `https://votre-projet.vercel.app/fr/bijoux`
  - [ ] Produits affichés
  - [ ] Images chargent

**✅ TOUT FONCTIONNE !**

---

## 🎉 FÉLICITATIONS !

**Votre site est maintenant en ligne !** 🚀

### URL de Votre Site
```
https://votre-projet.vercel.app
```

### Prochaines Étapes (Optionnel)

- [ ] **Configurer un domaine personnalisé**
  - Settings → Domains → Add Domain

- [ ] **Activer Vercel Analytics** (gratuit)
  - Settings → Analytics → Enable

- [ ] **Configurer Sentry** (optionnel)
  - Ajouter SENTRY_DSN dans Environment Variables

---

## 📊 RÉSUMÉ

### Temps Total: **10 minutes**

- ✅ Étape 1: Compte Vercel (2 min)
- ✅ Étape 2: Créer projet (1 min)
- ✅ Étape 3: Variables d'environnement (3 min)
- ✅ Étape 4: Base PostgreSQL (2 min)
- ✅ Étape 5: Migration DB (2 min)
- ✅ Étape 6: Déploiement (1 min)
- ✅ Étape 7: Créer admin (1 min)

### Résultat

**✅ Site en production:** https://votre-projet.vercel.app

---

**Date:** 2025-01-27  
**Version:** 1.0.0  
**Statut:** ✅ **CHECKLIST COMPLÈTE**

