-- =============================================================================
-- INOXYA BIJOUX — Vérification auth / table users (Supabase SQL Editor)
-- =============================================================================
-- Exécuter dans Supabase → SQL Editor. Aucune modification des données.
-- Vérifie que la table users existe, a les bonnes colonnes, et qu'au moins
-- un utilisateur est présent pour le login (sans afficher les mots de passe).
-- =============================================================================

-- 1. Structure de la table users (colonnes attendues pour l'auth)
SELECT
  column_name AS "Colonne",
  data_type AS "Type",
  is_nullable AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Présence des colonnes obligatoires pour l'auth
SELECT
  CASE WHEN COUNT(*) = 6 THEN 'OK' ELSE 'MANQUANT' END AS "Statut colonnes auth",
  COUNT(*) AS "Colonnes trouvées (attendu: 6)"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_name IN ('id', 'phone', 'password_hash', 'role', 'created_at', 'updated_at');

-- 3. Nombre d'utilisateurs (pour vérifier qu'au moins un compte existe)
SELECT COUNT(*) AS "Nombre d'utilisateurs" FROM public.users;

-- 4. Liste des comptes (sans mot de passe) — pour vérifier admin / rôles
SELECT id, phone, first_name, last_name, role, created_at
FROM public.users
ORDER BY id;
