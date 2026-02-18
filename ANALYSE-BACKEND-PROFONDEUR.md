# Analyse en profondeur du backend – INOXYA BIJOUX

**Date :** 2025  
**Périmètre :** Backend Next.js (API Routes, couche données, auth, sécurité, services)

---

## 1. Vue d’ensemble

### 1.1 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 15.2.4 (App Router) |
| Runtime | Node.js (API Routes) |
| Base de données principale | **SQLite** via `better-sqlite3` (`lib/sqlite.ts`) |
| Base alternative (présente, non utilisée en prod) | PostgreSQL (`lib/postgres.ts`) |
| Auth | Cookies (session `user_id`) + bcrypt (mots de passe) |
| Auth avancée (JWT) | `lib/security.ts` (JWT, rate limit, validation) – partiellement utilisé |
| Email | Nodemailer (SMTP) |
| Images | Sharp (redimensionnement, WebP) |
| Validation | Zod (côté formulaire), sanitization manuelle côté API |

### 1.2 Architecture en couches

```
┌─────────────────────────────────────────────────────────────────┐
│  app/api/* (Route Handlers Next.js)                               │
│  - Auth, validation basique, appels lib                          │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│  lib/database.ts (façade unique)                                    │
│  - Expose: getBijouById, createOrder, getCartItems, etc.            │
│  - Délègue tout à lib/sqlite.ts                                    │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│  lib/sqlite.ts (implémentation réelle)                              │
│  - better-sqlite3, requêtes préparées, normalisation params         │
└───────────────────────────────────────────────────────────────────┘

Parallèle :
  lib/auth.ts     → getCurrentUser(), loginUser(), registerUser() [cookies + sqlite]
  lib/security.ts → JWT, rate limit, sanitize, validate (utilisé par certaines API)
  lib/admin-auth.ts → requireAdmin(), requireAdminOrModerator() [pages admin]
```

- **Point fort :** une seule façade (`lib/database.ts`) pour la persistance ; les API n’appellent pas SQLite directement (sauf produits qui utilisent aussi `lib/sqlite` pour `select`/`execute`).
- **Incohérence :** les routes produits (`app/api/products/route.ts`, `app/api/products/[id]/route.ts`) importent `lib/sqlite` (select, execute, initializeDatabase) en plus de `lib/database` (getCurrentUser). Le reste des API s’appuie uniquement sur `lib/database` + `lib/auth`.

---

## 2. Base de données

### 2.1 Choix effectif : SQLite

- Fichier : `data/inoxya_bijoux.db`.
- Connexion unique, synchrone (`better-sqlite3`).
- `lib/database.ts` documente : *« Utilise exclusivement SQLite »* et délègue à `lib/sqlite.ts`.
- `lib/postgres.ts` existe (pool PG, schéma) mais **n’est pas référencé** par `lib/database.ts` ni par les API : base secondaire / ancienne option.

### 2.2 Tables créées dans `lib/sqlite.ts` (`initializeDatabase()`)

Créées explicitement dans `initializeDatabase()` :

- `products` (id, name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_by, created_at, updated_at)
- `users` (id, phone, password_hash, first_name, last_name, role, created_at, updated_at)
- `categories` (id, name, slug, description, image_url, created_at)
- `packs` (id, name, slug, description, price, image_url, is_featured, created_at)
- `cart_items` (id, user_id, bijou_id, quantity, created_at, UNIQUE(user_id, bijou_id))

Migrations inline dans la même fonction :

- `products.images` (TEXT, JSON)
- `products.created_by` (TEXT)

### 2.3 Tables utilisées mais non créées dans `initializeDatabase()`

Le code dans `lib/sqlite.ts` utilise aussi :

- `orders`
- `order_items`
- `payments`
- `notifications`
- `favorites`

Ces tables **ne sont pas créées** dans `lib/sqlite.ts`. Elles le sont dans des scripts séparés (`scripts/add-missing-tables.js`, `scripts/setup-sqlite-db.js`, `scripts/create-advanced-tables.sql`, etc.).

**Risque :** sur une base vierge, si seuls `initializeDatabase()` et le flux normal de l’app sont exécutés (sans lancer ces scripts), la première commande / premier paiement / première notification / premier favori provoquera une erreur SQL (table inexistante).

**Recommandation :** déplacer la création de `orders`, `order_items`, `payments`, `notifications`, `favorites` dans `initializeDatabase()` de `lib/sqlite.ts`, ou documenter clairement qu’un script (ex. `npm run db:setup`) doit être exécuté une fois.

### 2.4 Façade `lib/database.ts`

- Expose uniquement des fonctions asynchrones (`async/await`), alors que `lib/sqlite.ts` est synchrone : l’enveloppe async est légère mais homogène pour les appelants.
- Gestion d’erreur : beaucoup de `try/catch` qui renvoient `null`, `false` ou tableaux vides sans remonter l’erreur, ce qui complique le debug.
- Pas de transaction explicite pour les opérations multi-tables (ex. commande + order_items + payment) : si une étape échoue, la base peut rester incohérente.

