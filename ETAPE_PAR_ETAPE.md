# 📋 ÉTAPE PAR ÉTAPE - Configuration Supabase

## ✅ ÉTAPE 1 : Récupérer les clés API (VOUS ÊTES ICI)

Sur la page **API Keys** de Supabase :

### 1.1 - Project URL
1. Regardez l'URL dans votre navigateur : `https://supabase.com/dashboard/project/jzcmdwfddjyyawidlzlc/...`
2. Votre Project URL est : `https://jzcmdwfddjyyawidlzlc.supabase.co`
   (Remplacez `jzcmdwfddjyyawidlzlc` par votre ID de projet si différent)

OU

1. Allez dans **Settings** → **API** (menu de gauche)
2. Cherchez **"Project URL"** ou **"API URL"**
3. Copiez l'URL (format : `https://xxxxx.supabase.co`)

### 1.2 - Publishable key (anon key)
1. Sur la page actuelle, section **"Publishable key"**
2. Cliquez sur l'icône **👁️** ou **"Reveal"** pour voir la clé complète
3. Copiez la clé (commence par `sb_publishable_...` ou `eyJ...`)

### 1.3 - Secret key (service_role)
1. Scrollez vers le bas jusqu'à la section **"Secret keys"**
2. Cliquez sur **"Reveal"** ou l'icône 👁️ pour voir la clé
3. Copiez la clé (commence par `sb_service_role_...` ou `eyJ...`)

---

## ✅ ÉTAPE 2 : Ajouter les clés à `.env.local`

1. Ouvrez le fichier `.env.local` dans votre projet
2. Ajoutez ces 3 lignes (remplacez par vos vraies valeurs) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://jzcmdwfddjyyawidlzlc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx...
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_xxxxx...
```

3. **Sauvegardez** le fichier

---

## ✅ ÉTAPE 3 : Générer le schéma SQL

Dans votre terminal, exécutez :

```bash
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
npm run db:schema
```

Cela va afficher le SQL à copier.

---

## ✅ ÉTAPE 4 : Créer les tables dans Supabase

1. Dans Supabase Dashboard → **SQL Editor** (menu de gauche)
2. Cliquez **"New query"**
3. **Copiez TOUT le SQL** affiché par `npm run db:schema`
4. **Collez** dans l'éditeur SQL
5. Cliquez **"Run"** (ou Ctrl+Enter)
6. ✅ Vous devriez voir "Success" - les 21 tables sont créées

---

## ✅ ÉTAPE 5 : Migrer vos 36 produits

Dans votre terminal :

```bash
npm run db:migrate
```

Cela va migrer tous vos produits, catégories, packs depuis SQLite vers Supabase.

---

## ✅ ÉTAPE 6 : Ajouter les variables sur Vercel

1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner projet **inoxya-bijoux**
3. **Settings** → **Environment Variables**
4. Cliquez **"Add New"** et ajoutez ces 3 variables :

   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : Votre Project URL
   - ✅ Cocher : Production, Preview, Development

   - **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value** : Votre Publishable key
   - ✅ Cocher : Production, Preview, Development

   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : Votre Secret key
   - ✅ Cocher : Production, Preview, Development

5. Cliquez **"Save"** pour chaque variable

---

## ✅ ÉTAPE 7 : Redéployer sur Vercel

Dans votre terminal :

```bash
vercel --prod --force --yes
```

OU depuis Vercel Dashboard :
- Cliquez **"Redeploy"** sur le dernier déploiement

---

## ✅ ÉTAPE 8 : Vérifier

Attendez 2-3 minutes, puis visitez :
**https://inoxya-bijoux.vercel.app/fr/bijoux**

✅ **Vos 36 produits devraient maintenant s'afficher !** 🎉

---

## 🆘 AIDE

Si vous avez besoin d'aide pour trouver les clés :
- **Project URL** : Regardez l'URL de votre navigateur ou Settings → API
- **Publishable key** : Section "Publishable key" → Cliquez "Reveal"
- **Secret key** : Section "Secret keys" → Cliquez "Reveal"

