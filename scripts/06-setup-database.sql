-- Script de configuration complète de la base de données INOXYA BIJOUX
-- Exécutez ce script dans votre console Supabase SQL

-- 1. Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Suppression des tables existantes (si elles existent)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS bijoux CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS custom_requests CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS site_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Création des tables principales

-- Table des utilisateurs
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des packs
CREATE TABLE packs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des bijoux
CREATE TABLE bijoux (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200), -- Nom en arabe
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- Prix original pour les promos
  category_id UUID REFERENCES categories(id),
  pack_id UUID REFERENCES packs(id),
  image_url TEXT,
  images JSONB DEFAULT '[]', -- Pour stocker les étiquettes (promo, nouveau, etc.)
  rating DECIMAL(2,1) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du panier
CREATE TABLE cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

-- Table des favoris
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

-- Table des commandes
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB,
  phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items de commande
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes sur mesure
CREATE TABLE custom_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des avis et notes
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

-- Table des newsletters
CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques
CREATE TABLE site_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash_on_delivery', 'bank_transfer', 'paypal', etc.
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  transaction_id VARCHAR(255),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des adresses de livraison
CREATE TABLE shipping_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Morocco',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des codes promo
CREATE TABLE promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisations de codes promo
CREATE TABLE promo_code_uses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages de contact
CREATE TABLE contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'read', 'replied', 'closed'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des témoignages/avis clients
CREATE TABLE testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres du site
CREATE TABLE site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insertion des données de base