---

## 3. Authentification et autorisation

### 3.1 Mécanisme utilisé en production (côté API)

- **Session :** cookie `user_id` (httpOnly, secure en prod, 7 jours).
- **Identification :** `getCurrentUser()` dans `lib/auth.ts` lit le cookie puis charge l’utilisateur via `getUserById(userId)` (SQLite).
- **Mots de passe :** hachage avec `bcrypt` (dans `lib/auth.ts` et `lib/sqlite.ts` pour `createUser`).
- **Rôles :** `user` | `moderator` | `admin` ; les routes admin vérifient `user.role === 'admin'` (ou admin/moderator selon le cas).

Aucun JWT n’est requis pour les API actuelles ; l’auth réelle est **cookie + SQLite**.

### 3.2 Module `lib/security.ts`

- **JWT :** `generateJWT`, `verifyJWT`, `createSecureSession`, `getCurrentSession`, `clearSession` (cookies `auth_token` + `user_data`). Peu ou pas utilisé par les Route Handlers qui s’appuient sur `lib/auth.ts`.
- **Rate limiting :** en mémoire (`loginAttempts` Map) pour les tentatives de login ; utilisé par `/api/auth/login` et `/api/checkout`.
- **Validation :** mots de passe (longueur, majuscule, minuscule, chiffre, spécial), téléphone marocain, email, `validateNumericId`, `sanitizeInput`, `validateRequestOrigin`, `generateCSRFToken`.

Double système (cookie simple vs JWT) à clarifier : soit tout basculer sur un seul (ex. cookies uniquement), soit documenter quand utiliser JWT (ex. mobile / API tierces).

### 3.3 Admin

- **lib/admin-auth.ts :** `requireAdmin()`, `requireAdminOrModerator()`, `getAdminUserOrNull()` basés sur `getCurrentUser()` (donc cookie + SQLite). Utilisé par les **pages** admin (Server Components / Server Actions), pas directement par les API.
- Les **API** admin (produits, commandes, stats, etc.) font leur propre vérification `getCurrentUser()` puis `user.role !== 'admin'` → 403.

Cohérent mais duplication de la logique “admin” entre pages et API.

---

## 4. Routes API (inventaire et patterns)

### 4.1 Inventaire

| Domaine | Méthodes | Fichier(s) | Auth |
|---------|----------|------------|------|
| Produits | GET, POST | `api/products/route.ts` | POST: admin |
| Produit par ID | GET, PUT, DELETE | `api/products/[id]/route.ts` | PUT/DELETE: admin |
| Catégories | GET | `api/categories/route.ts` | Public |
| Packs | GET, (autres) | `api/packs/route.ts`, `api/packs/[id]/route.ts` | Selon route |
| Panier | GET, POST, PUT, DELETE | `api/cart/route.ts` | Utilisateur (optionnel pour GET) |
| Favoris | GET, POST | `api/favorites/route.ts` | Utilisateur |
| Commandes | GET, POST | `api/orders/route.ts` | GET: admin, POST: public (checkout) |
| Commande par ID | GET, (status, export) | `api/orders/[id]/*` | Admin / utilisateur selon route |
| Checkout | POST | `api/checkout/route.ts` | Public (rate limit) |
| Paiements | GET, POST, status | `api/payments/route.ts`, `api/payments/[id]/status/route.ts` | Admin |
| Auth | POST | `api/auth/login`, `api/auth/register` | Public (rate limit login) |
| Upload image | POST | `api/upload/product-image/route.ts` | Admin |
| Factures | POST | `api/invoices/generate`, `generate-pdf`, `send-email` | Admin |
| Admin | Divers | `api/admin/*` (stats, users, notifications, carts, packs, products/trim) | Admin |

### 4.2 Patterns communs

- **Validation :** champs requis, types (nombre, entier), plages (quantité 1–100, prix > 0).
- **Sécurité :** `sanitizeInput` sur texte, `validateNumericId` sur IDs, vérification des prix côté serveur au checkout (pas de confiance au client).
- **Erreurs :** `NextResponse.json({ error: '...' }, { status: 4xx/5xx })` ; logs via `lib/logger`.
- **Rate limiting :** login (IP + téléphone), checkout (IP) via `lib/security`.

### 4.3 Points sensibles

- **Checkout** (`api/checkout/route.ts`) : appelle `createPayment(..., { created_at, updated_at })` alors que la signature dans `lib/sqlite.ts` et `lib/database.ts` ne prévoit pas ces champs ; ils sont ignorés (pas de crash mais confusion).
- **Inscription** (`lib/auth.ts` `registerUser`) : le mot de passe est passé en clair à `createSqliteUser({ password_hash: password })` ; c’est bien `lib/sqlite.ts` qui fait le hash dans `createUser`. À ne pas changer côté appelant sans adapter SQLite.
- **Factures** (`api/invoices/generate/route.ts`) : pas de persistance des factures ; retour JSON uniquement. PDF et envoi email dépendent d’autres routes.

