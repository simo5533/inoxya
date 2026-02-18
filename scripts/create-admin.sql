-- Script SQL pour créer l'utilisateur admin
-- Généré automatiquement le 2026-02-14T00:08:07.060Z

-- Créer ou mettre à jour l'utilisateur admin (0612345678)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('0612345678', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);

-- Créer ou mettre à jour l'utilisateur admin (admin_phone)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('admin_phone', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);

-- Vérifier que les utilisateurs ont été créés
SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin';
