# 📸 Dossier des Images INOXYA

## 📁 Structure Actuelle

```
public/images/
├── bijoux/
│   ├── bagues/
│   │   ├── bague-berbere-or-18k/          ✅ Créé
│   │   ├── bague-alliance-diamantee/      ✅ Créé
│   │   └── bague-solitaire-premium/       ✅ Créé
│   ├── colliers/
│   │   └── collier-filigrane-argent/      ✅ Créé
│   ├── bracelets/
│   │   └── bracelet-khomsa-protection/    ✅ Créé
│   ├── boucles-oreilles/                  ✅ Créé
│   ├── parures/                           ✅ Créé
│   └── broches/                           ✅ Créé
├── packs/                                 ✅ Créé
└── categories/                            ✅ Créé
```

## 🎯 Comment Ajouter vos Images

### **Étape 1 : Prendre vos Photos**
1. Photographiez vos bijoux sous différents angles
2. Utilisez un fond neutre (blanc ou gris)
3. Assurez-vous d'avoir un bon éclairage
4. Prenez des photos de détail et d'ensemble

### **Étape 2 : Organiser vos Fichiers**

#### **Pour une Bague (exemple : Bague Berbère Or 18K) :**
```
public/images/bijoux/bagues/bague-berbere-or-18k/
├── main.jpg          (800x800px) - Photo principale
├── gallery-1.jpg     (600x600px) - Vue de côté
├── gallery-2.jpg     (600x600px) - Vue de dessus
├── gallery-3.jpg     (600x600px) - Détail des motifs
└── thumbnail.jpg     (200x200px) - Miniature
```

#### **Pour un Pack (exemple : Pack Élégance Berbère) :**
```
public/images/packs/pack-elegance-berbere/
├── main.jpg          (1000x750px) - Photo du pack complet
├── composition.jpg   (800x600px)  - Composition des bijoux
├── packaging.jpg     (800x600px)  - Emballage cadeau
└── thumbnail.jpg     (200x200px)  - Miniature
```

### **Étape 3 : Vérifier vos Images**
```bash
# Vérifier que toutes les images sont présentes
npm run images:check

# Optimiser les images si nécessaire
npm run images:optimize
```

## 📏 Tailles Recommandées

| Type | Dimensions | Qualité | Usage |
|------|------------|---------|-------|
| **main** | 800x800px | 90% | Image principale |
| **gallery** | 600x600px | 85% | Galerie |
| **thumbnail** | 200x200px | 80% | Miniatures |
| **pack** | 1000x750px | 90% | Packs |
| **category** | 400x300px | 85% | Catégories |

## 🎨 Conseils Photographiques

### **Pour les Bijoux :**
- ✅ Éclairage doux et uniforme
- ✅ Fond neutre (blanc/gris)
- ✅ Photos sous différents angles
- ✅ Montrer les détails et la finition
- ❌ Éviter les reflets excessifs
- ❌ Éviter les ombres dures

### **Pour les Packs :**
- ✅ Montrer la composition complète
- ✅ Photo de l'emballage
- ✅ Bijoux ensemble et séparément
- ✅ Mise en scène élégante

## 🔧 Scripts Disponibles

```bash
# Vérifier les images manquantes
npm run images:check

# Optimiser les images existantes
npm run images:optimize

# Vérifier ET optimiser
npm run images:setup
```

## 📝 Convention de Nommage

### **Images de Produits :**
```
{type}-{nom}-{variante}.{extension}

Exemples :
- bague-berbere-or-18k-main.jpg
- collier-filigrane-argent-gallery-1.jpg
- bracelet-khomsa-protection-thumbnail.jpg
```

### **Images de Packs :**
```
pack-{nom}-{type}.{extension}

Exemples :
- pack-elegance-berbere-main.jpg
- pack-moderne-chic-composition.jpg
- pack-mariee-royale-packaging.jpg
```

## 🚨 Points d'Attention

1. **Taille des fichiers** : Gardez sous 500KB
2. **Noms de fichiers** : Utilisez des tirets, pas d'espaces
3. **Formats** : Privilégiez JPG pour les photos
4. **Backup** : Gardez toujours les originaux
5. **Test** : Vérifiez l'affichage sur mobile et desktop

## 📞 Support

Si vous avez des questions :
1. Consultez `README-IMAGES.md` dans la racine du projet
2. Vérifiez les exemples dans `examples/ImageUsageExample.tsx`
3. Testez avec une image simple d'abord
4. Utilisez les outils de développement du navigateur

---

**✨ Prêt à ajouter vos photos de bijoux INOXYA ! ✨**
