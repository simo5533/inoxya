-- Script SQL pour créer la table des produits dans Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Créer la table products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  original_price DECIMAL(10,2) CHECK (original_price > 0),
  category VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur la catégorie pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Créer un index sur le statut actif
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Créer un index sur la date de création
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Insérer quelques produits d'exemple
INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url) VALUES
('Bague Berbère Or 18K', 'خاتم بربري ذهبي', 'Magnifique bague berbère en or 18 carats avec motifs traditionnels marocains.', 2999.00, 3999.00, 'Bagues', 5, true, '/placeholder.svg'),
('Collier Filigrane Argent', 'قلادة فضية مزركشة', 'Collier en argent sterling avec technique de filigrane traditionnel.', 1890.00, NULL, 'Colliers', 8, true, '/placeholder.svg'),
('Bracelet Khomsa Protection', 'سوار خميسة الحماية', 'Bracelet avec la main de Fatma (Khomsa) pour la protection et la chance.', 890.00, 1200.00, 'Bracelets', 12, true, '/placeholder.svg'),
('Boucles d''oreilles Perles', 'أقراط اللؤلؤ', 'Élégantes boucles d''oreilles avec perles naturelles et finitions dorées.', 1200.00, NULL, 'Boucles d''oreilles', 3, false, '/placeholder.svg'),
('Pendentif Étoile Marocaine', 'قلادة نجمة مغربية', 'Pendentif en argent avec motif d''étoile à cinq branches, symbole marocain.', 750.00, NULL, 'Pendentifs', 15, true, '/placeholder.svg'),
('Chaîne Or 14K', 'سلسلة ذهبية', 'Chaîne en or 14 carats, élégante et résistante pour tous les jours.', 1500.00, 2000.00, 'Chaînes', 6, true, '/placeholder.svg')
ON CONFLICT DO NOTHING;

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security (RLS) pour la sécurité
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access for authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Créer une politique pour permettre l'insertion, modification et suppression aux admins seulement
CREATE POLICY "Allow admin full access" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table products créée avec succès avec les produits d''exemple !';
    RAISE NOTICE 'Politiques de sécurité RLS activées.';
    RAISE NOTICE 'Trigger pour updated_at configuré.';
END $$;
