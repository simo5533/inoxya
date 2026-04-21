# 📸 Guide des Images INOXYA

## 📁 Structure des Dossiers

```
public/images/
├── bijoux/
│   ├── bagues/
│   │   ├── bague-berbere-or-18k/
│   │   │   ├── main.jpg          (800x800px)
│   │   │   ├── gallery-1.jpg     (600x600px)
│   │   │   ├── gallery-2.jpg     (600x600px)
│   │   │   ├── gallery-3.jpg     (600x600px)
│   │   │   └── thumbnail.jpg     (200x200px)
│   │   ├── bague-alliance-diamantee/
│   │   └── bague-solitaire-premium/
│   ├── colliers/
│   │   └── collier-filigrane-argent/
│   ├── bracelets/
│   │   └── bracelet-khomsa-protection/
│   ├── boucles-oreilles/
│   ├── parures/
│   └── broches/
├── packs/
│   ├── pack-elegance-berbere/
│   ├── pack-moderne-chic/
│   └── pack-mariee-royale/
└── categories/
    ├── bagues-category.jpg
    ├── colliers-category.jpg
    └── ...
```

## 🎯 Convention de Nommage

### **Images de Produits**
```
{type}-{nom}-{variante}.{extension}

Exemples :
- bague-berbere-or-18k-main.jpg
- collier-filigrane-argent-gallery-1.jpg
- bracelet-khomsa-protection-thumbnail.jpg
```

### **Images de Packs**
```
pack-{nom}-{type}.{extension}

Exemples :
- pack-elegance-berbere-main.jpg
- pack-moderne-chic-composition.jpg
- pack-mariee-royale-packaging.jpg
```

## 📏 Tailles d'Images Recommandées

| Type | Dimensions | Qualité | Usage |
|------|------------|---------|-------|
| **main** | 800x800px | 90% | Image principale du produit |
| **gallery** | 600x600px | 85% | Galerie d'images |
| **thumbnail** | 200x200px | 80% | Miniatures |
| **pack** | 1000x750px | 90% | Images de packs |
| **category** | 400x300px | 85% | Images de catégories |

## 🖼️ Formats Supportés

### **Priorité 1 : WebP** (Recommandé)
- Meilleure compression
- Qualité supérieure
- Support moderne

### **Priorité 2 : JPG**
- Compatibilité maximale
- Taille optimisée
- Pas de transparence

### **Priorité 3 : PNG**
- Transparence
- Qualité parfaite
- Taille plus importante

## 🚀 Comment Ajouter vos Images

### **Étape 1 : Préparer vos Images**
1. Prenez des photos de vos bijoux sous différents angles
2. Utilisez un fond neutre (blanc ou gris)
3. Assurez-vous d'avoir un bon éclairage
4. Prenez des photos de détail et d'ensemble

### **Étape 2 : Organiser les Fichiers**
1. Placez vos images dans les dossiers correspondants
2. Suivez la convention de nommage
3. Créez les différentes tailles (main, gallery, thumbnail)

### **Étape 3 : Optimiser les Images**
```bash
# Installer Sharp (si pas déjà fait)
npm install sharp

# Exécuter le script d'optimisation
node scripts/optimize-images.js
```

### **Étape 4 : Mettre à Jour le Code**
1. Modifiez `lib/product-images.ts` pour ajouter vos nouveaux produits
2. Mettez à jour `data/sample-bijoux.ts` avec les nouveaux chemins
3. Testez l'affichage sur votre site

## 📝 Exemple Concret

### **Pour la "Bague Berbère Or 18K" :**

1. **Placez vos images dans :**
   ```
   public/images/bijoux/bagues/bague-berbere-or-18k/
   ├── main.jpg          (photo principale)
   ├── gallery-1.jpg     (vue de côté)
   ├── gallery-2.jpg     (vue de dessus)
   ├── gallery-3.jpg     (détail des motifs)
   └── thumbnail.jpg     (miniature)
   ```

2. **Le mapping est déjà configuré dans `lib/product-images.ts` :**
   ```typescript
   "bijou-1": {
     main: "/images/bijoux/bagues/bague-berbere-or-18k/main.jpg",
     gallery: [
       "/images/bijoux/bagues/bague-berbere-or-18k/gallery-1.jpg",
       "/images/bijoux/bagues/bague-berbere-or-18k/gallery-2.jpg",
       "/images/bijoux/bagues/bague-berbere-or-18k/gallery-3.jpg"
     ],
     thumbnail: "/images/bijoux/bagues/bague-berbere-or-18k/thumbnail.jpg"
   }
   ```

## 🔧 Scripts Utiles

### **Optimisation Automatique**
```bash
node scripts/optimize-images.js
```

### **Vérification des Images**
```bash
# Vérifier que toutes les images existent
node -e "
const fs = require('fs');
const { productImages } = require('./lib/product-images.ts');
// Script de vérification...
"
```

## 📱 Responsive Images

Le système utilise Next.js Image avec :
- **Lazy loading** automatique
- **Responsive** selon la taille d'écran
- **Optimisation** automatique des formats
- **Placeholder** en cas d'image manquante

## 🎨 Conseils Photographiques

### **Pour les Bijoux :**
- Utilisez un éclairage doux et uniforme
- Évitez les reflets excessifs
- Prenez des photos sous différents angles
- Montrez les détails et la finition
- Utilisez un fond neutre

### **Pour les Packs :**
- Montrez la composition complète
- Prenez une photo de l'emballage
- Montrez les bijoux ensemble et séparément

## 🚨 Points d'Attention

1. **Taille des fichiers** : Gardez les images sous 500KB
2. **Noms de fichiers** : Utilisez des tirets, pas d'espaces
3. **Formats** : Privilégiez JPG pour les photos
4. **Backup** : Gardez toujours les originaux
5. **Test** : Vérifiez l'affichage sur mobile et desktop

## 📞 Support

Si vous avez des questions sur l'ajout d'images :
1. Vérifiez la structure des dossiers
2. Consultez les exemples dans `lib/product-images.ts`
3. Testez avec une image simple d'abord
4. Utilisez les outils de développement du navigateur

---

**✨ Bonne chance avec vos photos de bijoux INOXYA ! ✨**
