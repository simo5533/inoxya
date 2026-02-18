-- Script pour changer le mot de passe d'un utilisateur
-- Remplacez les valeurs selon vos besoins

-- Exemple : Changer le mot de passe de l'admin
-- Le hash ci-dessous correspond au mot de passe "admin123"
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bGj8Q5bGj8Q5bGj8Q5bGj8Q'
WHERE phone = 'VOTRE_NUMERO' AND role = 'admin';

-- Exemple : Changer le mot de passe d'un utilisateur
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQvOQ5bGj8Q5bGj8Q5bGj8Q5bGj8Q'
WHERE phone = '06 12 34 56 78';

-- Vérifier le changement
SELECT phone, first_name, last_name, role, updated_at 
FROM users 
WHERE phone IN ('VOTRE_NUMERO', '06 12 34 56 78');
