-- =============================================================================
-- Vide les tables products et packs (et tables dépendantes) pour réimporter
-- depuis SQLite avec sync-products-to-supabase.ts et sync-packs-to-supabase.ts.
-- À exécuter dans Supabase SQL Editor AVANT de lancer les scripts de sync.
-- ATTENTION : supprime les données concernées (panier, favoris, avis, etc.).
-- =============================================================================

-- Ordre : supprimer les lignes qui référencent products ou packs
DELETE FROM public.cart_items;
DELETE FROM public.favorites;
DELETE FROM public.reviews;
DELETE FROM public.testimonials;
-- order_items a bijou_id/pack_id en TEXT, pas de FK ; on peut les laisser ou vider
-- DELETE FROM public.order_items;
DELETE FROM public.products;
DELETE FROM public.packs;
