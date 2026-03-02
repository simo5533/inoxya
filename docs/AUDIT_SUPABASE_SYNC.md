# Audit — Synchronisation des tables avec Supabase

Analyse approfondie de l’alignement code / Supabase : tables utilisées, adapter, scripts de sync et corrections appliquées.

---

## 1. Tables Supabase (schéma `scripts/supabase-complete-schema.sql`)

| Table | Utilisée par l’app | Adapter (CRUD) | Sync SQLite→Supabase | Statut |
|-------|--------------------|----------------|----------------------|--------|
| **users** | Auth, admin | ✅ getUserByPhone, getUserById, createUser, getAllUsers, updateUserRole | Seed dans le script SQL | ✅ OK (corrigé) |
| **products** | Catalogue, admin, checkout | ✅ getProducts, getProductById, createProduct, updateProduct, deleteProduct | `sync-products-to-supabase.ts` | ✅ OK |
| **categories** | Catalogue, admin | ✅ getCategories, createCategory, updateCategory | — (créées via admin ou schéma) | ✅ OK |
| **packs** | Packs, admin, checkout | ✅ getPacks, getPackById, createPack, updatePack, deletePack | `sync-packs-to-supabase.ts` | ✅ OK |
| **orders** | Checkout, admin | ✅ getOrders, getOrderById, createOrder, updateOrderStatus | — (créées à la commande) | ✅ OK |
| **order_items** | Checkout | ✅ createOrderItem, getOrderItems | — | ✅ OK |
| **payments** | Checkout, admin | ✅ createPayment, getPaymentsByOrderId, getAllPayments, updatePaymentStatus | — | ✅ OK (corrigé) |
| **cart_items** | API panier (utilisateur connecté) | ✅ getCartItems, addToCart, updateCartQuantity, removeFromCart | — | ✅ OK (corrigé) |
| **favorites** | API favoris (utilisateur connecté) | ✅ getFavorites, addToFavorites, removeFromFavorites | — | ✅ OK (déjà corrigé) |
| **notifications** | Admin, panier, custom-requests | ✅ createNotification, getNotifications, markNotificationAsRead | — | ✅ OK |
| **settings** | Admin, app | ✅ getSettings, updateSettings (optionnel) | — | ✅ OK |
| **custom_requests** | Formulaire sur mesure | ❌ (stockage actuel = notification uniquement) | — | ⚠️ Table vide volontaire |
| **reviews** | — | ❌ (reviews_count sur produits uniquement) | — | ⚠️ Non utilisée |
| **newsletter_subscriptions** | — | ❌ | — | ⚠️ Non utilisée |
| **contact_messages** | — | ❌ | — | ⚠️ Non utilisée |
| **shipping_addresses** | — | ❌ (adresse dans `orders.shipping_address`) | — | ⚠️ Non utilisée |
| **promo_codes** | — | ❌ | — | ⚠️ Non utilisée |
| **testimonials** | — | ❌ | — | ⚠️ Non utilisée |
| **site_settings** | — | ❌ | — | ⚠️ Non utilisée |
| **site_stats** | — | ❌ | — | ⚠️ Non utilisée |
| **user_sessions** | — | ❌ (sessions gérées par cookies) | — | ⚠️ Non utilisée |

---

## 2. Corrections appliquées (cette session)

### 2.1 `lib/database.ts` — Utilisation de l’adapter en production

- **getAllUsers** : avant `if (IS_PRODUCTION) return []` → maintenant passage par l’adapter (Supabase).
- **updateUserRole** : avant `if (IS_PRODUCTION) return` → maintenant passage par l’adapter, retour `boolean`.
- **createPayment** : avant `if (IS_PRODUCTION) throw` → maintenant passage par l’adapter (évite erreur en prod).
- **getAllPayments** : avant `if (IS_PRODUCTION) return []` → maintenant passage par l’adapter.
- **updatePaymentStatus** : avant `if (IS_PRODUCTION) return` → maintenant passage par l’adapter.
- **getCartItems, addToCart, updateCartQuantity, removeFromCart** : avant court-circuit en prod → maintenant passage par l’adapter (table `cart_items` alimentée en prod).
- **getFavorites, addToFavorites, removeFromFavorites** : déjà corrigés précédemment (adapter + sync client).

