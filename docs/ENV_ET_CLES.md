# Variables d'environnement et clés API — Inoxya Bijoux

## Exactement quoi faire — étape par étape

### 1. Générer la valeur de JWT_SECRET (une seule fois)

**Sous Windows (PowerShell)** — coller dans le terminal puis Entrée :

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Une seule ligne s’affiche (ex. `T/9pMLZYZEuL1IBTM89jtIdwPgRpDP8K5ZL6pwE1cAA=`). **Copiez cette ligne** — c’est la valeur à utiliser pour `JWT_SECRET` partout.

---

### 2. Où coller chaque valeur

**Sur Vercel**  
→ Projet → **Settings** → **Environment Variables** → **Add** (ou modifier une variable existante).

**Sur GitHub**  
→ Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

**En local**  
→ Fichier `.env.local` à la racine du projet (une ligne par variable).

| Nom exact de la variable | Quelle valeur coller | Où la récupérer |
|--------------------------|----------------------|------------------|
| `JWT_SECRET` | La ligne générée à l’étape 1 (ex. `T/9pMLZYZEuL1IBTM89jtIdwPgRpDP8K5ZL6pwE1cAA=`) | Vous l’avez générée vous‑même. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → **Settings** → **API** → **Project URL** → copier. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé longue qui commence par `eyJ...` ou `sb_publishable_...` | Supabase → **Settings** → **API** → **Project API keys** → **anon** **public** → copier. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé longue (souvent `sb_secret_...` ou `eyJ...`) | Supabase → **Settings** → **API** → **Project API keys** → **service_role** **secret** → copier. |
| `NEXT_PUBLIC_SITE_URL` | `https://inoxya-bijoux.vercel.app` (ou votre domaine si vous en avez un) | Votre URL de site Vercel. |

**À faire :** pour chaque ligne du tableau, créer la variable avec le **nom exact** (colonne 1) et coller la **valeur** (colonne 2) dans Vercel, GitHub et `.env.local` (sauf secrets GitHub : seulement les valeurs nécessaires aux Actions).

---

### 3. Exemple de contenu pour `.env.local`

Remplacez les `...` par vos vraies valeurs (sans guillemets).

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...ou_sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...ou_eyJ...
NEXT_PUBLIC_SITE_URL=https://inoxya-bijoux.vercel.app
JWT_SECRET=T/9pMLZYZEuL1IBTM89jtIdwPgRpDP8K5ZL6pwE1cAA=
```

(Utilisez pour `JWT_SECRET` la valeur affichée dans votre terminal après la commande PowerShell de l’étape 1.)

---

## Où configurer

| Variable | GitHub (Secrets → Actions) | Vercel (Environment Variables) | .env.local (dev) |
|----------|----------------------------|----------------------------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ | ✅ |
| `JWT_SECRET` | ✅ | ✅ | ✅ |

**Important :** `SUPABASE_SERVICE_ROLE_KEY` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` doivent être **deux clés différentes** (service_role ≠ anon). À récupérer dans Supabase → Settings → API.

---

## JWT_SECRET : valeur app vs Supabase

| Où prendre la valeur pour `JWT_SECRET` | Où ne pas la prendre |
|----------------------------------------|----------------------|
| Vous la **générez** : `openssl rand -base64 32` (une fois), puis vous mettez la même valeur dans `.env.local`, Vercel et GitHub. | **Pas** dans Supabase (API, JWT Keys, Legacy JWT Secret). |

- **JWT_SECRET** (app) : secret **de votre application** pour signer/vérifier vos propres tokens (sessions, etc.). À générer une fois et à utiliser partout (Vercel, GitHub, `.env.local`).
  - Génération : `openssl rand -base64 32`
  - Exemple (à ne pas réutiliser) : `2R/oICqYyZcyHHN7k3V4qfF0w+Xyy1f6nCPJkBLcQW0=`

- **Legacy JWT Secret** (Supabase) : secret utilisé **par Supabase** pour signer les clés anon/service_role. Affiché dans Supabase → Settings → JWT Keys → Legacy JWT Secret. **Ne pas** mettre cette valeur dans `JWT_SECRET` sur Vercel/GitHub.

**Sur Vercel et GitHub, `JWT_SECRET` doit être la valeur générée pour l’app (ex. `openssl rand -base64 32`), pas le Legacy JWT Secret Supabase.**

---

## Vercel

- Ne pas définir `NODE_ENV` (géré par Vercel).
- Après toute modification des variables, faire un **Redeploy** pour que les changements soient pris en compte.
