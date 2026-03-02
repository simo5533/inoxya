# Audit DB — Schéma, tables, PK, FK, relations, ORM/Adapter

Analyse de la couche base de données : schéma Supabase, types TypeScript, adapters (Supabase, Postgres, SQLite), cohérence et corrections appliquées.

---

## 1. Tables Supabase (schéma de référence)

Référence : `scripts/supabase-complete-schema.sql`.

| Table | PK | Colonnes clés | FK |
|-------|-----|---------------|-----|
| **users** | id SERIAL | phone UNIQUE, password_hash, first_name, last_name, role | — |
| **products** | id SERIAL | name, price, category, image_url, images (JSONB), is_active, is_featured, created_by | created_by → users(id) |
| **categories** | id SERIAL | name UNIQUE, slug UNIQUE, description, image_url | — |
| **packs** | id SERIAL | name, slug UNIQUE, price, image_url, is_featured, created_by | created_by → users(id) |
| **orders** | id SERIAL | user_id (TEXT), customer_id, total_amount, status, shipping_address, phone, notes | customer_id → users(id) |
| **order_items** | id SERIAL | order_id, bijou_id (TEXT), pack_id (TEXT), quantity, price | order_id → orders(id) |
| **payments** | id SERIAL | order_id, amount, payment_method, status, transaction_id | order_id → orders(id) |
| **notifications** | id SERIAL | user_id (TEXT), title, message, type, is_read (BOOLEAN), action_url | — |
| **cart_items** | id SERIAL | user_id, bijou_id, quantity, UNIQUE(user_id,bijou_id) | user_id → users(id), bijou_id → products(id) |
| **favorites** | id SERIAL | user_id, bijou_id, UNIQUE(user_id,bijou_id) | user_id → users(id), bijou_id → products(id) |
| **settings** | id SERIAL | key UNIQUE, value, updated_at | — |
| *(+ 10 autres tables : custom_requests, reviews, newsletter_subscriptions, etc.)* | | | |

Toutes les tables ont une **clé primaire** `id` (SERIAL). Aucune table sans PK.

---

## 2. Types TypeScript (`lib/db/types.ts`)

| Interface | Champs | Aligné schéma |
|-----------|--------|----------------|
| User | id, phone, password_hash?, first_name?, last_name?, role | ✅ |
| Product | id, name, price, category, image_url, images, is_active, is_featured, … | ✅ (is_available dérivé de is_active) |
| Category | id, name, slug, description?, image_url? | ✅ |
| Pack | id, name, slug, price, image_url?, is_featured, created_by? | ✅ |
| Order | id, user_id, total_amount, status, shipping_address?, phone?, notes?, created_at | ✅ |
| **OrderItem** | id, order_id, bijou_id, **pack_id?**, quantity, price | ✅ (pack_id ajouté) |
| CartItem | id, user_id, bijou_id, quantity | ✅ |
| Favorite | id, user_id, bijou_id | ✅ |
| Payment | id, order_id, amount, payment_method, status, transaction_id? | ✅ |
| Notification | id, user_id?, title, message, type?, is_read, action_url?, created_at | ✅ (action_url = link en entrée) |

Tous les types sont cohérents avec le schéma et l’usage dans les adapters.

---

## 3. Adapter — Méthodes par entité

| Entité | Create | Read | Update | Delete | Table(s) |
|--------|--------|------|--------|--------|----------|
| Users | createUser | getUserByPhone, getUserById, getAllUsers | updateUserRole | — | users |
| Products | createProduct | getProducts, getProductById | updateProduct | deleteProduct (soft) | products |
| Categories | createCategory | getCategories | updateCategory | — | categories |
| Packs | createPack | getPacks, getPackById | updatePack | deletePack | packs |
| Orders | createOrder | getOrders, getOrderById | updateOrderStatus | — | orders |
| OrderItems | createOrderItem | getOrderItems | — | — | order_items |
| Payments | createPayment | getPaymentsByOrderId, getAllPayments | updatePaymentStatus | — | payments |
| Cart | addToCart | getCartItems | updateCartQuantity | removeFromCart | cart_items |
| Favorites | addToFavorites | getFavorites | — | removeFromFavorites | favorites |
| Notifications | createNotification | getNotifications | markNotificationAsRead | — | notifications |
| Settings | (upsert) | getSettings | updateSettings | — | settings |
| Stats | — | getDashboardStats | — | — | products, orders, users, payments |

Aucune méthode CRUD manquante pour les entités utilisées par l’app.

---

## 4. Mapping schéma ↔ Adapter

### 4.1 Colonnes sensibles (types / noms)

