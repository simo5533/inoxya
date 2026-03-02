-- =============================================================================
-- Vérification rapide des tables Supabase (nombre de lignes par table)
-- À exécuter dans Supabase SQL Editor pour s'assurer que le contenu s'affiche.
-- =============================================================================

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'packs', COUNT(*) FROM public.packs
UNION ALL SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL SELECT 'order_items', COUNT(*) FROM public.order_items
UNION ALL SELECT 'cart_items', COUNT(*) FROM public.cart_items
UNION ALL SELECT 'favorites', COUNT(*) FROM public.favorites
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL SELECT 'settings', COUNT(*) FROM public.settings
UNION ALL SELECT 'custom_requests', COUNT(*) FROM public.custom_requests
UNION ALL SELECT 'contact_messages', COUNT(*) FROM public.contact_messages
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'newsletter_subscriptions', COUNT(*) FROM public.newsletter_subscriptions
UNION ALL SELECT 'site_stats', COUNT(*) FROM public.site_stats
UNION ALL SELECT 'shipping_addresses', COUNT(*) FROM public.shipping_addresses
UNION ALL SELECT 'promo_codes', COUNT(*) FROM public.promo_codes
UNION ALL SELECT 'testimonials', COUNT(*) FROM public.testimonials
UNION ALL SELECT 'site_settings', COUNT(*) FROM public.site_settings
UNION ALL SELECT 'user_sessions', COUNT(*) FROM public.user_sessions
ORDER BY table_name;
