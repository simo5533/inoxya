# 🔍 GUIDE DE DIAGNOSTIC COMPLET

**Date:** 2025-01-27  
**Problème:** Les packs et produits ne s'affichent pas

---

## ✅ CORRECTIONS APPLIQUÉES

1. **Fonction `ensureDatabaseConnection()` créée**
   - Réinitialise automatiquement la connexion si nécessaire
   - Appelée avant chaque accès à la base

2. **`getPacks()` et `getProducts()` améliorés**
   - Appellent `ensureDatabaseConnection()` avant de lire
   - Logging amélioré pour le diagnostic

3. **Initialisation dans l'API**
   - `/api/packs` initialise la base avant de lire

---

## 🔍 DIAGNOSTIC ÉTAPE PAR ÉTAPE

### Étape 1: Vérifier les logs du serveur

**Dans le terminal où tourne `npm run dev`, cherchez:**

```
[getPacks] X pack(s) récupéré(s) depuis ...
[getProducts] X produit(s) récupéré(s) depuis ...
[SQLite] Connexion réussie: ...
```

**Si vous voyez:**
- ✅ `X pack(s) récupéré(s)` → Les données sont lues, problème frontend
- ❌ `Impossible de se connecter` → Problème de connexion DB
- ❌ Aucun message → L'API n'est pas appelée

---

### Étape 2: Tester l'API directement

**Ouvrez dans votre navigateur:**
```
http://localhost:3000/api/packs
```

**Résultats possibles:**
- ✅ Vous voyez un JSON avec des packs → **Problème frontend**
- ❌ Vous voyez `[]` → **Problème API/DB**
- ❌ Erreur 500 → **Regardez les logs du terminal**

---

### Étape 3: Vérifier la console du navigateur

1. Ouvrez http://localhost:3000/packs
2. Appuyez sur **F12**
3. Onglet **Console** → Vérifiez les erreurs
4. Onglet **Network** → Cherchez `/api/packs` → Cliquez dessus → Onglet **Response**

**Si vous voyez:**
- ✅ Des données dans Response → Problème d'affichage frontend
- ❌ `[]` dans Response → Problème API
- ❌ Erreur 500 → Regardez les logs du terminal

---

### Étape 4: Tester dans la console

**Dans la console du navigateur (F12), tapez:**
```javascript
fetch('/api/packs').then(r => r.json()).then(console.log)
```

**Résultats:**
- ✅ Vous voyez des packs → Problème d'affichage
- ❌ Vous voyez `[]` → Problème API/DB
- ❌ Erreur → Regardez le message d'erreur

---

## 🚨 PROBLÈMES COURANTS ET SOLUTIONS

### Problème 1: API retourne `[]`

**Cause:** La connexion à la base n'est pas établie

**Solution:**
1. Vérifiez que `data/inoxya_bijoux.db` existe
2. Redémarrez le serveur: `Ctrl+C` puis `npm run dev`
3. Regardez les logs pour voir les erreurs

---

### Problème 2: Erreur dans les logs

**Si vous voyez dans les logs:**
```
[SQLite] Initialisation impossible: ...
```

**Solutions:**
1. Vérifiez les permissions du fichier `data/inoxya_bijoux.db`
2. Vérifiez que le dossier `data/` existe
3. Redémarrez le serveur

---

### Problème 3: Frontend ne charge pas les données

**Si l'API retourne des données mais la page est vide:**

1. Vérifiez la console du navigateur (F12)
2. Cherchez les erreurs JavaScript
3. Vérifiez l'onglet Network → `/api/packs` → Response

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Le serveur Next.js est démarré (`npm run dev`)
- [ ] La base de données existe (`data/inoxya_bijoux.db`)
- [ ] L'API `/api/packs` retourne des données (testez dans le navigateur)
- [ ] Aucune erreur dans la console du navigateur (F12)
- [ ] Aucune erreur dans les logs du terminal
- [ ] Les images existent dans `public/images/`

---

## 💡 INFORMATIONS À ME FOURNIR

Pour que je puisse vous aider, dites-moi:

1. **Ce que vous voyez sur http://localhost:3000/api/packs:**
   - JSON avec des données?
   - `[]` vide?
   - Erreur?

2. **Les logs du terminal (où tourne npm run dev):**
   - Messages `[getPacks]`?
   - Messages `[SQLite]`?
   - Erreurs?

3. **La console du navigateur (F12):**
   - Erreurs en rouge?
   - Messages dans Network?

---

**Date:** 2025-01-27  
**Statut:** ⚠️ **EN ATTENTE DE DIAGNOSTIC**

