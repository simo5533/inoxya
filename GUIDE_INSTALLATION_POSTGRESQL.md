# 🐘 GUIDE D'INSTALLATION POSTGRESQL - INOXYA BIJOUX

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
- Windows 10/11
- Droits administrateur
- Connexion internet

## 🚀 Installation de PostgreSQL

### Étape 1: Téléchargement
1. Allez sur https://www.postgresql.org/download/windows/
2. Cliquez sur "Download the installer"
3. Téléchargez la version la plus récente (PostgreSQL 15+)

### Étape 2: Installation
1. Exécutez le fichier téléchargé en tant qu'administrateur
2. Suivez l'assistant d'installation :
   - **Port**: 5432 (par défaut)
   - **Mot de passe superutilisateur**: Choisissez un mot de passe fort (ex: `postgres123`)
   - **Locale**: French, France
   - **Composants**: Laissez tout coché

### Étape 3: Configuration
1. L'installation créera automatiquement :
   - Un utilisateur `postgres` (superutilisateur)
   - Un service PostgreSQL
   - L'outil pgAdmin (interface graphique)

## 🗄️ Création de la Base de Données

### Méthode 1: Via pgAdmin (Interface Graphique)
1. Ouvrez pgAdmin depuis le menu Démarrer
2. Connectez-vous avec :
   - **Serveur**: localhost
   - **Utilisateur**: postgres
   - **Mot de passe**: [votre mot de passe]
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom: `inoxya_bijoux`
5. Clic droit sur "Login/Group Roles" → "Create" → "Login/Group Role"
6. Nom: `inoxya_user`
7. Mot de passe: `inoxya_password_2024`
8. Onglet "Privileges" → Cochez "Can login?"
9. Clic droit sur la base `inoxya_bijoux` → "Properties" → "Security"
10. Ajoutez l'utilisateur `inoxya_user` avec tous les privilèges

### Méthode 2: Via psql (Ligne de Commande)
1. Ouvrez l'invite de commande en tant qu'administrateur
2. Naviguez vers le dossier PostgreSQL :
   ```cmd
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```
3. Connectez-vous en tant que postgres :
   ```cmd
   psql -U postgres
   ```
4. Entrez votre mot de passe postgres
5. Exécutez les commandes suivantes :
   ```sql
   CREATE DATABASE inoxya_bijoux;
   CREATE USER inoxya_user WITH PASSWORD 'inoxya_password_2024';
   GRANT ALL PRIVILEGES ON DATABASE inoxya_bijoux TO inoxya_user;
   \q
   ```

## 🔧 Vérification de l'Installation

### Test de Connexion
1. Ouvrez l'invite de commande
2. Naviguez vers le dossier PostgreSQL :
   ```cmd
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```
3. Testez la connexion :
   ```cmd
   psql -U inoxya_user -d inoxya_bijoux -h localhost
   ```
4. Entrez le mot de passe : `inoxya_password_2024`
5. Vous devriez voir : `inoxya_bijoux=>`

### Test via l'Application
1. Assurez-vous que le fichier `.env.local` contient :
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=inoxya_bijoux
   DB_USER=inoxya_user
   DB_PASSWORD=inoxya_password_2024
   ```
2. Exécutez le test :
   ```cmd
   node scripts/test-postgresql-connection.js
   ```

## 🚨 Dépannage

### Erreur: "Service PostgreSQL non démarré"
```cmd
# Démarrer le service
net start postgresql-x64-15
```

### Erreur: "Port 5432 déjà utilisé"
1. Ouvrez le Gestionnaire des tâches
2. Recherchez les processus utilisant le port 5432
3. Arrêtez-les ou changez le port dans la configuration

### Erreur: "Authentification échouée"
1. Vérifiez le fichier `pg_hba.conf`
2. Assurez-vous que l'authentification par mot de passe est activée
3. Redémarrez le service PostgreSQL

### Erreur: "Base de données n'existe pas"
```sql
-- Connectez-vous en tant que postgres
psql -U postgres

-- Créez la base de données
CREATE DATABASE inoxya_bijoux;
```

## 📚 Ressources Utiles

- **Documentation PostgreSQL**: https://www.postgresql.org/docs/
- **pgAdmin**: Interface graphique pour PostgreSQL
- **DBeaver**: Alternative gratuite à pgAdmin
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/

## 🔄 Alternative: SQLite

Si PostgreSQL pose des problèmes, vous pouvez utiliser SQLite qui est plus simple :

1. Installez SQLite : `npm install sqlite3`
2. Modifiez la configuration pour utiliser SQLite
3. SQLite stocke les données dans un fichier local

## ✅ Vérification Finale

Une fois l'installation terminée, vous devriez pouvoir :
- ✅ Vous connecter à PostgreSQL
- ✅ Créer des tables
- ✅ Insérer des données
- ✅ Récupérer des données
- ✅ Utiliser l'application INOXYA BIJOUX avec persistance

---

**Note**: Ce guide est spécifique à Windows. Pour Linux/Mac, consultez la documentation officielle PostgreSQL.
