# ✅ CHECKLIST PRÉ-DÉPLOIEMENT - INOXYA BIJOUX

**Date:** 2025-01-27  
**Utilisez cette checklist avant chaque déploiement en production**

---

## 🔧 1. CONFIGURATION

### Variables d'Environnement
- [ ] `JWT_SECRET` configuré (64 caractères minimum)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_SITE_URL` configuré avec votre domaine
- [ ] `DATABASE_URL` configuré (PostgreSQL pour production)
- [ ] `SMTP_*` configurés (si emails activés)
- [ ] Toutes les variables sont dans `.env.local` (local) et sur la plateforme (production)

### Base de Données
- [ ] PostgreSQL configuré (pas SQLite en production)
- [ ] Connexion testée et fonctionnelle
- [ ] Tables créées et initialisées
- [ ] Compte admin créé
- [ ] Sauvegardes configurées

### Configuration Next.js
- [ ] `next.config.mjs` vérifié
- [ ] Headers de sécurité configurés
- [ ] Optimisations d'images activées
- [ ] Build de production testé

---

## 🧪 2. TESTS

### Tests Automatisés
- [ ] `npm run build` réussit sans erreurs
- [ ] `node scripts/test-complete-crud.js` → 15/15 tests passés
- [ ] `node scripts/test-all-apis.js` → Tous les tests passent

### Tests Manuels - Interface Admin
- [ ] Connexion admin fonctionne
- [ ] Dashboard s'affiche correctement
- [ ] Liste des produits s'affiche
- [ ] Création de produit fonctionne
- [ ] Modification de produit fonctionne
- [ ] Suppression de produit fonctionne
- [ ] Liste des commandes s'affiche
- [ ] Détails d'une commande s'affichent
- [ ] Modification du statut de commande fonctionne
- [ ] Liste des paiements s'affiche
- [ ] Modification du statut de paiement fonctionne
- [ ] Notifications s'affichent

### Tests Manuels - Frontend
- [ ] Page d'accueil charge correctement
- [ ] Produits s'affichent
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent
- [ ] Détails d'un produit s'affichent
- [ ] Ajout au panier fonctionne
- [ ] Panier s'affiche correctement
- [ ] Checkout fonctionne
- [ ] Commande créée avec succès
- [ ] Confirmation de commande affichée

### Tests Manuels - Flux Complet
- [ ] Ajouter produit au panier
- [ ] Aller au checkout
- [ ] Remplir le formulaire
- [ ] Valider la commande
- [ ] Vérifier que la commande apparaît dans `/admin/orders`
- [ ] Vérifier que le paiement apparaît dans `/admin/payments`
- [ ] Vérifier que la notification apparaît dans `/admin/notifications`
- [ ] Modifier le statut de la commande
- [ ] Vérifier que le statut est mis à jour

---

## 🔒 3. SÉCURITÉ

### Authentification
- [ ] Protection admin active sur toutes les routes sensibles
- [ ] Cookies httpOnly et sécurisés
- [ ] Sessions fonctionnent correctement
- [ ] Déconnexion fonctionne

### Validation
- [ ] Toutes les entrées utilisateur sont validées
- [ ] Toutes les entrées utilisateur sont sanitizées
- [ ] IDs validés avec `validateNumericId()`
- [ ] Prix vérifiés depuis la BDD (pas le client)
- [ ] Formats téléphone validés

### Protection
- [ ] Rate limiting actif sur login et checkout
- [ ] Headers de sécurité configurés
- [ ] Protection SQL injection (requêtes préparées)
- [ ] Protection XSS (sanitization)
- [ ] HTTPS activé en production

---

## 📊 4. DONNÉES

### Base de Données
- [ ] Tables créées
- [ ] Relations (foreign keys) configurées
- [ ] Index créés (si nécessaire)
- [ ] Données de test présentes (ou base vide prête)

### Enregistrement
- [ ] Commandes s'enregistrent correctement
- [ ] Paiements s'enregistrent correctement
- [ ] Notifications s'enregistrent correctement
- [ ] Produits s'enregistrent correctement
- [ ] Toutes les données sont visibles dans l'admin

---

## 🚀 5. DÉPLOIEMENT

### Préparation
- [ ] Code commité et pushé sur Git
- [ ] Variables d'environnement configurées sur la plateforme
- [ ] Base de données accessible depuis la plateforme
- [ ] Domaine configuré (si applicable)

### Déploiement
- [ ] Build de production réussi
- [ ] Déploiement réussi
- [ ] Site accessible
- [ ] HTTPS activé

### Post-Déploiement
- [ ] Site accessible sur le domaine
- [ ] Connexion admin fonctionne
- [ ] Toutes les fonctionnalités testées
- [ ] Performance acceptable (< 3s chargement)
- [ ] Aucune erreur dans les logs

---

## 📝 6. DOCUMENTATION

- [ ] README.md à jour
- [ ] Guide de déploiement à jour
- [ ] Identifiants admin documentés
- [ ] Variables d'environnement documentées

---

## ✅ VALIDATION FINALE

### Avant de marquer comme "Prêt pour Production"
- [ ] Tous les tests passent
- [ ] Toutes les fonctionnalités fonctionnent
- [ ] Sécurité vérifiée
- [ ] Performance acceptable
- [ ] Documentation à jour
- [ ] Variables d'environnement configurées
- [ ] Base de données configurée

---

## 🎯 RÉSUMÉ

**Total de vérifications:** 60+  
**Statut:** [ ] Prêt pour Production | [ ] En cours | [ ] Bloqué

**Notes:**
```
[Vos notes ici]
```

---

**Date de validation:** _______________  
**Validé par:** _______________

---

**⚠️ IMPORTANT:** Ne déployez JAMAIS en production si cette checklist n'est pas complète à 100% !

