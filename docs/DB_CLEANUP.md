# 🗑️ GUIDE DE NETTOYAGE DE LA BASE DE DONNÉES

**Date:** 2026-02-02  
**Objectif:** Supprimer les produits de démonstration de la base de données

---

## 📋 PRODUITS SUPPRIMÉS

Les 6 produits de démonstration suivants ont été supprimés :

1. **Bague Berbère Or 18K** (ID: 1)
2. **Bague Solitaire Premium** (ID: 2)
3. **Bague Vintage Art Deco** (ID: 3)
4. **Collier Filigrane Argent** (ID: 4)
5. **Collier Pendentif Lune** (ID: 5)
6. **Bracelet Khomsa Protection** (ID: 6)

---

## 🛠️ SCRIPT DE SUPPRESSION

### Fichier
`scripts/delete-demo-products.ts`

### Utilisation

#### Mode Dry-Run (par défaut - recommandé)
```bash
npm run db:delete-demo
# OU
npx tsx scripts/delete-demo-products.ts
```

**Résultat:** Affiche les produits qui seraient supprimés **sans les supprimer**.

#### Mode Exécution
```bash
npm run db:delete-demo:execute
# OU
npx tsx scripts/delete-demo-products.ts --execute
```

**Résultat:** Supprime définitivement les produits de démonstration.

---

## 🔒 SÉCURITÉ

### Backup Automatique

Le script crée **automatiquement un backup** avant toute suppression :
- **Emplacement:** `data/inoxya_bijoux.backup.<timestamp>.db`
- **Format:** `inoxya_bijoux.backup.2026-02-13T01-20-59.db`

### Restauration du Backup

Si vous devez restaurer le backup :

```bash
# Windows PowerShell
Copy-Item "data\inoxya_bijoux.backup.2026-02-13T01-20-59.db" "data\inoxya_bijoux.db" -Force

# Linux/Mac
cp data/inoxya_bijoux.backup.2026-02-13T01-20-59.db data/inoxya_bijoux.db
```

---

## 📊 CE QUI EST SUPPRIMÉ

Le script supprime :

1. **Les produits** correspondant aux noms de démonstration
2. **Les références** dans les tables liées :
   - `favorites` (favoris utilisateurs)
   - `cart_items` (paniers)
   - `order_items` (lignes de commande)

### Ce qui N'EST PAS affecté

- ✅ **Packs** : Aucun pack n'est supprimé
- ✅ **Autres produits** : Seuls les 6 produits de démonstration sont supprimés
- ✅ **Catégories** : Aucune catégorie n'est supprimée
- ✅ **Utilisateurs** : Aucun utilisateur n'est supprimé
- ✅ **Commandes** : Les commandes existantes sont conservées (seules les lignes liées aux produits supprimés sont nettoyées)

---

## ✅ VÉRIFICATION

### Après Suppression

Le script vérifie automatiquement :
- ✅ Les produits ont bien été supprimés
- ✅ Le nombre de produits restants
- ✅ Le nombre de packs (non affectés)

### Vérification Automatique (Recommandé)

```bash
npm run db:verify-deletion
```

Ce script vérifie automatiquement :
- ✅ Aucun produit avec ID 1-6 n'existe plus
- ✅ Aucun produit de démonstration trouvé par nom
- ✅ Statistiques (produits, packs)

### Vérification Manuelle

```bash
# Vérifier le nombre de produits
npx tsx -e "const db = require('better-sqlite3')('data/inoxya_bijoux.db'); const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get(); console.log('Produits actifs:', count.count); db.close();"

# Vérifier que les produits supprimés ne sont plus présents
npx tsx -e "const db = require('better-sqlite3')('data/inoxya_bijoux.db'); const products = db.prepare('SELECT id, name FROM products WHERE id IN (1,2,3,4,5,6)').all(); console.log('Produits restants avec IDs 1-6:', products.length); db.close();"
```

### Vérification API

```bash
# Tester l'API produits
curl http://localhost:3000/api/products

# Vérifier que les noms de démonstration ne sont plus présents
curl http://localhost:3000/api/products | grep -i "berbère\|solitaire\|vintage\|filigrane\|pendentif\|khomsa"
```

---

## 📈 STATISTIQUES AVANT/APRÈS

### Avant Suppression
- **Produits:** 41 (tous actifs)
- **Packs:** 13
- **Catégories:** 6

### Après Suppression
- **Produits:** 35 (tous actifs) ✅
- **Packs:** 13 (non affectés) ✅
- **Catégories:** 6 (non affectées) ✅

---

## 🔍 DÉTAILS TECHNIQUES

### Correspondance des Noms

Le script utilise une correspondance flexible :
- **Insensible à la casse**
- **Tolérant aux accents** (Berbère = Berbere)
- **Tolérant à la ponctuation**
- **Seuil de correspondance:** 70%

### Ordre d'Exécution

1. **Backup** de la base de données
2. **Recherche** des produits correspondants
3. **Suppression** des références (favorites, cart_items, order_items)
4. **Suppression** des produits
5. **Vérification** de la suppression

---

## ⚠️ AVERTISSEMENTS

1. **Irréversible:** La suppression est définitive (sauf restauration du backup)
2. **Mode Dry-Run:** Toujours exécuter en mode dry-run d'abord
3. **Backup:** Le backup est créé automatiquement, mais gardez-en une copie ailleurs si nécessaire
4. **Production:** Ne jamais exécuter en production sans backup externe

---

## 📝 EXEMPLES

### Exemple 1: Dry-Run
```bash
$ npm run db:delete-demo

🔍 Suppression des produits de démonstration
⚠️  MODE DRY-RUN (aucune modification ne sera effectuée)

📊 6 produit(s) trouvé(s):
ID  | Nom                              | Catégorie        | Image
  1 | Bague Berbère Or 18K           | Bagues          | ✅
  2 | Bague Solitaire Premium        | Bagues          | ✅
  ...

✅ DRY-RUN terminé. Aucune modification effectuée.
```

### Exemple 2: Exécution
```bash
$ npm run db:delete-demo:execute

🔍 Suppression des produits de démonstration
🚨 MODE EXÉCUTION - Les produits seront supprimés définitivement!

💾 STEP 0 — Création du backup...
✅ Backup créé: data/inoxya_bijoux.backup.2026-02-13T01-20-59.db

🗑️  STEP 2 — Suppression des produits et références...
   ✅ 6 produit(s) supprimé(s)

✅ Suppression terminée avec succès!
📊 Produits restants: 35 (tous actifs)
📦 Packs: 13 (non affectés)
```

---

## 🆘 DÉPANNAGE

### Erreur: "Base de données non trouvée"
```bash
# Vérifier que la base existe
ls data/inoxya_bijoux.db

# Si elle n'existe pas, créer la base
npm run db:seed
```

### Erreur: "Aucun produit trouvé"
- Les produits ont peut-être déjà été supprimés
- Vérifiez avec le mode dry-run

### Restauration du Backup
```bash
# Trouver le dernier backup
ls -lt data/inoxya_bijoux.backup.*.db | head -1

# Restaurer (remplacer TIMESTAMP par le timestamp réel)
cp data/inoxya_bijoux.backup.TIMESTAMP.db data/inoxya_bijoux.db
```

---

## 📚 RESSOURCES

- **Script:** `scripts/delete-demo-products.ts`
- **Backup:** `data/inoxya_bijoux.backup.*.db`
- **Documentation:** Ce fichier

---

**Dernière mise à jour:** 2026-02-02

