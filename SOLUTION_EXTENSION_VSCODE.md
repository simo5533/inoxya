# 🔧 SOLUTION - Extension VS Code qui crash

**Date:** 2025-01-27  
**Problème:** Extension `ms-vscode.vscode-typescript-tslint-plugin` crash 5 fois

---

## 🔍 PROBLÈME IDENTIFIÉ

L'extension VS Code `ms-vscode.vscode-typescript-tslint-plugin` crash 5 fois en 5 minutes, ce qui peut:
- Bloquer le service TypeScript
- Empêcher la compilation
- Faire que le serveur ne démarre pas

---

## ✅ SOLUTION

### Étape 1: Désactiver l'extension

1. Ouvrez VS Code
2. Appuyez sur `Ctrl+Shift+X` (Extensions)
3. Cherchez: `TypeScript TSLint Plugin`
4. Cliquez sur **Désactiver** ou **Désinstaller**

### Étape 2: Redémarrer VS Code

1. Fermez complètement VS Code
2. Rouvrez VS Code
3. Attendez que le service TypeScript redémarre

### Étape 3: Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis:
npm run dev
```

---

## 📊 RÉSULTATS ATTENDUS

### Avant
- ❌ Service TypeScript crash 5 fois
- ❌ Serveur ne démarre pas
- ❌ Compilation bloquée

### Après
- ✅ Service TypeScript stable
- ✅ Serveur démarre correctement
- ✅ Compilation fonctionne

---

## 💡 ALTERNATIVE

Si vous avez besoin de TSLint, vous pouvez:
1. Utiliser ESLint à la place (recommandé)
2. Mettre à jour l'extension si disponible
3. Utiliser une version antérieure de l'extension

---

## ✅ STATUT

- ✅ Extension identifiée comme cause probable
- ⚠️ Désactivation manuelle requise
- 🔄 Redémarrage VS Code nécessaire

**Après désactivation, le projet devrait fonctionner correctement!** 🎉

