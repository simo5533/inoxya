# Analyse approfondie du projet INOXYA BIJOUX

**Date :** 2 février 2026

---

## 1. Architecture et sources de données

### Problème majeur : dualité Supabase / SQLite
- **SQLite** (`data/inoxya_bijoux.db`) : produits, packs, catégories, utilisateurs, commandes (données réelles)
- **database-adapter** : conçu pour **Supabase** uniquement
- **Conséquence** : checkout, cart, orders utilisent `db` (Supabase) qui retourne `null` quand Supabase n’est pas configuré → **checkout et panier inopérants**

### Méthodes manquantes dans database-adapter
- `createOrder`, `createOrderItem`, `createPayment`, `createNotification`, `getAllOrders` sont **appelées mais non implémentées** dans l’adapter
- Risque d’erreurs à l’exécution : `db.createOrder is not a function`

---

## 2. Problèmes critiques à corriger

| # | Problème | Fichier(s) | Solution |
|---|----------|------------|----------|
| 1 | Checkout utilise `db.getBijouById` (Supabase) | checkout/route.ts | Utiliser `getBijouById` de lib/database (SQLite) |
| 2 | `createOrder`, `createOrderItem` inexistants | database-adapter | Implémenter via SQLite |
| 3 | `createPayment`, `createNotification` inexistants | database-adapter | Implémenter via SQLite |
| 4 | Cart/orders utilisent `db` (Supabase) | cart, orders | Basculer sur SQLite |
| 5 | `sharp` non installé (process-product-image) | process-product-image.ts | Installer sharp ou gérer l’absence |
| 6 | `verifyPassword` renvoie `plainPassword === 'password'` | database-adapter | Utiliser bcrypt |

---

## 3. Problèmes mineurs

- **Supabase** : variables d’environnement manquantes → warnings à chaque build
- **auth-old.ts** : fichier obsolète, à supprimer ou ignorer
- **database-sqlite.ts**, **database-local.ts** : doublons avec `lib/sqlite.ts`
- **require('bcryptjs')** dans sqlite.ts : préférer `import`

---

## 4. Sécurité

- Rate limiting : présent sur checkout
- Sanitization : `sanitizeInput` utilisé
- Validation téléphone : format marocain vérifié
- JWT : utilisé dans security.ts

---

## 5. Dépendances

- **installées** : nodemailer, jsonwebtoken, better-sqlite3, bcryptjs
- **manquante** : sharp (utilisé dans process-product-image)
- **conflit** : react-day-picker vs React 19 (résolu avec --legacy-peer-deps)

---

## 6. Recommandations

1. Unifier les sources de données sur SQLite pour le flux e-commerce
2. Implémenter les méthodes manquantes (orders, payments, notifications) côté SQLite
3. Installer `sharp` ou désactiver/contourner le traitement d’images
4. Supprimer ou marquer clairement le code mort (auth-old, etc.)
5. Documenter la configuration : SQLite = données principales, Supabase = optionnel
