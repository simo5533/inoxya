-- Script de configuration complète pour la base de données locale INOXYA BIJOUX
-- Exécutez ce script dans l'ordre pour une configuration complète

-- 1. Créer les tables de base
\i 01-create-tables.sql

-- 2. Ajouter le système de rôles
\i 07-add-roles-system.sql

-- 3. Insérer les données de test
\i 02-seed-data.sql

-- 4. Créer les comptes utilisateurs avec vrais mots de passe hashés
-- Note: Utilisation de crypt() pour hasher les mots de passe
INSERT INTO users (phone, password_hash, first_name, last_name, role) VALUES
('admin_phone', crypt('password', gen_salt('bf')), 'Admin', 'Principal', 'admin'),
('0698765432', crypt('password', gen_salt('bf')), 'Modérateur', 'Test', 'moderator'),
('0612345678', crypt('password', gen_salt('bf')), 'Utilisateur', 'Standard', 'user')
ON CONFLICT (phone) DO NOTHING;

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
