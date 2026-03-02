-- =============================================================================
-- INOXYA BIJOUX — Table favorites : liaisons (FK) + contrainte UNIQUE
-- À exécuter dans Supabase → SQL Editor. Aucun DROP, aucune suppression.
-- =============================================================================
-- IMPORTANT : exécuter CE FICHIER SEUL (ne pas coller avec d'autres scripts).
-- En SQL, les commentaires doivent commencer par -- (deux tirets), pas - (un seul).
-- =============================================================================
-- La table "favorites" doit exister. Ce script ajoute :
--   * user_id -> users(id) ON DELETE CASCADE
--   * bijou_id -> products(id) ON DELETE CASCADE
--   * UNIQUE(user_id, bijou_id) pour l'upsert côté app
-- Si la table n'existe pas, la partie 1 la crée (colonnes minimales).
-- =============================================================================

-- 1. Créer la table favorites si elle n'existe pas (colonnes minimales)
CREATE TABLE IF NOT EXISTS public.favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  bijou_id INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. FK user_id → users(id)
DO $$
BEGIN
  ALTER TABLE public.favorites
    ADD CONSTRAINT favorites_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'favorites_user_id_fkey existe déjà.';
END
$$;

-- 3. FK bijou_id → products(id)
DO $$
BEGIN
  ALTER TABLE public.favorites
    ADD CONSTRAINT favorites_bijou_id_fkey
    FOREIGN KEY (bijou_id) REFERENCES public.products(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'favorites_bijou_id_fkey existe déjà.';
END
$$;

-- 4. UNIQUE(user_id, bijou_id) — requis pour l'upsert de l'app (évite doublons)
-- Note: PostgreSQL crée un index (relation) pour UNIQUE ; 42P07 = duplicate_table
DO $$
BEGIN
  ALTER TABLE public.favorites
    ADD CONSTRAINT favorites_user_id_bijou_id_key
    UNIQUE (user_id, bijou_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table THEN
    RAISE NOTICE 'favorites_user_id_bijou_id_key existe déjà.';
END
$$;

-- 5. Vérification : lister les contraintes sur favorites
SELECT conname AS "Contrainte", contype AS "Type"
FROM pg_constraint
WHERE conrelid = 'public.favorites'::regclass
ORDER BY conname;
