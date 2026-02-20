# 🧹 GUIDE : Nettoyer le Cache Vercel et Redéployer

## ⚠️ PROBLÈME
Vercel utilise un cache contenant l'ancienne configuration `next.config.mjs` avec des flags expérimentaux, ce qui cause l'échec du build.

## ✅ SOLUTION : Nettoyer le Cache et Redéployer

### Méthode 1 : Via le Dashboard Vercel (RECOMMANDÉ)

#### Étape 1 : Ouvrir le Dashboard
1. Allez sur : https://vercel.com/aomarlaasri-9900s-projects/inoxya-bijoux
2. Connectez-vous si nécessaire

#### Étape 2 : Accéder aux Déploiements
1. Cliquez sur l'onglet **"Deployments"** dans le menu de gauche
2. Trouvez le dernier déploiement (celui qui a échoué)

#### Étape 3 : Redéployer SANS Cache
1. Cliquez sur les **trois points (⋯)** à droite du déploiement
2. Sélectionnez **"Redeploy"**
3. **IMPORTANT** : Dans la fenêtre qui s'ouvre, **DÉSACTIVEZ** l'option :
   - ❌ "Use existing Build Cache" (ou "Utiliser le cache de build existant")
4. Cliquez sur **"Redeploy"**

#### Étape 4 : Vérifier le Build
1. Attendez que le build se termine (1-2 minutes)
2. Vérifiez les logs pour confirmer qu'il n'y a plus d'erreur `experimental.cacheComponents`
3. Si le build réussit, votre site sera en ligne !

---

### Méthode 2 : Via les Paramètres du Projet

#### Étape 1 : Accéder aux Paramètres
1. Allez sur : https://vercel.com/aomarlaasri-9900s-projects/inoxya-bijoux
2. Cliquez sur **"Settings"** dans le menu de gauche
3. Allez dans **"Git"**

#### Étape 2 : Nettoyer le Cache
1. Faites défiler jusqu'à la section **"Build Cache"**
2. Cliquez sur **"Clear Build Cache"** ou **"Nettoyer le cache de build"**
3. Confirmez l'action

#### Étape 3 : Déclencher un Nouveau Déploiement
1. Retournez dans **"Deployments"**
2. Cliquez sur **"Redeploy"** sur le dernier déploiement
3. Le build utilisera maintenant la nouvelle configuration

---

### Méthode 3 : Forcer un Nouveau Commit (Alternative)

Si les méthodes ci-dessus ne fonctionnent pas, forcez un nouveau commit :

```bash
# Créer un commit vide pour forcer le rebuild
git commit --allow-empty -m "chore: force rebuild without cache"
git push origin main
```

Vercel détectera automatiquement le nouveau commit et redéploiera avec un cache propre.

---

## 🔍 VÉRIFICATIONS

### Vérifier que le Cache est Nettoyé
1. Dans les logs de build Vercel, cherchez :
   - ✅ "Skipping build cache" ou "Cache cleared"
   - ✅ Aucune erreur `experimental.cacheComponents`
   - ✅ Build réussi

### Vérifier la Configuration Utilisée
Dans les logs de build, vous devriez voir :
```
Creating an optimized production build ...
✓ Compiled successfully
```

**Sans** les warnings :
- ❌ `experimental.dynamicIO has been renamed`
- ❌ `experimental.cacheComponents can only be enabled`

---

## 📋 CHECKLIST

- [ ] Cache Vercel nettoyé
- [ ] Redéploiement lancé SANS cache
- [ ] Build réussi (vérifier les logs)
- [ ] Aucune erreur `experimental.cacheComponents`
- [ ] Site accessible et fonctionnel

---

## 🆘 SI LE PROBLÈME PERSISTE

### Option 1 : Supprimer et Recréer le Projet
1. Dashboard Vercel → Settings → General
2. Faites défiler jusqu'à "Delete Project"
3. Supprimez le projet
4. Recréez-le en connectant le repo GitHub
5. Le premier déploiement n'utilisera pas de cache

### Option 2 : Contacter le Support Vercel
Si rien ne fonctionne, contactez le support Vercel avec :
- L'URL du déploiement qui échoue
- Les logs de build
- La mention que le cache contient une ancienne configuration

---

## ✅ CONFIGURATION ACTUELLE

### Fichiers Vérifiés
- ✅ `next.config.mjs` : PROPRE (aucun flag experimental)
- ✅ `vercel.json` : Configuré avec `installCommand: "npm ci --force"`
- ✅ Code poussé sur GitHub (commit `85a636c`)

### Prochaines Étapes
1. Nettoyer le cache Vercel (méthode 1 ou 2)
2. Redéployer
3. Vérifier que le build réussit
4. Tester l'application déployée

---

**Date de création :** 2026-02-20  
**Dernière mise à jour :** 2026-02-20

