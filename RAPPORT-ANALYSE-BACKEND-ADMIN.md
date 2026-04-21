# Analyse approfondie du Backend Admin - INOXYA BIJOUX

**Date :** 3 février 2026

---

## 1. Vue d'ensemble des pages Admin

| Page | Route | Composant / API | Statut |
|------|-------|-----------------|--------|
| Dashboard | `/admin` | AdminDashboard, getDashboardStats | ✅ Opérationnel |
| Produits | `/admin/produits` | fetch /api/products | ✅ Opérationnel |
| Nouveau produit | `/admin/produits/nouveau` | POST /api/products | ✅ Corrigé |
| Modifier produit | `/admin/produits/[id]/modifier` | GET/PUT /api/products/[id] | ✅ Corrigé |
| Supprimer produit | (bouton Modifier) | DELETE /api/products/[id] | ✅ Corrigé |
| Packs | `/admin/packs` | AdminPacksManagement, GET/POST /api/admin/packs | ✅ Opérationnel |
| Modifier pack | (dialog AdminPacksManagement) | PUT /api/admin/packs/[id] | ✅ Opérationnel |
| Supprimer pack | (bouton AdminPacksManagement) | DELETE /api/admin/packs/[id] | ✅ Opérationnel |
| Initialiser packs | `/admin/packs/initialize` | POST /api/admin/packs/initialize | ✅ Opérationnel |
| Commandes | `/admin/orders` | fetch /api/orders (admin) | ✅ Opérationnel |
| Paiements | `/admin/payments` | fetch /api/payments | ✅ Opérationnel |
| Paniers | `/admin/paniers` | fetch /api/admin/carts | ✅ Opérationnel |
| Notifications | `/admin/notifications` | fetch /api/admin/notifications | ✅ Opérationnel |
| Utilisateurs | (AdminDashboard) | /api/admin/users | ✅ Opérationnel |
| Collections | `/admin/collections` | Simulation uniquement | ⚠️ Non connecté |
| Catégories | (AdminDashboard) | /api/categories | ✅ Opérationnel |

---

## 2. APIs Admin et sources de données

| API | Méthode | Source | Persistance |
|-----|---------|--------|-------------|
| `/api/products` | GET | lib/sqlite (products) | SQLite |
| `/api/products` | POST | execute INSERT | SQLite |
| `/api/products/[id]` | GET | select FROM products | SQLite |
| `/api/products/[id]` | PUT | execute UPDATE | SQLite |
| `/api/products/[id]` | DELETE | execute DELETE | SQLite |
| `/api/admin/packs` | GET | getAllPacks → getSqlitePacks | SQLite |
| `/api/admin/packs` | POST | createPack (pack-management) | SQLite |
| `/api/admin/packs/[id]` | GET/PUT/DELETE | pack-management | SQLite |
| `/api/admin/stats` | GET | getDashboardStats | SQLite |
| `/api/admin/users` | GET | getAllUsers | SQLite |
| `/api/admin/carts` | GET | getAllActiveCarts | SQLite |
| `/api/admin/notifications` | GET | getNotifications | SQLite |

---

## 3. Boutons et fonctionnalités vérifiées

### Produits
- **Nouveau produit** → Formulaire → POST /api/products → INSERT SQLite ✅
- **Modifier** → Formulaire pré-rempli → PUT /api/products/[id] → UPDATE SQLite ✅
- **Supprimer** → Confirmation → DELETE /api/products/[id] → DELETE SQLite ✅

### Packs
- **Nouveau Pack** → Dialog formulaire → POST /api/admin/packs → createPack → INSERT SQLite ✅
- **Modifier** → Dialog formulaire → PUT /api/admin/packs/[id] → updatePack → UPDATE SQLite ✅
- **Supprimer** → Confirmation → DELETE /api/admin/packs/[id] → deletePack → DELETE SQLite ✅

---

## 4. Corrections appliquées

1. **Nouveau produit** : Remplacement de la simulation par un appel réel à POST /api/products.
2. **Modifier produit** : Remplacement de la simulation par PUT et DELETE réels.
3. **Mapping catégorie** : Ajout de categoryIdToName (form → API) et categoryNameToId (API → form) pour le Select.
4. **SelectItem value=""** : Remplacement par value="none" pour respecter Radix UI.

---

## 5. Vérification de l’ajout réel en base

- **Produits** : POST /api/products appelle `execute(INSERT INTO products ...)` dans lib/sqlite. Les données sont bien enregistrées en SQLite.
- **Packs** : POST /api/admin/packs appelle `createPack()` qui utilise `db.prepare(INSERT INTO packs ...).run()`. Les packs sont bien enregistrés en SQLite.

---

## 6. Point d’attention : Collections

La page `/admin/collections` utilise encore une simulation (setTimeout) et n’appelle aucune API. Si les « collections » doivent correspondre aux packs ou aux catégories, il faudra connecter cette page à l’API appropriée.

---

## 7. Flux de données (produits)

```
Formulaire (nom, prix, catégorie, image...)
  → POST /api/products
  → getCurrentUser() [admin requis]
  → sanitizeInput(), validation
  → execute(INSERT INTO products ...)
  → SQLite data/inoxya_bijoux.db
```
