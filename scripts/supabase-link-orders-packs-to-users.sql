-- =============================================================================
-- INOXYA BIJOUX — Liaison commandes (orders) et packs à la table users (admin)
-- À exécuter dans Supabase → SQL Editor. Aucun DROP, aucune suppression de données.
-- =============================================================================
-- Ce script ajoute :
--   * orders.customer_id → users(id) : lie la commande au client (user) connecté
--   * packs.created_by → users(id) : lie le pack à l'admin qui l'a créé
-- Ainsi les commandes et les packs sont liés à l'admin / aux utilisateurs.
-- =============================================================================

-- 1. Colonne orders.customer_id (client lié à la commande)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id INTEGER;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'orders_customer_id_fkey existe déjà.';
END
$$;

-- 2. Colonne packs.created_by (admin qui a créé le pack)
ALTER TABLE public.packs
  ADD COLUMN IF NOT EXISTS created_by INTEGER;

DO $$
BEGIN
  ALTER TABLE public.packs
    ADD CONSTRAINT packs_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'packs_created_by_fkey existe déjà.';
END
$$;

-- 3. Vérification
SELECT 'orders.customer_id' AS liaison, EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
) AS colonne_ok, EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_fkey'
) AS fk_ok
UNION ALL
SELECT 'packs.created_by', EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'packs' AND column_name = 'created_by'
), EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'packs_created_by_fkey'
);
