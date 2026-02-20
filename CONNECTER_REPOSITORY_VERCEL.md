# 🔗 Connecter le Repository GitHub à Vercel

## ✅ Vous avez déjà cliqué sur "Connect" - Prochaines étapes

### 📋 Vérification du Repository

Le repository GitHub est : `https://github.com/basmaouarid/inoxya-bijoux.git`

### 🔍 Si le repository "inoxya-bijoux" n'apparaît pas dans la liste

#### Option 1 : Ajuster les permissions GitHub App

1. Sur la page Git Settings de Vercel, cliquez sur **"Adjust GitHub App Permissions →"**
2. Autorisez l'accès au repository `inoxya-bijoux`
3. Retournez sur Vercel et rafraîchissez la page
4. Le repository devrait maintenant apparaître

#### Option 2 : Rechercher le repository

1. Dans la barre de recherche "Search..." sur la page Git Settings
2. Tapez : `inoxya-bijoux`
3. Si le repository apparaît, cliquez dessus pour le connecter

#### Option 3 : Connecter manuellement via URL

Si le repository n'apparaît toujours pas :

1. Sur la page Git Settings, cherchez un bouton **"Import Git Repository"** ou **"Add Repository"**
2. Entrez l'URL complète : `https://github.com/basmaouarid/inoxya-bijoux.git`
3. Ou connectez-vous via l'interface GitHub de Vercel

### ✅ Une fois le repository connecté

1. **Vérifier la branche de production** :
   - Vercel devrait détecter automatiquement la branche `main` ou `master`
   - Si vous voulez déployer `fix/dev-server-restore`, allez dans :
     - **Settings** → **Git** → **Production Branch**
     - Changez vers `fix/dev-server-restore` (ou mergez vers `main` d'abord)

2. **Déclencher le premier déploiement** :
   - Vercel devrait automatiquement déclencher un build
   - Ou allez dans **Deployments** → **"Deploy"** → Sélectionnez la branche

3. **Vérifier les variables d'environnement** :
   - **Settings** → **Environment Variables**
   - Assurez-vous que `NEXT_PUBLIC_SITE_URL` et `NODE_ENV=production` sont définis

### 🚨 Si le repository est déjà connecté mais le build échoue

1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement (même s'il a échoué)
3. Cliquez sur **"Redeploy"**
4. **⚠️ DÉCOCHEZ "Use existing Build Cache"**
5. Cliquez sur **"Redeploy"**

### 📝 Branches disponibles

- `fix/dev-server-restore` : Contient la correction pour `cacheComponents` ✅
- `main` : Branche principale (peut ne pas avoir la correction)

**Recommandation** : Merger `fix/dev-server-restore` vers `main` pour déployer la correction :

```bash
git checkout main
git merge fix/dev-server-restore
git push origin main
```

Puis sur Vercel, configurez la branche de production sur `main`.

### 🔍 Vérifier la connexion

1. **Settings** → **Git** → Vous devriez voir :
   - Repository : `basmaouarid/inoxya-bijoux`
   - Production Branch : `main` ou `fix/dev-server-restore`
   - Auto-deploy : Activé

2. **Deployments** → Vous devriez voir les commits récents

### ✅ Prochaines étapes après connexion

1. ✅ Repository connecté
2. ⏳ Vercel déclenche automatiquement un build
3. ⏳ Attendre 2-3 minutes
4. ✅ Vérifier que le build réussit (plus d'erreur `cacheComponents`)

