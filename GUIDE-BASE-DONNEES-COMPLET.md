# 🗄️ Guide Complet - Base de Données INOXYA BIJOUX

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Installation et Configuration](#installation-et-configuration)
3. [Structure de la Base de Données](#structure-de-la-base-de-données)
4. [Commandes de Consultation](#commandes-de-consultation)
5. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
6. [Gestion des Produits](#gestion-des-produits)
7. [Sauvegarde et Restauration](#sauvegarde-et-restauration)
8. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Votre projet INOXYA BIJOUX utilise **SQLite** comme base de données locale, stockée dans le fichier `data/inoxya_bijoux.db`.

### Avantages SQLite :
- ✅ Aucune installation de serveur requise
- ✅ Base de données dans un fichier local
- ✅ Parfait pour le développement
- ✅ Facile à sauvegarder (copier le fichier)
- ✅ Pas de configuration complexe

---

## 🔧 Installation et Configuration

### 1. Installer les Dépendances
```bash
# Installer sqlite3 pour les scripts
npm install sqlite3

# Installer better-sqlite3 (optionnel, plus rapide)
npm install better-sqlite3
```

### 2. Vérifier la Configuration
```bash
# Vérifier que la base existe
ls -la data/inoxya_bijoux.db

# Vérifier la taille du fichier
du -h data/inoxya_bijoux.db
```

### 3. Variables d'Environnement
Vérifiez votre fichier `.env.local` :
```env
# Configuration SQLite
DB_TYPE=sqlite
DB_PATH=./data/inoxya_bijoux.db

# Configuration de l'application
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=inoxya-bijoux-secret-key-2024-development
NODE_ENV=development
```

---

## 🏗️ Structure de la Base de Données

### Tables Principales

#### 👥 Table `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

#### 💍 Table `bijoux`
```sql
CREATE TABLE bijoux (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category_id TEXT,
  image_url TEXT,
  images TEXT, -- JSON
  rating DECIMAL(2,1) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 🛒 Table `cart_items`
```sql
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  bijou_id TEXT,
  quantity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### ❤️ Table `favorites`
```sql
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  bijou_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 📦 Table `orders`
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT, -- JSON
  phone TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 Commandes de Consultation

### 1. Script de Consultation des Utilisateurs
```bash
# Voir tous les utilisateurs et leurs connexions
node scripts/view-login-users.js
```

### 2. Consultation Directe avec SQLite
```bash
# Ouvrir la base de données
sqlite3 data/inoxya_bijoux.db

# Commandes SQL utiles :
.tables                    # Voir toutes les tables
.schema users             # Voir la structure de la table users
SELECT * FROM users;      # Voir tous les utilisateurs
SELECT * FROM bijoux;     # Voir tous les bijoux
.quit                     # Quitter
```

### 3. Scripts de Consultation Spécialisés

#### Voir les Utilisateurs Actifs
```bash
node scripts/view-login-users.js
```

#### Voir les Produits
```bash
node scripts/view-products.js
```

#### Voir les Commandes
```bash
node scripts/view-orders.js
```

---

## 👥 Gestion des Utilisateurs

### 1. Voir Tous les Utilisateurs
```sql
SELECT 
  id,
  phone,
  first_name,
  last_name,
  role,
  created_at,
  last_login
FROM users 
ORDER BY created_at DESC;
```

### 2. Voir les Sessions Actives
```sql
SELECT 
  us.id,
  u.phone,
  u.first_name,
  u.last_name,
  us.created_at,
  us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.expires_at > datetime('now');
```

### 3. Voir les Tentatives de Connexion
```sql
SELECT 
  phone,
  success,
  ip_address,
  created_at
FROM login_attempts 
ORDER BY created_at DESC 
LIMIT 20;
```

### 4. Ajouter un Utilisateur
```sql
INSERT INTO users (
  id,
  phone,
  password_hash,
  first_name,
  last_name,
  role
) VALUES (
  'user-' || random(),
  '0612345678',
  '$2b$12$hashed_password_here',
  'Prénom',
  'Nom',
  'user'
);
```

### 5. Modifier un Utilisateur
```sql
UPDATE users 
SET 
  first_name = 'Nouveau Prénom',
  last_name = 'Nouveau Nom'
WHERE phone = '0612345678';
```

### 6. Supprimer un Utilisateur
```sql
DELETE FROM users WHERE phone = '0612345678';
```

---

## 💍 Gestion des Produits

### 1. Voir Tous les Produits
```sql
SELECT 
  id,
  name,
  price,
  original_price,
  category_id,
  image_url,
  is_available,
  created_at
FROM bijoux 
ORDER BY created_at DESC;
```

### 2. Voir les Produits par Catégorie
```sql
SELECT 
  b.id,
  b.name,
  b.price,
  c.name as category_name
FROM bijoux b
LEFT JOIN categories c ON b.category_id = c.id
WHERE c.slug = 'bagues';
```

### 3. Ajouter un Produit
```sql
INSERT INTO bijoux (
  id,
  name,
  name_ar,
  description,
  price,
  original_price,
  category_id,
  image_url,
  images,
  rating,
  reviews_count
) VALUES (
  'bijou-' || random(),
  'Nouveau Bijou',
  'اسم جديد',
  'Description du bijou',
  299.99,
  399.99,
  'cat-bagues',
  '/images/bijoux/bagues/nouveau-bijou/main.jpg',
  '["promo", "nouveau"]',
  4.5,
  0
);
```

### 4. Modifier un Produit
```sql
UPDATE bijoux 
SET 
  name = 'Nouveau Nom',
  price = 199.99
WHERE id = 'bijou-1';
```

### 5. Supprimer un Produit
```sql
DELETE FROM bijoux WHERE id = 'bijou-1';
```

---

## 🛒 Gestion des Commandes

### 1. Voir Toutes les Commandes
```sql
SELECT 
  o.id,
  u.phone,
  u.first_name,
  u.last_name,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
```

### 2. Voir les Détails d'une Commande
```sql
SELECT 
  o.id,
  o.total_amount,
  o.status,
  o.shipping_address,
  o.notes,
  o.created_at,
  oi.bijou_id,
  b.name as bijou_name,
  oi.quantity,
  oi.price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN bijoux b ON oi.bijou_id = b.id
WHERE o.id = 'order-123';
```

### 3. Changer le Statut d'une Commande
```sql
UPDATE orders 
SET status = 'shipped' 
WHERE id = 'order-123';
```

---

## 💾 Sauvegarde et Restauration

### 1. Sauvegarde Simple
```bash
# Copier le fichier de base de données
cp data/inoxya_bijoux.db data/backup/inoxya_bijoux_$(date +%Y%m%d_%H%M%S).db

# Ou avec compression
tar -czf data/backup/inoxya_bijoux_$(date +%Y%m%d_%H%M%S).tar.gz data/inoxya_bijoux.db
```

### 2. Sauvegarde avec Export SQL
```bash
# Exporter toutes les données en SQL
sqlite3 data/inoxya_bijoux.db .dump > data/backup/inoxya_bijoux_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Restauration
```bash
# Restaurer depuis un fichier de base
cp data/backup/inoxya_bijoux_20241218_143000.db data/inoxya_bijoux.db

# Restaurer depuis un export SQL
sqlite3 data/inoxya_bijoux.db < data/backup/inoxya_bijoux_20241218_143000.sql
```

### 4. Script de Sauvegarde Automatique
```bash
# Créer le script
cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="data/backup"
DB_FILE="data/inoxya_bijoux.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Sauvegarde du fichier
cp $DB_FILE $BACKUP_DIR/inoxya_bijoux_$TIMESTAMP.db

# Export SQL
sqlite3 $DB_FILE .dump > $BACKUP_DIR/inoxya_bijoux_$TIMESTAMP.sql

echo "✅ Sauvegarde créée: $BACKUP_DIR/inoxya_bijoux_$TIMESTAMP.*"
EOF

# Rendre exécutable
chmod +x scripts/backup-database.sh

# Exécuter
./scripts/backup-database.sh
```

---

## 🔧 Dépannage

### 1. Problèmes Courants

#### Base de données verrouillée
```bash
# Vérifier les processus qui utilisent la DB
lsof data/inoxya_bijoux.db

# Tuer les processus si nécessaire
kill -9 <PID>
```

#### Fichier de base corrompu
```bash
# Vérifier l'intégrité
sqlite3 data/inoxya_bijoux.db "PRAGMA integrity_check;"

# Réparer si possible
sqlite3 data/inoxya_bijoux.db "PRAGMA repair;"
```

#### Permissions insuffisantes
```bash
# Donner les bonnes permissions
chmod 664 data/inoxya_bijoux.db
chown $USER:$USER data/inoxya_bijoux.db
```

### 2. Réinitialiser la Base de Données
```bash
# Supprimer et recréer
rm data/inoxya_bijoux.db
npm run db:init
```

### 3. Vérifier les Tables
```sql
-- Voir toutes les tables
.tables

-- Voir la structure d'une table
.schema users

-- Compter les enregistrements
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM bijoux;
SELECT COUNT(*) FROM orders;
```

### 4. Nettoyer les Données
```sql
-- Supprimer les sessions expirées
DELETE FROM user_sessions WHERE expires_at < datetime('now');

-- Supprimer les tentatives de connexion anciennes
DELETE FROM login_attempts WHERE created_at < datetime('now', '-30 days');

-- Nettoyer le panier des utilisateurs inactifs
DELETE FROM cart_items WHERE created_at < datetime('now', '-7 days');
```

---

## 📊 Statistiques Utiles

### 1. Statistiques Générales
```sql
-- Nombre total d'utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- Nombre de produits
SELECT COUNT(*) as total_products FROM bijoux;

-- Nombre de commandes
SELECT COUNT(*) as total_orders FROM orders;

-- Chiffre d'affaires total
SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'completed';
```

### 2. Statistiques par Période
```sql
-- Commandes des 30 derniers jours
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders_count,
  SUM(total_amount) as daily_revenue
FROM orders 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. Top Produits
```sql
-- Produits les plus commandés
SELECT 
  b.name,
  b.price,
  COUNT(oi.bijou_id) as order_count,
  SUM(oi.quantity) as total_quantity
FROM bijoux b
JOIN order_items oi ON b.id = oi.bijou_id
GROUP BY b.id, b.name, b.price
ORDER BY total_quantity DESC
LIMIT 10;
```

---

## 🚀 Commandes Rapides

### Consultation Rapide
```bash
# Voir les utilisateurs
node scripts/view-login-users.js

# Voir les produits
node scripts/view-products.js

# Voir les commandes
node scripts/view-orders.js

# Sauvegarder
./scripts/backup-database.sh
```

### SQL Rapide
```sql
-- Utilisateurs actifs
SELECT phone, first_name, last_name, last_login FROM users WHERE last_login > datetime('now', '-7 days');

-- Produits en stock
SELECT name, price, stock_quantity FROM bijoux WHERE is_available = 1 AND stock_quantity > 0;

-- Commandes en attente
SELECT id, total_amount, created_at FROM orders WHERE status = 'pending' ORDER BY created_at DESC;
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : `npm run dev` affiche les erreurs de DB
2. **Consultez les scripts** : `scripts/` contient des outils de diagnostic
3. **Sauvegardez avant** : Toujours faire une sauvegarde avant les modifications
4. **Testez en local** : Utilisez une copie de la DB pour les tests

---

**✨ Votre base de données INOXYA BIJOUX est maintenant sous contrôle ! ✨**
