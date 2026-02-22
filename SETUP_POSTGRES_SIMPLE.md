# 🚀 CONFIGURATION POSTGRESQL - GUIDE ULTRA SIMPLIFIÉ

## ✅ Vous avez 36 produits à migrer !

---

## 📋 ÉTAPES (10 minutes max)

### 1️⃣ Créer Supabase (2 min)
1. Aller sur **https://supabase.com**
2. Cliquer **"Start your project"** → Créer compte (gratuit)
3. Cliquer **"New Project"**
   - Nom : `inoxya-bijoux`
   - Mot de passe : **Notez-le bien** (affiché 1 seule fois)
   - Région : Europe (West)
4. Attendre 2-3 minutes

### 2️⃣ Créer les tables (1 min)
1. Dans Supabase, cliquer **SQL Editor** (menu gauche)
2. Cliquer **"New query"**
3. Ouvrir le fichier : `scripts/setup-postgres-vercel.sql`
4. **Copier TOUT le contenu** et le coller dans Supabase
5. Cliquer **"Run"** (ou Ctrl+Enter)
6. ✅ Vous devriez voir : "Configuration PostgreSQL terminée avec succès!"

### 3️⃣ Récupérer l'URL (1 min)
1. Dans Supabase : **Settings** → **Database**
2. Scroller jusqu'à **"Connection string"**
3. Sélectionner **"URI"**
4. **Copier l'URL** (exemple : `postgresql://postgres:VOTRE_MOT_DE_PASSE@db.xxxxx.supabase.co:5432/postgres`)
5. **Remplacer `[PASSWORD]`** par votre vrai mot de passe Supabase

### 4️⃣ Configurer Vercel (2 min)
1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner projet **inoxya-bijoux**
3. **Settings** → **Environment Variables**
4. Cliquer **"Add New"**
   - **Name** : `DATABASE_URL`
   - **Value** : Coller l'URL de l'étape 3 (avec le mot de passe)
   - ✅ Cocher : Production, Preview, Development
5. Cliquer **"Save"**

### 5️⃣ Migrer vos 36 produits (2 min)
**Sur votre ordinateur**, exécuter :

```powershell
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
npm run migrate:sqlite-to-postgres
```

⚠️ **Si la commande n'existe pas**, utiliser :
```powershell
npx tsx scripts/migrate-sqlite-to-postgres.ts --execute
```

### 6️⃣ Redéployer (1 min)
1. Sur Vercel Dashboard → votre projet
2. Cliquer **"Redeploy"** sur le dernier déploiement
3. OU faire un commit vide :
```powershell
git commit --allow-empty -m "trigger: redeploy with PostgreSQL"
git push origin main
```

### 7️⃣ Vérifier (1 min)
1. Attendre 2-3 minutes
2. Visiter **https://inoxya-bijoux.vercel.app/fr/bijoux**
3. ✅ **Vos 36 produits devraient s'afficher !** 🎉

---

## 🆘 EN CAS DE PROBLÈME

### "DATABASE_URL not found"
→ Vérifier que la variable est bien dans Vercel (Settings → Environment Variables)

### "Connection refused"
→ Vérifier que l'URL contient bien le mot de passe (remplacer `[PASSWORD]`)

### "Table products does not exist"
→ Réexécuter le script SQL dans Supabase (étape 2)

### "Aucun produit affiché"
→ Vérifier la migration (étape 5) - les 36 produits doivent être migrés

---

## 📝 RÉSUMÉ RAPIDE

1. ✅ Créer Supabase
2. ✅ Exécuter `setup-postgres-vercel.sql` dans Supabase
3. ✅ Copier `DATABASE_URL` depuis Supabase
4. ✅ Ajouter `DATABASE_URL` dans Vercel
5. ✅ Migrer les 36 produits
6. ✅ Redéployer
7. ✅ Vérifier

**Temps total : ~10 minutes**

