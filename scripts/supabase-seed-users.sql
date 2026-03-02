-- =============================================================================
-- INOXYA BIJOUX — Insertion d'utilisateurs dans la table public.users
-- À exécuter dans Supabase → SQL Editor (aucun DROP, aucune suppression)
-- =============================================================================
-- La table "users" doit déjà exister. Ce script insère des comptes pour pouvoir
-- se connecter à l'admin. Changez le mot de passe après la première connexion.
-- =============================================================================

-- Activer pgcrypto pour générer un hash bcrypt compatible avec l'app (bcryptjs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insérer un admin et un utilisateur test (évite les doublons sur "phone")
INSERT INTO public.users (phone, password_hash, first_name, last_name, role)
VALUES
  ('0612345678', crypt('Admin123!', gen_salt('bf')), 'Admin', 'Inoxya', 'admin'),
  ('0698765432', crypt('User123!', gen_salt('bf')), 'Test', 'Client', 'user')
ON CONFLICT (phone) DO NOTHING;

-- Vérification : afficher les utilisateurs insérés
SELECT id, phone, first_name, last_name, role, created_at FROM public.users ORDER BY id;