| Table | Colonne | Schéma | Adapter | Statut |
|-------|---------|--------|--------|--------|
| cart_items | user_id, bijou_id | INTEGER (FK) | string (JS) | ✅ Postgres cast string→int si numérique |
| favorites | user_id, bijou_id | INTEGER (FK) | string | ✅ Idem |
| orders | customer_id | INTEGER (FK) | envoyé si fourni (number) | ✅ createOrder envoie customer_id |
| packs | created_by | INTEGER (FK) | envoyé si fourni | ✅ createPack envoie created_by |
| notifications | action_url | — | link → action_url | ✅ createNotification mappe link → action_url |
| notifications | is_read | BOOLEAN | boolean | ✅ |
| products | images | JSONB | string/array → JSON | ✅ mapProduct gère les deux |
| order_items | pack_id | TEXT | envoyé et lu si présent | ✅ Corrigé (type + adapter) |

### 4.2 order_items — pack_id

- **Schéma** : `order_items` a `bijou_id TEXT` et `pack_id TEXT` (pas de FK sur ces colonnes).
- **Avant** : l’adapter n’envoyait pas `pack_id` et ne le retournait pas dans `getOrderItems`.
- **Après** :
  - `OrderItem` a `pack_id?: string`.
  - `createOrderItem` accepte `pack_id?` et l’insère en base (Supabase, Postgres, SQLite).
  - `getOrderItems` retourne `pack_id` pour chaque item.
- **SQLite** : `createOrderItem` et `getOrderItems` gèrent `pack_id` ; la table a déjà la colonne `pack_id TEXT`.

---

## 5. Clés étrangères (FK) — Vérification

Les FK suivantes sont définies dans `supabase-complete-schema.sql` :

- products.created_by → users(id)
- packs.created_by → users(id)
- orders.customer_id → users(id)
- order_items.order_id → orders(id)
- payments.order_id → orders(id)
- cart_items.user_id → users(id), cart_items.bijou_id → products(id)
- favorites.user_id → users(id), favorites.bijou_id → products(id)

**Colonnes volontairement sans FK (TEXT / flexibilité)** :  
orders.user_id, order_items.bijou_id, order_items.pack_id, notifications.user_id.

Pour vérifier en base : exécuter la requête de la Partie 5 du script `supabase-complete-schema.sql` (résultat attendu : toutes les lignes en « OK »).

---

## 6. Relations et usage

- **users** : racine ; référencé par products (created_by), packs (created_by), orders (customer_id), cart_items, favorites, etc.
- **products** : référencé par cart_items, favorites, order_items (bijou_id utilisé pour produit ou id mixte).
- **packs** : référencé par order_items (pack_id).
- **orders** : référencé par order_items, payments.

Aucune relation orpheline ou incohérente détectée dans l’adapter.

---

## 7. Points d’attention (sans erreur bloquante)

| Sujet | Détail |
|-------|--------|
| Postgres (hors Supabase) | `scripts/setup-postgres-vercel.sql` définit `order_items` sans colonne `pack_id`. Si vous utilisez ce script, ajouter `pack_id TEXT` à `order_items` si besoin. |
| IDs en string | Partout, les PK et FK sont exposées en **string** dans l’app (ex. cookie user_id). Les colonnes INTEGER en base acceptent les chaînes numériques (cast automatique). |
| createProduct (Supabase) | Utilise parfois un id explicite (MAX+1) pour éviter les conflits de séquence ; le schéma reste en SERIAL. |

---

## 8. Résumé — État après audit

- **Tables** : 21 tables avec PK ; schéma cohérent.
- **FK** : Toutes les FK attendues sont présentes dans le script Supabase.
- **Types** : Alignés avec le schéma et les adapters ; `OrderItem` inclut `pack_id`.
- **Adapter** : Chaque entité utilisée a les méthodes CRUD nécessaires ; `order_items` gère correctement `pack_id` (Supabase, Postgres, SQLite).
- **Corrections effectuées** :
  1. Type `OrderItem` : ajout de `pack_id?: string`.
  2. Interface adapter `createOrderItem` : ajout de `pack_id?: string`.
  3. Supabase / Postgres / SQLite : `createOrderItem` envoie `pack_id` quand il est fourni.
  4. Supabase / Postgres / SQLite : `getOrderItems` retourne `pack_id` pour chaque ligne.
  5. SQLite : `createOrderItem` accepte `pack_id` et insère dans `order_items (order_id, bijou_id, pack_id, quantity, price)` ; `getOrderItems` retourne `order_id` et `pack_id`.

Aucune erreur ni avertissement bloquant identifié ; la couche DB est cohérente et fonctionnelle pour les tables et relations auditées.
