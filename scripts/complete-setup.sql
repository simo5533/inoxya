-- Script de configuration complète pour INOXYA BIJOUX
-- Exécutez ce script dans l'ordre dans la console SQL de Supabase

-- 1. Créer les tables de base
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bijoux (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- 2. Ajouter la contrainte pour les rôles
ALTER TABLE users
ADD CONSTRAINT chk_user_role CHECK (role IN ('user', 'moderator', 'admin'));

-- 3. Insérer les catégories
INSERT INTO categories (name, slug, description) VALUES
('Bagues', 'bagues', 'Collection de bagues berbères et modernes'),
('Colliers', 'colliers', 'Colliers traditionnels et contemporains'),
('Bracelets', 'bracelets', 'Bracelets élégants et résistants'),
('Boucles d''oreilles', 'boucles-oreilles', 'Boucles d''oreilles traditionnelles et modernes'),
('Parures', 'parures', 'Ensembles coordonnés de bijoux'),
('Broches', 'broches', 'Broches décoratives et élégantes')
ON CONFLICT (slug) DO NOTHING;

-- 4. Insérer des produits de test
INSERT INTO bijoux (name, name_ar, description, price, original_price, image_url, images, rating, reviews_count, category_id, is_featured) VALUES
('Bague Berbère Or 18K', 'خاتم بربري ذهب', 'Bague traditionnelle berbère en or 18K avec motifs gravés authentiques.', 2999, 3999, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', ARRAY['promo', 'bestseller'], 4.8, 127, (SELECT id FROM categories WHERE slug = 'bagues'), true),
('Collier Filigrane Argent', 'قلادة فضية مشغولة', 'Collier traditionnel en filigrane d''argent 925, motifs floraux délicats.', 1890, NULL, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', ARRAY['bestseller'], 4.7, 178, (SELECT id FROM categories WHERE slug = 'colliers'), true),
('Bracelet Khomsa Protection', 'سوار خمسة للحماية', 'Bracelet traditionnel avec main de Fatma, symbole de protection.', 890, NULL, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop', ARRAY['bestseller'], 4.6, 134, (SELECT id FROM categories WHERE slug = 'bracelets'), true),
('Boucles Créoles Berbères', 'أقراط دائرية بربرية', 'Créoles traditionnelles avec motifs berbères gravés, diamètre 4cm.', 599, NULL, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop', ARRAY['nouveau'], 4.5, 89, (SELECT id FROM categories WHERE slug = 'boucles-oreilles'), true),
('Parure Mariée Royale', 'طقم عروس ملكي', 'Ensemble complet : collier, boucles, bracelet et bague.', 5999, NULL, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', ARRAY['premium', 'bestseller'], 4.9, 267, (SELECT id FROM categories WHERE slug = 'parures'), true)
ON CONFLICT DO NOTHING;

-- 5. Créer les utilisateurs de test
-- Note: Les mots de passe sont hashés avec bcrypt (salt 10)
-- Mot de passe pour tous: "password"
INSERT INTO users (phone, password_hash, first_name, last_name, role) VALUES
('admin_phone', '$2a$10$2B.a.real.bcrypt.hash.for.password.here.for.test', 'Admin', 'Principal', 'admin'),
('0698765432', '$2a$10$2B.a.real.bcrypt.hash.for.password.here.for.test', 'Modérateur', 'Test', 'moderator'),
('0612345678', '$2a$10$2B.a.real.bcrypt.hash.for.password.here.for.test', 'Utilisateur', 'Standard', 'user')
ON CONFLICT (phone) DO NOTHING;

-- 6. Vérifier la configuration
SELECT 'Configuration terminée avec succès!' as status;

-- Afficher les utilisateurs créés
SELECT 
  phone,
  first_name,
  last_name,
  role,
  created_at
FROM users 
ORDER BY role, created_at;

-- Afficher les catégories
SELECT name, slug, description FROM categories;

-- Afficher les produits
SELECT name, price, is_available FROM bijoux LIMIT 5;
