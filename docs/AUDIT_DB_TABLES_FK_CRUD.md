# Audit DB — Tables, attributs, PK/FK, liaisons, CRUD

Analyse du schéma Supabase, des liaisons et des méthodes (adapter + database.ts) pour garantir que tout est cohérent et que le CRUD est fonctionnel.

---

## 1. Tables et clés primaires (PK)

| Table | PK | Colonnes principales | Statut |
|-------|-----|----------------------|--------|
| products | id (SERIAL) | name, price, category, image_url, images, is_active, is_featured, created_by | OK |
| categories | id (SERIAL) | name, slug (UNIQUE), description, image_url | OK |
| packs | id (SERIAL) | name, slug (UNIQUE), price, created_by | OK |
| orders | id (SERIAL) | user_id (TEXT), customer_id (INT), total_amount, status, shipping_address, phone, notes | OK |
| order_items | id (SERIAL) | order_id, bijou_id (TEXT), pack_id (TEXT), quantity, price | OK |
| payments | id (SERIAL) | order_id, amount, payment_method, status, transaction_id | OK |
| users | id (SERIAL) | phone (UNIQUE), password_hash, first_name, last_name, role | OK |
| cart_items | id (SERIAL) | user_id, bijou_id, quantity, UNIQUE(user_id,bijou_id) | OK |
| favorites | id (SERIAL) | user_id, bijou_id, UNIQUE(user_id,bijou_id) | OK |
| user_sessions | id (SERIAL) | user_id, session_token (UNIQUE), expires_at | OK |
| custom_requests | id (SERIAL) | user_id, name, email, phone, type, description, budget, status | OK |
| reviews | id (SERIAL) | user_id, bijou_id, rating, comment, is_approved | OK |
| newsletter_subscriptions | id (SERIAL) | email (UNIQUE), is_active | OK |
| site_stats | id (SERIAL) | page_views, unique_visitors, orders_count, revenue, date (UNIQUE) | OK |
| shipping_addresses | id (SERIAL) | user_id, order_id, full_name, address, city, postal_code, phone, is_default | OK |
| promo_codes | id (SERIAL) | code (UNIQUE), discount_type, discount_value, usage_limit, usage_count, is_active | OK |
| contact_messages | id (SERIAL) | name, email, phone, subject, message, status, priority | OK |
| testimonials | id (SERIAL) | user_id, customer_name, product_id, rating, testimonial, is_featured, is_approved | OK |
| site_settings | id (SERIAL) | setting_key (UNIQUE), setting_value, setting_type | OK |
| settings | id (SERIAL) | key (UNIQUE), value, updated_at | OK |
| notifications | id (SERIAL) | user_id (TEXT), title, message, type, is_read (INTEGER), action_url | OK |

Toutes les tables ont une PK `id` SERIAL. Aucune table sans PK.

---

## 2. Clés étrangères (FK) — attendues vs schéma

| Table | Colonne | Référence | Dans CREATE TABLE | Ajout script (Partie 3 full-setup) | Statut |
|-------|---------|-----------|-------------------|-------------------------------------|--------|
| cart_items | user_id | users(id) | Oui | - | OK |
| cart_items | bijou_id | products(id) | Oui | - | OK |
| custom_requests | user_id | users(id) | Oui | - | OK |
| favorites | user_id | users(id) | Oui | - | OK |
| favorites | bijou_id | products(id) | Oui | - | OK |
| order_items | order_id | orders(id) | Non | Oui (DO $$) | OK si script exécuté |
| orders | customer_id | users(id) | Non | Oui (DO $$) | OK si script exécuté |
| packs | created_by | users(id) | Non | Oui (DO $$) | OK si script exécuté |
| payments | order_id | orders(id) | Non | Oui (DO $$) | OK si script exécuté |
| reviews | user_id | users(id) | Oui | - | OK |
| reviews | bijou_id | products(id) | Oui | - | OK |
| shipping_addresses | user_id | users(id) | Oui | - | OK |
| shipping_addresses | order_id | orders(id) | Oui | - | OK |
| testimonials | user_id | users(id) | Oui | - | OK |
| testimonials | product_id | products(id) | Oui | - | OK |
| user_sessions | user_id | users(id) | Oui | - | OK |

**Non lié volontairement (TEXT, pas FK) :**
- orders.user_id (TEXT) : peut stocker téléphone ou id client ; pas de FK.
- order_items.bijou_id (TEXT) : compatibilité avec ids string ; pas de FK vers products.
- order_items.pack_id (TEXT) : id pack en string ; pas de FK vers packs (optionnel).
- notifications.user_id (TEXT) : id user ou null ; pas de FK.

