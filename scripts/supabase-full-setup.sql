-- =============================================================================
-- INOXYA BIJOUX — Script COMPLET pour Supabase SQL Editor (tout-en-un)
-- =============================================================================
-- CONTENU : 21 tables (products, categories, PACKS, orders, order_items,
-- payments, notifications, users, cart_items, FAVORITES, user_sessions,
-- custom_requests, reviews, newsletter_subscriptions, site_stats,
-- shipping_addresses, promo_codes, contact_messages, testimonials,
-- site_settings, settings) + seed users + FK checkout + FK FAVORITES + vérif.
-- ATTENTION : La partie 1 contient DROP TABLE CASCADE (supprime toutes les
-- données). Ne l'exécuter que sur une base vide ou de test.
-- Base existante : commentez la partie 1, exécutez à partir de la partie 2.
-- Tous les commentaires utilisent -- (deux tirets). Jamais - seul en début de ligne.
-- =============================================================================

-- ========== PARTIE 1 : SCHÉMA (tables) — À exécuter uniquement sur base vide ==========
-- Table: products
DROP TABLE IF EXISTS "products" CASCADE;
CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "name_ar" TEXT,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "original_price" DECIMAL(10,2),
        "category" TEXT NOT NULL,
        "stock" INTEGER DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "image_url" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      , "images" TEXT DEFAULT '[]', "created_by" TEXT, "is_featured" BOOLEAN DEFAULT false);

-- Table: categories
DROP TABLE IF EXISTS "categories" CASCADE;
CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "image_url" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );

-- Table: packs (created_by lie le pack à l'admin qui l'a créé)
DROP TABLE IF EXISTS "packs" CASCADE;
CREATE TABLE IF NOT EXISTS "packs" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "image_url" TEXT,
        "is_featured" BOOLEAN DEFAULT false,
        "created_by" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW()
      );

-- Table: orders (customer_id lie la commande au client/user)
DROP TABLE IF EXISTS "orders" CASCADE;
CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT,
        "customer_id" INTEGER,
        "total_amount" DECIMAL(10,2) NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "shipping_address" TEXT,
        "phone" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );

-- Table: order_items
DROP TABLE IF EXISTS "order_items" CASCADE;
CREATE TABLE IF NOT EXISTS "order_items" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL,
        "bijou_id" TEXT,
        "quantity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      , "pack_id" TEXT);

-- Table: payments
DROP TABLE IF EXISTS "payments" CASCADE;
CREATE TABLE IF NOT EXISTS "payments" (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "payment_method" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "transaction_id" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );

-- Table: notifications
DROP TABLE IF EXISTS "notifications" CASCADE;
CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT DEFAULT 'info',
        "is_read" INTEGER DEFAULT 0,
        "action_url" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP
      );

-- Table: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "phone" TEXT UNIQUE NOT NULL,
      "password_hash" TEXT NOT NULL,
      "first_name" TEXT,
      "last_name" TEXT,
      "role" TEXT NOT NULL DEFAULT 'user',
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: cart_items
DROP TABLE IF EXISTS "cart_items" CASCADE;
CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER,
        "bijou_id" INTEGER,
        "quantity" INTEGER DEFAULT 1,
        "created_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, bijou_id),
        FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE,
        FOREIGN KEY (bijou_id) REFERENCES "products"(id) ON DELETE CASCADE
      );

-- Table: favorites
DROP TABLE IF EXISTS "favorites" CASCADE;
CREATE TABLE IF NOT EXISTS "favorites" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "bijou_id" INTEGER,
      "created_at" TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, bijou_id),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE,
      FOREIGN KEY (bijou_id) REFERENCES "products"(id) ON DELETE CASCADE
    );

-- Table: user_sessions
DROP TABLE IF EXISTS "user_sessions" CASCADE;
CREATE TABLE IF NOT EXISTS "user_sessions" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "session_token" TEXT UNIQUE NOT NULL,
      "expires_at" TIMESTAMP NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE
    );

-- Table: custom_requests
DROP TABLE IF EXISTS "custom_requests" CASCADE;
CREATE TABLE IF NOT EXISTS "custom_requests" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "type" TEXT,
      "description" TEXT,
      "budget" DECIMAL(10,2),
      "status" TEXT DEFAULT 'pending',
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE SET NULL
    );

-- Table: reviews
DROP TABLE IF EXISTS "reviews" CASCADE;
CREATE TABLE IF NOT EXISTS "reviews" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "bijou_id" INTEGER,
      "rating" INTEGER CHECK(rating >= 1 AND rating <= 5),
      "comment" TEXT,
      "is_approved" BOOLEAN DEFAULT false,
      "created_at" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE SET NULL,
      FOREIGN KEY (bijou_id) REFERENCES "products"(id) ON DELETE CASCADE
    );

-- Table: newsletter_subscriptions
DROP TABLE IF EXISTS "newsletter_subscriptions" CASCADE;
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "is_active" BOOLEAN DEFAULT true,
      "subscribed_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: site_stats
