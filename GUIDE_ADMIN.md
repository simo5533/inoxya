# 🔐 Guide d'accès Admin - INOXYA Bijoux

## Connexion Admin

### Identifiants Admin
- **Téléphone** : `admin_phone`
- **Mot de passe** : `Admin123!`

### Étapes de connexion
1. Allez sur `http://localhost:3000/login`
2. Entrez le téléphone : `admin_phone`
3. Entrez le mot de passe : `Admin123!`
4. Cliquez sur "Se connecter"
5. Vous serez automatiquement redirigé vers `/admin`

## Fonctionnalités Admin Disponibles

### 📊 Tableau de Bord
- Statistiques générales (bijoux, utilisateurs, revenus)
- Commandes récentes
- Produits populaires
- Graphiques de performance

### 🛍️ Gestion des Produits
- Ajouter/modifier/supprimer des bijoux
- Gestion des images
- Catégorisation des produits
- Gestion des stocks

### 📂 Gestion des Catégories
- Créer/modifier des catégories
- Activer/désactiver des catégories
- Noms en français et arabe

### 👥 Gestion des Utilisateurs
- Voir tous les utilisateurs
- Modifier les rôles (user/moderator/admin)
- Gestion des permissions

### 🛒 Gestion des Commandes
- Voir toutes les commandes
- Changer le statut des commandes
- Détails des commandes

### 💳 Gestion des Paiements
- Suivi des paiements
- Changer le statut des paiements
- Statistiques financières

### 🔒 Sécurité
- Informations de sécurité
- Logs d'authentification
- Paramètres de sécurité

## Autres Utilisateurs de Test

### Modérateur
- **Téléphone** : `0698765432`
- **Mot de passe** : `User123!`
- **Accès** : Limité (pas admin)

### Utilisateur Standard
- **Téléphone** : `0612345678`
- **Mot de passe** : `Moderator123!`
- **Accès** : Standard (pas admin)

## Sécurité
- Les mots de passe sont hachés avec bcrypt
- Sessions sécurisées avec cookies httpOnly
- Validation des permissions par rôle
- Logs d'authentification

## Support
En cas de problème, vérifiez :
1. Que le serveur Next.js fonctionne (`npm run dev`)
2. Que vous utilisez les bons identifiants
3. Que l'URL est correcte (`http://localhost:3000`)