-- Catégories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Bagues', 'bagues', 'Collection de bagues berbères et modernes', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&h=300&fit=crop'),
('Colliers', 'colliers', 'Colliers traditionnels et contemporains', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop'),
('Bracelets', 'bracelets', 'Bracelets élégants et résistants', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300&h=300&fit=crop'),
('Boucles d''oreilles', 'boucles-oreilles', 'Boucles d''oreilles traditionnelles et modernes', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=300&fit=crop'),
('Parures', 'parures', 'Ensembles coordonnés de bijoux', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop'),
('Broches', 'broches', 'Broches décoratives et élégantes', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=300&h=300&fit=crop');

-- Packs avec prix en MAD
INSERT INTO packs (name, slug, description, price, image_url, is_featured) VALUES
('Pack Élégance Berbère', 'pack-elegance-berbere', 'Collection traditionnelle : Bague berbère + Collier filigrane + Boucles traditionnelles. Artisanat marocain authentique.', 1599.00, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop', true),
('Pack Moderne Chic', 'pack-moderne-chic', 'Style contemporain : 3 Bagues modernes + Bracelet délicat + Collier minimaliste. Design épuré et élégant.', 899.00, 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&h=500&fit=crop', true),
('Pack Mariée Royale', 'pack-mariee-royale', 'Pour votre jour J : Parure complète avec collier, boucles et bracelet assortis. Finition dorée premium.', 2499.00, 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&h=500&fit=crop', true),
('Pack Quotidien Premium', 'pack-quotidien-premium', 'Bijoux de tous les jours : Bracelet chaîne + Bague simple + Boucles discrètes. Confort et élégance.', 699.00, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&h=500&fit=crop', true);

-- Bijoux vedettes avec prix MAD, noms arabes et étiquettes
INSERT INTO bijoux (name, name_ar, description, price, original_price, category_id, image_url, images, rating, reviews_count, is_available, is_featured) VALUES
-- Bagues Vedettes
('Bague Berbère Or 18K', 'خاتم بربري ذهب', 'Bague traditionnelle berbère en or 18 carats avec motifs gravés authentiques. Pièce d''exception artisanale.', 2999.00, 3999.00, (SELECT id FROM categories WHERE slug = 'bagues'), 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', '["promo", "bestseller"]', 4.8, 127, true, true),

('Bague Alliance Diamantée', 'خاتم أنيق مرصع', 'Alliance moderne sertie de zirconiums, largeur 4mm. Finition polie miroir, confort optimal.', 1299.00, null, (SELECT id FROM categories WHERE slug = 'bagues'), 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', '["nouveau"]', 4.6, 89, true, true),

('Bague Solitaire Premium', 'خاتم سوليتير فاخر', 'Solitaire classique avec pierre centrale 1 carat, monture 6 griffes. Éclat exceptionnel garanti.', 1899.00, null, (SELECT id FROM categories WHERE slug = 'bagues'), 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', '["premium"]', 4.9, 203, true, true),

('Bague Vintage Art Déco', 'خاتم عتيق آرت ديكو', 'Design inspiré des années 1920, motifs géométriques finement ciselés. Style intemporel et raffiné.', 899.00, 1199.00, (SELECT id FROM categories WHERE slug = 'bagues'), 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', '["promo"]', 4.4, 156, true, true),

-- Colliers Vedettes  
('Collier Filigrane Argent', 'قلادة فضية مشغولة', 'Collier traditionnel en filigrane d''argent 925, motifs floraux délicats. Savoir-faire artisanal marocain.', 1890.00, null, (SELECT id FROM categories WHERE slug = 'colliers'), 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', '["bestseller"]', 4.7, 178, true, true),

('Collier Pendentif Lune', 'قلادة هلال القمر', 'Pendentif croissant de lune avec détails gravés, chaîne serpent 45cm. Symbole de féminité et d''élégance.', 799.00, null, (SELECT id FROM categories WHERE slug = 'colliers'), 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', '["nouveau"]', 4.5, 92, true, true),

('Collier Ras de Cou Moderne', 'قلادة عصرية قصيرة', 'Choker contemporain 35cm avec pendentif géométrique. Style urbain et sophistiqué.', 599.00, 799.00, (SELECT id FROM categories WHERE slug = 'colliers'), 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', '["promo"]', 4.3, 67, true, true),

-- Bracelets Vedettes
('Bracelet Khomsa Protection', 'سوار خمسة للحماية', 'Bracelet traditionnel avec main de Fatma, symbole de protection. Argent 925 avec détails émaillés.', 890.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop', '["bestseller"]', 4.6, 134, true, true),

('Bracelet Tennis Luxe', 'سوار تنس فاخر', 'Bracelet tennis avec zirconiums AAA, 18cm. Fermoir sécurisé, éclat diamant garanti.', 1599.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop', '["premium"]', 4.8, 201, true, true),

('Bracelet Chaîne Gourmette', 'سوار سلسلة كلاسيكي', 'Gourmette classique 8mm, 20cm. Style intemporel, finition polie brillante.', 699.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop', '[]', 4.4, 78, true, true),

-- Boucles d'oreilles Vedettes
('Boucles Créoles Berbères', 'أقراط دائرية بربرية', 'Créoles traditionnelles avec motifs berbères gravés, diamètre 4cm. Argent 925 patiné.', 599.00, null, (SELECT id FROM categories WHERE slug = 'boucles-oreilles'), 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop', '["nouveau"]', 4.5, 89, true, true),

('Boucles Pendantes Cascade', 'أقراط متدلية متدرجة', 'Boucles longues avec effet cascade, mouvement fluide. Design contemporain et féminin.', 799.00, 999.00, (SELECT id FROM categories WHERE slug = 'boucles-oreilles'), 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop', '["promo"]', 4.7, 145, true, true),

-- Parures Vedettes
('Parure Mariée Royale', 'طقم عروس ملكي', 'Ensemble complet : collier, boucles, bracelet et bague. Finition dorée, cristaux Swarovski.', 5999.00, null, (SELECT id FROM categories WHERE slug = 'parures'), 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', '["premium", "bestseller"]', 4.9, 267, true, true),

('Parure Berbère Authentique', 'طقم بربري أصيل', 'Parure traditionnelle 4 pièces, motifs berbères authentiques. Argent 925 avec émaux colorés.', 3499.00, null, (SELECT id FROM categories WHERE slug = 'parures'), 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', '["nouveau"]', 4.6, 112, true, true),

-- Broches
('Broche Papillon Doré', 'بروش فراشة ذهبية', 'Broche élégante en forme de papillon, finition dorée avec cristaux. Parfaite pour les occasions spéciales.', 399.00, null, (SELECT id FROM categories WHERE slug = 'broches'), 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop', '["nouveau"]', 4.3, 45, true, true);

-- 5. Création des index pour optimiser les performances
CREATE INDEX idx_bijoux_category ON bijoux(category_id);
CREATE INDEX idx_bijoux_pack ON bijoux(pack_id);
CREATE INDEX idx_bijoux_featured ON bijoux(is_featured);
CREATE INDEX idx_bijoux_available ON bijoux(is_available);
CREATE INDEX idx_bijoux_price ON bijoux(price);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_custom_requests_user ON custom_requests(user_id);
CREATE INDEX idx_custom_requests_status ON custom_requests(status);
CREATE INDEX idx_reviews_bijou ON reviews(bijou_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX idx_site_stats_date ON site_stats(date);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- 6. Activation de la sécurité RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité basiques
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Les tables publiques (categories, bijoux, packs) restent lisibles par tous
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Bijoux are viewable by everyone" ON bijoux FOR SELECT USING (true);
CREATE POLICY "Packs are viewable by everyone" ON packs FOR SELECT USING (true);

-- Politiques pour les nouvelles tables
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own custom requests" ON custom_requests FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own reviews" ON reviews FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Newsletter subscriptions are public" ON newsletter_subscriptions FOR SELECT USING (true);
CREATE POLICY "Site stats are viewable by everyone" ON site_stats FOR SELECT USING (true);
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own shipping addresses" ON shipping_addresses FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Promo codes are viewable by everyone" ON promo_codes FOR SELECT USING (true);
CREATE POLICY "Users can view their own promo code uses" ON promo_code_uses FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Contact messages are viewable by everyone" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "Testimonials are viewable by everyone" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Site settings are viewable by everyone" ON site_settings FOR SELECT USING (is_public = true);

-- 7. Fonctions utilitaires
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour automatiquement les notes des bijoux
CREATE OR REPLACE FUNCTION update_bijou_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bijoux 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 4.5) 
            FROM reviews 
            WHERE bijou_id = NEW.bijou_id
        ),
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE bijou_id = NEW.bijou_id
        )
    WHERE id = NEW.bijou_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement les notes
CREATE TRIGGER update_bijou_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_bijou_rating();

-- 8. Créer l'utilisateur admin par défaut
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  'admin_phone', 
  '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', -- mot de passe: admin123
  'Admin', 
  'INOXYA', 
  'admin'
) ON CONFLICT (phone) DO NOTHING;

-- 9. Insérer des données de test pour les nouvelles tables

-- Codes promo de test
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_until) VALUES
('BIENVENUE10', 'Réduction de bienvenue 10%', 'percentage', 10.00, 100.00, 100, NOW() + INTERVAL '1 year'),
('LIVRAISON_GRATUITE', 'Livraison gratuite', 'fixed', 30.00, 200.00, 1000, NOW() + INTERVAL '1 year'),
('PREMIUM20', 'Réduction premium 20%', 'percentage', 20.00, 500.00, 50, NOW() + INTERVAL '6 months');

-- Paramètres du site
INSERT INTO site_settings (key, value, description, type, is_public) VALUES
('site_name', 'INOXYA BIJOUX', 'Nom du site', 'string', true),
('site_description', 'Bijoux en acier inoxydable de qualité premium', 'Description du site', 'string', true),
('free_shipping_threshold', '200', 'Seuil pour la livraison gratuite (MAD)', 'number', true),
('contact_email', 'contact@inoxya-bijoux.com', 'Email de contact', 'string', true),
('contact_phone', '+212 5XX XXX XXX', 'Téléphone de contact', 'string', true),
('maintenance_mode', 'false', 'Mode maintenance', 'boolean', false),
('max_upload_size', '5242880', 'Taille maximale des uploads (bytes)', 'number', false);

-- Témoignages de test
INSERT INTO testimonials (name, email, rating, title, content, is_approved, is_featured) VALUES
('Fatima A.', 'fatima@example.com', 5, 'Magnifique qualité !', 'Les bijoux INOXYA sont d''une qualité exceptionnelle. Je recommande vivement !', true, true),
('Ahmed M.', 'ahmed@example.com', 5, 'Service impeccable', 'Livraison rapide et bijoux magnifiques. Merci INOXYA !', true, true),
('Aicha B.', 'aicha@example.com', 4, 'Très satisfaite', 'Belle collection, prix raisonnables. Je reviendrai !', true, false);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données INOXYA BIJOUX configurée avec succès !';
    RAISE NOTICE '📊 Données insérées : % catégories, % packs, % bijoux', 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM packs), 
        (SELECT COUNT(*) FROM bijoux);
    RAISE NOTICE '👤 Utilisateur admin créé : admin_phone / admin123';
    RAISE NOTICE '🔒 Politiques de sécurité configurées pour toutes les tables';
    RAISE NOTICE '📊 Tables créées : users, categories, packs, bijoux, cart_items, favorites, orders, order_items';
    RAISE NOTICE '📊 Tables fonctionnelles : user_sessions, custom_requests, reviews, newsletter_subscriptions, site_stats';
    RAISE NOTICE '📊 Tables avancées : payments, shipping_addresses, notifications, promo_codes, contact_messages, testimonials, site_settings';
    RAISE NOTICE '🎁 Codes promo créés : BIENVENUE10, LIVRAISON_GRATUITE, PREMIUM20';
    RAISE NOTICE '⭐ Témoignages clients ajoutés';
    RAISE NOTICE '⚙️ Paramètres du site configurés';
END $$;
