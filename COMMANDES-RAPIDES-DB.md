# 🚀 Commandes Rapides - Base de Données INOXYA

## 📋 Commandes NPM Disponibles

### 👥 Gestion des Utilisateurs
```bash
# Voir tous les utilisateurs et leurs connexions
npm run db:users

# Voir les sessions actives
npm run db:users -- --sessions

# Voir les tentatives de connexion
npm run db:users -- --attempts
```

### 💍 Gestion des Produits
```bash
# Voir tous les produits
npm run db:products

# Voir les statistiques des produits
npm run db:products -- --stats
```

### 📦 Gestion des Commandes
```bash
# Voir toutes les commandes
npm run db:orders

# Voir les détails d'une commande spécifique
npm run db:orders -- order-123

# Voir les commandes récentes
npm run db:orders -- --recent
```

### 💾 Sauvegarde
```bash
# Créer une sauvegarde
npm run db:backup

# Initialiser la base de données
npm run db:init
```

## 🔧 Commandes SQLite Directes

### Ouvrir la Base de Données
```bash
sqlite3 data/inoxya_bijoux.db
```

### Commandes SQL Essentielles
```sql
-- Voir toutes les tables
.tables

-- Voir la structure d'une table
.schema users
.schema bijoux
.schema orders

-- Voir tous les utilisateurs
SELECT * FROM users;

-- Voir tous les produits
SELECT * FROM bijoux;

-- Voir toutes les commandes
SELECT * FROM orders;

-- Compter les enregistrements
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM bijoux;
SELECT COUNT(*) FROM orders;

-- Quitter
.quit
```

## 📊 Requêtes Utiles

### Utilisateurs Actifs
```sql
SELECT 
  phone,
  first_name,
  last_name,
  last_login
FROM users 
WHERE last_login > datetime('now', '-7 days');
```

### Produits en Stock
```sql
SELECT 
  name,
  price,
  stock_quantity
FROM bijoux 
WHERE is_available = 1 
AND stock_quantity > 0;
```

### Commandes en Attente
```sql
SELECT 
  id,
  total_amount,
  created_at
FROM orders 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Top Produits
```sql
SELECT 
  b.name,
  COUNT(oi.bijou_id) as commandes,
  SUM(oi.quantity) as quantite_vendue
FROM bijoux b
JOIN order_items oi ON b.id = oi.bijou_id
GROUP BY b.id, b.name
ORDER BY quantite_vendue DESC
LIMIT 10;
```

### Chiffre d'Affaires
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as commandes,
  SUM(total_amount) as chiffre_affaires
FROM orders 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🛠️ Maintenance

### Nettoyer les Données
```sql
-- Supprimer les sessions expirées
DELETE FROM user_sessions 
WHERE expires_at < datetime('now');

-- Supprimer les tentatives de connexion anciennes
DELETE FROM login_attempts 
WHERE created_at < datetime('now', '-30 days');

-- Nettoyer le panier des utilisateurs inactifs
DELETE FROM cart_items 
WHERE created_at < datetime('now', '-7 days');
```

### Vérifier l'Intégrité
```sql
-- Vérifier l'intégrité de la base
PRAGMA integrity_check;

-- Optimiser la base
PRAGMA optimize;

-- Voir les statistiques
PRAGMA stats;
```

## 🚨 Dépannage Rapide

### Problème de Connexion
```bash
# Vérifier que la base existe
ls -la data/inoxya_bijoux.db

# Vérifier les permissions
chmod 664 data/inoxya_bijoux.db
```

### Base Corrompue
```bash
# Vérifier l'intégrité
sqlite3 data/inoxya_bijoux.db "PRAGMA integrity_check;"

# Réparer si possible
sqlite3 data/inoxya_bijoux.db "PRAGMA repair;"
```

### Réinitialiser
```bash
# Sauvegarder d'abord
npm run db:backup

# Supprimer et recréer
rm data/inoxya_bijoux.db
npm run db:init
```

## 📱 Interface Web

### Accès Admin
- URL: `http://localhost:3001/admin`
- Compte admin: `admin_phone` / `Admin123!`

### Pages Utiles
- `/admin` - Gestion des produits
- `/profile` - Profil utilisateur
- `/bijoux` - Catalogue des bijoux
- `/panier` - Panier d'achat

## 🔐 Comptes de Test

### Admin
- Téléphone: `admin_phone`
- Mot de passe: `Admin123!`

### Utilisateur Standard
- Téléphone: `0612345678`
- Mot de passe: `User123!`

### Modérateur
- Téléphone: `0698765432`
- Mot de passe: `Moderator123!`

---

**✨ Toutes les commandes sont prêtes à utiliser ! ✨**
