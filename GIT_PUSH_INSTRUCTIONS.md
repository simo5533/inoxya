# 🔧 INSTRUCTIONS POUR PUSH SUR GITHUB

## ÉTAT ACTUEL
- ✅ Commit créé: `5308dbe` - "fix: vercel production build ready"
- ✅ Branche: `fix/dev-server-restore`
- ❌ Remote `origin` non configuré

---

## ÉTAPE 1 — Configurer le remote GitHub

**Remplacez `YOUR_USERNAME` par votre vrai username GitHub:**

```bash
# Si vous avez déjà un repo GitHub créé:
git remote add origin https://github.com/YOUR_USERNAME/inoxya-bijoux.git

# OU si le repo s'appelle différemment:
git remote add origin https://github.com/YOUR_USERNAME/nom-du-repo.git

# Vérifier:
git remote -v
```

**Si le remote existe déjà mais avec une mauvaise URL:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/inoxya-bijoux.git
```

---

## ÉTAPE 2 — Push sur GitHub

### Option A — Push sur la branche main
```bash
git push -u origin fix/dev-server-restore:main
```

### Option B — Push sur la branche actuelle
```bash
git push -u origin fix/dev-server-restore
```

### Option C — Merge sur main puis push
```bash
git checkout main
git merge fix/dev-server-restore
git push -u origin main
```

---

## ÉTAPE 3 — Si GitHub demande un mot de passe

GitHub n'accepte plus les mots de passe. Utilisez un **Personal Access Token**:

1. Aller sur **https://github.com/settings/tokens**
2. Cliquer **"Generate new token"** → **"Generate new token (classic)"**
3. Donner un nom: `inoxya-bijoux-push`
4. Cocher la scope **`repo`** (accès complet aux repos)
5. Cliquer **"Generate token"**
6. **COPIER le token** (vous ne le reverrez plus!)
7. Quand Git demande le mot de passe, **coller le token** (pas votre mot de passe)

---

## ÉTAPE 4 — Vérifier que le push a réussi

```bash
git remote -v
git log --oneline -1
```

Vous devriez voir:
- `origin  https://github.com/YOUR_USERNAME/inoxya-bijoux.git (fetch)`
- `origin  https://github.com/YOUR_USERNAME/inoxya-bijoux.git (push)`

---

## APRÈS LE PUSH — VERCEL

### 1. Vérifier la connexion Vercel → GitHub
- Vercel Dashboard → **Settings** → **Git**
- Vérifier que c'est bien connecté à votre repo GitHub

### 2. Configurer les variables d'environnement
- **Settings** → **Environment Variables** → **Add New** (4 fois)

| Name | Value | Comment obtenir |
|------|-------|----------------|
| `DATABASE_URL` | `postgresql://...` | Storage → DB → .env.local |
| `JWT_SECRET` | `abc123...` | https://generate-secret.vercel.app/32 |
| `NEXT_PUBLIC_SITE_URL` | `https://inoxya-bijoux.vercel.app` | Votre domaine Vercel |
| `NODE_ENV` | `production` | Taper exactement |

**Pour chaque variable:**
- Cocher ✅ Production
- Cocher ✅ Preview  
- Cocher ✅ Development
- Cliquer **Save**

### 3. Redéployer
- **Deployments** → cliquer les **3 points** (···) sur le dernier déploiement
- **Redeploy**
- Attendre 2-3 minutes
- ✅ **Build vert** = site en ligne! 🎉

---

## SI ERREUR APRÈS LE PUSH

1. **Vercel Dashboard** → **Deployments** → cliquer le déploiement rouge
2. **Build Logs** → faire défiler jusqu'à la ligne rouge
3. **Copier l'erreur complète**
4. **Me la montrer** → je corrigerai immédiatement

---

## RÉSUMÉ RAPIDE

```bash
# 1. Ajouter remote (remplacer YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/inoxya-bijoux.git

# 2. Push
git push -u origin fix/dev-server-restore:main

# 3. Dans Vercel: ajouter 4 variables d'environnement
# 4. Dans Vercel: Redeploy
# 5. ✅ Site en ligne!
```

---

**Besoin d'aide?** Dites-moi votre username GitHub et je vous donnerai la commande exacte! 🚀

