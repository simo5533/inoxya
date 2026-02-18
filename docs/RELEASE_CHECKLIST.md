# ✅ CHECKLIST DE RELEASE - INOXYA BIJOUX

**Date:** 2026-02-13  
**Version:** 1.0.0  
**Statut:** Pré-production

---

## 🎯 Objectif

Vérifier que le projet est prêt pour le déploiement en production avec **zéro erreur** et **toutes les fonctionnalités opérationnelles**.

---

## 📋 Checklist Avant Déploiement

### 1. Build & Compilation

- [ ] **Build réussi**
  ```bash
  npm run build
  ```
  **Attendu:** ✅ Compilation réussie, 0 erreur

- [ ] **Vérifier les warnings**
  - Aucun warning critique
  - Warnings mineurs documentés si nécessaire

---

### 2. Base de Données

- [ ] **Vérifier la DB SQLite**
  ```bash
  npm run verify:sqlite
  ```
  **Attendu:** ✅ Toutes les tables présentes, produits/catégories cohérents

- [ ] **Vérifier les catégories normalisées**
  ```bash
  npm run db:diagnose-categories
  ```
  **Attendu:** ✅ Toutes les catégories ont une correspondance

- [ ] **Vérifier les images**
  ```bash
  npm run verify:images
  npm run verify:packs
  ```
  **Attendu:** ✅ 0 image manquante

---

### 3. Filtrage par Catégorie (CRITIQUE)

- [ ] **Tester chaque catégorie manuellement:**
  1. Ouvrir `/bijoux`
  2. Cliquer sur chaque carte de catégorie :
     - Bagues → Doit afficher 7 produits
     - Colliers → Doit afficher 14 produits
     - Bracelets → Doit afficher 14 produits
     - Boucles d'oreilles → Doit afficher les produits (ou message vide élégant)
     - Parures → Doit afficher les produits (ou message vide élégant)
     - Nos packs → Doit rediriger vers `/packs`

- [ ] **Tester l'API directement:**
  ```bash
  npm run test:category-filter
  ```
  **Attendu:** ✅ Toutes les catégories retournent des produits ou 0 (pas d'erreur)

- [ ] **Vérifier les URLs:**
  - `/bijoux?category=bagues` → Affiche les bagues
  - `/bijoux?category=bracelets` → Affiche les bracelets
  - `/bijoux?category=colliers` → Affiche les colliers

---

### 4. Images de Catégories

- [ ] **Vérifier visuellement:**
  1. Ouvrir `/bijoux`
  2. Vérifier que toutes les cartes de catégories ont des **vraies photos** (pas d'icônes SVG)
  3. Vérifier que le style est **uniforme** (même aspect ratio, overlay, typographie)

---

### 5. Runtime & Console

- [ ] **Tester les pages principales:**
  - `/` (accueil) → Pas d'erreur console
  - `/bijoux` → Pas d'erreur console
  - `/bijoux?category=bracelets` → Pas d'erreur console, produits affichés
  - `/packs` → Pas d'erreur console
  - `/admin` → Pas d'erreur console (si connecté)

- [ ] **Vérifier la console navigateur (F12):**
  - 0 erreur rouge
  - Warnings acceptables uniquement

---

### 6. APIs

- [ ] **Tester les endpoints critiques:**
  ```bash
  # GET /api/products
  curl http://localhost:3000/api/products
  
  # GET /api/products?category=bracelets
  curl http://localhost:3000/api/products?category=bracelets
  
  # GET /api/categories
  curl http://localhost:3000/api/categories
  ```
  **Attendu:** ✅ Réponses JSON valides, pas d'erreur 500

---

### 7. Responsive Design

- [ ] **Tester sur différentes tailles:**
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1920px)
  - Vérifier que les cartes de catégories s'affichent correctement

---

### 8. Performance

- [ ] **Vérifier le temps de chargement:**
  - Page d'accueil < 3s
  - Page bijoux < 3s
  - Images optimisées (next/image)

---

## 🚀 Commandes de Vérification Rapide

```bash
# 1. Build
npm run build

# 2. Vérification DB complète
npm run verify:all

# 3. Diagnostic catégories
npm run db:diagnose-categories

# 4. Test filtrage API
npm run test:category-filter

# 5. Démarrer en production
npm run start
```

---

## ✅ Critères d'Acceptation

**TOUS doivent être vrais:**

- [x] `npm run build` passe sans erreur
- [x] Catégories normalisées dans DB (noms, pas IDs)
- [x] Filtrage par catégorie fonctionne (clics sur cartes)
- [x] API `/api/products?category=<slug>` fonctionne
- [x] Images de catégories sont des vraies photos
- [x] Style uniforme sur toutes les cartes
- [x] 0 erreur console sur pages principales
- [x] Responsive fonctionnel

---

## 📝 Notes Post-Déploiement

Après déploiement, vérifier:
1. Variables d'environnement configurées
2. Base de données accessible (SQLite ou PostgreSQL)
3. Images servies correctement
4. HTTPS activé (production)
5. Monitoring/Logging configuré

---

**Dernière mise à jour:** 2026-02-13
