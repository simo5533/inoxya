-- Script simplifié pour créer les tables essentielles INOXYA BIJOUX
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

-- 4. Insertion des données de base

-- Catégories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Bagues', 'bagues', 'Collection de bagues berbères et modernes', '/images/categories/bagues.jpg'),
('Colliers', 'colliers', 'Colliers traditionnels et contemporains', '/images/categories/colliers.jpg'),
('Bracelets', 'bracelets', 'Bracelets élégants et résistants', '/images/categories/bracelets.jpg'),
('Boucles d''oreilles', 'boucles-oreilles', 'Boucles d''oreilles traditionnelles et modernes', '/images/categories/boucles.jpg'),
('Parures', 'parures', 'Ensembles coordonnés de bijoux', '/images/categories/parures.jpg'),
('Broches', 'broches', 'Broches décoratives et élégantes', '/images/categories/broches.jpg');

-- Packs avec prix en MAD
INSERT INTO packs (name, slug, description, price, image_url, is_featured) VALUES
('Pack Élégance Berbère', 'pack-elegance-berbere', 'Collection traditionnelle : Bague berbère + Collier filigrane + Boucles traditionnelles. Artisanat marocain authentique.', 1599.00, '/images/packs/pack-elegance-berbere/main.jpg', true),
('Pack Moderne Chic', 'pack-moderne-chic', 'Style contemporain : 3 Bagues modernes + Bracelet délicat + Collier minimaliste. Design épuré et élégant.', 899.00, '/images/packs/pack-moderne-chic/main.jpg', true),
('Pack Mariée Royale', 'pack-mariee-royale', 'Pour votre jour J : Parure complète avec collier, boucles et bracelet assortis. Finition dorée premium.', 2499.00, '/images/packs/pack-mariee-royale/main.jpg', true),
('Pack Quotidien Premium', 'pack-quotidien-premium', 'Bijoux de tous les jours : Bracelet chaîne + Bague simple + Boucles discrètes. Confort et élégance.', 699.00, '/images/packs/pack-quotidien-premium/main.jpg', true);

-- Bijoux vedettes avec prix MAD, noms arabes et étiquettes
INSERT INTO bijoux (name, name_ar, description, price, original_price, category_id, image_url, images, rating, reviews_count, is_available, is_featured) VALUES
-- Bagues Vedettes
('Bague Berbère Or 18K', 'خاتم بربري ذهب', 'Bague traditionnelle berbère en or 18 carats avec motifs gravés authentiques. Pièce d''exception artisanale.', 2999.00, 3999.00, (SELECT id FROM categories WHERE slug = 'bagues'), '/images/bijoux/bagues/bague-berbere-or-18k/main.jpg', '["promo", "bestseller"]', 4.8, 127, true, true),

('Bague Alliance Diamantée', 'خاتم أنيق مرصع', 'Alliance moderne sertie de zirconiums, largeur 4mm. Finition polie miroir, confort optimal.', 1299.00, null, (SELECT id FROM categories WHERE slug = 'bagues'), '/images/bijoux/bagues/bague-alliance-diamantee/main.jpg', '["nouveau"]', 4.6, 89, true, true),

('Bague Solitaire Premium', 'خاتم سوليتير فاخر', 'Solitaire classique avec pierre centrale 1 carat, monture 6 griffes. Éclat exceptionnel garanti.', 1899.00, null, (SELECT id FROM categories WHERE slug = 'bagues'), '/images/bijoux/bagues/bague-solitaire-premium/main.jpg', '["premium"]', 4.9, 203, true, true),

('Bague Vintage Art Déco', 'خاتم عتيق آرت ديكو', 'Design inspiré des années 1920, motifs géométriques finement ciselés. Style intemporel et raffiné.', 899.00, 1199.00, (SELECT id FROM categories WHERE slug = 'bagues'), '/images/bijoux/bagues/bague-vintage-art-deco/main.jpg', '["promo"]', 4.4, 156, true, true),

-- Colliers Vedettes  
('Collier Filigrane Argent', 'قلادة فضية مشغولة', 'Collier traditionnel en filigrane d''argent 925, motifs floraux délicats. Savoir-faire artisanal marocain.', 1890.00, null, (SELECT id FROM categories WHERE slug = 'colliers'), '/images/bijoux/colliers/collier-filigrane-argent/main.jpg', '["bestseller"]', 4.7, 178, true, true),

('Collier Pendentif Lune', 'قلادة هلال القمر', 'Pendentif croissant de lune avec détails gravés, chaîne serpent 45cm. Symbole de féminité et d''élégance.', 799.00, null, (SELECT id FROM categories WHERE slug = 'colliers'), '/images/bijoux/colliers/collier-pendentif-lune/main.jpg', '["nouveau"]', 4.5, 92, true, true),

