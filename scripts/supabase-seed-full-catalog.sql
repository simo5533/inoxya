-- =============================================================================
-- Catalogue de démo (catégories + produits + packs) pour Supabase
-- À exécuter si vous n'avez plus la SQLite et voulez un site rempli.
-- Supprime d'abord les produits/packs existants puis insère le catalogue.
-- =============================================================================

DELETE FROM public.cart_items;
DELETE FROM public.favorites;
DELETE FROM public.reviews;
DELETE FROM public.testimonials;
DELETE FROM public.products;
DELETE FROM public.packs;

-- Catégories (pour affichage dans Table Editor ; l'app utilise aussi category-mapping si vide)
INSERT INTO public.categories (name, slug, description) VALUES
('Bracelets', 'bracelets', 'Bracelets et gourmettes'),
('Colliers', 'colliers', 'Colliers et pendentifs'),
('Boucles d''oreilles', 'boucles-doreilles', 'Boucles et créoles'),
('Bagues', 'bagues', 'Bagues et alliances'),
('Montres', 'montres', 'Montres femme et homme')
ON CONFLICT (slug) DO NOTHING;

-- Produits (created_by = 1, images placeholder)
INSERT INTO public.products (name, name_ar, description, price, category, stock, is_active, image_url, created_by, is_featured) VALUES
('Bracelet Inox', NULL, 'Bracelet inoxydable élégant', 49.99, 'Bracelets', 10, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Bracelet', 1, false),
('Collier Classique', NULL, 'Collier fin pour toute occasion', 79.99, 'Colliers', 5, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Collier', 1, true),
('Boucles d''oreilles', NULL, 'Boucles discrètes et raffinées', 29.99, 'Boucles d''oreilles', 20, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Boucles', 1, false),
('Gourmette Homme', NULL, 'Gourmette inox gravure possible', 89.99, 'Bracelets', 8, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Gourmette', 1, true),
('Bague Solitaire', NULL, 'Bague argent et zirconium', 59.99, 'Bagues', 15, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Bague', 1, true),
('Montre Femme', NULL, 'Montre bracelet cuir et acier', 129.99, 'Montres', 6, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Montre', 1, false),
('Pendentif Cœur', NULL, 'Pendentif argent 925', 45.99, 'Colliers', 12, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pendentif', 1, false),
('Bracelet Perles', NULL, 'Bracelet perles et inox', 39.99, 'Bracelets', 18, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Perles', 1, false),
('Chaîne Argent', NULL, 'Chaîne fine 40 cm', 34.99, 'Colliers', 25, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Chaine', 1, false),
('Créoles', NULL, 'Créoles taille moyenne argent', 42.99, 'Boucles d''oreilles', 14, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Creoles', 1, false),
('Alliance Or Blanc', NULL, 'Alliance or blanc 18 carats', 199.99, 'Bagues', 4, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Alliance', 1, true),
('Sautoir Long', NULL, 'Sautoir perles et fermoir doré', 69.99, 'Colliers', 7, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Sautoir', 1, false);

-- Packs
INSERT INTO public.packs (name, slug, description, price, image_url, is_featured, created_by) VALUES
('Pack Découverte', 'pack-decouverte', 'Une sélection de pièces pour découvrir la marque', 129.99, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pack+Decouverte', true, 1),
('Pack Élégance', 'pack-elegance', 'Bracelet + collier + boucles assortis', 199.99, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pack+Elegance', true, 1),
('Pack Homme', 'pack-homme', 'Gourmette + montre pour homme', 189.99, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pack+Homme', false, 1);