### 2.2 `lib/auth.ts` — Délégation à la couche database

- **updateUserRole** : n’utilise plus SQLite directement ; appelle `database.updateUserRole` (donc adapter en prod).
- **getAllUsers** : n’utilise plus `getSqliteUsers` ; appelle `database.getAllUsers` (donc adapter en prod).
- Import `getSqliteUsers` supprimé (inutilisé).

---

## 3. Flux de données par entité

### Données “maîtres” (à synchroniser ou créer une fois)

- **users** : seed SQL + inscriptions (createUser via adapter).
- **products** : `npx tsx scripts/sync-products-to-supabase.ts` (SQLite → Supabase) ou création via admin.
- **categories** : créées via admin ou schéma.
- **packs** : `npx tsx scripts/sync-packs-to-supabase.ts` ou création via admin.

### Données “transactionnelles” (créées en prod par l’app)

- **orders, order_items, payments** : checkout (`createOrderFull` → adapter).
- **cart_items** : API `/api/cart` (utilisateur connecté) → `database.*` → adapter.
- **favorites** : API `/api/favorites` + sync client (`lib/cart-favorites.ts`) → `database.*` → adapter.
- **notifications** : panier, custom-requests, etc. → `adapter.createNotification`.

### Admin (lecture / mise à jour en prod)

- **GET /api/admin/users** : `getAllUsers()` → adapter → table **users**.
- **PATCH /api/admin/users/[id]/role** : `auth.updateUserRole` → `database.updateUserRole` → adapter.
- **GET /api/payments** : `getAllPayments()` → adapter → table **payments**.
- **POST /api/payments** : `createPayment()` → adapter.
- **PATCH /api/payments/[id]/status** : `updatePaymentStatus()` → adapter.

---

## 4. Scripts de sync existants

| Script | Rôle | Commande |
|--------|------|----------|
| `sync-products-to-supabase.ts` | Produits SQLite → Supabase | `npx tsx scripts/sync-products-to-supabase.ts` |
| `sync-packs-to-supabase.ts` | Packs SQLite → Supabase | `npx tsx scripts/sync-packs-to-supabase.ts` |

Prérequis : `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.

Il n’existe pas de script de sync pour **categories**, **users** (hors seed), **favorites** ou **cart_items** : les deux premiers sont gérés par seed/admin ou création manuelle ; favoris et panier sont remplis par l’usage de l’app (utilisateur connecté).

---

## 5. Vérifications recommandées

1. **Build** : `npm run build`
2. **En prod (ou staging Supabase)** :
   - Se connecter, ajouter au panier → vérifier des lignes dans `cart_items`.
   - Ajouter aux favoris → vérifier des lignes dans `favorites`.
   - Passer une commande → vérifier `orders`, `order_items`, `payments`.
   - Admin : liste utilisateurs, changement de rôle, liste paiements, mise à jour statut paiement.
3. **FK / schéma** : exécuter `scripts/supabase-verify-all-fk.sql` et `scripts/supabase-diagnostic-fk-types.sql` si disponibles (voir `docs/AUDIT_DB_TABLES_FK_CRUD.md`).

---

## 6. Résumé

- **Tables critiques** (users, products, categories, packs, orders, order_items, payments, cart_items, favorites, notifications, settings) sont désormais lues/écrites via l’adapter en production ; les court-circuits “IS_PRODUCTION return” ont été supprimés pour ces entités.
- **Scripts de sync** : produits et packs ont un script dédié ; le reste est alimenté par l’app ou l’admin.
- **Tables du schéma non utilisées** (reviews, newsletter_subscriptions, contact_messages, shipping_addresses, promo_codes, testimonials, site_settings, site_stats, user_sessions, custom_requests comme table) restent optionnelles ; aucune correction code nécessaire pour qu’elles soient “sync” car l’app ne les utilise pas actuellement.
