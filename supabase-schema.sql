-- ============================================
-- INOXYA BIJOUX - Auto-generated PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- ============================================

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

-- Table: packs
DROP TABLE IF EXISTS "packs" CASCADE;
CREATE TABLE IF NOT EXISTS "packs" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "image_url" TEXT,
        "is_featured" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW()
      );

-- Table: orders
DROP TABLE IF EXISTS "orders" CASCADE;
CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT,
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

-- ============================================
-- Schema generation complete!
-- Total tables: 21
-- ============================================
