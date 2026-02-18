# 🔍 VÉRIFIER DATABASE_URL DANS VERCEL

## ✅ ÉTAPE 1 : ALLER SUR VERCEL

1. **Ouvrez votre navigateur**
2. **Allez sur:** https://vercel.com
3. **Connectez-vous** si nécessaire
4. **Sélectionnez votre projet:** `inoxya-bijoux`

---

## ✅ ÉTAPE 2 : ALLER DANS LES VARIABLES D'ENVIRONNEMENT

1. **Dans la barre latérale gauche, cliquez sur "Settings"**
2. **Cliquez sur "Environment Variables"** (dans la section "Environments")

---

## ✅ ÉTAPE 3 : VÉRIFIER DATABASE_URL

**Vous devriez voir `DATABASE_URL` dans la liste.**

**Vérifiez que:**
- ✅ **"Production" est coché** (case à cocher)
- ✅ **"Preview" est coché** (case à cocher)
- ✅ **"Development" peut être coché ou non** (optionnel)

**Format attendu:**
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Exemple:**
```
postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## ✅ ÉTAPE 4 : MODIFIER SI NÉCESSAIRE

**Si `DATABASE_URL` n'est pas configuré pour Production:**

1. **Cliquez sur les trois points (`...`) à droite de `DATABASE_URL`**
2. **Cliquez sur "Edit"**
3. **Cochez "Production"** si ce n'est pas déjà fait
4. **Cochez "Preview"** si ce n'est pas déjà fait
5. **Cliquez sur "Save"**

---

## ✅ ÉTAPE 5 : VÉRIFIER LES AUTRES VARIABLES

**Vérifiez aussi que ces variables sont configurées:**

1. **`JWT_SECRET`**
   - Doit être configuré pour **Production, Preview, Development**
   - Format: chaîne de caractères aléatoire (64 caractères recommandés)

2. **`NEXT_PUBLIC_SITE_URL`**
   - Doit être configuré pour **Production**
   - Format: `https://inoxya-bijoux.vercel.app` ou `https://www.inoxya.ma`

3. **`BLOB_READ_WRITE_TOKEN`** (si utilisé)
   - Doit être configuré pour **Production, Preview, Development**

---

## 🎯 RÉSUMÉ

1. ✅ Allez sur Vercel → Settings → Environment Variables
2. ✅ Vérifiez que `DATABASE_URL` est configuré pour **Production**
3. ✅ Vérifiez le format: `postgresql://...?sslmode=require`
4. ✅ Vérifiez `JWT_SECRET` et `NEXT_PUBLIC_SITE_URL`

---

**Une fois vérifié, dites-moi et je redéploierai le projet !**

