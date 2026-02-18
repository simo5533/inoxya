# 🗄️ GUIDE DE GESTION DE LA BASE DE DONNÉES - INOXYA BIJOUX

## 📊 **VOTRE BASE DE DONNÉES SQLITE**

Votre base de données est maintenant **opérationnelle** et contient des données réelles !

### 📁 **Localisation**
```
📁 C:\Users\hassa\Desktop\inoxya-bijoux 2\data\
   └── 📄 inoxya_bijoux.db (32 KB)
```

---

## 🔍 **COMMENT VOIR VOTRE BASE DE DONNÉES**

### 1. **Script de Visualisation (Recommandé)**
```bash
node scripts/view-database.js
```
**Affiche** :
- ✅ Toutes les tables
- ✅ Tous les produits avec détails
- ✅ Toutes les catégories
- ✅ Tous les packs
- ✅ Statistiques complètes

### 2. **Test de Connexion**
```bash
node scripts/test-sqlite-connection.js
```
**Vérifie** :
- ✅ Connexion à la base
- ✅ Création des tables
- ✅ Opérations CRUD

### 3. **Test d'Intégration**
```bash
node scripts/test-final-integration.js
```
**Teste** :
- ✅ Toutes les fonctionnalités
- ✅ Opérations complètes
- ✅ Statistiques finales

---

## 📊 **CONTENU ACTUEL DE VOTRE BASE**

### 📦 **PRODUITS (4)**
1. **Bracelet Khomsa Protection** - 450 MAD (Stock: 12)
2. **Boucles d'oreilles Étoiles** - 320 MAD (Stock: 15)
3. **Bague Berbère Or 18K** - 2999 MAD (Stock: 5)
4. **Collier Filigrane Argent** - 1890 MAD (Stock: 8)

### 📂 **CATÉGORIES (6)**
1. Bagues
2. Boucles d'oreilles
3. Bracelets
4. Broches
5. Colliers
6. Parures

### 🎁 **PACKS (0)**
- Aucun pack pour le moment

### 📊 **STATISTIQUES**
- **Produits totaux** : 4
- **Produits actifs** : 4
- **Stock total** : 40 unités
- **Valeur stock** : 40,315 MAD
- **Catégories** : 6

---

## 🛠️ **OUTILS DE GESTION**

### **1. Via l'Interface Web**
- 🌐 Allez sur `http://localhost:3000/admin`
- ✅ Ajoutez/modifiez/supprimez des produits
- ✅ Toutes les modifications sont sauvegardées

### **2. Via les Scripts**
```bash
# Voir la base de données
node scripts/view-database.js

# Tester la connexion
node scripts/test-sqlite-connection.js

# Test complet
node scripts/test-final-integration.js
```

### **3. Via un Éditeur SQLite (Optionnel)**
- **DB Browser for SQLite** (gratuit)
- **SQLiteStudio** (gratuit)
- **DBeaver** (gratuit)

---

## 🔧 **COMMANDES UTILES**

### **Voir le contenu**
```bash
node scripts/view-database.js
```

### **Tester la base**
```bash
node scripts/test-sqlite-connection.js
```

### **Test complet**
```bash
node scripts/test-final-integration.js
```

### **Redémarrer le serveur**
```bash
npm run dev
```

---

## 📈 **AJOUTER DES DONNÉES**

### **Via l'Interface Web (Recommandé)**
1. Allez sur `http://localhost:3000/admin`
2. Cliquez sur "Ajouter un Produit"
3. Remplissez le formulaire
4. Cliquez sur "Créer le produit"
5. ✅ Le produit est sauvegardé en base !

### **Via Script (Avancé)**
Vous pouvez créer un script personnalisé pour ajouter des données en masse.

---

## 💾 **SAUVEGARDE**

### **Sauvegarde Simple**
```bash
# Copier le fichier de base
copy "data\inoxya_bijoux.db" "backup\inoxya_bijoux_backup.db"
```

### **Sauvegarde Automatique (Script)**
```bash
# Créer un dossier backup
mkdir backup

# Copier avec timestamp
copy "data\inoxya_bijoux.db" "backup\inoxya_bijoux_%date%.db"
```

---

## 🔄 **RESTAURATION**

### **Restaurer depuis une sauvegarde**
```bash
# Arrêter le serveur
# Remplacer le fichier
copy "backup\inoxya_bijoux_backup.db" "data\inoxya_bijoux.db"
# Redémarrer le serveur
npm run dev
```

---

## 🚨 **DÉPANNAGE**

### **Base de données corrompue**
```bash
# Supprimer et recréer
del data\inoxya_bijoux.db
node scripts/test-sqlite-connection.js
```

### **Tables manquantes**
```bash
# Réinitialiser complètement
del data\inoxya_bijoux.db
node scripts/test-final-integration.js
```

### **Données perdues**
```bash
# Restaurer depuis backup
copy "backup\inoxya_bijoux_backup.db" "data\inoxya_bijoux.db"
```

---

## 📊 **MONITORING**

### **Vérifier la taille**
```bash
dir data\inoxya_bijoux.db
```

### **Voir les statistiques**
```bash
node scripts/view-database.js
```

### **Tester les performances**
```bash
node scripts/test-final-integration.js
```

---

## 🎯 **BONNES PRATIQUES**

### ✅ **À FAIRE**
- Sauvegarder régulièrement
- Utiliser l'interface web pour les modifications
- Vérifier les données avec les scripts
- Tester après chaque modification importante

### ❌ **À ÉVITER**
- Modifier directement le fichier .db
- Supprimer le fichier sans sauvegarde
- Ignorer les erreurs de connexion
- Oublier de tester après les modifications

---

## 🚀 **PROCHAINES ÉTAPES**

### **Immédiat**
- ✅ Votre base fonctionne parfaitement
- ✅ Vous pouvez ajouter des produits via l'interface
- ✅ Toutes les données sont persistantes

### **Futur (Optionnel)**
- 🔄 Migration vers PostgreSQL pour la production
- 🔄 Backup automatique
- 🔄 Monitoring avancé
- 🔄 Optimisation des performances

---

## 🎉 **CONCLUSION**

Votre base de données SQLite est **parfaitement fonctionnelle** ! 

### **Ce que vous pouvez faire maintenant** :
- ✅ **Voir vos données** : `node scripts/view-database.js`
- ✅ **Ajouter des produits** : Interface web `/admin`
- ✅ **Modifier des produits** : Interface web `/admin`
- ✅ **Sauvegarder** : Copier le fichier `.db`
- ✅ **Tester** : Scripts de test disponibles

**Votre projet INOXYA BIJOUX est prêt à l'emploi !** 🚀

---

**Guide créé le**: 16 Septembre 2025  
**Base de données**: SQLite opérationnelle  
**Statut**: ✅ **FONCTIONNEL**
