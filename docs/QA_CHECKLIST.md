# ✅ CHECKLIST QA - INOXYA BIJOUX

**Date:** 2025-02-14  
**À utiliser avant chaque déploiement**

---

## 🏠 PAGES PUBLIQUES

### Homepage (`/`)

- [ ] Page se charge sans erreur
- [ ] Hero banner s'affiche
- [ ] Section "Bijoux Vedettes" affiche des produits (ou message vide si aucun)
- [ ] Section "Notre Collection" affiche les catégories avec images
- [ ] Bouton "Voir Tous les Bijoux" fonctionne
- [ ] Section "Pourquoi Choisir INOXYA" s'affiche
- [ ] Sections Instagram/TikTok s'affichent
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Aucune erreur console

### Collection (`/bijoux`)

- [ ] Page se charge sans erreur
- [ ] Tous les produits s'affichent
- [ ] Filtre par catégorie fonctionne (chaque catégorie)
- [ ] Tri fonctionne (prix, date, note)
- [ ] Message "Aucun bijou trouvé" s'affiche uniquement si vraiment vide
- [ ] Bouton "Voir tous les bijoux" dans message vide fonctionne
- [ ] Images produits s'affichent correctement
- [ ] Responsive
- [ ] Aucune erreur console

### Détails Produit (`/bijoux/[id]`)

- [ ] Page se charge sans erreur
- [ ] Image principale s'affiche
- [ ] Galerie d'images fonctionne (si plusieurs images)
- [ ] Nom, prix, description s'affichent
- [ ] Bouton "Ajouter au panier" fonctionne
- [ ] Bouton "Ajouter aux favoris" fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Packs (`/packs`)

- [ ] Page se charge sans erreur
- [ ] Tous les packs s'affichent
- [ ] Images packs s'affichent correctement
- [ ] Prix et descriptions s'affichent
- [ ] Bouton "Voir le pack" fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Détails Pack (`/packs/[id]`)

- [ ] Page se charge sans erreur
- [ ] Image pack s'affiche
- [ ] Composition du pack s'affiche
- [ ] Prix s'affiche
- [ ] Bouton "Ajouter au panier" fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Panier (`/panier`)

- [ ] Page se charge sans erreur
- [ ] Produits dans le panier s'affichent
- [ ] Quantités modifiables
- [ ] Bouton "Retirer" fonctionne
- [ ] Total calculé correctement
- [ ] Bouton "Passer commande" fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Checkout (`/panier/checkout`)

- [ ] Page se charge sans erreur
- [ ] Formulaire de commande s'affiche
- [ ] Validation des champs fonctionne
- [ ] Soumission fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### À Propos (`/a-propos`)

- [ ] Page se charge sans erreur
- [ ] Hero section s'affiche
- [ ] Toutes les sections s'affichent
- [ ] Images s'affichent
- [ ] Boutons CTA fonctionnent
- [ ] Responsive
- [ ] Aucune erreur console

### FAQ (`/faq`)

- [ ] Page se charge sans erreur
- [ ] Recherche FAQ fonctionne
- [ ] Filtres par catégorie fonctionnent
- [ ] Accordéon s'ouvre/ferme correctement
- [ ] Animations fluides (pas de lag)
- [ ] Responsive
- [ ] Aucune erreur console

---

## 🔐 AUTHENTIFICATION

### Connexion (`/login`)

- [ ] Page se charge sans erreur
- [ ] Formulaire s'affiche
- [ ] Validation fonctionne
- [ ] Connexion avec identifiants valides fonctionne
- [ ] Message d'erreur avec identifiants invalides
- [ ] Redirection après connexion
- [ ] Responsive
- [ ] Aucune erreur console

### Inscription (`/inscription`)

- [ ] Page se charge sans erreur
- [ ] Formulaire s'affiche
- [ ] Validation fonctionne
- [ ] Inscription fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

---

## 👨‍💼 INTERFACE ADMIN

### Dashboard (`/admin`)

- [ ] Page se charge sans erreur
- [ ] Redirection si non connecté
- [ ] Statistiques s'affichent
- [ ] Graphiques s'affichent (si présents)
- [ ] Responsive
- [ ] Aucune erreur console

