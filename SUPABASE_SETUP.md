# 🚀 Supabase Setup for Vercel Deployment

## ❌ PROBLÈME ACTUEL
Site déployé sur Vercel mais affiche "Aucun pack disponible" et aucun produit/image car la base SQLite locale n'est pas accessible sur Vercel.

## ✅ SOLUTION
Migrer les données vers Supabase (PostgreSQL cloud gratuit).

---

## 📋 ÉTAPES DE CONFIGURATION

### Step A - Créer un compte Supabase (GRATUIT)
1. Aller sur **https://supabase.com**
2. Cliquer **"Start your project"**
3. Créer un nouveau projet nommé **"inoxya-bijoux"**
4. **Sauvegarder votre mot de passe de base de données** (affiché une seule fois)
5. Choisir la région la plus proche (Europe de l'Ouest recommandé)
6. Attendre 2-3 minutes pour la création

### Step B - Récupérer les identifiants
Dans le dashboard Supabase → **Settings** → **API** :
- **Project URL** → copier → c'est `NEXT_PUBLIC_SUPABASE_URL`
- **service_role secret key** → copier → c'est `SUPABASE_SERVICE_ROLE_KEY`
- **anon public key** → copier → c'est `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step C - Ajouter à `.env.local`
Créer/modifier `.env.local` et ajouter :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Step D - Générer et exécuter le schéma
1. **Générer le schéma SQL** :
   ```bash
   npm run db:schema
   ```
2. **Copier tout le SQL affiché** dans la console
3. Dans Supabase → **SQL Editor** → **New query**
4. **Coller le SQL** et cliquer **"Run"** (ou Ctrl+Enter)
5. ✅ Vous devriez voir les tables créées

### Step E - Migrer vos données
```bash
npm run db:migrate
```
Cela migrera tous vos produits, catégories, packs, etc. depuis SQLite vers Supabase.

### Step F - Ajouter les variables d'environnement sur Vercel
1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner votre projet **inoxya-bijoux**
3. **Settings** → **Environment Variables**
4. Ajouter ces 3 variables :
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL` | **Value**: votre Project URL
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Value**: votre anon key
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY` | **Value**: votre service_role key
5. ✅ Cocher : Production, Preview, Development
6. Cliquer **"Save"**

### Step G - Redéployer
```bash
vercel --prod --force --yes
```

OU depuis le dashboard Vercel :
- Cliquer **"Redeploy"** sur le dernier déploiement

---

## ✅ VÉRIFICATION

1. Attendre 2-3 minutes pour le redéploiement
2. Visiter **https://inoxya-bijoux.vercel.app/fr/bijoux**
3. ✅ **Vos produits devraient maintenant s'afficher !** 🎉

---

## 🆘 EN CAS DE PROBLÈME

### "Missing NEXT_PUBLIC_SUPABASE_URL"
→ Vérifier que `.env.local` contient bien les 3 variables

### "No SQLite database found"
→ Vérifier que `data/inoxya_bijoux.db` existe localement

### "Error in table migration"
→ Vérifier que le schéma SQL a bien été exécuté dans Supabase

### "Aucun produit affiché"
→ Vérifier que la migration s'est bien terminée (`npm run db:migrate`)
→ Vérifier les variables d'environnement sur Vercel

---

## 📝 RÉSUMÉ RAPIDE

1. ✅ Créer compte Supabase
2. ✅ Copier les 3 clés API
3. ✅ Ajouter à `.env.local`
4. ✅ Générer schéma : `npm run db:schema`
5. ✅ Exécuter schéma dans Supabase SQL Editor
6. ✅ Migrer données : `npm run db:migrate`
7. ✅ Ajouter variables sur Vercel
8. ✅ Redéployer

**Temps total : ~15 minutes**

