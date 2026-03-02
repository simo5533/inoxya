# Audit des tables Supabase — INOXYA BIJOUX

## Objectif

Vérifier que toutes les tables du schéma sont cohérentes avec l’application, que le Table Editor affiche les bonnes données et qu’aucun problème bloquant n’existe.

---

## 1. Tables utilisées par l’adapter (lecture/écriture)

| Table | Utilisation | Contenu attendu dans Table Editor |
|-------|-------------|-----------------------------------|
| **users** | Auth, admin (getUserByPhone, getUserById, createUser, getAllUsers, updateUserRole) | 2 lignes (seed : Admin, Test Client) + utilisateurs inscrits |
| **products** | Catalogue, admin (getProducts, getProductById, createProduct, updateProduct, deleteProduct) | Données sync depuis SQLite ou seed (36+ ou 3 seed) |
| **categories** | Navigation / filtres (getCategories, createCategory, updateCategory) | Vide ou lignes créées via admin. L’app utilise aussi `lib/category-mapping` si vide. |
| **packs** | Page packs, admin (getPacks, getPackById, createPack, updatePack, deletePack) | Données sync ou seed (13+ ou 1) |
| **orders** | Commandes, checkout (getOrders, getOrderById, createOrder, updateOrderStatus) | Lignes créées à chaque commande |
| **order_items** | Détail des commandes (createOrderItem, getOrderItems) | Une ou plusieurs lignes par commande |
| **cart_items** | Panier (getCartItems, addToCart, updateCartQuantity, removeFromCart) | Lignes quand un utilisateur connecté a des articles dans le panier |
| **favorites** | Favoris (getFavorites, addToFavorites, removeFromFavorites) | Lignes quand un utilisateur connecté a mis des produits/packs en favori (sync au chargement de /favoris) |
| **payments** | Paiements (createPayment, getPaymentsByOrderId, getAllPayments, updatePaymentStatus) | Une ou plusieurs lignes par commande payée |
| **notifications** | Admin + custom requests (createNotification, getNotifications, markNotificationAsRead) | Notifications créées (ex. demande sur mesure → 1 notification) |
| **settings** | Admin (getSettings, updateSettings) | Clé/valeur (ex. paramètres du site). Peut être vide. |

Toutes ces tables sont **utilisées en production** lorsque `DATABASE_URL` ou la config Supabase est active. Le Table Editor doit les afficher correctement ; les colonnes et types correspondent au schéma dans `scripts/supabase-complete-schema.sql`.

---

## 2. Tables présentes dans le schéma mais non gérées par l’adapter

| Table | Rôle dans le schéma | État actuel de l’app |
|-------|----------------------|----------------------|
| **user_sessions** | Sessions utilisateur | Non utilisée par l’adapter (auth via cookie user_id). Table peut rester vide. |
| **custom_requests** | Demandes sur mesure | **Non remplie** : l’API POST `/api/custom-requests` crée uniquement une **notification**, pas une ligne dans `custom_requests`. Table vide dans le Table Editor = comportement actuel. |
| **reviews** | Avis produits | Non utilisée par l’adapter. `reviews_count` sur les produits est optionnel (non stocké en colonne). Table peut rester vide. |
| **newsletter_subscriptions** | Inscriptions newsletter | Aucune route API ne l’utilise. Table vide. |
| **site_stats** | Statistiques (vues, revenus par jour) | Non utilisée. Table vide. |
| **shipping_addresses** | Adresses de livraison par user/commande | Non utilisée ; l’app utilise le champ `orders.shipping_address` (texte). Table vide. |
| **promo_codes** | Codes promo | Non utilisée par l’adapter. Table vide. |
| **contact_messages** | Messages formulaire contact | Aucune API ne lit/écrit cette table. Table vide. |
| **testimonials** | Témoignages | Non utilisée. Table vide. |
| **site_settings** | Paramètres avancés (clé/valeur par catégorie) | Distinct de `settings`. Non utilisée. Table vide. |

Aucune de ces tables n’est **obligatoire** pour le fonctionnement actuel du site. Le fait qu’elles soient vides dans le Table Editor est **normal** tant que l’on n’ajoute pas de fonctionnalités (newsletter, contact, promos, etc.).

---

## 3. Cohérence schéma ↔ adapter

