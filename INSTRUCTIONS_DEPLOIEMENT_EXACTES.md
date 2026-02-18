# 🎯 INSTRUCTIONS EXACTES POUR DÉPLOIEMENT VERCEL

**Vous êtes connecté en tant que:** `aomarlaasri-9900`  
**Projet lié:** `inoxya-bijoux`  
**JWT_SECRET généré:** `wE5alUYpQWvD9bG1hXyWdZhfIGiBHJjMiM1xEyK6Ybk=`

---

## ÉTAPE 1: CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### 1.1 Ouvrir le Dashboard Vercel
1. Allez sur: **https://vercel.com/dashboard**
2. Cliquez sur le projet **`inoxya-bijoux`**

### 1.2 Ajouter les Variables
1. Dans le menu de gauche, cliquez sur **"Settings"**
2. Cliquez sur **"Environment Variables"** (dans le menu Settings)
3. Vous verrez un formulaire avec 3 champs:
   - **Key** (nom de la variable)
   - **Value** (valeur)
   - **Environment** (Production, Preview, Development)

### 1.3 Ajouter NEXT_PUBLIC_SITE_URL
1. Cliquez sur **"Add New"** ou **"Add"**
2. Dans **Key**, tapez: `NEXT_PUBLIC_SITE_URL`
3. Dans **Value**, tapez: `https://www.inoxya.ma`
4. Cochez **Production** (et Preview + Development si vous voulez)
5. Cliquez sur **"Save"**

### 1.4 Ajouter JWT_SECRET
1. Cliquez sur **"Add New"** ou **"Add"**
2. Dans **Key**, tapez: `JWT_SECRET`
3. Dans **Value**, tapez: `wE5alUYpQWvD9bG1hXyWdZhfIGiBHJjMiM1xEyK6Ybk=`
4. Cochez **Production** (et Preview + Development)
5. Cliquez sur **"Save"**

### 1.5 Ajouter NODE_ENV
1. Cliquez sur **"Add New"** ou **"Add"**
2. Dans **Key**, tapez: `NODE_ENV`
3. Dans **Value**, tapez: `production`
4. Cochez **Production** (et Preview + Development)
5. Cliquez sur **"Save"**

**✅ Vérification:** Vous devriez voir 3 variables dans la liste:
- `NEXT_PUBLIC_SITE_URL` = `https://www.inoxya.ma`
- `JWT_SECRET` = `wE5alUYpQWvD9bG1hXyWdZhfIGiBHJjMiM1xEyK6Ybk=`
- `NODE_ENV` = `production`

---

## ÉTAPE 2: CONFIGURER POSTGRESQL (OBLIGATOIRE)

### 2.1 Créer Vercel Postgres
1. Dans le dashboard Vercel, cliquez sur **"Storage"** (dans le menu de gauche)
2. Cliquez sur **"Create Database"**
3. Sélectionnez **"Postgres"**
4. Choisissez un nom (ex: `inoxya-postgres`)
5. Choisissez une région (ex: `Frankfurt` - proche du Maroc)
6. Cliquez sur **"Create"**

### 2.2 Obtenir DATABASE_URL
1. Une fois créé, cliquez sur votre base de données
2. Allez dans l'onglet **"Settings"**
3. Trouvez **"Connection String"** ou **"DATABASE_URL"**
4. Copiez la valeur (commence par `postgresql://...`)

### 2.3 Ajouter DATABASE_URL comme Variable
1. Retournez dans **Settings → Environment Variables**
2. Cliquez sur **"Add New"**
3. Dans **Key**, tapez: `DATABASE_URL`
4. Dans **Value**, collez la connection string copiée
5. Cochez **Production** (et Preview + Development)
6. Cliquez sur **"Save"**

### 2.4 Exécuter les Migrations SQL
1. Dans Vercel Dashboard → Storage → Votre base Postgres
2. Cliquez sur **"Connect"** ou **"Query"**
3. Ouvrez le fichier `scripts/setup-local-database.sql` dans votre projet
4. Copiez tout le contenu SQL
5. Collez dans l'éditeur SQL de Vercel
6. Cliquez sur **"Run"** ou **"Execute"**

**⚠️ IMPORTANT:** Si vous avez déjà des données dans SQLite local, vous devrez les migrer vers PostgreSQL.

---

## ÉTAPE 3: DÉPLOYER LE PROJET

