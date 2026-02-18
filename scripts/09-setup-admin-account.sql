-- Configuration du compte administrateur INOXYA
-- Remplacez 'VOTRE_NUMERO' par votre vrai numéro de téléphone

-- 1. Créer le compte admin principal
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  'VOTRE_NUMERO', -- Remplacez par votre numéro (ex: '06 12 34 56 78')
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Mot de passe: "password"
  'Admin',
  'Principal',
  'admin'
) ON CONFLICT (phone) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 2. Créer un compte utilisateur de test
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  '06 12 34 56 78',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Mot de passe: "password"
  'Utilisateur',
  'Test',
  'user'
) ON CONFLICT (phone) DO NOTHING;

-- 3. Créer un compte modérateur de test
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  '06 98 76 54 32',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Mot de passe: "password"
  'Modérateur',
  'Test',
  'moderator'
) ON CONFLICT (phone) DO NOTHING;

-- 4. Vérifier les comptes créés
SELECT 
  phone,
  first_name,
  last_name,
  role,
  created_at
FROM users 
WHERE role IN ('admin', 'moderator', 'user')
ORDER BY role, created_at;
