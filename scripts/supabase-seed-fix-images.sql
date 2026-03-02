-- =============================================================================
-- Mise à jour des image_url pour les produits et packs du seed (une fois)
-- À exécuter dans Supabase SQL Editor si les cartes affichent un placeholder vide.
-- =============================================================================

UPDATE public.products SET image_url = 'https://placehold.co/400x400/e8e4df/5c5a57?text=Bracelet' WHERE name = 'Bracelet Inox' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://placehold.co/400x400/e8e4df/5c5a57?text=Collier' WHERE name = 'Collier Classique' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://placehold.co/400x400/e8e4df/5c5a57?text=Boucles' WHERE name = 'Boucles d''oreilles' AND (image_url IS NULL OR image_url = '');
UPDATE public.packs SET image_url = 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pack' WHERE slug = 'pack-decouverte' AND (image_url IS NULL OR image_url = '');