### Option A: Via Terminal (RECOMMANDÉ)
Dans votre terminal, exécutez:
```bash
vercel --prod
```

### Option B: Via Dashboard Vercel
1. Dans le dashboard, allez dans **"Deployments"**
2. Cliquez sur **"Deploy"** ou **"Redeploy"**
3. Sélectionnez votre branche (généralement `main` ou `master`)
4. Cliquez sur **"Deploy"**

**⏱️ Temps d'attente:** 2-5 minutes pour le build

---

## ÉTAPE 4: CONFIGURER LE DOMAINE www.inoxya.ma

### 4.1 Ajouter le Domaine dans Vercel
1. Dans le dashboard, allez dans **Settings → Domains**
2. Cliquez sur **"Add Domain"** ou **"Add"**
3. Tapez: `www.inoxya.ma`
4. Cliquez sur **"Add"**
5. Vercel vous donnera des instructions DNS

### 4.2 Configurer DNS chez votre Registrar
Vercel vous donnera des valeurs DNS. Généralement:

**Option 1: CNAME (RECOMMANDÉ)**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com` (ou la valeur fournie par Vercel)

**Option 2: A Record**
- Type: `A`
- Name: `@` (ou vide pour la racine)
- Value: L'adresse IP fournie par Vercel

### 4.3 Ajouter aussi inoxya.ma (sans www)
1. Dans Vercel → Settings → Domains
2. Ajoutez aussi: `inoxya.ma` (sans www)
3. Configurez la redirection www → inoxya.ma ou vice-versa

### 4.4 Vérifier la Propagation DNS
1. Attendez 5-30 minutes (peut prendre jusqu'à 48h)
2. Vérifiez avec: https://dnschecker.org
3. Tapez: `www.inoxya.ma`
4. Vérifiez que les enregistrements DNS pointent vers Vercel

### 4.5 Mettre à jour NEXT_PUBLIC_SITE_URL
1. Une fois le domaine configuré, retournez dans **Settings → Environment Variables**
2. Modifiez `NEXT_PUBLIC_SITE_URL` pour être sûr qu'il vaut: `https://www.inoxya.ma`
3. Redéployez: `vercel --prod`

---

## ÉTAPE 5: VÉRIFICATIONS FINALES

### Checklist de Vérification:
- [ ] Site accessible sur https://www.inoxya.ma
- [ ] Redirection HTTPS fonctionne
- [ ] Page d'accueil charge
- [ ] Navigation FR/AR fonctionne
- [ ] Catalogue produits s'affiche
- [ ] Panier fonctionne
- [ ] Connexion/Inscription fonctionne
- [ ] Admin accessible (avec compte admin)
- [ ] Base de données connectée (tester une action qui utilise la DB)
- [ ] Sitemap accessible: https://www.inoxya.ma/sitemap.xml
- [ ] Robots.txt accessible: https://www.inoxya.ma/robots.txt

---

## 🆘 EN CAS DE PROBLÈME

### Build échoue
1. Allez dans **Deployments → [Dernier déploiement]**
2. Cliquez sur **"Build Logs"**
3. Vérifiez les erreurs
4. Corrigez et redéployez

### Erreurs 500
1. Allez dans **Deployments → [Dernier déploiement] → Functions**
2. Vérifiez les logs des fonctions
3. Vérifiez que toutes les variables d'environnement sont définies

### Base de données ne fonctionne pas
1. Vérifiez que `DATABASE_URL` est correctement configuré
2. Vérifiez que les migrations SQL ont été exécutées
3. Testez la connexion dans Vercel Postgres → Query

### Domaine ne fonctionne pas
1. Vérifiez la configuration DNS avec https://dnschecker.org
2. Vérifiez que le domaine est bien ajouté dans Vercel
3. Attendez jusqu'à 48h pour la propagation DNS complète

---

## ✅ RÉSUMÉ RAPIDE

1. **Variables d'environnement:** Settings → Environment Variables → Ajouter les 3 variables
2. **PostgreSQL:** Storage → Create Database → Postgres → Copier DATABASE_URL → Ajouter comme variable
3. **Déployer:** `vercel --prod` ou via Dashboard → Deployments → Deploy
4. **Domaine:** Settings → Domains → Add Domain → Configurer DNS
5. **Vérifier:** Tester toutes les fonctionnalités

**Temps total estimé:** 15-30 minutes

---

**Besoin d'aide?** Vérifiez les logs dans Vercel Dashboard → Deployments