DROP TABLE IF EXISTS "site_stats" CASCADE;
CREATE TABLE IF NOT EXISTS "site_stats" (
      "id" SERIAL PRIMARY KEY,
      "page_views" INTEGER DEFAULT 0,
      "unique_visitors" INTEGER DEFAULT 0,
      "orders_count" INTEGER DEFAULT 0,
      "revenue" DECIMAL(10,2) DEFAULT 0,
      "date" DATE UNIQUE NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: shipping_addresses
DROP TABLE IF EXISTS "shipping_addresses" CASCADE;
CREATE TABLE IF NOT EXISTS "shipping_addresses" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "order_id" INTEGER,
      "full_name" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "postal_code" TEXT,
      "phone" TEXT,
      "is_default" BOOLEAN DEFAULT false,
      "created_at" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES "orders"(id) ON DELETE SET NULL
    );

-- Table: promo_codes
DROP TABLE IF EXISTS "promo_codes" CASCADE;
CREATE TABLE IF NOT EXISTS "promo_codes" (
      "id" SERIAL PRIMARY KEY,
      "code" TEXT UNIQUE NOT NULL,
      "description" TEXT,
      "discount_type" TEXT CHECK(discount_type IN ('percentage', 'fixed')),
      "discount_value" DECIMAL(10,2) NOT NULL,
      "min_order_amount" DECIMAL(10,2),
      "usage_limit" INTEGER,
      "usage_count" INTEGER DEFAULT 0,
      "is_active" BOOLEAN DEFAULT true,
      "valid_until" TIMESTAMP,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: contact_messages
DROP TABLE IF EXISTS "contact_messages" CASCADE;
CREATE TABLE IF NOT EXISTS "contact_messages" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied', 'closed')),
      "priority" TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: testimonials
DROP TABLE IF EXISTS "testimonials" CASCADE;
CREATE TABLE IF NOT EXISTS "testimonials" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER,
      "customer_name" TEXT NOT NULL,
      "customer_email" TEXT,
      "rating" INTEGER CHECK(rating >= 1 AND rating <= 5),
      "testimonial" TEXT NOT NULL,
      "product_id" INTEGER,
      "is_featured" BOOLEAN DEFAULT false,
      "is_approved" BOOLEAN DEFAULT false,
      "created_at" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES "products"(id) ON DELETE SET NULL
    );

-- Table: site_settings
DROP TABLE IF EXISTS "site_settings" CASCADE;
CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" SERIAL PRIMARY KEY,
      "setting_key" TEXT UNIQUE NOT NULL,
      "setting_value" TEXT,
      "setting_type" TEXT DEFAULT 'string' CHECK(setting_type IN ('string', 'number', 'BOOLEAN', 'json')),
      "description" TEXT,
      "category" TEXT,
      "is_public" BOOLEAN DEFAULT false,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );

-- Table: settings
DROP TABLE IF EXISTS "settings" CASCADE;
CREATE TABLE IF NOT EXISTS "settings" (
          "id" SERIAL PRIMARY KEY,
          "key" TEXT UNIQUE NOT NULL,
          "value" TEXT,
          "updated_at" TIMESTAMP DEFAULT NOW()
        );

-- ========== PARTIE 2 : Utilisateurs (seed) — sans destruction ==========
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (phone, password_hash, first_name, last_name, role)
VALUES
  ('0612345678', crypt('Admin123!', gen_salt('bf')), 'Admin', 'Inoxya', 'admin'),
  ('0698765432', crypt('User123!', gen_salt('bf')), 'Test', 'Client', 'user')
ON CONFLICT (phone) DO NOTHING;

SELECT id, phone, first_name, last_name, role, created_at FROM public.users ORDER BY id;

-- ========== PARTIE 3 : FK checkout + orders/packs -> users (une seule fois par FK) ==========
DO $$
BEGIN
  ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'order_items_order_id_fkey existe déjà.';
END
$$;

DO $$
BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'payments_order_id_fkey existe déjà.';
END
$$;

-- Liaison commandes et packs vers users (admin/client)
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

-- ========== PARTIE 4 : Favoris (FK + UNIQUE) — idempotent ==========
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

-- ========== PARTIE 5 : Vérification des FK ==========
SELECT
  c.conrelid::regclass AS table_name,
  a.attname AS column_name,
  c.confrelid::regclass AS references_table,
  c.conname AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid AND a.attnum > 0 AND NOT a.attisdropped
WHERE c.contype = 'f'
  AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.conrelid::regclass::text, a.attname;

WITH expected AS (
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
),
actual AS (
  SELECT
    regexp_replace(c.conrelid::regclass::text, '^[^.]*\.', '') AS table_name,
    a.attname AS column_name,
    regexp_replace(c.confrelid::regclass::text, '^[^.]*\.', '') AS references_table
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid AND a.attnum > 0 AND NOT a.attisdropped
  WHERE c.contype = 'f'
    AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
SELECT
  e.table_name AS "Table",
  e.column_name AS "Colonne",
  e.references_table AS "Référence",
  CASE WHEN a.table_name IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END AS "Statut"
FROM expected e
LEFT JOIN actual a ON e.table_name = a.table_name AND e.column_name = a.column_name AND e.references_table = a.references_table
ORDER BY "Statut" DESC, e.table_name, e.column_name;
