# 🔧 FIX: Erreurs EPIPE (Broken Pipe)

## 📋 Problème

Les erreurs `EPIPE: broken pipe, write` se produisent quand :
1. Un processus Node.js (serveur Next.js) essaie d'écrire dans `stdout` ou `stderr`
2. Mais le terminal/parent qui a lancé le processus a été fermé
3. Le pipe de communication est "cassé" (broken pipe)

### Symptômes
```
EPIPE: broken pipe, write
Socket._write @ node:internal/net:75
...
Server.<anonymous> @ node_modules/next/dist/server/lib/start-server.js:388:22
```

## ✅ Solutions Appliquées

### 1. Script de nettoyage des processus
**Fichier:** `scripts/kill-all-node.js`

**Usage:**
```bash
node scripts/kill-all-node.js
```

**Fonctionnalités:**
- Liste tous les processus Node.js
- Arrête tous les processus orphelins
- Nettoie les processus qui causent des erreurs EPIPE

### 2. Amélioration des scripts de démarrage

#### `scripts/dev-server.js`
- Ajout de gestion d'erreurs EPIPE
- Ignore les erreurs EPIPE (terminal fermé)
- Continue à fonctionner même si le terminal est fermé

#### `scripts/start-server.js`
- Même amélioration
- Gestion robuste des erreurs de pipe

### 3. Gestion des erreurs dans les processus

Les scripts ignorent maintenant les erreurs `EPIPE` car elles sont normales quand :
- Le terminal est fermé
- Le processus parent se termine
- Un pipe est fermé prématurément

## 🚀 Utilisation

### Nettoyer les processus orphelins
```bash
node scripts/kill-all-node.js
```

### Redémarrer le serveur proprement
```bash
npm run dev
```

### Si les erreurs persistent

1. **Vérifier les processus en cours:**
   ```bash
   tasklist /FI "IMAGENAME eq node.exe"
   ```

2. **Arrêter manuellement un processus:**
   ```bash
   taskkill /F /PID <PID>
   ```

3. **Redémarrer le terminal:**
   - Fermer complètement le terminal
   - Ouvrir un nouveau terminal
   - Relancer `npm run dev`

## 🔍 Diagnostic

### Vérifier si le serveur tourne
```bash
curl http://localhost:3000/api/health
```

### Vérifier les ports utilisés
```bash
netstat -ano | findstr :3000
```

### Voir les processus Node.js
```bash
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

## ⚠️ Notes Importantes

1. **Les erreurs EPIPE ne sont pas critiques:**
   - Elles n'empêchent pas le serveur de fonctionner
   - Elles indiquent juste que le terminal a été fermé
   - Le serveur peut continuer à tourner en arrière-plan

2. **Pour éviter les erreurs:**
   - Ne pas fermer le terminal pendant que le serveur tourne
   - Utiliser `Ctrl+C` pour arrêter proprement le serveur
   - Utiliser un gestionnaire de processus (PM2) en production

3. **En production:**
   - Les erreurs EPIPE ne devraient pas se produire
   - Les logs sont redirigés vers des fichiers
   - Utiliser un gestionnaire de processus (PM2, systemd, etc.)

## 📝 Scripts Disponibles

- `scripts/kill-all-node.js` - Nettoie tous les processus Node.js
- `scripts/dev-server.js` - Démarre le serveur de développement (amélioré)
- `scripts/start-server.js` - Démarre le serveur de production (amélioré)

## ✅ Résultat Attendu

Après avoir appliqué ces corrections :
- ✅ Plus d'erreurs EPIPE dans la console
- ✅ Serveur démarre proprement
- ✅ Processus orphelins nettoyés
- ✅ Gestion robuste des erreurs de pipe

---

**Date:** 2025-01-27  
**Statut:** ✅ Corrigé

