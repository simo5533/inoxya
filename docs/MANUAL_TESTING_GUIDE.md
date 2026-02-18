# 🧪 GUIDE DE TEST MANUEL - INOXYA BIJOUX

**Date:** 2026-02-02  
**Objectif:** Tester manuellement toutes les fonctionnalités avant le déploiement

---

## 🚀 PRÉPARATION

### 1. Démarrer le Serveur

```bash
# Mode développement
npm run dev

# OU mode production (après build)
npm run build
npm run start
```

### 2. Ouvrir le Navigateur

- **URL:** http://localhost:3000
- **Ouvrir la Console DevTools** (F12)
- **Onglet Console** pour voir les erreurs
- **Onglet Network** pour voir les requêtes

---

## ✅ CHECKLIST DE TEST

### 📄 A. PAGES PUBLIQUES

#### A1. Page d'Accueil (`/`)

- [ ] **Page se charge** sans erreur
- [ ] **Aucune erreur console** (rouge)
- [ ] **Hero Banner** s'affiche avec l'image
- [ ] **Section "Bijoux Vedettes"** affiche des produits
- [ ] **Images produits** s'affichent (pas de placeholder par défaut)
- [ ] **Section Catégories** affiche les catégories
- [ ] **Section Avantages** s'affiche
- [ ] **Section Instagram** s'affiche
- [ ] **Section TikTok** s'affiche
- [ ] **Boutons de navigation** fonctionnent
- [ ] **Responsive:** Tester sur mobile (F12 → Toggle device toolbar)

**Erreurs à vérifier:**
- ❌ Erreur 404 pour les images
- ❌ Erreur dans la console
- ❌ Page blanche

#### A2. Catalogue Bijoux (`/bijoux`)

- [ ] **Page se charge** sans erreur
- [ ] **Tous les produits** s'affichent (41 produits)
- [ ] **Images produits** s'affichent
- [ ] **Filtres par catégorie** fonctionnent
- [ ] **Tri** fonctionne (prix, date, note)
- [ ] **Compteur de produits** correct
- [ ] **Clic sur un produit** redirige vers `/bijoux/[id]`
- [ ] **Bouton "Voir"** fonctionne
- [ ] **Bouton "Ajouter au panier"** fonctionne (icône panier)

**Erreurs à vérifier:**
- ❌ Produits ne s'affichent pas
- ❌ Images manquantes
- ❌ Filtres ne fonctionnent pas

#### A3. Détail Produit (`/bijoux/[id]`)

- [ ] **Page se charge** sans erreur
- [ ] **Image principale** s'affiche
- [ ] **Galerie d'images** s'affiche (si plusieurs images)
- [ ] **Nom du produit** correct
- [ ] **Prix** affiché correctement
- [ ] **Description** affichée
- [ ] **Note et avis** affichés
- [ ] **Bouton "Ajouter au panier"** fonctionne
- [ ] **Formulaire de commande** s'affiche
- [ ] **Onglets** (Description, Détails, Avis) fonctionnent
- [ ] **Produits similaires** s'affichent en bas
- [ ] **Bouton retour** fonctionne

**Erreurs à vérifier:**
- ❌ Image principale manquante
- ❌ Galerie ne fonctionne pas
- ❌ Formulaire ne soumet pas

#### A4. Page Packs (`/packs`)

- [ ] **Page se charge** sans erreur
- [ ] **Tous les packs** s'affichent (13 packs)
- [ ] **Images packs** s'affichent
- [ ] **Clic sur un pack** redirige vers `/packs/[id]`
- [ ] **Prix** affichés correctement

#### A5. Détail Pack (`/packs/[id]`)

- [ ] **Page se charge** sans erreur
- [ ] **Image du pack** s'affiche
- [ ] **Nom et description** affichés
- [ ] **Prix** affiché
- [ ] **Bouton d'achat** fonctionne

---

### 👤 B. FLUX UTILISATEUR

#### B1. Inscription (`/inscription`)

