# 🔧 FIX: Problème de Démarrage - Site Ne S'Affiche Pas

## 🔍 Problème Identifié

Le serveur Next.js démarre mais les requêtes timeout. Le serveur est bloqué lors de l'initialisation de la base de données.

## ✅ Solutions Appliquées

### 1. Timeout sur les Requêtes DB
- ✅ Timeout de 3 secondes sur `getBijouxVedettes()`
- ✅ Timeout de 2 secondes sur `initSqlJsAsync()`
- ✅ Retourne un tableau vide si timeout (évite le blocage)

### 2. Configuration FORCE_SQLJS
- ✅ `FORCE_SQLJS=1` dans `.env.local`
- ✅ Évite les blocages de `better-sqlite3`
- ✅ Utilise `sql.js` (JavaScript pur, plus lent mais stable)

### 3. Scripts de Diagnostic
- ✅ `npm run diagnose` - Diagnostic complet
- ✅ `npm run fix:startup` - Correction automatique

## 🚀 SOLUTION RAPIDE

### Étape 1: Arrêter le Serveur
```bash
# Dans le terminal où tourne npm run dev
Ctrl+C
```

### Étape 2: Nettoyer les Processus
```bash
npm run clean:node
```

### Étape 3: Corriger la Configuration
```bash
npm run fix:startup
```

### Étape 4: Redémarrer
```bash
npm run dev
```

### Étape 5: Accéder au Site
**IMPORTANT:** Utilisez l'URL avec la locale:
```
http://localhost:3000/fr
```

**PAS:** `http://localhost:3000/` (redirige mais peut bloquer)

## 🔍 Diagnostic

Si le problème persiste:

1. **Ouvrez la console du navigateur (F12)**
   - Onglet "Console" → Vérifiez les erreurs JavaScript
   - Onglet "Network" → Vérifiez les requêtes bloquées

2. **Vérifiez les logs du serveur**
   - Regardez le terminal où tourne `npm run dev`
   - Cherchez les erreurs ou warnings

3. **Testez l'API directement**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Vérifiez la base de données**
   ```bash
   npm run db:verify
   ```

## ⚠️ Causes Possibles

1. **Base de données bloquée**
   - Solution: `FORCE_SQLJS=1` dans `.env.local`

2. **better-sqlite3 ne compile pas**
   - Solution: Déjà géré avec `FORCE_SQLJS=1`

3. **Requête DB trop lente**
   - Solution: Timeouts ajoutés (3s max)

4. **Middleware i18n bloque**
   - Solution: Accéder directement à `/fr`

## 📝 Configuration Recommandée

Dans `.env.local`:
```env
FORCE_SQLJS=1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
JWT_SECRET=votre-secret-64-caracteres
```

## ✅ Vérification

Après redémarrage, vous devriez voir:
```
✓ Ready in X.Xs
```

Puis accédez à:
```
http://localhost:3000/fr
```

Le site devrait s'afficher même si la base de données est vide (tableau vide au lieu de produits).

---

**Si le problème persiste, utilisez `npm run diagnose` pour un diagnostic complet.**

