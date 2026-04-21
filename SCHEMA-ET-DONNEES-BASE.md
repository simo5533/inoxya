# Schéma et données réelles - Base INOXYA BIJOUX

**Base de données :** SQLite (`data/inoxya_bijoux.db`)  
**Date d'extraction :** 2 février 2026

---

## 1. Schéma des tables

### products (produits/bijoux)
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  image_url TEXT,
  images TEXT DEFAULT '[]',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### categories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### packs
```sql
CREATE TABLE packs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### orders
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)
```

### order_items
```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  bijou_id TEXT,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)
```

### Autres tables
- **cart_items** – Panier (user_id, bijou_id, quantity)
- **favorites** – Favoris
- **payments** – Paiements (order_id, amount, payment_method, status)
- **notifications** – Notifications admin
- **contact_messages** – Messages de contact
- **custom_requests** – Demandes sur mesure
- **newsletter_subscriptions** – Newsletter
- **reviews** – Avis
- **promo_codes** – Codes promo
- **site_settings** – Paramètres
- **site_stats** – Statistiques
- **testimonials** – Témoignages
- **shipping_addresses** – Adresses de livraison
- **user_sessions** – Sessions

---

## 2. Données réelles (comptages)

| Table | Enregistrements |
|-------|-----------------|
| products | 35 |
| categories | 6 |
| packs | 13 |
| users | 1 |
| orders | 11 |
| order_items | 11 |
| payments | 11 |
| notifications | 13 |
| cart_items | 0 |
| favorites | 0 |
| reviews | 0 |
| testimonials | 0 |
| promo_codes | 0 |
| contact_messages | 0 |

---

## 3. Données détaillées (échantillons)

### Catégories
| id | name | slug |
|----|------|------|
| 1 | Bagues | bagues |
| 2 | Colliers | colliers |
| 3 | Bracelets | bracelets |
| 4 | Boucles d'oreilles | boucles-oreilles |
| 5 | Parures | parures |
| 6 | Nos packs / Broches | broches |

### Produits (extrait – 35 au total)
- Bague Éclat (139 MAD), Bague Glamour, Bague Ancestrale…
- Luna Chic, Fleur de Lune, Panthére Royale (Colliers)…
- Gourmette Luxa, Royal, Nova (Bracelets)…
- Voir `data/produits-reels.json` pour la liste complète.

### Packs (13)
Pack Prestige (149 MAD), Pack Émeraude (219 MAD), Pack Doré Luxe (299 MAD), Pack Cloue, Pack Élegancia, Pack Black Titanium, etc.

### Utilisateur admin
- **Téléphone :** admin_phone  
- **Nom :** Admin INOXYA  
- **Rôle :** admin  

### Commandes (11)
Clients réels (Aymane, Bahir Elhassane…), téléphones 06/07, adresses (Rabat, Safi…).

---

## 4. Statistiques produits (produits-reels.json)

- **Total bijoux :** 35  
- **Prix moyen :** 124 MAD  
- **Prix min :** 69 MAD  
- **Prix max :** 220 MAD

---

## 5. Script de suppression des données demo

Pour supprimer les données demo restantes dans la base :

```bash
node scripts/supprimer-donnees-demo.js
```

**Fichiers demo supprimés :**
- `data/sample-bijoux.ts`
- `data/sample-bijoux-with-images.ts`
- `data/sample-categories.ts`
- `data/sample-packs.ts`
- `data/sample-packs-with-images.ts`
- `lib/auth-demo.ts`

**Authentification :** utilise désormais uniquement la base SQLite (plus de `demoUsers`).  