- [ ] **Page se charge** sans erreur
- [ ] **Formulaire** s'affiche
- [ ] **Champs requis:** Téléphone, Prénom, Nom, Mot de passe
- [ ] **Validation** fonctionne (champs vides, format téléphone)
- [ ] **Soumission** crée un compte
- [ ] **Message de succès** affiché
- [ ] **Redirection** vers `/profile` ou `/login`

**Test avec:**
- Téléphone: `0612345678`
- Prénom: `Test`
- Nom: `User`
- Mot de passe: `Test123!`

#### B2. Connexion (`/login`)

- [ ] **Page se charge** sans erreur
- [ ] **Formulaire** s'affiche
- [ ] **Connexion avec compte créé** fonctionne
- [ ] **Connexion admin** fonctionne:
  - Téléphone: `admin_phone`
  - Mot de passe: `Admin123!`
- [ ] **Redirection** vers `/profile` ou `/admin` (si admin)
- [ ] **Message d'erreur** si identifiants incorrects
- [ ] **Rate limiting** fonctionne (essayer 6 fois avec mauvais mot de passe)

#### B3. Profil (`/profile`)

- [ ] **Page se charge** après connexion
- [ ] **Informations utilisateur** affichées
- [ ] **Commandes** affichées (si existantes)
- [ ] **Déconnexion** fonctionne

#### B4. Panier (`/panier`)

- [ ] **Page se charge** sans erreur
- [ ] **Produits ajoutés** s'affichent
- [ ] **Quantité** modifiable
- [ ] **Suppression** fonctionne
- [ ] **Total** calculé correctement
- [ ] **Bouton "Passer commande"** fonctionne

**Test:**
1. Aller sur `/bijoux`
2. Cliquer sur l'icône panier d'un produit
3. Vérifier que le produit apparaît dans `/panier`

#### B5. Favoris (`/favoris`)

- [ ] **Page se charge** sans erreur
- [ ] **Produits favoris** s'affichent
- [ ] **Ajout aux favoris** fonctionne (icône cœur)
- [ ] **Retrait des favoris** fonctionne

**Test:**
1. Aller sur `/bijoux`
2. Cliquer sur l'icône cœur d'un produit
3. Vérifier que le produit apparaît dans `/favoris`

#### B6. Checkout (`/panier/checkout`)

- [ ] **Page se charge** sans erreur
- [ ] **Récapitulatif** affiche les produits
- [ ] **Formulaire** s'affiche (nom, adresse, téléphone)
- [ ] **Validation** fonctionne
- [ ] **Soumission** crée une commande
- [ ] **Message de succès** affiché
- [ ] **Redirection** appropriée

---

### 🔐 C. FLUX ADMIN

#### C1. Connexion Admin

- [ ] **Connexion avec compte admin** fonctionne
- [ ] **Redirection** vers `/admin` après connexion
- [ ] **Utilisateur non-admin** ne peut pas accéder à `/admin`

**Compte admin:**
- Téléphone: `admin_phone`
- Mot de passe: `Admin123!`

#### C2. Dashboard Admin (`/admin`)

- [ ] **Page se charge** sans erreur
- [ ] **Statistiques** affichées (produits, packs, commandes, etc.)
- [ ] **Navigation admin** fonctionne
- [ ] **Aucune erreur console**

#### C3. Gestion Produits (`/admin/products`)

- [ ] **Liste des produits** s'affiche
- [ ] **Créer un produit** fonctionne
- [ ] **Modifier un produit** fonctionne
- [ ] **Supprimer un produit** fonctionne
- [ ] **Upload d'image** fonctionne

**Test CRUD:**
1. Créer un produit test
2. Modifier le produit
3. Vérifier les modifications
4. Supprimer le produit

#### C4. Gestion Packs (`/admin/packs`)

- [ ] **Liste des packs** s'affiche
- [ ] **Créer un pack** fonctionne
- [ ] **Modifier un pack** fonctionne
- [ ] **Supprimer un pack** fonctionne

