-- =============================================================================
-- INOXYA BIJOUX — SCRIPT COMPLET SUPABASE (FULL STRONG — SQL EDITOR)
-- =============================================================================
-- Remplace l'ancien script. Tout-en-un : 21 tables, PK, FK, types corrigés,
-- seed users, vérification. À exécuter sur une base vide ou pour tout recréer.
-- Inclut favorites avec pack_id (produits + packs). Aucune migration séparée.
--
-- ATTENTION : DROP TABLE ... CASCADE supprime toutes les données.
-- Tous les commentaires utilisent -- (deux tirets). Aucune omission volontaire.
-- =============================================================================

-- ========== PARTIE 1 : SUPPRESSION (ordre inverse des dépendances) ==========
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.shipping_addresses CASCADE;
DROP TABLE IF EXISTS public.site_stats CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.custom_requests CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.packs CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ========== PARTIE 2 : CRÉATION DES TABLES (ordre des dépendances) ==========

-- Table: users (racine, référencée par beaucoup)
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: products (created_by -> users)
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  images JSONB DEFAULT '[]'::jsonb,
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false
);

-- Table: categories
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: packs (created_by -> users)
CREATE TABLE public.packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: orders (customer_id -> users)
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  customer_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: order_items (order_id -> orders)
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  bijou_id TEXT,
  pack_id TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: payments (order_id -> orders)
CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Table: cart_items (user_id -> users, bijou_id -> products)
CREATE TABLE public.cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bijou_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

-- Table: favorites (user_id -> users, bijou_id -> products OU pack_id -> packs)
CREATE TABLE public.favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bijou_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  pack_id INTEGER REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT favorites_bijou_or_pack CHECK (bijou_id IS NOT NULL OR pack_id IS NOT NULL)
);
CREATE UNIQUE INDEX favorites_user_bijou_unique ON public.favorites (user_id, bijou_id) WHERE bijou_id IS NOT NULL;
CREATE UNIQUE INDEX favorites_user_pack_unique ON public.favorites (user_id, pack_id) WHERE pack_id IS NOT NULL;

-- Table: user_sessions (user_id -> users)
CREATE TABLE public.user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: custom_requests (user_id -> users)
CREATE TABLE public.custom_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT,
  description TEXT,
  budget DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: reviews (user_id -> users, bijou_id -> products)
CREATE TABLE public.reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  bijou_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: newsletter_subscriptions
CREATE TABLE public.newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT NOW()
);

-- Table: site_stats
CREATE TABLE public.site_stats (
  id SERIAL PRIMARY KEY,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: shipping_addresses (user_id -> users, order_id -> orders)
CREATE TABLE public.shipping_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: promo_codes
CREATE TABLE public.promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: contact_messages
CREATE TABLE public.contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: testimonials (user_id -> users, product_id -> products)
CREATE TABLE public.testimonials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT NOT NULL,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: site_settings
CREATE TABLE public.site_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'BOOLEAN', 'json')),
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: settings
CREATE TABLE public.settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========== PARTIE 3 : EXTENSION ET SEED USERS ==========
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (phone, password_hash, first_name, last_name, role)
VALUES
  ('0612345678', crypt('Admin123!', gen_salt('bf')), 'Admin', 'Inoxya', 'admin'),
  ('0698765432', crypt('User123!', gen_salt('bf')), 'Test', 'Client', 'user')
ON CONFLICT (phone) DO NOTHING;

SELECT id, phone, first_name, last_name, role, created_at FROM public.users ORDER BY id;

-- ========== PARTIE 3b : SEED CATÉGORIES, PRODUITS ET PACKS (optionnel) ==========
INSERT INTO public.categories (name, slug, description) VALUES
  ('Bracelets', 'bracelets', 'Bracelets et gourmettes'),
  ('Colliers', 'colliers', 'Colliers et pendentifs'),
  ('Boucles d''oreilles', 'boucles-doreilles', 'Boucles et créoles'),
  ('Bagues', 'bagues', 'Bagues et alliances'),
  ('Montres', 'montres', 'Montres femme et homme')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, name_ar, description, price, category, stock, is_active, image_url, created_by, is_featured)
SELECT * FROM (VALUES
  ('Bracelet Inox', NULL, 'Bracelet inoxydable élégant', 49.99, 'Bracelets', 10, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Bracelet', 1, false),
  ('Collier Classique', NULL, 'Collier fin pour toute occasion', 79.99, 'Colliers', 5, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Collier', 1, true),
  ('Boucles d''oreilles', NULL, 'Boucles discrètes et raffinées', 29.99, 'Boucles d''oreilles', 20, true, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Boucles', 1, false)
) AS v(name, name_ar, description, price, category, stock, is_active, image_url, created_by, is_featured)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

INSERT INTO public.packs (name, slug, description, price, image_url, is_featured, created_by)
SELECT * FROM (VALUES
  ('Pack Découverte', 'pack-decouverte', 'Une sélection de pièces pour découvrir la marque', 129.99, 'https://placehold.co/400x400/e8e4df/5c5a57?text=Pack', true, 1)
) AS v(name, slug, description, price, image_url, is_featured, created_by)
WHERE NOT EXISTS (SELECT 1 FROM public.packs LIMIT 1);

-- ========== PARTIE 4 : TRIGGER updated_at (optionnel) ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_promo_codes ON public.promo_codes;
CREATE TRIGGER set_updated_at_promo_codes BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_contact_messages ON public.contact_messages;
CREATE TRIGGER set_updated_at_contact_messages BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_site_settings ON public.site_settings;
CREATE TRIGGER set_updated_at_site_settings BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_settings ON public.settings;
CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_custom_requests ON public.custom_requests;
CREATE TRIGGER set_updated_at_custom_requests BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== PARTIE 5 : VÉRIFICATION FK (résultat attendu : tout OK) ==========
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
    ('favorites', 'pack_id', 'packs'),
    ('order_items', 'order_id', 'orders'),
    ('orders', 'customer_id', 'users'),
    ('packs', 'created_by', 'users'),
    ('payments', 'order_id', 'orders'),
    ('products', 'created_by', 'users'),
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
