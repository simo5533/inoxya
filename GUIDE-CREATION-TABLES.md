# 🚀 GUIDE : Créer les Tables Supabase INOXYA BIJOUX

## 📋 **ÉTAPES À SUIVRE**

### **Étape 1 : Ouvrir Supabase Dashboard**
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet INOXYA

### **Étape 2 : Accéder au SQL Editor**
1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### **Étape 3 : Copier le Script**
1. Ouvrez le fichier `scripts/create-tables-simple.sql`
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)

### **Étape 4 : Coller et Exécuter**
1. Dans Supabase SQL Editor, **collez** le script (Ctrl+V)
2. Cliquez sur **"Run"** ou appuyez sur **Ctrl+Enter**

### **Étape 5 : Vérifier l'Exécution**
Vous devriez voir des messages comme :
```
✅ Tables INOXYA BIJOUX créées avec succès !
📊 Données insérées : 6 catégories, 4 packs, 15 bijoux
👤 Utilisateur admin créé : admin_phone / admin123
🔒 Politiques de sécurité configurées
```

### **Étape 6 : Tester la Connexion**
```bash
npm run test:supabase
```

---

## 📊 **TABLES QUI SERONT CRÉÉES**

### **Tables Principales** ✅
- ✅ **users** - Utilisateurs et admin
- ✅ **categories** - 6 catégories de bijoux
- ✅ **bijoux** - 15+ produits avec prix MAD
- ✅ **packs** - 4 collections
- ✅ **cart_items** - Panier
- ✅ **favorites** - Favoris
- ✅ **orders** - Commandes
- ✅ **order_items** - Détails commandes

### **Données Insérées** 📦
- ✅ **6 catégories** : Bagues, Colliers, Bracelets, etc.
- ✅ **4 packs** : Pack Élégance Berbère, etc.
- ✅ **15 bijoux** : Bague Berbère Or 18K, etc.
- ✅ **1 admin** : admin_phone / admin123

---

## 🔧 **EN CAS DE PROBLÈME**

### **Erreur "Table already exists"**
```sql
-- Si vous avez déjà des tables, ajoutez ceci au début :
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS bijoux CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### **Erreur de permissions**
- Vérifiez que vous êtes connecté en tant qu'admin du projet
- Vérifiez que votre projet Supabase est actif

### **Erreur de connexion**
```bash
# Vérifiez vos variables d'environnement
npm run test:supabase
```

---

## ✅ **VÉRIFICATION POST-CRÉATION**

### **1. Tester la Connexion**
```bash
npm run test:supabase
```

### **2. Vérifier les Données**
- Allez dans **"Table Editor"** dans Supabase
- Vérifiez que vous voyez les tables : users, categories, bijoux, packs, etc.

### **3. Tester le Site**
```bash
npm run dev
```
- Allez sur http://localhost:3000
- Vérifiez que les produits s'affichent
- Testez l'admin : http://localhost:3000/admin

---

## 🎯 **RÉSULTAT ATTENDU**

Après l'exécution, vous devriez avoir :
- ✅ **8 tables** créées et fonctionnelles
- ✅ **6 catégories** de bijoux
- ✅ **4 packs** de collections
- ✅ **15 bijoux** avec prix en MAD
- ✅ **1 utilisateur admin** (admin_phone / admin123)
- ✅ **Sécurité RLS** configurée
- ✅ **Index** pour les performances

---

## 🚨 **IMPORTANT**

- **Sauvegardez** votre projet avant d'exécuter le script
- **Testez** d'abord sur un projet de développement
- **Vérifiez** que toutes les tables sont créées
- **Changez** le mot de passe admin après la création

---

## 📞 **SUPPORT**

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase
2. Testez la connexion avec `npm run test:supabase`
3. Vérifiez que votre `.env.local` est correct
