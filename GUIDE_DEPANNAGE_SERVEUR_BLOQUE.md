# 🔧 Guide de Dépannage - Serveur Bloqué

## 🔍 Problème Identifié

Le serveur Next.js écoute sur le port 3000 mais ne répond pas aux requêtes. Il est probablement bloqué lors de l'initialisation de la base de données.

## ✅ Solution Rapide

### Étape 1: Arrêter le Serveur
Dans le terminal où tourne `npm run dev`, appuyez sur:
```
Ctrl+C
```

### Étape 2: Nettoyer les Processus
```bash
npm run clean:node
```

### Étape 3: Vérifier FORCE_SQLJS
```bash
npm run fix:env
```

Cela garantit que `FORCE_SQLJS=1` est dans `.env.local` pour éviter les blocages de `better-sqlite3`.

### Étape 4: Redémarrer le Serveur
```bash
npm run dev
```

**Attendez le message:** `✓ Ready in X.Xs`

### Étape 5: Tester le Serveur
Dans un **nouveau terminal**, exécutez:
```bash
npm run test:server
```

Ou ouvrez directement dans votre navigateur:
```
http://localhost:3000/fr
```

## 🔍 Si le Problème Persiste

### 1. Vérifier les Logs du Serveur
Regardez le terminal où tourne `npm run dev`:
- Cherchez les erreurs en rouge
- Cherchez les messages `[DB]` ou `[getAllBijoux]`
- Si vous voyez des timeouts, c'est normal (la DB est lente)

### 2. Vérifier la Base de Données
```bash
npm run db:verify
```

Si la DB est vide ou corrompue, elle sera recréée au prochain démarrage.

### 3. Forcer sql.js Uniquement
Assurez-vous que `.env.local` contient:
```env
FORCE_SQLJS=1
```

### 4. Redémarrer Proprement
```bash
# Arrêter
Ctrl+C

# Nettoyer
npm run clean:node

# Attendre 5 secondes

# Redémarrer
npm run dev
```

## 💡 Causes Possibles

1. **better-sqlite3 bloque** → Solution: `FORCE_SQLJS=1`
2. **Initialisation DB trop lente** → Solution: Timeouts déjà ajoutés (3s max)
3. **Base de données corrompue** → Solution: Supprimer `data/inoxya_bijoux.db` et redémarrer
4. **Plusieurs instances Node.js** → Solution: `npm run clean:node`

## 📝 Commandes Utiles

```bash
npm run clean:node      # Nettoyer tous les processus Node.js
npm run fix:env         # Forcer FORCE_SQLJS=1
npm run test:server     # Tester si le serveur répond
npm run diagnose        # Diagnostic complet
npm run db:verify       # Vérifier la base de données
```

## ✅ Vérification Finale

Après redémarrage, vous devriez voir:
```
✓ Ready in X.Xs
✓ Compiled /middleware in XXXms
```

Puis testez:
```
http://localhost:3000/fr
```

Le site devrait s'afficher (même si vide, le header/footer doivent apparaître).

---

**Si le problème persiste après ces étapes, vérifiez les logs du serveur pour identifier l'erreur exacte.**

