-- Script pour créer un utilisateur administrateur
-- Remplacez les valeurs par vos propres données

-- 1. Créer un utilisateur admin (remplacez les valeurs)
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  'admin_phone', -- Remplacez par le numéro de téléphone de l'admin
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Mot de passe: "password"
  'Admin',
  'Principal',
  'admin'
) ON CONFLICT (phone) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 2. Vérifier que l'utilisateur a été créé
SELECT id, phone, first_name, last_name, role, created_at 
FROM users 
WHERE role = 'admin';

-- 3. Instructions pour changer le mot de passe
-- Pour changer le mot de passe, utilisez bcrypt avec un salt de 10
-- Exemple avec le mot de passe "admin123":
-- $2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bGj8Q5bGj8Q5bGj8Q5bGj8Q