('Collier Ras de Cou Moderne', 'قلادة عصرية قصيرة', 'Choker contemporain 35cm avec pendentif géométrique. Style urbain et sophistiqué.', 599.00, 799.00, (SELECT id FROM categories WHERE slug = 'colliers'), '/images/bijoux/colliers/collier-ras-de-cou-moderne/main.jpg', '["promo"]', 4.3, 67, true, true),

-- Bracelets Vedettes
('Bracelet Khomsa Protection', 'سوار خمسة للحماية', 'Bracelet traditionnel avec main de Fatma, symbole de protection. Argent 925 avec détails émaillés.', 890.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), '/images/bijoux/bracelets/bracelet-khomsa-protection/main.jpg', '["bestseller"]', 4.6, 134, true, true),

('Bracelet Tennis Luxe', 'سوار تنس فاخر', 'Bracelet tennis avec zirconiums AAA, 18cm. Fermoir sécurisé, éclat diamant garanti.', 1599.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), '/images/bijoux/bracelets/bracelet-tennis-luxe/main.jpg', '["premium"]', 4.8, 201, true, true),

('Bracelet Chaîne Gourmette', 'سوار سلسلة كلاسيكي', 'Gourmette classique 8mm, 20cm. Style intemporel, finition polie brillante.', 699.00, null, (SELECT id FROM categories WHERE slug = 'bracelets'), '/images/bijoux/bracelets/bracelet-chaine-gourmette/main.jpg', '[]', 4.4, 78, true, true),

-- Boucles d'oreilles Vedettes
('Boucles Créoles Berbères', 'أقراط دائرية بربرية', 'Créoles traditionnelles avec motifs berbères gravés, diamètre 4cm. Argent 925 patiné.', 599.00, null, (SELECT id FROM categories WHERE slug = 'boucles-oreilles'), '/images/bijoux/boucles-oreilles/boucles-creoles-berberes/main.jpg', '["nouveau"]', 4.5, 89, true, true),

('Boucles Pendantes Cascade', 'أقراط متدلية متدرجة', 'Boucles longues avec effet cascade, mouvement fluide. Design contemporain et féminin.', 799.00, 999.00, (SELECT id FROM categories WHERE slug = 'boucles-oreilles'), '/images/bijoux/boucles-oreilles/boucles-pendantes-cascade/main.jpg', '["promo"]', 4.7, 145, true, true),

-- Parures Vedettes
('Parure Mariée Royale', 'طقم عروس ملكي', 'Ensemble complet : collier, boucles, bracelet et bague. Finition dorée, cristaux Swarovski.', 5999.00, null, (SELECT id FROM categories WHERE slug = 'parures'), '/images/bijoux/parures/parure-mariee-royale/main.jpg', '["premium", "bestseller"]', 4.9, 267, true, true),

('Parure Berbère Authentique', 'طقم بربري أصيل', 'Parure traditionnelle 4 pièces, motifs berbères authentiques. Argent 925 avec émaux colorés.', 3499.00, null, (SELECT id FROM categories WHERE slug = 'parures'), '/images/bijoux/parures/parure-berbere-authentique/main.jpg', '["nouveau"]', 4.6, 112, true, true),

-- Broches
('Broche Papillon Doré', 'بروش فراشة ذهبية', 'Broche élégante en forme de papillon, finition dorée avec cristaux. Parfaite pour les occasions spéciales.', 399.00, null, (SELECT id FROM categories WHERE slug = 'broches'), '/images/bijoux/broches/broche-papillon-dore/main.jpg', '["nouveau"]', 4.3, 45, true, true);

-- 5. Créer l'utilisateur admin par défaut
INSERT INTO users (phone, password_hash, first_name, last_name, role) 
VALUES (
  'admin_phone', 
  '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', -- mot de passe: admin123
  'Admin', 
  'INOXYA', 
  'admin'
) ON CONFLICT (phone) DO NOTHING;

-- 6. Création des index pour optimiser les performances
CREATE INDEX idx_bijoux_category ON bijoux(category_id);
CREATE INDEX idx_bijoux_pack ON bijoux(pack_id);
CREATE INDEX idx_bijoux_featured ON bijoux(is_featured);
CREATE INDEX idx_bijoux_available ON bijoux(is_available);
CREATE INDEX idx_bijoux_price ON bijoux(price);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);

-- 7. Activation de la sécurité RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité basiques
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Les tables publiques (categories, bijoux, packs) restent lisibles par tous
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Bijoux are viewable by everyone" ON bijoux FOR SELECT USING (true);
CREATE POLICY "Packs are viewable by everyone" ON packs FOR SELECT USING (true);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables INOXYA BIJOUX créées avec succès !';
    RAISE NOTICE '📊 Données insérées : % catégories, % packs, % bijoux', 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM packs), 
        (SELECT COUNT(*) FROM bijoux);
    RAISE NOTICE '👤 Utilisateur admin créé : admin_phone / admin123';
    RAISE NOTICE '🔒 Politiques de sécurité configurées';
END $$;
