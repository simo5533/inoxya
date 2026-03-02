-- =============================================================================
-- INOXYA BIJOUX — Corrections et migrations idempotentes (Supabase SQL Editor)
-- =============================================================================
-- À exécuter par parties. Aucun DROP, aucune suppression de données.
-- Chaque bloc peut être exécuté séparément. Les EXCEPTION évitent les erreurs
-- si la contrainte/colonne existe déjà.
--
-- Résumé des corrections (d’après revue) :
--   * Suppression des doublons : une seule fois par FK (déjà le cas dans
--     supabase-full-setup.sql ; ne pas coller plusieurs scripts ensemble).
--   * Types cohérents : is_read BOOLEAN, images JSONB, optionnel user_id/bijou_id.
--   * Trigger updated_at optionnel.
--   * Gestion d’exception : duplicate_object ou duplicate_table selon le cas.
-- =============================================================================

-- ========== PARTIE 1 : Corrections sûres (types) ==========

-- 1.1 notifications.is_read : INTEGER -> BOOLEAN (0/1 -> false/true), si colonne existe et est integer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN is_read TYPE BOOLEAN USING (is_read::int::boolean);
    RAISE NOTICE 'notifications.is_read converti en boolean.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'notifications.is_read : %', SQLERRM;
END
$$;

-- 1.2 products.images : TEXT -> JSONB (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images') THEN
    ALTER TABLE public.products
      ALTER COLUMN images TYPE jsonb USING (
        CASE
          WHEN images IS NULL OR trim(images::text) = '' THEN '[]'::jsonb
          WHEN images::text ~ '^\[.*\]$' THEN images::jsonb
          ELSE '[]'::jsonb
        END
      );
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
    RAISE NOTICE 'products.images converti en jsonb.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'products.images : %', SQLERRM;
END
$$;

-- ========== PARTIE 2 : Liaisons manquantes (idempotent) ==========
-- Colonnes + FK orders.customer_id, packs.created_by (si pas déjà fait)

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id INTEGER;
ALTER TABLE public.packs ADD COLUMN IF NOT EXISTS created_by INTEGER;

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

-- ========== PARTIE 3 : Trigger updated_at (optionnel) ==========
-- Met à jour updated_at à chaque UPDATE sur les tables concernées.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

DO $$
DECLARE
  t text;
  tbl text[] := ARRAY['products','users','payments','promo_codes','contact_messages','site_settings','settings','custom_requests','testimonials'];
BEGIN
  FOREACH t IN ARRAY tbl
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t AND c.column_name = 'updated_at') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
      RAISE NOTICE 'Trigger set_updated_at créé sur %.', t;
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger updated_at : %', SQLERRM;
END
$$;

-- ========== PARTIE 4 : UNIQUE favorites (exception large) ==========
-- Utiliser OTHERS pour couvrir duplicate_object et duplicate_table.

DO $$
BEGIN
  ALTER TABLE public.favorites
    ADD CONSTRAINT favorites_user_id_bijou_id_key
    UNIQUE (user_id, bijou_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table THEN
    RAISE NOTICE 'favorites_user_id_bijou_id_key existe déjà.';
  WHEN OTHERS THEN
    RAISE NOTICE 'favorites UNIQUE : %', SQLERRM;
END
$$;

-- ========== PARTIE 5 : Diagnostic (lecture seule) ==========
-- Liste les FK attendues vs présentes et les colonnes TEXT qui référencent des PK integer.

SELECT
  e.table_name AS "Table",
  e.column_name AS "Colonne",
  e.references_table AS "Référence",
  CASE WHEN a.table_name IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END AS "Statut"
FROM (
  SELECT * FROM (VALUES
    ('cart_items', 'user_id', 'users'),
    ('cart_items', 'bijou_id', 'products'),
    ('custom_requests', 'user_id', 'users'),
    ('favorites', 'user_id', 'users'),
    ('favorites', 'bijou_id', 'products'),
    ('order_items', 'order_id', 'orders'),
    ('orders', 'customer_id', 'users'),
    ('packs', 'created_by', 'users'),
    ('payments', 'order_id', 'orders'),
    ('reviews', 'user_id', 'users'),
    ('reviews', 'bijou_id', 'products'),
    ('shipping_addresses', 'user_id', 'users'),
    ('shipping_addresses', 'order_id', 'orders'),
    ('testimonials', 'user_id', 'users'),
    ('testimonials', 'product_id', 'products'),
    ('user_sessions', 'user_id', 'users')
  ) AS t(table_name, column_name, references_table)
) e
LEFT JOIN (
  SELECT
    regexp_replace(c.conrelid::regclass::text, '^[^.]*\.', '') AS table_name,
    a.attname AS column_name,
    regexp_replace(c.confrelid::regclass::text, '^[^.]*\.', '') AS references_table
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid AND a.attnum > 0 AND NOT a.attisdropped
  WHERE c.contype = 'f' AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
) a ON e.table_name = a.table_name AND e.column_name = a.column_name AND e.references_table = a.references_table
ORDER BY "Statut" DESC, e.table_name, e.column_name;

-- ========== PARTIE 6 (OPTIONNELLE) : Types FK TEXT -> INTEGER ==========
-- Décommenter et exécuter seulement si l’app envoie des IDs numériques (ex. user_id = "1").
-- Risque : échec si des valeurs non numériques existent (user_id = téléphone, etc.).

/*
-- orders.user_id : TEXT -> INTEGER (référence users.id)
ALTER TABLE public.orders ALTER COLUMN user_id TYPE INTEGER USING nullif(trim(user_id), '')::integer;

-- order_items.bijou_id : peut rester TEXT si l’app utilise des identifiants string.
-- Pour lier à products.id (INTEGER) :
-- ALTER TABLE public.order_items ALTER COLUMN bijou_id TYPE INTEGER USING nullif(trim(bijou_id), '')::integer;

-- products.created_by : TEXT -> INTEGER (référence users.id) si utilisé comme id admin
-- ALTER TABLE public.products ALTER COLUMN created_by TYPE INTEGER USING nullif(trim(created_by), '')::integer;
*/
