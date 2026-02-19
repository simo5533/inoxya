# Configurer Git et Push sur GitHub

## Étape 1 — Créer repo GitHub

1. Aller sur **https://github.com** → Cliquer **"New repository"**
2. **Nom du repo:** `inoxya-bijoux`
3. ⚠️ **NE PAS cocher** "Initialize with README"
4. Cliquer **"Create repository"**
5. **Copier l'URL** affichée (ex: `https://github.com/TON-USERNAME/inoxya-bijoux.git`)

---

## Étape 2 — Connecter et push

### 2.1 — Ajouter le remote

```bash
# Remplacez TON-USERNAME par votre vrai username GitHub
git remote add origin https://github.com/TON-USERNAME/inoxya-bijoux.git

# Vérifier
git remote -v
```

### 2.2 — S'assurer d'être sur main

```bash
# Voir la branche actuelle
git branch

# Si vous êtes sur fix/dev-server-restore, merger sur main
git checkout main 2>$null || git checkout -b main
git merge fix/dev-server-restore --no-edit
```

### 2.3 — Push sur GitHub

```bash
# Push la branche main
git push -u origin main
```

**Si GitHub demande un mot de passe:**
- GitHub n'accepte plus les mots de passe
- Utiliser un **Personal Access Token**:
  1. https://github.com/settings/tokens
  2. "Generate new token (classic)"
  3. Cocher `repo` (accès complet)
  4. Copier le token
  5. Utiliser le token comme mot de passe lors du push

---

## Étape 3 — Dans Vercel

### 3.1 — Connecter GitHub

1. **Vercel Dashboard** → **Settings** → **Git**
2. Cliquer **"Connect Git Repository"**
3. Choisir **GitHub**
4. Autoriser Vercel
5. Sélectionner **`inoxya-bijoux`**

### 3.2 — Configurer les variables d'environnement

**Settings** → **Environment Variables** → **Add New** (4 fois):

| Name | Value | Comment |
|------|-------|---------|
| `DATABASE_URL` | `postgresql://...` | Storage → DB → .env.local → copier |
| `JWT_SECRET` | `abc123...` | https://generate-secret.vercel.app/32 |
| `NEXT_PUBLIC_SITE_URL` | `https://inoxya-bijoux.vercel.app` | Votre domaine Vercel |
| `NODE_ENV` | `production` | Exactement ce mot |

**Pour chaque variable:**
- ✅ Cocher **Production**
- ✅ Cocher **Preview**
- ✅ Cocher **Development**
- Cliquer **Save**

### 3.3 — Déployer

1. **Deployments** → Cliquer les **3 points** (···) sur le dernier déploiement
2. **Redeploy**
3. Attendre 2-3 minutes
4. ✅ **Build vert** = site en ligne! 🎉

---

## Étape 4 — Initialiser la base de données

1. **Vercel Dashboard** → **Storage** → Cliquer votre base de données
2. Onglet **"Query"**
3. Copier-coller le SQL complet de `DEPLOY_VERCEL.md` (Étape 6)
4. Cliquer **"Run Query"** → ✅ "Success"

---

## Étape 5 — Créer compte admin

1. Aller sur votre site: `https://votre-app.vercel.app`
2. S'inscrire avec votre numéro de téléphone
3. **Vercel** → **Storage** → **Query**
4. Exécuter (remplacer par votre numéro):
```sql
UPDATE users SET role = 'admin' WHERE phone = '0TON_NUMERO';
```

---

## ✅ Vérification finale

Tester ces URLs (remplacer `votre-app` par votre domaine):

| Test | URL | Résultat attendu |
|-----|-----|-----------------|
| Site principal | `https://votre-app.vercel.app` | Page d'accueil |
| Health check | `https://votre-app.vercel.app/api/health` | `{"status":"ok","db":"connected"}` |
| API produits | `https://votre-app.vercel.app/api/products` | `{"data":[]}` |
| Panel admin | `https://votre-app.vercel.app/admin` | Dashboard admin |

---

## ❌ Problèmes courants

| Problème | Solution |
|----------|----------|
| "Application error" | Vercel → Functions → voir logs rouges |
| Base de données vide | Refaire l'Étape 4 (init DB) |
| "Invalid token" | Vérifier JWT_SECRET (min 32 chars) |
| Page blanche | Vérifier NEXT_PUBLIC_SITE_URL |
| Admin inaccessible | Refaire l'Étape 5 (UPDATE users) |

---

**Besoin d'aide?** Consultez `DEPLOY_VERCEL.md` pour le guide complet.

