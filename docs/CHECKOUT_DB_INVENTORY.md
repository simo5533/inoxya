# Checkout + Order — Inventaire DB (Phase 0)

**Branche:** `fix/supabase-checkout-db`  
**Règle:** Zéro action destructive (pas de DROP, reset, suppression de données).

---

## 0.1 Carte des fichiers DB

| Fichier | Responsabilité |
|---------|----------------|
| **lib/db/index.ts** | Choix de l’adapter (Supabase → Postgres → SQLite). Init client Supabase avec `SUPABASE_SERVICE_ROLE_KEY`. Timeout 10s, test connexion 5s. |
| **lib/db/supabase-adapter.ts** | Implémentation Supabase : `createOrder`, `createOrderItem`, `createPayment`, `getOrders`, `getOrderById`, `getOrderItems`, `updateOrderStatus`, cart, favorites, products, categories, packs, users, notifications, dashboard. |
| **lib/db/adapter.ts** | Interface `DatabaseAdapter` (contrat commun). |
| **lib/db/types.ts** | Types `Order`, `OrderItem`, `Payment`, `Product`, `Pack`, `User`, `CartItem`, `Favorite`, `Notification`, `DashboardStats`. |
| **lib/db/postgres-adapter.ts** | Adapter Postgres (DATABASE_URL) : `createOrder`, `createOrderItem`, etc. |
| **lib/db/sqlite-adapter.ts** | Délègue à `lib/sqlite.ts` pour SQLite. |
| **lib/database.ts** | Couche métier : `createOrder`, `createOrderItem`, `createOrderFull` (essaie adapter puis fallback SQLite en dev). Utilise `serializeError` pour les erreurs adapter. |
| **lib/sqlite.ts** | Implémentation SQLite directe, `createOrderFull`, `serializeError`. |
| **app/api/checkout/route.ts** | POST /api/checkout : CSRF, rate limit, validation Zod, vérification des prix BDD, appel `createOrderFull`, notification admin, email. Runtime `nodejs`. |
| **lib/validations.ts** | `checkoutSchema`, `createOrderSchema` (Zod). |
| **lib/logger.ts** | Logger (debug/info/warn/error), pas de log des secrets. |
| **supabase-schema.sql** | Schéma de référence (orders, order_items, payments, etc.) — à ne pas exécuter en DROP sur une base existante. |

**Clients Supabase :**
- **Server-side (API, adapter):** `lib/db/index.ts` → `SupabaseAdapter(supabaseUrl, supabaseKey)` avec `SUPABASE_SERVICE_ROLE_KEY`. Pas d’autre fichier `createClient` côté serveur pour les commandes.
- **Scripts:** Plusieurs scripts utilisent `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` (check-admin-user, verification-finale, test-supabase-connection, etc.).

---

## 0.2 Variables d’environnement

| Variable | Utilisation | Exposition |
|----------|-------------|------------|
| **NEXT_PUBLIC_SUPABASE_URL** | URL projet Supabase. | Côté client (préfixe NEXT_PUBLIC). |
| **SUPABASE_SERVICE_ROLE_KEY** | Clé service_role pour l’adapter DB (getDatabaseAdapter). | **Serveur uniquement** — utilisée dans `lib/db/index.ts`, jamais exposée au client. |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Clé anon (auth publique si utilisée ailleurs). | Côté client. |
| **DATABASE_URL** | Priorité 2 si présent (postgresql://). | Serveur. |

**Vérification:** L’adapter de commandes (createOrder, createOrderItem, createPayment) est toujours appelé depuis `lib/database.ts` / `app/api/checkout/route.ts`, donc côté serveur, avec la clé chargée dans `getDatabaseAdapter()` = `SUPABASE_SERVICE_ROLE_KEY`. Aucun risque d’exposition client pour la création de commandes.

---

## 0.3 Parcours création de commande (checkout)

1. **Client** → `POST /api/checkout` (body: items, customer_name, phone, city, address, payment_method).
2. **app/api/checkout/route.ts** : CSRF, rate limit, Zod, sanitization, vérification des prix (getBijouById / getPackById), puis `createOrderFull({ user_id, total, status, shipping_address, shipping_phone, shipping_name, items })`.
3. **lib/database.ts** `createOrderFull` : `getDatabaseAdapter()` → `adapter.createOrder()` puis `adapter.createOrderItem()` pour chaque item, puis `adapter.createPayment()`. En échec (et hors production) : fallback `createSqliteOrderFull()`.
4. **lib/db/supabase-adapter.ts** : `createOrder` (insert `orders`), `createOrderItem` (insert `order_items`), `createPayment` (insert `payments`). Types : `order_id` envoyé en number si numérique pour correspondre au schéma INTEGER.

---

*Document généré dans le cadre du fix checkout Supabase (Phase 0).*
