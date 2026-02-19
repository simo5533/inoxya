# 🔧 CORRIGER L'ERREUR VERCEL — GUIDE RAPIDE
## Résoudre le build qui échoue en 5 minutes

---

## 🎯 ÉTAPE 1 — Voir l'erreur exacte (30 secondes)

1. Dans **Vercel Dashboard** → cliquer **"Deployments"** (menu haut)
2. Cliquer sur le déploiement **rouge** (celui avec ❌ Error)
3. Cliquer **"View Logs"** ou **"Build Logs"**
4. Faire défiler jusqu'à la ligne **rouge** avec l'erreur

**Les 3 erreurs les plus courantes:**

| Erreur | Solution |
|--------|----------|
| `Environment variable not found: DATABASE_URL` | → Aller à [Étape 2](#étape-2--configurer-les-variables-denvironnement) |
| `Type error: ...` | → Aller à [Étape 3](#étape-3--erreur-typescript) |
| `Cannot find module...` | → Aller à [Étape 4](#étape-4--module-manquant) |

---

## 🔑 ÉTAPE 2 — Configurer les variables d'environnement (90% des cas)

**C'est la cause la plus fréquente!**

### 2.1 — Aller dans Settings

1. Vercel Dashboard → **Settings** (menu haut)
2. Menu gauche → **"Environment Variables"**

### 2.2 — Vérifier les 4 variables obligatoires

| Nom | Valeur | ✅/❌ |
|-----|--------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | ❓ |
| `JWT_SECRET` | `32+ caractères aléatoires` | ❓ |
| `NEXT_PUBLIC_SITE_URL` | `https://inoxya-bijoux.vercel.app` | ❓ |
| `NODE_ENV` | `production` | ❓ |

### 2.3 — Ajouter les variables manquantes

**Pour chaque variable manquante:**

1. Cliquer **"Add New"**
2. **Name:** Entrer le nom exact (ex: `DATABASE_URL`)
3. **Value:** Entrer la valeur
4. **Environments:** Sélectionner **tous** (Production ✅ Preview ✅ Development ✅)
5. Cliquer **"Save"**

### 2.4 — Où trouver les valeurs

#### DATABASE_URL
1. Vercel Dashboard → **Storage** (menu gauche)
2. Cliquer sur votre base de données
3. Onglet **".env.local"**
4. Copier la valeur de `DATABASE_URL`
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`

#### JWT_SECRET
1. Aller sur **https://generate-secret.vercel.app/32**
2. Copier le résultat (ex: `a8f3k9m2p5q7r1s4t6u8v2w5x9y3z1`)
3. Coller dans la valeur de `JWT_SECRET`

#### NEXT_PUBLIC_SITE_URL
- Si votre domaine est `inoxya-bijoux.vercel.app` → mettre: `https://inoxya-bijoux.vercel.app`
- Si Vercel a donné un autre nom → mettre votre vrai domaine Vercel

#### NODE_ENV
- Valeur exacte: `production` (sans guillemets)

---

## 🔄 ÉTAPE 3 — Redéployer après avoir ajouté les variables

**Important:** Après avoir ajouté/modifié des variables, il faut redéployer!

1. Aller dans **Deployments** (menu haut)
2. Trouver le déploiement en erreur
3. Cliquer les **3 points** (···) à droite
4. Cliquer **"Redeploy"**
5. Sélectionner **"Use existing Build Cache"** (optionnel, plus rapide)
6. Cliquer **"Redeploy"**
7. Attendre 2-3 minutes
8. ✅ Si le build devient **vert** → SUCCÈS! 🎉

---

## ⚠️ ÉTAPE 3 — Erreur TypeScript

**Si l'erreur est:** `Type error: Property 'X' does not exist...`

### Solution rapide:
1. Vérifier que vous avez bien fait `git push` de toutes vos modifications
2. Vercel utilise le code de votre branche GitHub
3. Si vous avez modifié des fichiers localement mais pas push → Vercel ne les voit pas!

### Vérifier:
```bash
# Dans votre terminal local:
git status
# Si des fichiers sont modifiés:
git add .
git commit -m "Fix TypeScript errors"
git push
```

Puis redéployer (Étape 3 ci-dessus).

---

## 📦 ÉTAPE 4 — Module manquant

**Si l'erreur est:** `Cannot find module 'X'` ou `Module not found`

### Solution:
1. Vérifier que le module est dans `package.json`:
   ```bash
   # Localement:
   cat package.json | grep "module-name"
   ```

2. Si le module manque, l'ajouter:
   ```bash
   npm install module-name
   git add package.json package-lock.json
   git commit -m "Add missing dependency"
   git push
   ```

3. Redéployer sur Vercel

---

## 🐛 ÉTAPE 5 — Erreur de base de données

**Si l'erreur est:** `Database connection error` ou `SSL required`

### Solution:
1. Vérifier que `DATABASE_URL` contient `?sslmode=require` à la fin
2. Format correct: `postgresql://user:pass@host:5432/db?sslmode=require`
3. Si `?sslmode=require` manque → l'ajouter
4. Redéployer

---

## ✅ CHECKLIST RAPIDE

Avant de redéployer, vérifier:

- [ ] Les 4 variables d'environnement sont configurées dans Vercel
- [ ] `DATABASE_URL` contient `?sslmode=require`
- [ ] `JWT_SECRET` fait au moins 32 caractères
- [ ] `NEXT_PUBLIC_SITE_URL` correspond à votre vrai domaine Vercel
- [ ] Tous les changements locaux sont pushés sur GitHub
- [ ] `package.json` contient toutes les dépendances

---

## 🚨 SI RIEN NE FONCTIONNE

1. **Copier l'erreur complète** depuis Build Logs
2. **Me la montrer** et je te dirai exactement quoi faire

Ou essayer:

1. Vercel Dashboard → **Settings** → **General**
2. Scroll jusqu'à **"Danger Zone"**
3. Cliquer **"Clear Build Cache"**
4. Redéployer

---

## 📞 RÉSUMÉ ULTRA-RAPIDE

```
1. Deployments → déploiement rouge → Build Logs → lire l'erreur
2. Settings → Environment Variables → ajouter les 4 variables
3. Deployments → Redeploy
4. Attendre 2-3 min → ✅ vert = en ligne!
```

---

## 🎉 APRÈS LE SUCCÈS

Une fois le build vert:

1. Cliquer sur le déploiement vert
2. Cliquer **"Visit"** → votre site est en ligne!
3. Tester: `https://votre-app.vercel.app/api/health`
   - Doit retourner: `{"status":"ok","db":"connected"}`

---

**Besoin d'aide?** Copie-moi l'erreur exacte depuis Build Logs et je te dirai quoi faire! 🚀

