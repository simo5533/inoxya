-- Script SQL pour créer les tables de gestion avancée des packs
-- Exécuter ce script pour ajouter les fonctionnalités avancées de packs

-- Table des packs (version avancée)
CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT DEFAULT '[]', -- JSON array des images
  category TEXT DEFAULT 'general',
  tags TEXT DEFAULT '[]', -- JSON array des tags
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 100,
  min_items INTEGER DEFAULT 1,
  max_items INTEGER DEFAULT 10,
  discount TEXT DEFAULT '{}', -- JSON object pour les remises
  rating DECIMAL(2,1) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de composition des packs
CREATE TABLE IF NOT EXISTS pack_composition (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  bijou_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  is_customizable BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
  FOREIGN KEY (bijou_id) REFERENCES bijoux(id) ON DELETE CASCADE,
  UNIQUE(pack_id, bijou_id)
);

-- Table des packs personnalisés (commandes)
CREATE TABLE IF NOT EXISTS custom_packs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  pack_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  items TEXT NOT NULL, -- JSON array des items sélectionnés
  status TEXT DEFAULT 'draft', -- draft, ordered, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE SET NULL
);

-- Table des avis sur les packs
CREATE TABLE IF NOT EXISTS pack_reviews (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  user_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des favoris de packs
CREATE TABLE IF NOT EXISTS pack_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
  UNIQUE(user_id, pack_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_packs_category ON packs(category);
CREATE INDEX IF NOT EXISTS idx_packs_featured ON packs(is_featured);
CREATE INDEX IF NOT EXISTS idx_packs_active ON packs(is_active);
CREATE INDEX IF NOT EXISTS idx_pack_composition_pack_id ON pack_composition(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_composition_bijou_id ON pack_composition(bijou_id);
CREATE INDEX IF NOT EXISTS idx_custom_packs_user_id ON custom_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_pack_id ON pack_reviews(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_favorites_user_id ON pack_favorites(user_id);

-- Insérer des données d'exemple pour les packs avancés
INSERT OR IGNORE INTO packs (
  id, name, slug, description, price, original_price, image_url, 
  category, tags, is_featured, stock_quantity, min_items, max_items, discount
) VALUES 
(
  'pack-elegance-berbere',
  'Pack Élégance Berbère',
  'pack-elegance-berbere',
  'Collection traditionnelle authentique avec bague berbère, collier filigrane et boucles traditionnelles. Artisanat marocain de qualité.',
  1599.00,
  1999.00,
  '/images/packs/pack-elegance-berbere/main.jpg',
  'traditionnel',
  '["berbere", "traditionnel", "artisanal", "marocain"]',
  1,
  50,
  1,
  3,
  '{"type": "percentage", "value": 20}'
),
(
  'pack-moderne-chic',
  'Pack Moderne Chic',
  'pack-moderne-chic',
  'Style contemporain avec 3 bagues modernes, bracelet délicat et collier minimaliste. Design épuré et élégant.',
  899.00,
  1199.00,
  '/images/packs/pack-moderne-chic/main.jpg',
  'moderne',
  '["moderne", "chic", "contemporain", "minimaliste"]',
  1,
  75,
  1,
  5,
  '{"type": "percentage", "value": 25}'
),
(
  'pack-mariee-royale',
  'Pack Mariée Royale',
  'pack-mariee-royale',
  'Parure complète pour votre jour J avec collier, boucles et bracelet assortis. Finition dorée premium.',
  2499.00,
  2999.00,
  '/images/packs/pack-mariee-royale/main.jpg',
  'mariage',
  '["mariage", "royal", "premium", "doré"]',
  1,
  25,
  1,
  2,
  '{"type": "fixed", "value": 500}'
);

-- Insérer la composition des packs
INSERT OR IGNORE INTO pack_composition (id, pack_id, bijou_id, quantity, is_required, is_customizable) VALUES
-- Pack Élégance Berbère
('pc-1', 'pack-elegance-berbere', 'bijou-1', 1, 1, 0), -- Bague Berbère Or 18K
('pc-2', 'pack-elegance-berbere', 'bijou-6', 1, 1, 0), -- Collier Filigrane Argent
('pc-3', 'pack-elegance-berbere', 'bijou-15', 1, 1, 0), -- Boucles Traditionnelles

-- Pack Moderne Chic
('pc-4', 'pack-moderne-chic', 'bijou-2', 1, 1, 1), -- Bague Alliance Diamantée
('pc-5', 'pack-moderne-chic', 'bijou-3', 1, 1, 1), -- Bague Solitaire Premium
('pc-6', 'pack-moderne-chic', 'bijou-8', 1, 1, 1), -- Bracelet Khomsa Protection

-- Pack Mariée Royale
('pc-7', 'pack-mariee-royale', 'bijou-1', 1, 1, 0), -- Bague Berbère Or 18K
('pc-8', 'pack-mariee-royale', 'bijou-6', 1, 1, 0), -- Collier Filigrane Argent
('pc-9', 'pack-mariee-royale', 'bijou-15', 1, 1, 0); -- Boucles Traditionnelles

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS update_packs_timestamp 
AFTER UPDATE ON packs
BEGIN
  UPDATE packs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_custom_packs_timestamp 
AFTER UPDATE ON custom_packs
BEGIN
  UPDATE custom_packs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
