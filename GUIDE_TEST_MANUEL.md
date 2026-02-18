# 🧪 GUIDE DE TEST MANUEL - INOXYA BIJOUX

Ce guide vous permet de tester toutes les fonctionnalités de l'application une par une.

---

## 🚀 PRÉPARATION

1. **Démarrer le serveur de développement**:
   ```bash
   Analyse et teste toutes les fonctionnalités une par une.

   ```

2. **Ouvrir le navigateur**:
   - URL: `http://localhost:3000`

3. **Ouvrir la console du navigateur** (F12) pour voir les erreurs éventuelles

---

## 🔐 1. TESTS D'AUTHENTIFICATION

### ✅ Test 1.1 : Inscription
1. Aller sur `/inscription`
2. Remplir le formulaire :
   - Prénom: `Test`
   - Nom: `User`
   - Téléphone: `0644444444` (utiliser un numéro unique)
   - Mot de passe: `test123`
   - Confirmer: `test123`
3. Cliquer sur "Créer mon compte"
4. **Résultat attendu**: Message de succès, redirection vers `/login`

### ✅ Test 1.2 : Connexion
1. Aller sur `/login`
2. Se connecter avec :
   - Téléphone: `admin_phone`
   - Mot de passe: `password`
3. **Résultat attendu**: Connexion réussie, redirection vers `/`

### ✅ Test 1.3 : Déconnexion
1. Cliquer sur le bouton de déconnexion dans le header
2. **Résultat attendu**: Déconnexion, redirection vers `/`

### ✅ Test 1.4 : Vérification du rôle admin
1. Se connecter avec `admin_phone` / `password`
2. Vérifier que le bouton "Admin" apparaît dans le header
3. Cliquer sur "Admin"
4. **Résultat attendu**: Accès au dashboard admin

---

## 🌐 2. TESTS DES PAGES PUBLIQUES

### ✅ Test 2.1 : Page d'accueil
1. Aller sur `/`
2. **Vérifier**:
   - Hero banner s'affiche
   - Grille de 9 produits vedettes
   - Sections catégories
   - Section avantages
   - Sections réseaux sociaux
3. Cliquer sur "Voir Tous les Bijoux"
4. **Résultat attendu**: Redirection vers `/bijoux`

### ✅ Test 2.2 : Catalogue bijoux
1. Aller sur `/bijoux`
2. **Vérifier**:
   - Tous les bijoux s'affichent
   - Filtres par catégorie fonctionnent
   - Recherche fonctionne
   - Tri fonctionne
3. Cliquer sur un bijou
4. **Résultat attendu**: Redirection vers `/bijoux/[id]`

### ✅ Test 2.3 : Détail bijou
1. Aller sur `/bijoux/[id]` (remplacer [id] par un ID réel)
2. **Vérifier**:
   - Image du produit
   - Informations détaillées
   - Prix et promotions
   - Boutons "Ajouter au panier" et "Ajouter aux favoris"
3. Cliquer sur "Ajouter au panier"
4. **Résultat attendu**: Produit ajouté au panier, compteur mis à jour

### ✅ Test 2.4 : Packs/Collections
1. Aller sur `/packs`
2. **Vérifier**:
   - Liste des packs s'affiche
   - Images des packs
   - Prix et descriptions
3. Cliquer sur "Voir détails"
4. **Résultat attendu**: Modal avec détails du pack

### ✅ Test 2.5 : Sur-mesure
1. Aller sur `/sur-mesure`
2. **Vérifier**: Page s'affiche correctement
3. Remplir le formulaire (si disponible)
4. **Résultat attendu**: Soumission réussie

### ✅ Test 2.6 : À propos
1. Aller sur `/a-propos`
2. **Vérifier**: Page s'affiche avec le contenu informatif

---

## 🛒 3. TESTS E-COMMERCE

### ✅ Test 3.1 : Panier d'achat
1. Ajouter un produit au panier depuis `/bijoux`
2. Aller sur `/panier`
3. **Vérifier**:
   - Produit affiché dans le panier
   - Quantité modifiable
   - Total calculé correctement
4. Modifier la quantité
5. **Résultat attendu**: Total mis à jour
6. Supprimer un article
7. **Résultat attendu**: Article retiré du panier

### ✅ Test 3.2 : Favoris
1. Ajouter un produit aux favoris depuis `/bijoux`
2. Aller sur `/favoris`
3. **Vérifier**:
   - Produit affiché dans les favoris
   - Bouton "Ajouter au panier" fonctionne
4. Retirer un favori
5. **Résultat attendu**: Produit retiré des favoris

### ✅ Test 3.3 : Checkout
1. Ajouter des produits au panier
2. Aller sur `/panier`
3. Cliquer sur "Passer la commande"
4. **Résultat attendu**: 
   - Formulaire de commande (si disponible)
   - Ou création de commande directe
   - Panier vidé après commande

---

## 👤 4. TESTS PROFIL UTILISATEUR

### ✅ Test 4.1 : Page profil
1. Se connecter
2. Aller sur `/profile`
3. **Vérifier**:
   - Informations utilisateur affichées
   - Historique des commandes (si disponible)
4. Modifier les informations (si possible)
5. **Résultat attendu**: Modifications sauvegardées

---

## 👑 5. TESTS ADMINISTRATION