- **users** : `id` SERIAL (integer). L’adapter et l’auth utilisent `user.id` en string ; la conversion est gérée (eq sur id).
- **products** : Pas de colonne `reviews_count` en base ; le type `Product` l’a en optionnel. L’adapter met `reviews_count` depuis la row si présent (sinon undefined) ; la table Supabase n’a pas cette colonne → affichage 0 ou undefined côté UI = OK.
- **orders** : `customer_id` INTEGER FK users, `user_id` TEXT. Adapter remplit les deux quand fournis. Cohérent.
- **order_items** : `bijou_id` et `pack_id` en TEXT (pas de FK). Adapter envoie des string. OK.
- **favorites** : `user_id` INTEGER, `bijou_id` INTEGER (nullable), `pack_id` INTEGER (nullable), CHECK bijou ou pack. Adapter envoie des nombres ou string convertis. OK.
- **cart_items** : `user_id` INTEGER, `bijou_id` INTEGER (FK products). Adapter utilise les bons types. OK.
- **settings** : Colonnes `key`, `value`, `updated_at`. Adapter fait select key/value et upsert sur `key`. OK.

Aucune incohérence bloquante entre le schéma SQL et l’adapter.

---

## 4. Vérifications à faire dans le Table Editor

1. **users** : Au moins 2 lignes (seed). Colonnes : id, phone, password_hash, first_name, last_name, role, created_at, updated_at.
2. **products** : Lignes présentes (sync ou seed). Colonnes : id, name, name_ar, description, price, category, stock, is_active, image_url, images (JSONB), created_by, is_featured, etc.
3. **packs** : Lignes présentes (sync ou seed). Colonnes : id, name, slug, description, price, image_url, is_featured, created_by, created_at.
4. **categories** : Peut être vide ; si des catégories sont créées en admin, elles apparaissent ici.
5. **orders** : Lignes après passage de commandes. Sinon vide.
6. **order_items** : Lignes liées aux commandes.
7. **cart_items** : Lignes si un utilisateur connecté a des articles dans le panier.
8. **favorites** : Lignes si un utilisateur connecté a des favoris (et a chargé /favoris pour déclencher la sync).
9. **payments** : Lignes pour les commandes avec paiement.
10. **notifications** : Lignes si des notifications ont été créées (ex. demande sur mesure).
11. **settings** : Peut être vide ou contenir des clés/valeurs.
12. **custom_requests, contact_messages, reviews, newsletter_subscriptions, site_stats, shipping_addresses, promo_codes, testimonials, site_settings, user_sessions** : Vides = normal pour l’état actuel de l’app.

---

## 5. Points d’attention (non bloquants)

- **categories** : Le script complet ne seed pas `categories`. Si vous voulez des lignes visibles dans le Table Editor, créez-les via l’admin ou un script d’insert.
- **custom_requests** : Les demandes sur mesure créent seulement une notification, pas une ligne dans `custom_requests`. Pour afficher des lignes ici, il faudrait que l’API POST écrive aussi dans `custom_requests` via l’adapter (à ajouter si besoin).
- **Favoris** : La table se remplit quand un utilisateur **connecté** ouvre la page Favoris (sync localStorage → Supabase). Invités = pas de lignes.

---

## 6. Résumé

| Élément | Statut |
|--------|--------|
| Schéma 21 tables | OK, cohérent avec le script complet |
| Adapter Supabase | OK pour users, products, categories, packs, orders, order_items, cart_items, favorites, payments, notifications, settings |
| Table Editor | Toutes les tables listées s’affichent ; contenu conforme à l’usage ci‑dessus |
| Tables vides | Normales pour : categories (si pas créées), cart_items, favorites (si pas d’usage connecté), orders/order_items/payments (si pas de commandes), et toutes les tables “non gérées” (custom_requests, contact_messages, etc.) |

Aucun problème bloquant identifié. Pour que “tout soit fonctionnel et qu’on ne voie pas de problème” : utiliser un compte connecté pour panier/favoris, passer une commande de test pour orders/payments, et éventuellement ajouter un seed ou l’admin pour `categories` si vous voulez des lignes visibles. Le script complet et le catalogue de démo insèrent désormais des catégories. **Vérification rapide** : exécuter `scripts/supabase-verify-tables.sql` dans le SQL Editor pour le nombre de lignes par table.