#### C5. Gestion Commandes (`/admin/orders`)

- [ ] **Liste des commandes** s'affiche
- [ ] **Détails d'une commande** accessibles
- [ ] **Changement de statut** fonctionne

#### C6. Gestion Utilisateurs (`/admin/users`)

- [ ] **Liste des utilisateurs** s'affiche
- [ ] **Changement de rôle** fonctionne

#### C7. Protection Admin

- [ ] **Utilisateur non-admin** ne peut pas accéder à `/admin`
- [ ] **Redirection** vers `/login` ou `/profile`
- [ ] **Message d'erreur** approprié (403)

**Test:**
1. Se connecter avec un compte non-admin
2. Essayer d'accéder à `/admin`
3. Vérifier la redirection

---

### 🌐 D. API ROUTES

#### D1. API Produits

- [ ] **`GET /api/products`** retourne les produits
- [ ] **`POST /api/products`** crée un produit (admin requis)
- [ ] **`PUT /api/products/[id]`** modifie un produit (admin requis)
- [ ] **Validation Zod** fonctionne (données invalides rejetées)

**Test avec curl ou Postman:**
```bash
# GET produits
curl http://localhost:3000/api/products

# POST produit (nécessite auth admin)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100,"category":"bagues"}'
```

#### D2. API Packs

- [ ] **`GET /api/packs`** retourne les packs
- [ ] **`POST /api/admin/packs`** crée un pack (admin requis)
- [ ] **`PUT /api/admin/packs/[id]`** modifie un pack (admin requis)

#### D3. API Auth

- [ ] **`POST /api/auth/login`** authentifie correctement
- [ ] **`POST /api/auth/register`** crée un compte
- [ ] **`GET /api/auth/me`** retourne l'utilisateur actuel
- [ ] **Rate limiting** fonctionne sur `/api/auth/login`

#### D4. API Cart

- [ ] **`POST /api/cart`** ajoute au panier
- [ ] **`PUT /api/cart`** modifie la quantité
- [ ] **`DELETE /api/cart`** retire du panier

#### D5. API Favorites

- [ ] **`POST /api/favorites`** ajoute aux favoris
- [ ] **`DELETE /api/favorites`** retire des favoris

#### D6. API Checkout

- [ ] **`POST /api/checkout`** crée une commande
- [ ] **Rate limiting** fonctionne

---

### 📱 E. RESPONSIVE DESIGN

#### E1. Mobile (< 768px)

- [ ] **Page d'accueil** s'affiche correctement
- [ ] **Navigation mobile** fonctionne (menu hamburger)
- [ ] **Images** s'adaptent à la largeur
- [ ] **Formulaires** utilisables
- [ ] **Boutons** accessibles

#### E2. Tablet (768px - 1024px)

- [ ] **Layout** adapté
- [ ] **Grille produits** s'adapte

#### E3. Desktop (> 1024px)

- [ ] **Layout optimal**
- [ ] **Navigation complète** visible

---

### 🔍 F. SEO ET MÉTADONNÉES

#### F1. Métadonnées

- [ ] **View Source** sur la page d'accueil montre les meta tags
- [ ] **Title** présent et correct
- [ ] **Description** présente
- [ ] **Open Graph** tags présents
- [ ] **Twitter Cards** tags présents

**Vérification:**
1. Clic droit → "Afficher le code source"
2. Chercher `<title>`, `<meta name="description">`, `<meta property="og:">`

#### F2. Sitemap

- [ ] **`/sitemap.xml`** accessible
- [ ] **Contient** les pages statiques et dynamiques
- [ ] **Format XML** valide

**Test:**
- Ouvrir http://localhost:3000/sitemap.xml

#### F3. Robots.txt

- [ ] **`/robots.txt`** accessible
- [ ] **Exclut** `/admin/` et `/api/`
- [ ] **Référence** le sitemap

**Test:**
- Ouvrir http://localhost:3000/robots.txt

