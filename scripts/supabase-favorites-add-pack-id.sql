-- Migration: ajouter support des packs dans la table favorites (Supabase)
-- À exécuter dans Supabase SQL Editor si la table favorites existe déjà.
-- Permet d'enregistrer des favoris sur des packs (pack_id) en plus des produits (bijou_id).

-- 1. Rendre bijou_id nullable
ALTER TABLE public.favorites
  ALTER COLUMN bijou_id DROP NOT NULL;

-- 2. Ajouter la colonne pack_id (FK vers packs)
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS pack_id INTEGER REFERENCES public.packs(id) ON DELETE CASCADE;

-- 3. Supprimer l'ancienne contrainte UNIQUE(user_id, bijou_id) si elle existe
ALTER TABLE public.favorites
  DROP CONSTRAINT IF EXISTS favorites_user_id_bijou_id_key;

-- 4. Contrainte : au moins un des deux (bijou_id ou pack_id) doit être renseigné
ALTER TABLE public.favorites
  DROP CONSTRAINT IF EXISTS favorites_bijou_or_pack;
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_bijou_or_pack CHECK (bijou_id IS NOT NULL OR pack_id IS NOT NULL);

-- 5. Index uniques partiels (éviter doublons produit ou pack par user)
DROP INDEX IF EXISTS public.favorites_user_bijou_unique;
CREATE UNIQUE INDEX favorites_user_bijou_unique ON public.favorites (user_id, bijou_id) WHERE bijou_id IS NOT NULL;

DROP INDEX IF EXISTS public.favorites_user_pack_unique;
CREATE UNIQUE INDEX favorites_user_pack_unique ON public.favorites (user_id, pack_id) WHERE pack_id IS NOT NULL;
