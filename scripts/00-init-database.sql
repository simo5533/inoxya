-- Script d'initialisation de la base de données INOXYA BIJOUX
-- Ce script s'exécute automatiquement au démarrage du conteneur PostgreSQL

-- Créer l'extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer l'extension pour le hachage des mots de passe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données INOXYA BIJOUX initialisée avec succès!';
END $$;
