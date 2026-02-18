# 📋 GUIDE ÉTAPE PAR ÉTAPE - CONFIGURATION VARIABLES D'ENVIRONNEMENT

**Date:** 2025-01-18  
**Projet:** inoxya-bijoux sur Vercel

---

## 🎯 OBJECTIF

Configurer les 3 variables d'environnement REQUISES pour que le site fonctionne correctement.

---

## ✅ ÉTAPE 1 : CONFIGURER DATABASE_URL

### 1.1 Obtenir la connection string depuis Neon

1. **Allez sur:** https://console.neon.tech
2. **Sélectionnez votre projet** (base de données PostgreSQL)
3. **Cliquez sur "Connection Details"** ou "Connection String"
4. **Copiez la connection string** complète
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - **IMPORTANT:** Assurez-vous que `?sslmode=require` est inclus

### 1.2 Configurer dans Vercel

1. **Dans Vercel Dashboard**, vous êtes déjà sur la page Environment Variables
2. **Cliquez sur `DATABASE_URL`** (ou sur les 3 points → Edit)
3. **Dans le champ "Value":**
   - Collez votre connection string complète depuis Neon
   - Exemple: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
4. **Dans la section "Environments":**
   - ✅ **Cochez "Production"**
   - ✅ **Cochez "Preview"** (déjà coché)
   - ✅ **Cochez "Development"**
   - **IMPORTANT:** Cliquez sur chaque environnement pour les sélectionner
5. **Cliquez sur "Save"**

---

## ✅ ÉTAPE 2 : CONFIGURER JWT_SECRET

### 2.1 Générer un JWT_SECRET

**Option A - Via Terminal (recommandé):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B - Via PowerShell:**
```powershell
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiez la valeur générée** (64 caractères hexadécimaux)

### 2.2 Configurer dans Vercel

1. **Si `JWT_SECRET` existe déjà:**
   - Cliquez sur `JWT_SECRET` → Edit
   - Vérifiez que la valeur est bien présente
   
2. **Si `JWT_SECRET` n'existe pas:**
   - Cliquez sur **"Add Environment Variable"** (en haut à droite)
   - **Name:** `JWT_SECRET`
   - **Value:** Collez la valeur générée (64 caractères)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - **Cliquez sur "Save"**

---

## ✅ ÉTAPE 3 : CONFIGURER NEXT_PUBLIC_SITE_URL

### 3.1 Déterminer la valeur

**Pour maintenant (temporaire):**
- Valeur: `https://inoxya-bijoux.vercel.app`

**Pour plus tard (après configuration du domaine):**
- Valeur: `https://www.inoxya.ma`

### 3.2 Configurer dans Vercel

1. **Cliquez sur `NEXT_PUBLIC_SITE_URL`** → Edit
2. **Dans le champ "Value":**
   - Pour l'instant: `https://inoxya-bijoux.vercel.app`
   - Plus tard: `https://www.inoxya.ma` (après configuration du domaine)
3. **Dans la section "Environments":**
   - ✅ **Cochez "Production"**
   - ✅ **Cochez "Preview"**
   - ✅ **Cochez "Development"**
4. **Cliquez sur "Save"**

---

## ✅ ÉTAPE 4 : VÉRIFIER BLOB_READ_WRITE_TOKEN (OPTIONNEL)

### 4.1 Vérifier si déjà configuré

1. **Vérifiez dans la liste** si `BLOB_READ_WRITE_TOKEN` existe
2. **Si oui:** Vérifiez qu'il est configuré pour **Production** et **Preview**
3. **Si non:** Créez-le depuis Vercel Storage (voir ci-dessous)

### 4.2 Créer Vercel Blob Storage (si nécessaire)

1. **Dans Vercel Dashboard**, allez dans l'onglet **"Storage"**
2. **Cliquez sur "Create Database"** ou **"Add Storage"**
3. **Sélectionnez "Blob"**
4. **Nom:** `inoxya-blob` (ou n'importe quel nom)
5. **Région:** Choisissez la plus proche (ex: Europe)
6. **Cliquez sur "Create"**
7. **Copiez le `BLOB_READ_WRITE_TOKEN`** affiché
8. **Retournez dans Environment Variables**
9. **Ajoutez la variable:**
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Le token copié
   - **Environments:** ✅ Production, ✅ Preview
   - **Cliquez sur "Save"**

---

## ✅ ÉTAPE 5 : VÉRIFIER TOUTES LES VARIABLES

### Checklist finale

Vérifiez que vous avez ces variables configurées pour **TOUS les environnements** (Production, Preview, Development):

- [ ] `DATABASE_URL` - Connection string PostgreSQL depuis Neon
- [ ] `JWT_SECRET` - 64 caractères hexadécimaux générés
- [ ] `NEXT_PUBLIC_SITE_URL` - URL du site (temporaire ou finale)
- [ ] `BLOB_READ_WRITE_TOKEN` - Token Vercel Blob (optionnel mais recommandé)

---

## ✅ ÉTAPE 6 : REDÉPLOYER

**Après avoir configuré toutes les variables, redéployez:**

```bash
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
vercel --prod
```

**OU** depuis Vercel Dashboard:
1. Allez dans **"Deployments"**
2. Cliquez sur les **3 points** du dernier déploiement
3. Cliquez sur **"Redeploy"**

---

## 🎯 RÉSUMÉ VISUEL

### Pour chaque variable:

1. **Cliquez sur la variable** (ou 3 points → Edit)
2. **Collez la valeur** dans le champ "Value"
3. **Sélectionnez les environnements:**
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. **Cliquez sur "Save"**

### Ordre recommandé:

1. ✅ `DATABASE_URL` (le plus important)
2. ✅ `JWT_SECRET`
3. ✅ `NEXT_PUBLIC_SITE_URL`
4. ✅ `BLOB_READ_WRITE_TOKEN` (optionnel)

---

## ⚠️ NOTES IMPORTANTES

1. **DATABASE_URL doit être pour TOUS les environnements** (Production, Preview, Development)
2. **Après chaque modification, redéployez** pour que les changements prennent effet
3. **Les valeurs sont masquées** (affichées avec `***`) - c'est normal pour la sécurité
4. **Vous pouvez voir la valeur** en cliquant sur l'icône 👁️ (œil)

---

## 🆘 SI VOUS AVEZ DES PROBLÈMES

### Erreur: "Variable not found"
- Vérifiez que vous avez bien cliqué sur "Save"
- Vérifiez que l'environnement est bien sélectionné

### Erreur: "Database connection failed"
- Vérifiez que `DATABASE_URL` contient `?sslmode=require`
- Vérifiez que la connection string est complète
- Vérifiez que les tables existent dans Neon (exécutez `scripts/neon-setup-complete.sql`)

### Le site affiche toujours une erreur 500
- Redéployez après avoir ajouté les variables
- Vérifiez les logs: `vercel logs inoxya-bijoux.vercel.app`

---

**✅ Une fois toutes les variables configurées, votre site sera fonctionnel !**

