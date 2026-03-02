# Audit — Codes de statut des APIs

Analyse de toutes les routes API du projet : quand elles renvoient **200/201** (succès) et quand elles renvoient **4xx/5xx** (erreur client/serveur).

---

## Convention retenue

- **200** : Succès (GET, PUT, PATCH, DELETE, ou POST sans création).
- **201** : Création réussie (POST qui crée une ressource).
- **400** : Données invalides (validation, métier).
- **401** : Non authentifié (cookie/session manquant ou invalide).
- **403** : Accès refusé (droits insuffisants).
- **404** : Ressource introuvable.
- **429** : Trop de requêtes (rate limit).
- **500** : Erreur serveur.
- **503** : Service temporairement indisponible (ex. DB).
- **504** : Timeout (ex. opération longue).

---

## 1. APIs publiques / utilisateur

| Route | Méthode | 200/201 | 400 | 401 | 403 | 404 | 429 | 500 | 503 | Notes |
|-------|---------|---------|-----|-----|-----|-----|-----|-----|-----|--------|
| **/api/auth/me** | GET | ✅ (user ou null) | — | — | — | — | — | 500 | — | Toujours 200 si pas d’exception (user: null si invité). |
| **/api/auth/login** | POST | ✅ (succès) | 400 (validation) | — | — | — | 429 (rate limit) | 500 | — | 401 géré dans le body (success: false). |
| **/api/auth/logout** | POST | ✅ | — | — | — | — | — | — | — | Toujours 200 (même en erreur, pour permettre redirection). |
| **/api/auth/register** | POST | — | 400 (validation / conflit) | — | — | — | 429 | 500 | — | 201 en succès. |
| **/api/csrf-token** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/health** | GET | ✅ (healthy) | — | — | — | — | — | — | 503 | Si DB indisponible. |
| **/api/favorites** | GET | ✅ (favorites ou []) | — | — | — | — | — | 500 | — | Invité → 200 + `favorites: []`. |
| **/api/favorites** | POST | ✅ (success, synced) | 400 (validation) | — | — | — | — | 500 | — | Invité → 200 + `synced: false`. |
| **/api/cart** | GET | ✅ (items ou []) | — | — | — | — | — | 500 | — | Invité → 200 + `items: []`. |
| **/api/cart** | POST | ✅ | 400 (validation) | — | — | — | — | 500 | — | |
| **/api/cart** | PUT | ✅ | 400 | — | — | — | — | 500 | — | |
| **/api/cart** | DELETE | ✅ | 400 (id invalide) | — | — | — | — | 500 | — | |
| **/api/products** | GET | ✅ | — | — | — | — | — | 500 | 503 | |
| **/api/products** | POST | — | 400 / 503 | — | 403 (non admin) | — | — | 500 | 503 | 201 en création OK. |
| **/api/products/[id]** | GET | ✅ | 400 | — | 403 | 404 | — | 500 | 503 | |
| **/api/products/[id]** | PUT/PATCH/DELETE | ✅ | 400 | — | 403 | 404 | — | 500 | 503 | |
| **/api/packs** | GET | ✅ | — | — | — | — | — | 500 | 503 | |
| **/api/packs** | POST | — | 400 | — | 403 | — | — | 500 | — | 201 en création. |
| **/api/packs/[id]** | GET | ✅ | 400 | — | 403 | 404 | — | 500 | — | |
| **/api/packs/[id]** | PUT/PATCH/DELETE | ✅ | 400 | — | 403 | 404 | — | 500 | — | |
| **/api/categories** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/orders** | GET | ✅ (orders) | — | — | 403 | — | — | 500 | — | Admin ou user propriétaire. |
| **/api/orders** | POST | ✅ ou 201 | 400 | — | — | 404 (produit/pack) | — | 500 | — | Création commande. |
| **/api/orders/[id]** | GET | ✅ | — | — | 403 | 404 | — | 500 | — | |
| **/api/orders/[id]/status** | PATCH | ✅ | 400 | 401 | 403 | — | — | 500 | — | |
| **/api/orders/export** | GET | ✅ (fichier) | 400 (format) | — | 403 | — | — | 500 | — | |
| **/api/orders/[id]/export** | GET | ✅ | 400 | — | 403 | 404 | — | 500 | — | |
| **/api/checkout** | POST | ✅ | 400 / 404 | — | — | — | 429 | 500 | — | |
| **/api/custom-requests** | POST | ✅ | 400 | — | — | — | 429 | 500 | — | |
| **/api/custom-requests** | GET | ✅ | — | — | 403? (commenté) | — | — | 500 | — | Admin. |
| **/api/test** | GET | ✅ | — | — | — | — | — | — | — | Route de test. |

