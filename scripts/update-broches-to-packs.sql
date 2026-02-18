-- Script de mise à jour : Changer "Broches" en "Nos packs"
-- Exécutez ce script dans votre base de données pour mettre à jour les catégories existantes

-- Pour SQLite
UPDATE categories 
SET name = 'Nos packs', 
    description = 'Packs exclusifs de bijoux à prix avantageux'
WHERE slug = 'broches' OR name = 'Broches';

-- Pour PostgreSQL/Supabase
-- UPDATE categories 
-- SET name = 'Nos packs', 
--     description = 'Packs exclusifs de bijoux à prix avantageux'
-- WHERE slug = 'broches' OR name = 'Broches';