Pour vérifier que toutes les FK sont bien présentes en base : exécuter `scripts/supabase-verify-all-fk.sql`.

---

## 3. Types de colonnes — incohérences possibles

| Table | Colonne | Type schéma | Type attendu (FK) | Adapter envoie | Risque |
|-------|---------|-------------|--------------------|----------------|--------|
| cart_items | user_id, bijou_id | INTEGER | INTEGER | string (userId, bijouId) | Postgres cast string→int si numérique ; OK en pratique. |
| favorites | user_id, bijou_id | INTEGER | INTEGER | string | Idem. |
| orders | user_id | TEXT | - | string | OK. |
| orders | customer_id | INTEGER | users(id) | non envoyé | **Manquant** : adapter ne remplit pas customer_id. |
| packs | created_by | INTEGER | users(id) | non envoyé | **Manquant** : adapter ne remplit pas created_by. |
| notifications | is_read | INTEGER | - | true (boolean) | Postgres accepte true→1 ; migration en BOOLEAN recommandée (script fixes). |
| products | images | TEXT | - | string JSON | Migration en JSONB recommandée (script fixes). |

---

## 4. CRUD par entité — couverture adapter

### Users
| Méthode | Adapter | Table | Colonnes utilisées | Statut |
|---------|---------|-------|--------------------|--------|
| getUserByPhone | Oui | users | phone | OK |
| getUserById | Oui | users | id | OK |
| createUser | Oui | users | phone, password_hash, first_name, last_name, role, created_at, updated_at | OK |
| getAllUsers | Oui | users | * | OK |
| updateUserRole | Oui | users | role, updated_at | OK |

### Products
| Méthode | Adapter | Table | Colonnes utilisées | Statut |
|---------|---------|-------|--------------------|--------|
| getProducts | Oui | products | *, is_active, category | OK |
| getProductById | Oui | products | id | OK |
| createProduct | Oui | products | name, price, description, name_ar, original_price, category, image_url, images, is_active, is_featured, stock | OK |
| updateProduct | Oui | products | (partial) | OK |
| deleteProduct | Oui | products | id (soft is_active) | OK |

### Categories
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getCategories | Oui | categories | OK |
| createCategory | Oui | categories | OK |
| updateCategory | Oui | categories | OK |

### Packs
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getPacks | Oui | packs | OK |
| getPackById | Oui | packs | OK |
| createPack | Oui | packs | **created_by non envoyé** |
| updatePack | Oui | packs | OK |
| deletePack | Oui | packs | OK |

### Orders
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getOrders | Oui | orders | OK (mapOrder retourne user_id) |
| getOrderById | Oui | orders | OK |
| createOrder | Oui | orders | **customer_id non envoyé** |
| createOrderItem | Oui | order_items | OK (order_id, bijou_id, quantity, price) |
| getOrderItems | Oui | order_items | OK |
| updateOrderStatus | Oui | orders | OK |

### Cart
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getCartItems | Oui | cart_items | OK (user_id integer accepte string en filtre) |
| addToCart | Oui | cart_items | OK (upsert user_id, bijou_id, quantity) |
| updateCartQuantity | Oui | cart_items | OK |
| removeFromCart | Oui | cart_items | OK |

### Favorites
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getFavorites | Oui | favorites | OK |
| addToFavorites | Oui | favorites | OK (upsert) |
| removeFromFavorites | Oui | favorites | OK |

### Payments
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| createPayment | Oui | payments | OK |
| getPaymentsByOrderId | Oui | payments | OK |
| getAllPayments | Oui | payments | OK |
| updatePaymentStatus | Oui | payments | OK |

### Notifications
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| createNotification | Oui | notifications | OK (user_id, title, message, type, action_url) |
| getNotifications | Oui | notifications | OK (is_read mappé en boolean) |
| markNotificationAsRead | Oui | notifications | OK (is_read: true → accepté en INTEGER) |

### Settings
| Méthode | Adapter | Table | Statut |
|---------|---------|-------|--------|
| getSettings | Oui | settings | OK (key, value) |
| updateSettings | Oui | settings | OK (upsert on key) |

### Stats
| Méthode | Adapter | Tables | Statut |
|---------|---------|--------|--------|
| getDashboardStats | Oui | products, orders, users, payments | OK |

---