---

## 2. APIs admin (protégées)

| Route | Méthode | 200/201 | 400 | 401 | 403 | 404 | 429 | 500 | 503/504 | Notes |
|-------|---------|---------|-----|-----|-----|-----|-----|-----|--------|--------|
| **/api/admin/users** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/users/[id]/role** | PATCH | ✅ | 400 | — | — | — | — | 500 | — | |
| **/api/admin/packs** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/packs** | POST | ✅ (201) | 400 | — | — | — | — | 500 | — | |
| **/api/admin/packs/[id]** | GET/PUT/PATCH/DELETE | ✅ | 400 | — | — | 404 | — | 500 | — | |
| **/api/admin/packs/verify** | GET/POST | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/packs/initialize** | POST | ✅ | — | — | — | — | — | 500 | 504 | Timeout possible. |
| **/api/admin/products** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/products/[id]/restore** | POST | ✅ | 400 | — | — | — | — | 500 | — | |
| **/api/admin/products/trim** | POST | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/notifications** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/notifications/[id]/read** | PATCH | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/settings** | GET/PUT | ✅ | — | — | — | — | — | 500 | 503 | |
| **/api/admin/upload-image** | POST | ✅ | 400 | — | — | — | — | 500 | — | |
| **/api/admin/serve-local-image** | GET | — | 400 | — | 403 | 404 | — | — | — | Pas de 200 si JSON d’erreur. |
| **/api/admin/import-products** | POST | ✅ | — | — | — | 404 | — | 500 | 504 | |
| **/api/admin/database/analyze** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/carts** | GET | ✅ | — | — | — | — | — | 500 | — | |
| **/api/admin/stats** | GET | ✅ | — | — | — | — | — | 500 | — | |

---

## 3. Paiements, factures, upload

| Route | Méthode | 200/201 | 400 | 401 | 403 | 404 | 429 | 500 | Notes |
|-------|---------|---------|-----|-----|-----|-----|-----|-----|--------|
| **/api/payments** | GET | ✅ | — | — | 403 | — | — | 500 | Admin. |
| **/api/payments** | POST | ✅ | 400 | — | 403 | 404 | — | 500 | Admin. |
| **/api/payments/[id]/status** | PATCH | ✅ | 400 | — | 403 | — | — | 500 | Admin. |
| **/api/invoices/generate** | GET | ✅ | 400 | — | 403 | 404 | — | 500 | Admin. |
| **/api/invoices/generate-pdf** | GET | ✅ | 400 | — | 403 | 404 | — | 500 | Admin. |
| **/api/invoices/send-email** | POST | ✅ | 400 | — | 403 | 404 | — | 500 | Admin. |
| **/api/upload/product-image** | POST | ✅ | 400 | — | 403 | — | 429 | 500 | |

---

## 4. Synthèse — Quand l’API renvoie 200

- **Succès métier** : la ressource est lue/créée/modifiée/supprimée comme demandé → **200** (ou **201** pour création).
- **Cas “optionnel” sans erreur** :
  - **GET /api/favorites** sans session → **200** + `favorites: []`.
  - **POST /api/favorites** sans session → **200** + `success: true, synced: false`.
  - **GET /api/cart** sans session → **200** + `items: []`.
  - **GET /api/auth/me** sans session → **200** + `user: null`.
- **Erreurs métier** (données invalides, ressource absente, droits) → **400 / 403 / 404** (pas 200).
- **Erreur serveur ou DB** → **500** ou **503** (pas 200).

---

## 5. Corrections appliquées (cette audit)

1. **GET /api/favorites** : auparavant **401** si non authentifié. Désormais **200** + `{ favorites: [] }` pour les invités, cohérent avec POST qui renvoie 200 + `synced: false`.
2. **POST /api/favorites** (déjà fait avant cet audit) : invité → **200** + `{ success: true, synced: false }` au lieu de 401.

Aucune autre route ne devait être modifiée pour “renvoyer 200” : les 401/403/404/500 restants correspondent à des échecs réels (auth requise, ressource introuvable, erreur serveur).

---

## 6. Vérification rapide

- **Invité** : `GET /api/favorites` → 200, `POST /api/favorites` → 200, `GET /api/cart` → 200, `GET /api/auth/me` → 200.
- **Connecté** : mêmes routes → 200 avec données quand l’opération réussit.
- **Admin** : routes `/api/admin/*` et `/api/payments/*` → 200/201 en succès, 403 si non admin, 400/404/500 selon les cas.