---

## 5. Sécurité

### 5.1 Points forts

- Vérification des prix au checkout depuis la BDD (pas de confiance au client).
- Upload d’images : whitelist MIME, taille max 5 Mo, validation du contenu avec Sharp.
- Requêtes SQL paramétrées (pas de concaténation de chaînes pour les paramètres).
- Sanitization des entrées (sanitizeInput), validation d’IDs numériques.
- Rate limiting sur login et checkout.
- Cookies httpOnly, secure en production.

### 5.2 À améliorer

- **CSRF :** `validateRequestOrigin` et `generateCSRFToken` existent mais ne sont pas utilisés systématiquement sur les mutations (POST/PUT/DELETE).
- **JWT / cookies :** deux mécanismes (cookie `user_id` vs JWT dans `security.ts`) ; risque de confusion et de failles si un chemin utilise l’un et pas l’autre.
- **Secrets :** `JWT_SECRET` avec fallback « build-time-placeholder » en build ; à éviter en prod (variable d’env obligatoire).
- **Rate limit :** en mémoire ; perdu au redémarrage et non partagé entre instances (à terme : Redis ou équivalent pour la scalabilité).

---

## 6. Services annexes

### 6.1 Email (`lib/email.ts`)

- Nodemailer, config SMTP via env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL).
- `sendAdminEmail(subject, htmlBody)` : envoi vers admin.
- `renderPaymentEmail(...)` : template HTML pour notification de paiement.
- Si SMTP non configuré : log warning, pas d’envoi (comportement sûr).

### 6.2 Logging (`lib/logger.ts`)

- Niveaux : debug, info, warn, error.
- En production, seuls warn/error sont émis.
- Méthodes dédiées : `api(method, path, status)`, `db(operation, success, details)`.
- Pas de log structuré (JSON) ni d’export vers un service externe.

### 6.3 Images

- **Upload :** `api/upload/product-image/route.ts` – Sharp, conversion WebP, redimensionnement (main, gallery, thumbnail), chemins sous `public/images/bijoux/...`.
- **Config / utilitaires :** `lib/image-utils.ts`, `lib/image-config.ts`, `lib/process-product-image.ts`, `lib/product-images.ts` – à consulter pour cohérence des tailles et chemins.

### 6.4 Packs

- **lib/pack-management.ts** : logique avancée (composition, réductions, etc.) avec une connexion SQLite propre (`getDatabase()`), indépendante de `lib/sqlite.ts`. Risque de duplication de connexion et de schéma si les deux évoluent séparément.

---

## 7. Incohérences et bugs mineurs

1. **Tables manquantes dans `initializeDatabase()`** : `orders`, `order_items`, `payments`, `notifications`, `favorites` (voir § 2.3).
2. **Produits :** usage direct de `lib/sqlite` (select/execute) dans les API alors que le reste passe par `lib/database`.
3. **Auth :** double système cookie simple (auth.ts) vs JWT/session (security.ts) sans frontière claire.
4. **createPayment** : paramètres `created_at`/`updated_at` envoyés par le checkout mais non définis dans la signature ni en base (à documenter ou supprimer côté appelant).
5. **sqlite.ts** : `e.message` dans les blocs catch (ligne 71, 80) – en TS strict, `e` est `unknown` ; utiliser `e instanceof Error && e.message`.
6. **registerUser** : le champ envoyé à SQLite s’appelle `password_hash` mais la valeur est le mot de passe en clair ; le hash est fait dans `createUser` SQLite. Fonctionnel mais nommage trompeur.

---

## 8. Recommandations synthétiques

| Priorité | Action |
|----------|--------|
| Haute | Créer `orders`, `order_items`, `payments`, `notifications`, `favorites` dans `initializeDatabase()` (ou un script unique documenté et exécuté au setup). |
| Haute | Unifier l’auth : soit tout en cookie (actuel), soit tout en JWT ; documenter et supprimer le code inutilisé. |
| Moyenne | Introduire des transactions (ex. dans SQLite ou en regroupant les appels) pour création commande + items + paiement + notification. |
| Moyenne | Centraliser la vérification “admin” (middleware ou helper unique) pour les API et les pages. |
| Basse | Utiliser `validateRequestOrigin` ou CSRF sur les mutations sensibles. |
| Basse | Corriger les `catch (e)` dans sqlite (typage `e instanceof Error`) et le nommage `password_hash` dans registerUser. |
| Basse | Prévoir un rate limiting distribué (Redis) si déploiement multi-instances. |

---

## 9. Conclusion

Le backend est **structuré et opérationnel** : une façade de données unique (SQLite), des API cohérentes, une bonne attention à la validation et à la sécurité des prix et des uploads. Les principaux points à traiter sont la **création des tables manquantes** au démarrage, l’**unification de l’authentification** (cookie vs JWT) et, à moyen terme, les **transactions** et la **clarification des rôles** entre `lib/sqlite`, `lib/database` et les routes produits.
