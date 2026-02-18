# 🔄 PROCÉDURE DE STABILITÉ AU REDÉMARRAGE

**Date** : 2025-01-27  
**Objectif** : Vérifier que les données sont toujours visibles après 10+ redémarrages

---

## 🎯 PROCÉDURE

### 1. Vérification Initiale

```bash
# Vérifier l'état de la DB
npm run db:doctor

# Tester les API
npm run smoke:catalog
```

### 2. Redémarrage x10

```bash
# Boucle de redémarrage
for ($i=1; $i -le 10; $i++) {
    Write-Host "`n=== Redémarrage #$i ===" -ForegroundColor Cyan
    
    # Arrêter le serveur
    taskkill /F /IM node.exe 2>$null
    Start-Sleep -Seconds 2
    
    # Redémarrer
    npm run dev &
    Start-Sleep -Seconds 5
    
    # Tester
    npm run smoke:catalog
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec au redémarrage #$i" -ForegroundColor Red
        break
    }
    
    Write-Host "✅ Redémarrage #$i réussi" -ForegroundColor Green
}
```

### 3. Vérifications Après Chaque Redémarrage

```bash
# 1. Vérifier le chemin DB (doit être identique)
npm run db:doctor | Select-String "Absolu:"

# 2. Vérifier le comptage (doit être identique)
npm run db:doctor | Select-String "Actifs:|Total:"

# 3. Tester les API
curl http://localhost:3000/api/products
curl http://localhost:3000/api/packs
```

---

## ✅ RÉSULTAT ATTENDU

Après 10 redémarrages :
- ✅ Chemin DB **strictement identique** à chaque fois
- ✅ Comptage produits/packs **identique** à chaque fois
- ✅ API retournent **toujours** les données (status 200)
- ✅ **0 échec** dans les smoke tests

---

## 🐛 SI PROBLÈME

### Le chemin DB change
→ Vérifier `SQLITE_DB_PATH` dans `.env.local`
→ Vérifier `process.cwd()` (doit être le dossier projet)

### Le comptage change
→ Vérifier qu'on lit bien le même fichier DB
→ Vérifier qu'il n'y a pas plusieurs fichiers DB

### L'API retourne 503
→ Vérifier que `better-sqlite3` est installé
→ Vérifier les logs du serveur
→ Exécuter `npm run db:doctor`

### L'API retourne []
→ Vérifier que la DB contient bien des données
→ Vérifier que `ENABLE_FALLBACK=0` (ou non défini)
→ Vérifier les logs pour voir si un fallback s'est déclenché

---

## 📊 CHECKLIST

- [ ] `db:doctor` affiche le même chemin à chaque redémarrage
- [ ] `db:doctor` affiche le même comptage à chaque redémarrage
- [ ] `smoke:catalog` passe à chaque redémarrage
- [ ] Les pages affichent toujours les produits/packs
- [ ] Pas d'erreur 503
- [ ] Pas de fallback silencieux

---

**Si tous les checks passent après 10 redémarrages → ✅ STABLE**

