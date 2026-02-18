-- Script pour créer les tables fonctionnelles supplémentaires INOXYA BIJOUX
-- Exécutez ce script APRÈS avoir exécuté create-tables-simple.sql

-- 1. Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des demandes sur mesure
CREATE TABLE IF NOT EXISTS custom_requests (
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

-- 3. Table des avis et notes
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bijou_id UUID REFERENCES bijoux(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bijou_id)
);

-- 4. Table des newsletters
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des statistiques
CREATE TABLE IF NOT EXISTS site_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_custom_requests_user ON custom_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_reviews_bijou ON reviews(bijou_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_site_stats_date ON site_stats(date);

-- 7. Activation de la sécurité RLS (Row Level Security)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- 8. Politiques de sécurité
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own custom requests" ON custom_requests FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own reviews" ON reviews FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Newsletter subscriptions are public" ON newsletter_subscriptions FOR SELECT USING (true);
CREATE POLICY "Site stats are viewable by everyone" ON site_stats FOR SELECT USING (true);

-- 9. Fonction pour mettre à jour automatiquement les notes des bijoux
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

-- 10. Trigger pour mettre à jour automatiquement les notes
DROP TRIGGER IF EXISTS update_bijou_rating_trigger ON reviews;
CREATE TRIGGER update_bijou_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_bijou_rating();

-- 11. Insertion de données de test

-- Avis de test
INSERT INTO reviews (user_id, bijou_id, rating, comment) VALUES
((SELECT id FROM users WHERE phone = 'admin_phone'), (SELECT id FROM bijoux WHERE name = 'Bague Berbère Or 18K'), 5, 'Magnifique bague ! La qualité est exceptionnelle et la finition parfaite. Je recommande vivement INOXYA pour la qualité de leurs créations.'),
((SELECT id FROM users WHERE phone = 'admin_phone'), (SELECT id FROM bijoux WHERE name = 'Collier Filigrane Argent'), 4, 'Très beau collier, finition soignée. Petit bémol sur la longueur de la chaîne mais globalement satisfait.'),
((SELECT id FROM users WHERE phone = 'admin_phone'), (SELECT id FROM bijoux WHERE name = 'Bracelet Khomsa Protection'), 5, 'Bracelet magnifique, symbolique et bien fait. Livraison rapide, emballage soigné. Merci !')
ON CONFLICT (user_id, bijou_id) DO NOTHING;

-- Inscriptions newsletter de test
INSERT INTO newsletter_subscriptions (email, is_active) VALUES
('fatima@example.com', true),
('ahmed@example.com', true),
('aicha@example.com', true),
('mohamed@example.com', true),
('khadija@example.com', true)
ON CONFLICT (email) DO NOTHING;

-- Statistiques de test
INSERT INTO site_stats (page_views, unique_visitors, orders_count, revenue, date) VALUES
(1250, 89, 12, 18900.00, CURRENT_DATE),
(980, 67, 8, 12450.00, CURRENT_DATE - INTERVAL '1 day'),
(1150, 78, 15, 22500.00, CURRENT_DATE - INTERVAL '2 days'),
(1420, 95, 18, 28900.00, CURRENT_DATE - INTERVAL '3 days'),
(1080, 72, 11, 16750.00, CURRENT_DATE - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Demandes sur mesure de test
INSERT INTO custom_requests (user_id, name, email, phone, type, description, budget, status) VALUES
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Fatima A.', 'fatima@example.com', '0612345678', 'Bague de mariage', 'Je souhaite une bague de mariage personnalisée avec des motifs berbères. Budget entre 2000 et 3000 MAD.', 2500.00, 'pending'),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Ahmed M.', 'ahmed@example.com', '0698765432', 'Parure complète', 'Besoin d\'une parure complète pour ma femme : collier, boucles et bracelet assortis. Style moderne.', 4000.00, 'in_progress'),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Aicha B.', 'aicha@example.com', '0654321098', 'Bracelet personnalisé', 'Je voudrais un bracelet avec mon prénom gravé en arabe. Acier inoxydable de préférence.', 800.00, 'completed')
ON CONFLICT DO NOTHING;

-- 12. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables fonctionnelles INOXYA BIJOUX créées avec succès !';
    RAISE NOTICE '📊 Tables ajoutées : user_sessions, custom_requests, reviews, newsletter_subscriptions, site_stats';
    RAISE NOTICE '🔒 Politiques de sécurité configurées pour toutes les nouvelles tables';
    RAISE NOTICE '📊 Données de test insérées : avis, newsletter, statistiques, demandes sur mesure';
    RAISE NOTICE '⚙️ Triggers automatiques configurés pour la mise à jour des notes';
    RAISE NOTICE '📈 Système de statistiques opérationnel';
END $$;
