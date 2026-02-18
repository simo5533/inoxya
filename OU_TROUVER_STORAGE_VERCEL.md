# 📍 OÙ TROUVER "STORAGE" DANS VERCEL

## 🎯 MÉTHODE 1: Via le Menu de Navigation (RECOMMANDÉ)

### Étapes exactes:

1. **Vous êtes actuellement sur:** 
   - La page de déploiement de `inoxya-bijoux`
   - URL: `vercel.com/aomarlaasri-9900s-projects/inoxya-bijoux/...`

2. **Cliquez sur le nom du projet en haut:**
   - En haut de la page, vous verrez **"inoxya-bijoux"** (en grand)
   - OU cliquez sur **"inoxya-bijoux"** dans le breadcrumb (fil d'Ariane)

3. **Vous arriverez sur la page d'aperçu du projet**

4. **Dans le menu de gauche, cherchez "Storage":**
   - Le menu de gauche contient:
     * Overview
     * Deployments
     * **Storage** ← C'EST ICI!
     * Analytics
     * Settings
     * etc.

5. **Cliquez sur "Storage"**

6. **Vous verrez une page avec:**
   - Un bouton **"Create Database"** ou **"Add Database"**
   - Cliquez dessus

7. **Sélectionnez "Postgres"**

---

## 🎯 MÉTHODE 2: Via Settings

### Étapes:

1. **Dans le menu de gauche, cliquez sur "Settings"**

2. **Dans Settings, cherchez la section "Storage" ou "Databases"**

3. **Cliquez sur "Create Database"** ou **"Add Database"**

---

## 🎯 MÉTHODE 3: URL Directe

Si vous êtes connecté, vous pouvez aller directement à:
```
https://vercel.com/dashboard/storage
```

OU

```
https://vercel.com/aomarlaasri-9900s-projects/inoxya-bijoux/storage
```

---

## 📸 À QUOI ÇA RESSEMBLE

Quand vous cliquez sur "Storage", vous verrez:

```
┌─────────────────────────────────────┐
│  Storage                             │
├─────────────────────────────────────┤
│                                      │
│  [Create Database]  ← Bouton vert   │
│                                      │
│  (Si vous avez déjà des bases,      │
│   elles apparaîtront ici)           │
│                                      │
└─────────────────────────────────────┘
```

Quand vous cliquez sur "Create Database", vous verrez:

```
┌─────────────────────────────────────┐
│  Create Database                    │
├─────────────────────────────────────┤
│                                      │
│  ○ Postgres                         │
│  ○ Redis                            │
│  ○ Blob                             │
│                                      │
│  [Continue]                          │
│                                      │
└─────────────────────────────────────┘
```

---

## ⚠️ SI VOUS NE VOYEZ PAS "STORAGE"

### Raisons possibles:

1. **Plan gratuit:** 
   - Vercel Postgres nécessite un plan payant
   - Vérifiez votre plan dans Settings → Billing

2. **Menu différent:**
   - Parfois "Storage" est dans "Settings" → "Storage"
   - Ou dans le menu principal du dashboard

3. **Alternative:**
   - Si Storage n'est pas disponible, utilisez une base externe:
     * Supabase (gratuit jusqu'à 500MB)
     * Railway (gratuit avec limites)
     * Neon (gratuit avec limites)

---

## 🔄 ALTERNATIVE: Base de Données Externe

Si vous ne trouvez pas Storage ou si c'est payant, utilisez **Supabase** (gratuit):

1. Allez sur: https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez la `DATABASE_URL` depuis Settings → Database
5. Ajoutez-la dans Vercel → Settings → Environment Variables

---

## ✅ RÉSUMÉ RAPIDE

**Chemin le plus simple:**
1. Dashboard Vercel → Projet `inoxya-bijoux`
2. Menu de gauche → **"Storage"**
3. **"Create Database"** → **"Postgres"**
4. Suivez les instructions

**Si Storage n'est pas visible:**
- Vérifiez votre plan Vercel
- Utilisez Supabase (gratuit) à la place

