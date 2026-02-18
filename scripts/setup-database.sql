-- Script de configuration complète de la base de données INOXYA BIJOUX
-- Exécutez ce script dans l'ordre pour une configuration complète

-- 1. Créer les tables de base
\i scripts/01-create-tables.sql

-- 2. Ajouter le système de rôles
\i scripts/07-add-roles-system.sql

-- 3. Insérer les données de test
\i scripts/02-seed-data.sql

-- 4. Créer les comptes utilisateurs
\i scripts/09-setup-admin-account.sql

-- 5. Vérifier la configuration
SELECT 'Configuration terminée avec succès!' as status;

-- Afficher les utilisateurs créés
SELECT 
  phone,
  first_name,
  last_name,
  role,
  created_at
FROM users 
ORDER BY role, created_at;

-- Afficher les catégories
SELECT name, slug, description FROM categories;

-- Afficher les produits
SELECT name, price, is_available FROM bijoux LIMIT 5;
