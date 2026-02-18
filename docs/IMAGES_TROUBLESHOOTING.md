# 🔍 Guide de dépannage - Images non affichées

## Problème

Les photos des produits et packs ne s'affichent pas dans le projet.

## Causes possibles

### 1. Base de données non accessible
**Symptôme:** Aucun produit/pack n'apparaît sur le site.

**Cause:** `better-sqlite3` n'est pas compilé (bindings natifs manquants).

**Solution:** Voir `docs/SETUP_BETTER_SQLITE3.md` pour compiler `better-sqlite3`.

### 2. Chemins d'images incorrects dans la base de données
**Symptôme:** Les produits/packs apparaissent mais sans images (placeholder).

**Cause:** Les chemins dans la base de données ne correspondent pas aux fichiers dans `public/images/`.

**Vérification:**
```bash
npx tsx scripts/check-images.ts
```

**Chemins corrects:**
- ✅ `/images/products/nom-image.jpeg`
- ✅ `/images/packs/pack-nom.jpg`
- ❌ `C:\Users\...\image.jpg` (chemin absolu Windows)
- ❌ `images/products/image.jpg` (sans le `/` initial)

### 3. Fichiers d'images manquants
**Symptôme:** Les chemins sont corrects mais les images ne s'affichent pas.

**Vérification:**
1. Vérifier que les fichiers existent dans `public/images/`
2. Vérifier les permissions de lecture
3. Vérifier que les extensions correspondent (`.jpg`, `.jpeg`, `.webp`, etc.)

## Structure attendue

```
public/
  images/
    products/        # Images des produits
    packs/            # Images des packs
    bijoux/          # Images organisées par catégorie
      bagues/
      colliers/
      ...
```

## Solutions rapides

### Solution 1: Vérifier l'API
```bash
# Dans le navigateur ou avec curl
curl http://localhost:3000/api/products
curl http://localhost:3000/api/packs
```

Vérifier que les réponses contiennent des `image_url` valides.

### Solution 2: Vérifier les logs
Regarder les logs du serveur pour voir si des chemins sont corrigés automatiquement :
```
[getProducts] Chemin corrigé pour Nom Produit: C:\... → /images/...
```

### Solution 3: Utiliser le script de vérification
```bash
npx tsx scripts/check-images.ts
```

Ce script :
- Liste tous les produits et packs
- Vérifie si leurs images existent
- Suggère des chemins alternatifs si trouvés

## Correction manuelle

Si vous trouvez des images manquantes :

1. **Vérifier que l'image existe dans `public/images/`**
2. **Mettre à jour la base de données** avec le bon chemin :
   ```sql
   UPDATE products SET image_url = '/images/products/nom-image.jpeg' WHERE id = 1;
   UPDATE packs SET image_url = '/images/packs/pack-nom.jpg' WHERE id = 1;
   ```

## Images disponibles

D'après la structure du projet, vous avez :
- ✅ **105+ images** dans `public/images/products/`
- ✅ **13+ images** dans `public/images/packs/`
- ✅ **Images organisées** dans `public/images/bijoux/` par catégorie

Les images sont présentes, il faut juste s'assurer que les chemins dans la base de données sont corrects.

