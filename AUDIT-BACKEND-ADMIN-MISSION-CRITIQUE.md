# AUDIT BACKEND ADMIN — MISSION CRITIQUE
## INOXYA BIJOUX — Rapport d'Audit Professionnel

**Date :** 3 février 2026  
**Périmètre :** Backend admin, API routes, persistance SQLite  
**Contrainte :** Aucune modification de code — analyse et vérification uniquement

---

## PHASE 1 — AUDIT D'EXÉCUTION RÉELLE

### 1.1 `/api/products`

| Méthode | SQLite réel | Simulation activable | Blocage erreur |
|---------|-------------|----------------------|----------------|
| **GET** | ✅ `select('SELECT * FROM products')` | ⚠️ OUI — si `testConnection()` échoue → retourne mockProducts (2 produits fictifs) | ✅ catch → 500 |
| **POST** | ✅ `execute(INSERT INTO products...)` | ⚠️ OUI — si `testConnection()` échoue → retourne mockProduct (201) sans INSERT | ✅ catch → 500 |

**Persistance réelle :** OUI (quand SQLite connecté)

---

### 1.2 `/api/products/[id]`

| Méthode | SQLite réel | Simulation activable | Blocage erreur |
|---------|-------------|----------------------|----------------|
| **GET** | ✅ `select('SELECT * FROM products WHERE id = ?')` | ⚠️ OUI — si testConnection échoue → mockProduct | ✅ 404 si vide |
| **PUT** | ✅ `execute(UPDATE products...)` | ⚠️ OUI — si testConnection échoue → mockProduct (sans UPDATE) | ✅ 404 si inexistant |
| **DELETE** | ✅ `execute(DELETE FROM products...)` | ⚠️ OUI — si testConnection échoue → 200 "simulation" (aucun DELETE) | ✅ 404 si inexistant |

**Persistance réelle :** OUI (quand SQLite connecté)

---

### 1.3 `/api/admin/packs`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getAllPacks()` → getSqlitePacks → `db.prepare('SELECT...').all()` | ❌ Aucune | ✅ 500 en catch |
| **POST** | ✅ `createPack()` → `db.prepare(INSERT INTO packs...).run()` | ❌ Aucune | ✅ 500 si createPack échoue |

**Persistance réelle :** OUI

---

### 1.4 `/api/admin/packs/[id]`

| Méthode | SQLite réel | Bug identifié | Blocage erreur |
|---------|-------------|---------------|----------------|
| **GET** | ✅ `getPackById(id)` (pack-management → SELECT packs) | ❌ Aucun | ✅ 404 si null |
| **PUT** | ✅ `updatePack()` → `db.prepare(UPDATE packs...).run()` | 🔴 **BUG :** `db.getPackById(id)` utilisé — `db` n'est pas importé → ReferenceError. De plus `updatePack` retourne `void`, donc `pack` = undefined → `pack.name` provoquerait une erreur | Échec à l'exécution |
| **DELETE** | ✅ `deletePack()` → `db.prepare(DELETE...).run()` | 🔴 **BUG :** `db.getPackById(id)` utilisé — `db` non importé. Et `deletePack` retourne `void` → `success` = undefined → toujours 500 | Échec à l'exécution |

