# 🚀 PROCHAINES ÉTAPES - Configuration Supabase

## ✅ CE QUI EST FAIT

- ✅ Scripts de migration créés
- ✅ Schéma SQL généré (21 tables)
- ✅ Erreurs TypeScript corrigées
- ✅ Package.json nettoyé

## 📋 ÉTAPES SUIVANTES (dans l'ordre)

### 1️⃣ CRÉER LE PROJET SUPABASE (en cours)

Sur l'écran Supabase que vous voyez :

1. **Région** : ✅ Gardez "Europe" (déjà sélectionné)
2. **Mot de passe** : Notez-le bien (affiché une seule fois)
3. **Security** :
   - ✅ **Enable Data API** : Cochez (déjà coché)
   - ⬜ **Enable automatic RLS** : Décochez (déjà décoché - OK)
4. Cliquez **"Create new project"**
5. Attendez 2-3 minutes

### 2️⃣ RÉCUPÉRER LES CLÉS API

Une fois le projet créé :

1. Dans Supabase Dashboard → **Settings** → **API**
2. Copiez ces 3 valeurs :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3️⃣ AJOUTER LES VARIABLES À `.env.local`

Ouvrez `.env.local` et ajoutez :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 4️⃣ CRÉER LES TABLES DANS SUPABASE

1. Dans Supabase → **SQL Editor** → **New query**
2. Exécutez cette commande pour générer le schéma :
   ```bash
   npm run db:schema
   ```
3. **Copiez TOUT le SQL** affiché
4. Collez-le dans Supabase SQL Editor
5. Cliquez **"Run"** (ou Ctrl+Enter)
6. ✅ Vous devriez voir "Success"

### 5️⃣ MIGRER VOS 36 PRODUITS

```bash
npm run db:migrate
```

Cela migrera tous vos produits, catégories, packs depuis SQLite vers Supabase.

### 6️⃣ AJOUTER LES VARIABLES SUR VERCEL

1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner projet **inoxya-bijoux**
3. **Settings** → **Environment Variables**
4. Ajouter les 3 variables Supabase (mêmes valeurs que `.env.local`)
5. ✅ Cocher : Production, Preview, Development
6. **Save**

### 7️⃣ REDÉPLOYER

```bash
vercel --prod --force --yes
```

### 8️⃣ VÉRIFIER

Visitez **https://inoxya-bijoux.vercel.app/fr/bijoux**

✅ **Vos 36 produits devraient maintenant s'afficher !** 🎉

---

## 🆘 EN CAS DE PROBLÈME

### "Missing NEXT_PUBLIC_SUPABASE_URL"
→ Vérifier que `.env.local` contient bien les 3 variables

### "Table does not exist"
→ Vérifier que le schéma SQL a bien été exécuté dans Supabase

### "Connection refused"
→ Vérifier que les clés API sont correctes

---

## 📝 RÉSUMÉ RAPIDE

1. ✅ Créer projet Supabase (en cours)
2. ⏳ Copier les 3 clés API
3. ⏳ Ajouter à `.env.local`
4. ⏳ Exécuter `npm run db:schema` → copier SQL → exécuter dans Supabase
5. ⏳ Exécuter `npm run db:migrate`
6. ⏳ Ajouter variables sur Vercel
7. ⏳ Redéployer

**Temps estimé : 10-15 minutes**