## 5. Synthèse — ce qui manquait et corrections

### Déjà corrigé ou documenté
- FK order_items.order_id, payments.order_id : ajoutées par script (supabase-full-setup Partie 3 ou supabase-add-fk-checkout.sql).
- FK orders.customer_id, packs.created_by : colonnes + FK ajoutées par script (supabase-link-orders-packs-to-users.sql ou Partie 3 full-setup).
- Favoris : UNIQUE(user_id, bijou_id) + FK dans le schéma ; script favorites idempotent si besoin.
- Types : notifications.is_read → BOOLEAN, products.images → JSONB : optionnel dans supabase-fixes-and-migrations.sql.

### Corrections code (à appliquer)
1. **createOrder** : accepter un champ optionnel `customer_id` (number | string) et l’envoyer en base quand l’utilisateur est connecté (id user = integer).
2. **createOrderFull** (database.ts) : passer `customer_id` à l’adapter lorsque `user_id` est un id numérique (client connecté).
3. **createPack** : accepter un champ optionnel `created_by` (number | string) et l’envoyer en base (admin créateur). **Appliqué** : l’adapter Supabase envoie `created_by` ; la route **POST /api/admin/packs** utilise l’adapter (Supabase/Postgres) avec `created_by: user.id` quand disponible, sinon fallback sur `pack-management.createPack` (SQLite).

### Vérifications recommandées
- Exécuter `scripts/supabase-verify-all-fk.sql` dans Supabase pour confirmer que toutes les FK sont présentes.
- Exécuter `scripts/supabase-diagnostic-fk-types.sql` pour lister les colonnes TEXT qui pourraient être liées en INTEGER.
- Après déploiement des corrections : créer une commande en étant connecté et vérifier que `orders.customer_id` est rempli ; créer un pack en admin et vérifier que `packs.created_by` est rempli.

---

## 6. Résumé statut CRUD

| Entité | Create | Read | Update | Delete | Liaisons FK |
|--------|--------|------|--------|--------|-------------|
| users | OK | OK | OK (role) | - | - |
| products | OK | OK | OK | OK (soft) | - |
| categories | OK | OK | OK | - | - |
| packs | OK (sans created_by) | OK | OK | OK | created_by → users (colonne + FK) |
| orders | OK (sans customer_id) | OK | OK (status) | - | customer_id → users (colonne + FK) |
| order_items | OK | OK | - | - | order_id → orders (script) |
| payments | OK | OK | OK (status) | - | order_id → orders (script) |
| cart_items | OK (upsert) | OK | OK (quantity) | OK | user_id, bijou_id (dans schéma) |
| favorites | OK (upsert) | OK | - | OK | user_id, bijou_id (dans schéma) |
| notifications | OK | OK | OK (is_read) | - | - |
| settings | OK (upsert) | OK | OK (upsert) | - | - |

Avec les corrections appliquées (customer_id dans createOrder + createOrderFull, created_by dans createPack), le CRUD et les liaisons sont alignés avec le schéma.

---

## 7. Checklist de vérification (Supabase)

### Script complet (remplacement total — base vide ou recréation)

**`scripts/supabase-complete-schema.sql`** — Full strong script pour SQL Editor :
- Suppression de toutes les tables (CASCADE) puis recréation dans l’ordre des dépendances.
- 21 tables avec PK, FK inline (users → products.created_by, packs.created_by, orders.customer_id ; orders → order_items, payments ; users/products → cart_items, favorites, reviews, etc.).
- Types : `notifications.is_read` BOOLEAN, `products.images` JSONB, `products.created_by` FK users.
- Seed users (pgcrypto), triggers `updated_at` sur les tables concernées, requête de vérification des FK en fin de script.
- À utiliser pour remplacer l’ancien script en une seule exécution (toutes les données sont supprimées).

### Vérifications sur une base existante (sans tout recréer)

1. **FK** : `scripts/supabase-verify-all-fk.sql` — toutes les lignes doivent être en "OK".
2. **Types / colonnes** : `scripts/supabase-diagnostic-fk-types.sql` — colonnes MANQUANT et types TEXT vs INTEGER.
3. **Liaisons orders/packs** : `scripts/supabase-link-orders-packs-to-users.sql` — si `customer_id` / `created_by` ou FK manquent.
4. **Corrections optionnelles** : `scripts/supabase-fixes-and-migrations.sql` (parties 1–4) — is_read BOOLEAN, images JSONB, trigger updated_at, UNIQUE favorites.