### Produits (`/admin/produits`)

- [ ] Page se charge sans erreur
- [ ] Liste des produits s'affiche
- [ ] Bouton "Nouveau produit" fonctionne
- [ ] Formulaire création fonctionne
- [ ] Upload d'images fonctionne
- [ ] Édition produit fonctionne
- [ ] Suppression produit fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Packs (`/admin/packs`)

- [ ] Page se charge sans erreur
- [ ] Liste des packs s'affiche
- [ ] Création pack fonctionne
- [ ] Édition pack fonctionne
- [ ] Suppression pack fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Commandes (`/admin/orders`)

- [ ] Page se charge sans erreur
- [ ] Liste des commandes s'affiche
- [ ] Détails commande fonctionnent
- [ ] Modification statut fonctionne
- [ ] Export fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

### Utilisateurs (`/admin/users`)

- [ ] Page se charge sans erreur
- [ ] Liste des utilisateurs s'affiche
- [ ] Modification rôle fonctionne
- [ ] Responsive
- [ ] Aucune erreur console

---

## 🔌 API ENDPOINTS

### Produits

- [ ] `GET /api/products` retourne des produits
- [ ] `GET /api/products?category=bagues` filtre correctement
- [ ] `POST /api/products` crée un produit (admin)
- [ ] `GET /api/products/[id]` retourne un produit
- [ ] `PUT /api/products/[id]` modifie un produit (admin)
- [ ] `DELETE /api/products/[id]` supprime un produit (admin)

### Packs

- [ ] `GET /api/packs` retourne des packs
- [ ] `POST /api/packs` crée un pack (admin)
- [ ] `GET /api/packs/[id]` retourne un pack

### Catégories

- [ ] `GET /api/categories` retourne les catégories

### Authentification

- [ ] `POST /api/auth/login` fonctionne
- [ ] `POST /api/auth/register` fonctionne
- [ ] `GET /api/auth/me` retourne l'utilisateur connecté

---

## 🖼️ IMAGES

- [ ] Toutes les images produits s'affichent
- [ ] Toutes les images packs s'affichent
- [ ] Images catégories s'affichent
- [ ] Pas de placeholder pour les vrais produits
- [ ] Images optimisées (WebP/AVIF)
- [ ] Lazy loading fonctionne

---

## 📱 RESPONSIVE

- [ ] Mobile (< 768px) - Toutes les pages
- [ ] Tablet (768px - 1024px) - Toutes les pages
- [ ] Desktop (> 1024px) - Toutes les pages
- [ ] Navigation mobile fonctionne
- [ ] Menus déroulants fonctionnent

---

## ♿ ACCESSIBILITÉ

- [ ] Contraste texte suffisant
- [ ] Focus visible sur les boutons
- [ ] Alt text sur les images
- [ ] Navigation au clavier fonctionne
- [ ] Screen reader compatible (basique)

---

## 🚀 PERFORMANCE

- [ ] Page load < 3s (Lighthouse)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Pas de layout shift (CLS < 0.1)
- [ ] Images optimisées
- [ ] Code splitting fonctionne

---

## 🔒 SÉCURITÉ

- [ ] HTTPS activé (production)
- [ ] Headers de sécurité présents
- [ ] CSRF protection fonctionne
- [ ] Rate limiting fonctionne
- [ ] Validation des inputs fonctionne
- [ ] Pas de données sensibles dans les logs

---

## 📊 CONSOLE & ERREURS

- [ ] Aucune erreur console (client)
- [ ] Aucune erreur serveur (logs)
- [ ] Aucun warning critique
- [ ] Pas de 404 pour les assets
- [ ] Pas de CORS errors

---

## ✅ VALIDATION FINALE

- [ ] `npm run build` passe sans erreur
- [ ] `npm run verify:all` passe sans erreur
- [ ] `npm run smoke:test` passe sans erreur
- [ ] Toutes les pages critiques testées
- [ ] Tous les boutons critiques testés
- [ ] Aucun contenu demo visible

---

**Date de validation:** _______________  
**Validé par:** _______________  
**Notes:** _______________

