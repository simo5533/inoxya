# 🔍 CAUSE RACINE - "Aucun bijou/pack trouvé"

**Date** : 2025-01-27  
**Problème** : Les produits/packs existent dans SQLite mais le site affiche parfois "Aucun bijou trouvé / Aucun pack disponible"

---

## 🎯 CAUSE RACINE IDENTIFIÉE

### 1. **INCOHÉRENCE DES NOMS DE FICHIERS DB** ⚠️ CRITIQUE

**Problème** :
- Le code utilise : `data/inoxya_bijoux.db` (avec **underscore**)
- Mais il existe aussi : `data/inoxya-bijoux.db` (avec **tiret**)
- Il y a **6 fichiers .db différents** dans le projet !

**Fichiers trouvés** :
```
✅ C:\Users\Basma\Desktop\inoxya-bijoux 2\data\inoxya-bijoux.db (36864 bytes) - ACTUEL
❌ C:\Users\Basma\Desktop\inoxya-bijoux 2\data\inoxya_bijoux.db (98304 bytes) - AUTRE
❌ C:\Users\Basma\Desktop\inoxya-bijoux 2\inoxya-bijoux 2\data\inoxya_bijoux.db (598016 bytes) - SOUS-DOSSIER
```

**Code actuel** (`lib/sqlite.ts:22`) :
```typescript
const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')  // underscore
```

**Impact** :
- Si le fichier `inoxya_bijoux.db` n'existe pas mais `inoxya-bijoux.db` existe → DB vide créée
- Après redémarrage, le serveur peut ouvrir un fichier différent
- Les données peuvent être dans un fichier mais le code lit un autre

---

### 2. **CHEMIN DB NON DÉTERMINISTE** ⚠️

**Problème** :
- Utilise `process.cwd()` qui peut varier selon le contexte d'exécution
- Pas de variable d'environnement `SQLITE_DB_PATH` pour forcer un chemin absolu
- Pas de log au démarrage pour confirmer quel fichier est utilisé

**Impact** :
- En développement : `process.cwd()` = dossier projet
- En build : `process.cwd()` peut être différent
- Après redémarrage : peut changer si le terminal est dans un autre dossier

---

### 3. **FALLBACKS SILENCIEUX** ⚠️

**Problème** :
- Si DB inaccessible, certaines fonctions retournent `[]` au lieu de 503
- Le code a des fallbacks (sql.js, fallback-products) qui peuvent masquer le problème
- Pas de log clair quand un fallback est utilisé

**Code problématique** (`lib/sqlite.ts:429`) :
```typescript
export function getProducts() {
  if (!db) return []  // ❌ Retourne [] silencieusement
  // ...
}
```

**Impact** :
- L'API retourne `[]` au lieu de 503
- Le front affiche "Aucun produit" au lieu d'une erreur claire
- Le problème est masqué

---

### 4. **CACHE NEXT.JS** ⚠️

**Problème** :
- Les routes API peuvent être mises en cache par Next.js
- Pas de `export const dynamic = "force-dynamic"` sur `/api/products` et `/api/packs`
- Le front peut utiliser `fetch()` avec cache par défaut

**Impact** :
- Après redémarrage serveur, le cache peut retourner une ancienne réponse vide
- Les données réelles ne sont pas rechargées

---

### 5. **INITIALISATION DB PARFOIS MANQUANTE** ⚠️

**Problème** :
- `initializeDatabase()` n'est pas toujours appelé avant les requêtes
- `testConnection()` peut retourner `true` même si `db` est `null` dans certains cas
- Pas de vérification systématique au démarrage

**Impact** :
- Les premières requêtes peuvent échouer silencieusement
- Après redémarrage, la DB peut ne pas être initialisée

---

## 📊 PREUVES

### Logs à vérifier :
```bash
# Vérifier quel fichier DB est utilisé
npm run db:doctor

# Vérifier le contenu de chaque DB
sqlite3 data/inoxya-bijoux.db "SELECT COUNT(*) FROM products;"
sqlite3 data/inoxya_bijoux.db "SELECT COUNT(*) FROM products;"
```

### Tests à effectuer :
1. Redémarrer le serveur 10 fois
2. Après chaque redémarrage, vérifier :
   - Quel fichier DB est ouvert (log)
   - Combien de produits dans la DB
   - Ce que retourne `/api/products`

---

## ✅ SOLUTION PROPOSÉE

### Phase B : Chemin DB déterministe
- Ajouter `SQLITE_DB_PATH` (env)
- Log au démarrage : chemin absolu utilisé
- Vérifier existence + taille

### Phase C : Stopper fallbacks silencieux
- Production : DB KO → 503 (jamais `[]`)
- Dev : DB KO → 503 (sauf si `ENABLE_FALLBACK=1` explicite)

### Phase D : Éliminer cache Next.js
- `export const dynamic = "force-dynamic"` sur routes API
- `Cache-Control: no-store` dans headers

### Phase E : Scripts anti-régression
- `db-doctor.ts` : vérifie chemin + contenu
- `smoke-catalog.ts` : teste API après redémarrage

---

## 🎯 RÉSULTAT ATTENDU

Après corrections :
- ✅ **1 seul fichier DB** utilisé (chemin absolu loggé)
- ✅ **0 fallback silencieux** (503 si DB KO)
- ✅ **0 cache** (données toujours fraîches)
- ✅ **20 redémarrages** → toujours les mêmes données

---

**Prochaine étape** : Phase B - Rendre le chemin DB 100% déterministe

