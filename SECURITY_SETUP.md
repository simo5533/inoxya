# Configuration de Sécurité - INOXYA BIJOUX

## 🔐 Améliorations de Sécurité Implémentées

### 1. Hachage Sécurisé des Mots de Passe
- **bcrypt** avec 12 rounds de salage
- Mots de passe hachés avant stockage en base
- Vérification sécurisée lors de la connexion

### 2. Système de Sessions JWT
- **Tokens JWT** signés et sécurisés
- Expiration automatique (7 jours)
- Cookies httpOnly et sécurisés
- Validation côté serveur

### 3. Validation des Données
- Validation des numéros de téléphone marocains
- Validation des mots de passe (complexité requise)
- Sanitisation des entrées utilisateur

### 4. Logging de Sécurité
- Logs des tentatives de connexion
- Suivi des échecs d'authentification
- Monitoring des accès

## 🚀 Configuration Requise

### Variables d'Environnement
Créez un fichier `.env.local` avec :

```env
# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Configuration de sécurité (OBLIGATOIRE)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Environnement
NODE_ENV=production
```

### Génération d'une Clé JWT Sécurisée
```bash
# Générer une clé JWT aléatoire
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔑 Comptes de Test Sécurisés

### Comptes Administrateur
- **Téléphone**: `admin_phone`
- **Mot de passe**: `Admin123!`
- **Rôle**: Admin

### Comptes Modérateur
- **Téléphone**: `0698765432`
- **Mot de passe**: `Admin123!`
- **Rôle**: Modérateur

### Comptes Utilisateur
- **Téléphone**: `0612345678`
- **Mot de passe**: `Admin123!`
- **Rôle**: Utilisateur

## 📋 Règles de Validation des Mots de Passe

Les mots de passe doivent contenir :
- ✅ Au moins 8 caractères
- ✅ Au moins une majuscule
- ✅ Au moins une minuscule
- ✅ Au moins un chiffre
- ✅ Au moins un caractère spécial

## 🔒 Sécurité des Cookies

- **httpOnly**: Empêche l'accès JavaScript
- **secure**: HTTPS uniquement en production
- **sameSite**: Protection CSRF
- **Expiration**: 7 jours maximum

## 🛡️ Protection des Routes

- Vérification des rôles utilisateur
- Middleware d'authentification
- Protection des routes admin
- Validation des permissions

## 📊 Monitoring et Logs

### Logs de Sécurité
- Tentatives de connexion (succès/échec)
- Changements de rôles
- Accès aux routes protégées
- Erreurs d'authentification

### Recommandations de Production
1. **Rate Limiting**: Limiter les tentatives de connexion
2. **2FA**: Authentification à deux facteurs
3. **Monitoring**: Intégration Sentry/LogRocket
4. **Backup**: Sauvegarde régulière des données
5. **SSL**: Certificat SSL obligatoire

## 🚨 Actions de Sécurité

### En cas de Compromission
1. Invalider toutes les sessions
2. Forcer le changement des mots de passe
3. Analyser les logs de sécurité
4. Mettre à jour les clés JWT

### Maintenance Régulière
- Rotation des clés JWT (trimestrielle)
- Audit des logs de sécurité
- Mise à jour des dépendances
- Test des sauvegardes

## 📞 Support Sécurité

Pour toute question de sécurité :
- Email: security@inoxya-bijoux.com
- Documentation: [Lien vers la documentation]
- Urgences: [Numéro d'urgence]

---

**⚠️ IMPORTANT**: Ne jamais commiter les clés de sécurité dans le code source !