**Persistance réelle :** GET OK. PUT et DELETE **défaillants** (bugs d'exécution).

---

### 1.5 `/api/admin/stats`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getDashboardStats()` → getSqliteDashboardStats → requêtes SQL products, packs, categories, users, orders | ❌ Aucune | ✅ 500 en catch |

**Persistance réelle :** Données uniquement depuis SQLite

---

### 1.6 `/api/admin/users`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getAllUsers()` → getSqliteAllUsers → `db.prepare('SELECT...').all()` | ❌ Aucune | ✅ 500 en catch |

---

### 1.7 `/api/admin/carts`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getAllActiveCarts()` → getSqliteAllActiveCarts → `db.prepare('SELECT...').all()` | ❌ Aucune | ✅ 500 en catch |

---

### 1.8 `/api/admin/notifications`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getNotifications()` → getSqliteNotifications | ❌ Aucune | ✅ 500 en catch |

---

### 1.9 `/api/orders`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **POST** | ✅ `createOrder()`, `createOrderItem()` → INSERT orders, order_items | ❌ Aucune | ✅ 500 si order null |
| **GET** | ✅ `getAllOrders()` → getSqliteOrders | ❌ Aucune | ✅ 500 en catch |

---

### 1.10 `/api/payments`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getAllPayments()` → getSqliteAllPayments | ❌ Aucune | ✅ 500 en catch |
| **POST** | ✅ `createPayment()` → INSERT payments | 🔴 **BUG :** Ligne 59 utilise `db.getPaymentsByOrderId(order_id)` — `db` n'est pas importé → ReferenceError à l'exécution | Échec avant INSERT |

**Persistance réelle :** GET OK. POST **défaillant** en cas de vérification paiements existants.

---

### 1.11 `/api/categories`

| Méthode | SQLite réel | Simulation | Blocage erreur |
|---------|-------------|------------|----------------|
| **GET** | ✅ `getAllCategories()` → getSqliteCategories | ❌ Aucune | ✅ 500 en catch |

---

### 1.12 Autres routes avec référence incorrecte

| Route | Problème |
|-------|----------|
| **`/api/cart` GET** | Utilise `db.getCartItems(user.id)` — `db` non importé. Devrait être `getCartItems(user.id)`. → ReferenceError |
| **`/api/favorites` POST** | Pour `pack_id` : utilise `db.addToFavorites` — `db` non importé. → ReferenceError lorsque action=add et pack_id fourni |

---

## PHASE 2 — RÈGLES MÉTIER

### Produits

| Règle | Implémenté | Détail |
|-------|------------|--------|
| Nom requis | ✅ | `if (!name ...)` → 400 |
| Prix > 0 | ✅ | `priceNum <= 0` → 400 |
| Catégorie requise | ✅ | `if (!category)` → 400 |
| Catégorie existante | ⚠️ **NON** | Aucune vérification que la catégorie existe dans la table categories. Une chaîne arbitraire est acceptée. |
| Image obligatoire | ✅ | `if (!finalImageUrl)` → 400 |

### Packs

| Règle | Implémenté | Détail |
|-------|------------|--------|
| Nom, slug, prix requis | ✅ | Validation 400 |
| Prix > 0 | ✅ | Validation 400 |
| Produits valides dans le pack | ⚠️ **NON** | Un pack peut être créé sans produit. Pas de vérification des bijou_id dans composition. |

### DELETE / UPDATE

| Règle | Implémenté | Détail |
|-------|------------|--------|
| DELETE échoue si ID inexistant | ✅ | SELECT avant DELETE → 404 |
| UPDATE vérifie existence | ✅ | SELECT avant UPDATE → 404 |
| UPDATE vérifie lignes affectées | ⚠️ **NON** | Aucun contrôle de `result.changes`. Un UPDATE avec mêmes valeurs reste 200. |

### Stats dashboard

| Règle | Implémenté |
|-------|------------|
| Données uniquement depuis SQLite | ✅ | getDashboardStats → getSqliteDashboardStats |

---

## PHASE 3 — VERROUILLAGE ADMIN

| Route | getCurrentUser | Vérification rôle admin | Statut |
|-------|----------------|-------------------------|--------|
| POST /api/products | ✅ | `user.role !== 'admin'` → 403 | 🔒 |
| PUT /api/products/[id] | ✅ | Idem | 🔒 |
| DELETE /api/products/[id] | ✅ | Idem | 🔒 |
| GET /api/admin/packs | ✅ | Idem | 🔒 |
| POST /api/admin/packs | ✅ | Idem | 🔒 |
| GET /api/admin/packs/[id] | ✅ | Idem | 🔒 |
| PUT /api/admin/packs/[id] | ✅ | Idem | 🔒 |
| DELETE /api/admin/packs/[id] | ✅ | Idem | 🔒 |
| GET /api/admin/stats | ✅ | Idem | 🔒 |
| GET /api/admin/users | ✅ | Idem | 🔒 |
| GET /api/admin/carts | ✅ | Idem | 🔒 |
| GET /api/admin/notifications | ✅ | Idem | 🔒 |
| GET /api/orders | ✅ | Idem | 🔒 |
| GET /api/payments | ✅ | Idem | 🔒 |
| POST /api/payments | ✅ | Idem | 🔒 |
| GET /api/products | ❌ | Public (catalogue) | Intentionnel |
| GET /api/products/[id] | ❌ | Public | Intentionnel |
| GET /api/categories | ❌ | Public | Intentionnel |

---

## PHASE 4 — ZONES SIMULÉES

### 4.1 Fallback produits (testConnection échoué)

| Fichier | Ligne | Comportement |
|---------|-------|--------------|
| api/products/route.ts | 14–34 | GET → mockProducts (2 produits fictifs) |
| api/products/route.ts | 153–170 | POST → mockProduct 201 sans INSERT |
| api/products/[id]/route.ts | 28–39 | GET → mockProduct |
| api/products/[id]/route.ts | 183–202 | PUT → mockProduct sans UPDATE |
| api/products/[id]/route.ts | 314–321 | DELETE → 200 "simulation" sans DELETE |

**Danger :** En cas d’indisponibilité SQLite, l’API retourne des données fictives. Risque de tromper le frontend et les opérateurs.

---

### 4.2 Page `/admin/collections`

| Élément | Constat |
|---------|---------|
| Fichier | `app/admin/collections/page.tsx` |
| handleSubmit | `await new Promise(resolve => setTimeout(resolve, 2000))` — simulation pure |
| API appelée | Aucune |
| Persistance | Aucune |

**Danger :** L’admin croit créer une collection, mais aucune donnée n’est enregistrée.

**Recommandation (sans nouvelle API) :** Connecter à `POST /api/admin/packs` si une « collection » = un pack. Ou à `POST /api/products` si une collection = un produit avec un type spécifique. Utiliser une route existante avec des paramètres adaptés.

---

## PHASE 5 — RAPPORT FINAL

### 5.1 ✅ Fonctionnalités réellement persistées

- GET /api/products (quand SQLite OK)
- POST /api/products (quand SQLite OK)
- GET /api/products/[id] (quand SQLite OK)
- PUT /api/products/[id] (quand SQLite OK)
- DELETE /api/products/[id] (quand SQLite OK)
- GET /api/admin/packs
- POST /api/admin/packs
- GET /api/admin/packs/[id]
- GET /api/admin/stats
- GET /api/admin/users
- GET /api/admin/carts
- GET /api/admin/notifications
- GET/POST /api/orders
- GET /api/payments
- GET /api/categories

### 5.2 🔒 Fonctionnalités sécurisées

- Toutes les routes admin (produits POST/PUT/DELETE, packs, stats, users, carts, notifications, orders GET, payments GET/POST) exigent un admin via `getCurrentUser()`.
- Validation des champs requis (nom, prix, catégorie, etc.).
- Sanitization des entrées (sanitizeInput).
- Validation des ID (validateNumericId).

### 5.3 ⚠️ Failles et bugs (sans modification de code)

| # | Faille | Impact | Correction théorique |
|---|--------|--------|----------------------|
| 1 | `api/admin/packs/[id]` : `db.getPackById` utilisé, `db` non défini | ReferenceError → 500 sur PUT et DELETE | Remplacer par `getPackById(id)` |
| 2 | `api/admin/packs/[id]` : `updatePack` retourne void, test `if (!pack)` et `pack.name` | Erreur d’exécution | Utiliser `getPackById(id)` après update pour obtenir le pack |
| 3 | `api/admin/packs/[id]` : `deletePack` retourne void, `if (!success)` toujours vrai | DELETE renvoie toujours 500 | Ne pas tester la valeur de retour, ou adapter deletePack pour retourner un booléen |
| 4 | `api/payments` : `db.getPaymentsByOrderId` utilisé, `db` non défini | ReferenceError avant création du paiement | Remplacer par `getPaymentsByOrderId(order_id)` |
| 5 | `api/cart` : `db.getCartItems` utilisé, `db` non défini | ReferenceError sur GET | Remplacer par `getCartItems(user.id)` |
| 6 | `api/favorites` : `db.addToFavorites` pour pack_id, `db` non défini | ReferenceError quand pack_id fourni | Remplacer par `addToFavorites(user.id, pack_id)` |
| 7 | Catégorie produit non validée en base | Catégories inventées possibles | Vérifier l’existence dans `categories` avant INSERT/UPDATE |
| 8 | Pack : pas de vérification des produits | Packs sans produits valides possibles | Valider les bijou_id de composition dans `products` |

### 5.4 ❌ Simulations restantes

| Zone | Type | Fichier |
|------|------|---------|
| Fallback produits (SQLite KO) | mock data | api/products/route.ts, api/products/[id]/route.ts |
| Page Collections | setTimeout, aucune API | app/admin/collections/page.tsx |

### 5.5 📌 Recommandations backend (sans toucher au code)

1. **Bugs critiques :** Corriger les références à `db` non importé dans : api/admin/packs/[id], api/payments, api/cart, api/favorites.
2. **updatePack / deletePack :** Adapter le typage et l’usage du retour (void) pour éviter les tests erronés.
3. **Fallback produits :** En production, éviter de retourner des mocks. Retourner 503 + message explicite si SQLite est indisponible.
4. **Collections :** Brancher la page sur une API existante (packs ou products) sans en créer de nouvelle.
5. **Catégories :** Valider l’existence de la catégorie dans la table `categories` avant création/modification de produit.
6. **Pack composition :** Valider les `bijou_id` dans `products` avant d’enregistrer un pack.

---

**Rapport généré dans le cadre d’un audit backend professionnel.**  
**Aucune modification n’a été apportée au code source.**
