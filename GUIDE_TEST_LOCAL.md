# 🧪 GUIDE DE TEST LOCAL - INOXYA BIJOUX

**Date** : 2025-01-27

---

## 🚀 SERVEUR DÉMARRÉ

Le serveur de développement est maintenant en cours d'exécution.

### Accès
- **URL** : http://localhost:3000
- **Mode** : Développement (hot reload activé)

---

## ✅ PAGES À TESTER

### Pages Publiques

1. **Accueil**
   - URL : http://localhost:3000
   - Vérifier : Affichage correct, images chargent

2. **Catalogue Produits**
   - URL : http://localhost:3000/bijoux
   - Vérifier : Liste des produits, filtres fonctionnent

3. **Page Produit**
   - URL : http://localhost:3000/bijoux/[id]
   - Vérifier : Détails produit, galerie d'images

4. **Packs**
   - URL : http://localhost:3000/packs
   - Vérifier : Liste des packs, images chargent

5. **Panier**
   - URL : http://localhost:3000/panier
   - Vérifier : Ajout/suppression produits

6. **Favoris**
   - URL : http://localhost:3000/favoris
   - Vérifier : Ajout/suppression favoris

### Pages Admin (nécessite authentification)

1. **Login Admin**
   - URL : http://localhost:3000/login
   - Identifiants de test (si configurés) :
     - Phone : `admin_phone` ou `0612345678`
     - Password : `password` ou `Admin123!`

2. **Dashboard Admin**
   - URL : http://localhost:3000/admin
   - Vérifier : Statistiques, commandes récentes

3. **Gestion Produits**
   - URL : http://localhost:3000/admin/produits
   - Vérifier : Liste, création, modification, suppression

4. **Gestion Packs**
   - URL : http://localhost:3000/admin/packs
   - Vérifier : Liste, création, modification, suppression

5. **Commandes**
   - URL : http://localhost:3000/admin/orders
   - Vérifier : Liste, détails, modification statut

---

## 🔌 API ROUTES À TESTER

### Routes Publiques

```bash
# Liste produits
curl http://localhost:3000/api/products

# Détails produit
curl http://localhost:3000/api/products/[id]

# Liste packs
curl http://localhost:3000/api/packs

# Catégories
curl http://localhost:3000/api/categories
```

### Routes Authentifiées (nécessite cookie)

```bash
# Login (obtenir cookie)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"admin_phone","password":"password"}'

# Stats admin (avec cookie)
curl http://localhost:3000/api/admin/stats \
  -H "Cookie: user_id=1"
```

---

## ✅ CHECKLIST DE TEST

### Fonctionnalités E-commerce
- [ ] Accueil s'affiche correctement
- [ ] Catalogue produits fonctionne
- [ ] Filtres par catégorie fonctionnent
- [ ] Page détail produit fonctionne
- [ ] Ajout au panier fonctionne
- [ ] Panier persiste (refresh page)
- [ ] Favoris fonctionnent
- [ ] Checkout fonctionne (test complet)

### Fonctionnalités Admin
- [ ] Login admin fonctionne
- [ ] Dashboard s'affiche
- [ ] Gestion produits fonctionne (CRUD)
- [ ] Gestion packs fonctionne (CRUD)
- [ ] Gestion commandes fonctionne
- [ ] Modification statut commande fonctionne

### API
- [ ] Routes publiques répondent
- [ ] Routes admin protégées (403 si non authentifié)
- [ ] CSRF fonctionne (erreur si token manquant)
- [ ] Timeouts fonctionnent (routes longues)

### Sécurité
- [ ] Cookies httpOnly fonctionnent
- [ ] CSRF protège les routes POST/PUT/DELETE
- [ ] Messages d'erreur clairs (401, 403)
- [ ] Headers de sécurité présents

---

## 🐛 DÉPANNAGE

### Le serveur ne démarre pas
```bash
# Vérifier les ports
netstat -ano | findstr :3000

# Arrêter les processus Node.js
taskkill /F /IM node.exe

# Redémarrer
npm run dev
```

### Erreurs de base de données
```bash
# Vérifier la connexion SQLite
npm run verify:sqlite

# Vérifier PostgreSQL (si configuré)
npm run db:verify
```

### Erreurs de build
```bash
# Nettoyer et reconstruire
rm -rf .next
npm run build
```

---

## 📊 CONSOLE DU NAVIGATEUR

Ouvrez la console du navigateur (F12) pour vérifier :
- ✅ Pas d'erreurs JavaScript
- ✅ Requêtes API réussies
- ✅ Images chargent correctement

---

## 🔍 LOGS SERVEUR

Les logs du serveur s'affichent dans le terminal où `npm run dev` a été lancé.

Vérifier :
- ✅ Pas d'erreurs critiques
- ✅ Routes accessibles
- ✅ Base de données connectée

---

## 🎯 TESTS RECOMMANDÉS

### Test Complet E-commerce
1. Parcourir le catalogue
2. Filtrer par catégorie
3. Voir un produit
4. Ajouter au panier
5. Voir le panier
6. Ajouter aux favoris
7. Tester le checkout (sans finaliser)

### Test Complet Admin
1. Se connecter en admin
2. Voir le dashboard
3. Créer un produit
4. Modifier un produit
5. Supprimer un produit
6. Voir les commandes
7. Modifier le statut d'une commande

---

## ✅ RÉSULTAT ATTENDU

Toutes les fonctionnalités doivent fonctionner sans erreurs :
- ✅ Pages s'affichent correctement
- ✅ API répondent rapidement
- ✅ Authentification fonctionne
- ✅ Pas d'erreurs dans la console
- ✅ Images chargent

---

**Bon test ! 🚀**