#### F4. JSON-LD Schema

- [ ] **View Source** montre les scripts JSON-LD
- [ ] **Organization schema** présent dans le layout
- [ ] **Product schema** présent sur les pages produits

**Vérification:**
1. View Source
2. Chercher `<script type="application/ld+json">`

---

### 🖼️ G. IMAGES

#### G1. Affichage

- [ ] **Toutes les images produits** s'affichent
- [ ] **Toutes les images packs** s'affichent
- [ ] **Placeholder** s'affiche si image manquante
- [ ] **Pas d'icône cassée** (image 404)

#### G2. Optimisation

- [ ] **Images chargées** en format WebP/AVIF (vérifier Network)
- [ ] **Lazy loading** fonctionne (images chargées au scroll)
- [ ] **Pas de CLS** (pas de saut de layout)

---

### 🔒 H. SÉCURITÉ

#### H1. Cookies

- [ ] **Cookies** présents dans DevTools → Application → Cookies
- [ ] **`auth_token`** a `httpOnly: true` (vérifier dans Network → Headers)
- [ ] **`secure`** activé en production (HTTPS)

#### H2. Headers de Sécurité

- [ ] **Network → Headers** montre les headers de sécurité
- [ ] **CSP** présent
- [ ] **HSTS** présent (en production)
- [ ] **X-Frame-Options** présent

**Vérification:**
1. DevTools → Network
2. Recharger la page
3. Cliquer sur la requête principale
4. Onglet "Headers" → "Response Headers"

#### H3. Protection Routes Admin

- [ ] **Accès direct** à `/admin` sans auth → redirection
- [ ] **API admin** sans auth → 401/403

---

## 📊 RAPPORT DE TEST

### Résultats

**Date:** ______________  
**Testeur:** ______________  
**Environnement:** Development / Production

**Pages Publiques:**
- Page d'accueil: [ ] PASS [ ] FAIL
- Catalogue bijoux: [ ] PASS [ ] FAIL
- Détail produit: [ ] PASS [ ] FAIL
- Page packs: [ ] PASS [ ] FAIL

**Flux Utilisateur:**
- Inscription: [ ] PASS [ ] FAIL
- Connexion: [ ] PASS [ ] FAIL
- Panier: [ ] PASS [ ] FAIL
- Favoris: [ ] PASS [ ] FAIL
- Checkout: [ ] PASS [ ] FAIL

**Flux Admin:**
- Dashboard: [ ] PASS [ ] FAIL
- CRUD Produits: [ ] PASS [ ] FAIL
- CRUD Packs: [ ] PASS [ ] FAIL
- Protection: [ ] PASS [ ] FAIL

**Responsive:**
- Mobile: [ ] PASS [ ] FAIL
- Tablet: [ ] PASS [ ] FAIL
- Desktop: [ ] PASS [ ] FAIL

**SEO:**
- Métadonnées: [ ] PASS [ ] FAIL
- Sitemap: [ ] PASS [ ] FAIL
- Robots.txt: [ ] PASS [ ] FAIL

**Sécurité:**
- Cookies: [ ] PASS [ ] FAIL
- Headers: [ ] PASS [ ] FAIL
- Protection admin: [ ] PASS [ ] FAIL

### Erreurs Trouvées

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Notes

_________________________________________________
_________________________________________________

---

## 🆘 EN CAS DE PROBLÈME

### Page Blanche

1. Vérifier la console (F12)
2. Vérifier les logs serveur
3. Vérifier les variables d'environnement
4. Vérifier la connexion à la base de données

### Images Ne S'Affichent Pas

1. Vérifier que les fichiers existent dans `public/images/`
2. Exécuter `npm run verify:images`
3. Vérifier les chemins dans la base de données

### Erreur API

1. Vérifier la console (erreurs réseau)
2. Vérifier les logs serveur
3. Vérifier l'authentification (si route protégée)
4. Vérifier la validation (données correctes)

---

**Dernière mise à jour:** 2026-02-02

