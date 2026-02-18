-- Script pour supprimer les données demo de la base SQLite INOXYA BIJOUX
-- Exécution: sqlite3 data/inoxya_bijoux.db < scripts/supprimer-donnees-demo.sql
-- Ou via node: voir scripts/supprimer-donnees-demo.js

-- ATTENTION: Ce script nettoie uniquement les données explicitement demo
-- Les données réelles (produits, catégories, packs, commandes, admin) sont conservées

-- 1. Témoignages avec emails @example.com (données demo)
DELETE FROM testimonials WHERE customer_email LIKE '%@example.com%';

-- 2. Codes promo de test (optionnel - décommenter si vous voulez les supprimer)
-- DELETE FROM promo_codes WHERE code IN ('BIENVENUE10', 'LIVRAISON_GRATUITE', 'PREMIUM20');

-- 3. Messages de contact de test (optionnel)
-- DELETE FROM contact_messages WHERE email LIKE '%@example.com%';

-- Vérification
SELECT 'Données demo supprimées' as status;
