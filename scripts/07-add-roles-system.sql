-- Ajout du système de rôles pour INOXYA BIJOUX

-- 1. Ajouter la colonne role à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. Créer un index pour optimiser les requêtes par rôle
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Mettre à jour l'utilisateur existant pour avoir un admin par défaut
-- (Vous devrez remplacer 'admin_phone' par le numéro de téléphone de votre admin)
UPDATE users SET role = 'admin' WHERE phone = 'admin_phone' LIMIT 1;

-- 4. Créer une table pour les permissions (optionnel, pour un système plus avancé)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer une table de liaison entre rôles et permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- 6. Insérer les permissions de base
INSERT INTO permissions (name, description) VALUES
  ('manage_products', 'Gérer les produits (CRUD)'),
  ('manage_categories', 'Gérer les catégories'),
  ('manage_orders', 'Gérer les commandes'),
  ('manage_users', 'Gérer les utilisateurs'),
  ('view_analytics', 'Voir les statistiques'),
  ('manage_content', 'Gérer le contenu du site')
ON CONFLICT (name) DO NOTHING;

-- 7. Assigner les permissions aux rôles
INSERT INTO role_permissions (role, permission_id) 
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id) 
SELECT 'moderator', id FROM permissions WHERE name IN ('manage_products', 'manage_categories', 'view_analytics')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 8. Créer une vue pour faciliter les requêtes de permissions
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  u.id as user_id,
  u.phone,
  u.role,
  p.name as permission_name,
  p.description as permission_description
FROM users u
LEFT JOIN role_permissions rp ON u.role = rp.role
LEFT JOIN permissions p ON rp.permission_id = p.id;

-- 9. Ajouter des colonnes d'audit pour les actions admin
ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