### ✅ Test 5.1 : Dashboard admin
1. Se connecter avec `admin_phone` / `password`
2. Aller sur `/admin`
3. **Vérifier**:
   - Statistiques affichées (revenu, commandes, produits, utilisateurs)
   - Commandes récentes
   - Produits populaires
   - Actualisation automatique (attendre 30 secondes)
4. **Résultat attendu**: Toutes les statistiques s'affichent correctement

### ✅ Test 5.2 : Gestion produits
1. Dans `/admin`, aller sur l'onglet "Produits"
2. **Vérifier**:
   - Liste des produits affichée
   - Recherche fonctionne
3. Cliquer sur "Nouveau produit" (si disponible)
4. **Résultat attendu**: Formulaire de création

### ✅ Test 5.3 : Gestion utilisateurs
1. Dans `/admin`, aller sur l'onglet "Utilisateurs"
2. **Vérifier**:
   - Liste des utilisateurs affichée
   - Recherche fonctionne
   - Filtres par rôle fonctionnent
3. Modifier le rôle d'un utilisateur
4. **Résultat attendu**: Rôle mis à jour

### ✅ Test 5.4 : Gestion commandes
1. Dans `/admin`, aller sur l'onglet "Commandes"
2. **Vérifier**:
   - Liste des commandes affichée
   - Détails des commandes accessibles
3. Modifier le statut d'une commande
4. **Résultat attendu**: Statut mis à jour

### ✅ Test 5.5 : Gestion catégories
1. Dans `/admin`, aller sur l'onglet "Catégories"
2. **Vérifier**:
   - Liste des catégories affichée
3. Créer une nouvelle catégorie (si possible)
4. **Résultat attendu**: Catégorie créée

### ✅ Test 5.6 : Protection des routes
1. Se déconnecter
2. Essayer d'accéder à `/admin` directement
3. **Résultat attendu**: Redirection vers `/login`
4. Se connecter avec un compte utilisateur (non admin)
5. Essayer d'accéder à `/admin`
6. **Résultat attendu**: Accès refusé ou redirection

---

## 💾 6. TESTS BASE DE DONNÉES

### ✅ Test 6.1 : Affichage des données
1. Aller sur `/bijoux`
2. **Vérifier**: Les bijoux s'affichent (depuis Supabase ou données de démo)
3. Aller sur `/packs`
4. **Vérifier**: Les packs s'affichent
5. Aller sur `/` (page d'accueil)
6. **Vérifier**: Les produits vedettes s'affichent

### ✅ Test 6.2 : Création de données
1. Se connecter en admin
2. Créer un nouveau produit dans `/admin`
3. **Vérifier**: Produit créé et affiché dans `/bijoux`

---

## 🎨 7. TESTS COMPOSANTS UI

### ✅ Test 7.1 : Responsive design
1. Ouvrir l'application sur mobile (ou réduire la fenêtre)
2. **Vérifier**:
   - Menu hamburger fonctionne
   - Grilles s'adaptent
   - Images se redimensionnent
3. Tester sur tablette
4. Tester sur desktop

### ✅ Test 7.2 : Interactions
1. Tester les hover effects sur les cartes produits
2. Tester les animations
3. Tester les transitions
4. **Résultat attendu**: Toutes les interactions fonctionnent

---

## 🔌 8. TESTS API ROUTES

### ✅ Test 8.1 : Routes produits
1. Ouvrir la console du navigateur
2. Aller sur `/bijoux`
3. **Vérifier**: Pas d'erreurs dans la console
4. Vérifier les appels API dans l'onglet Network

### ✅ Test 8.2 : Routes panier
1. Ajouter un produit au panier
2. **Vérifier**: Pas d'erreurs dans la console
3. Vérifier les appels API dans l'onglet Network

---

## 📋 CHECKLIST RAPIDE

### ✅ Fonctionnalités principales
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Page d'accueil s'affiche
- [ ] Catalogue bijoux s'affiche
- [ ] Détail bijou s'affiche
- [ ] Panier fonctionne
- [ ] Favoris fonctionnent
- [ ] Dashboard admin s'affiche
- [ ] Gestion produits fonctionne
- [ ] Gestion utilisateurs fonctionne
- [ ] Gestion commandes fonctionne

### ✅ Responsive design
- [ ] Mobile fonctionne
- [ ] Tablette fonctionne
- [ ] Desktop fonctionne

### ✅ Performance
- [ ] Pages chargent rapidement
- [ ] Images se chargent correctement
- [ ] Pas d'erreurs dans la console

---

## 🐛 RAPPORT D'ERREURS

Si vous trouvez des erreurs, notez-les ici :

1. **Erreur**: 
   - **Page**: 
   - **Description**: 
   - **Screenshot**: (si possible)

2. **Erreur**: 
   - **Page**: 
   - **Description**: 

---

## ✅ RÉSULTATS

Après avoir effectué tous les tests, cochez les fonctionnalités qui fonctionnent :

- [ ] Authentification (100%)
- [ ] Pages publiques (100%)
- [ ] E-commerce (100%)
- [ ] Profil utilisateur (100%)
- [ ] Administration (100%)
- [ ] Base de données (100%)
- [ ] Composants UI (100%)
- [ ] API Routes (100%)

**Taux de réussite global**: ___%

---

**Date du test**: _______________  
**Testeur**: _______________  
**Version testée**: 1.0.0