# 🔧 Configuration de better-sqlite3 sur Windows

## Problème

`better-sqlite3` nécessite des bindings natifs compilés pour fonctionner. Sur Windows, cela nécessite :
- Python 3.6+ (recommandé : Python 3.11)
- Visual C++ Build Tools (via Visual Studio Build Tools ou Visual Studio)

## Solution 1 : Installation complète (Recommandée)

### Étape 1 : Installer Python

1. Télécharger Python depuis https://www.python.org/downloads/
2. **Important** : Cocher "Add Python to PATH" lors de l'installation
3. Vérifier l'installation :
   ```powershell
   python --version
   ```

### Étape 2 : Installer Visual Studio Build Tools

1. Télécharger depuis : https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Installer "C++ build tools" (workload)
3. Redémarrer l'ordinateur

### Étape 3 : Compiler better-sqlite3

```powershell
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
npm rebuild better-sqlite3
```

## Solution 2 : Utilisation sans compilation (Temporaire)

L'application fonctionne actuellement **sans base de données** grâce à une gestion d'erreur gracieuse. Les fonctions retournent des valeurs par défaut (tableaux vides, null, etc.).

**Limitations :**
- Aucune donnée ne sera persistée
- Les produits ne seront pas chargés depuis la base
- L'interface admin ne fonctionnera pas correctement

## Solution 3 : Utiliser des binaires précompilés

Si vous avez accès à un autre ordinateur avec Node.js 24.12.0 et Windows x64 :

1. Sur l'autre ordinateur :
   ```powershell
   npm install better-sqlite3
   npm rebuild better-sqlite3
   ```

2. Copier le fichier compilé :
   - Source : `node_modules/better-sqlite3/build/Release/better_sqlite3.node`
   - Destination : `C:\Users\Basma\Desktop\inoxya-bijoux 2\node_modules\better-sqlite3\build\Release\better_sqlite3.node`

## Vérification

Après compilation, vérifier que le fichier existe :

```powershell
Test-Path "node_modules\better-sqlite3\build\Release\better_sqlite3.node"
```

Si `True`, la compilation a réussi. Redémarrer le serveur :

```powershell
npm run dev
```

## Notes

- L'application fonctionne actuellement **sans erreurs** mais **sans base de données**
- Pour une utilisation complète, la compilation de `better-sqlite3` est nécessaire
- En production (Vercel), utiliser une base de données externe (PostgreSQL, MySQL, etc.)

