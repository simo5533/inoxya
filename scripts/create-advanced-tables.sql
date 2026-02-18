-- Script pour créer les tables avancées INOXYA BIJOUX
-- Exécutez ce script APRÈS avoir exécuté create-tables-simple.sql ET create-additional-tables.sql

-- 1. Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  payment_method VARCHAR(50) NOT NULL, -- 'cash_on_delivery', 'bank_transfer', 'paypal', 'stripe'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  transaction_id VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des adresses de livraison
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(10),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'order', 'promotion', 'newsletter', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'read', 'replied', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id),
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des témoignages
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  customer_photo VARCHAR(500),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  testimonial TEXT NOT NULL,
  product_id UUID REFERENCES bijoux(id),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des paramètres du site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- 'general', 'payment', 'shipping', 'email', 'seo'
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_order ON shipping_addresses(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

-- 9. Activation de la sécurité RLS (Row Level Security)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 10. Politiques de sécurité
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own shipping addresses" ON shipping_addresses FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Promo codes are viewable by everyone" ON promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Contact messages are viewable by admins" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "Testimonials are viewable by everyone" ON testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "Public site settings are viewable by everyone" ON site_settings FOR SELECT USING (is_public = true);

-- 11. Fonction pour mettre à jour automatiquement le statut des commandes
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'completed' THEN
        UPDATE orders 
        SET status = 'paid' 
        WHERE id = NEW.order_id;
    ELSIF NEW.payment_status = 'failed' THEN
        UPDATE orders 
        SET status = 'payment_failed' 
        WHERE id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Trigger pour mettre à jour automatiquement le statut des commandes
DROP TRIGGER IF EXISTS update_order_payment_status_trigger ON payments;
CREATE TRIGGER update_order_payment_status_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_order_payment_status();

-- 13. Fonction pour créer une notification automatique
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
        NEW.user_id,
        'Nouvelle commande créée',
        'Votre commande #' || NEW.id || ' a été créée avec succès.',
        'order',
        '/orders/' || NEW.id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Trigger pour créer une notification lors de la création d'une commande
DROP TRIGGER IF EXISTS create_order_notification_trigger ON orders;
CREATE TRIGGER create_order_notification_trigger
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION create_notification();

-- 15. Insertion de données de test

-- Codes promo de test
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, usage_limit, valid_until) VALUES
('WELCOME10', '10% de réduction pour les nouveaux clients', 'percentage', 10.00, 500.00, 100, NOW() + INTERVAL '30 days'),
('FREESHIP', 'Livraison gratuite à partir de 1000 MAD', 'fixed', 50.00, 1000.00, 50, NOW() + INTERVAL '15 days'),
('LOYALTY20', '20% de réduction pour les clients fidèles', 'percentage', 20.00, 2000.00, 25, NOW() + INTERVAL '7 days'),
('RAMADAN2024', 'Réduction spéciale Ramadan', 'percentage', 15.00, 800.00, 200, NOW() + INTERVAL '45 days')
ON CONFLICT (code) DO NOTHING;

-- Paramètres du site
INSERT INTO site_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
('site_name', 'INOXYA BIJOUX', 'text', 'Nom du site', 'general', true),
('site_description', 'Bijoux artisanaux marocains de qualité exceptionnelle', 'text', 'Description du site', 'general', true),
('contact_email', 'contact@inoxya-bijoux.ma', 'text', 'Email de contact', 'general', true),
('contact_phone', '+212 5XX XXX XXX', 'text', 'Téléphone de contact', 'general', true),
('free_shipping_threshold', '1000', 'number', 'Montant minimum pour la livraison gratuite (MAD)', 'shipping', true),
('shipping_cost', '50', 'number', 'Coût de livraison standard (MAD)', 'shipping', true),
('currency', 'MAD', 'text', 'Devise principale', 'general', true),
('tax_rate', '20', 'number', 'Taux de TVA (%)', 'general', false),
('order_processing_time', '2-3', 'text', 'Délai de traitement des commandes (jours)', 'general', true),
('return_policy_days', '14', 'number', 'Délai de retour (jours)', 'general', true),
('whatsapp_number', '+212 6XX XXX XXX', 'text', 'Numéro WhatsApp pour les commandes', 'general', true),
('social_facebook', 'https://facebook.com/inoxya-bijoux', 'text', 'Page Facebook', 'general', true),
('social_instagram', 'https://instagram.com/inoxya_bijoux', 'text', 'Compte Instagram', 'general', true),
('seo_title', 'INOXYA BIJOUX - Bijoux Artisanaux Marocains', 'text', 'Titre SEO', 'seo', true),
('seo_description', 'Découvrez notre collection de bijoux artisanaux marocains. Bagues, colliers, bracelets et parures de qualité exceptionnelle.', 'text', 'Description SEO', 'seo', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Témoignages de test
INSERT INTO testimonials (user_id, customer_name, customer_email, rating, testimonial, product_id, is_featured, is_approved) VALUES
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Fatima Alami', 'fatima.alami@example.com', 5, 'Service exceptionnel ! Ma bague de mariage est magnifique et la qualité dépasse mes attentes. Je recommande vivement INOXYA.', (SELECT id FROM bijoux WHERE name = 'Bague Berbère Or 18K'), true, true),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Ahmed Benali', 'ahmed.benali@example.com', 5, 'Très satisfait de mon achat. Le collier est exactement comme sur la photo et la livraison a été rapide. Merci !', (SELECT id FROM bijoux WHERE name = 'Collier Filigrane Argent'), true, true),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Aicha Tazi', 'aicha.tazi@example.com', 4, 'Belle qualité, finition soignée. Petit délai de livraison mais le résultat en vaut la peine.', (SELECT id FROM bijoux WHERE name = 'Bracelet Khomsa Protection'), false, true),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Mohamed El Fassi', 'mohamed.elfassi@example.com', 5, 'Parfait ! Le service client est excellent et les bijoux sont de très belle qualité. Je reviendrai certainement.', (SELECT id FROM bijoux WHERE name = 'Boucles d''Oreilles Émeraude'), false, true),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Khadija Idrissi', 'khadija.idrissi@example.com', 5, 'Commande sur mesure réalisée à la perfection. L''équipe a su comprendre mes besoins et livrer exactement ce que je voulais.', (SELECT id FROM bijoux WHERE name = 'Bague Alliance Diamantée'), true, true)
ON CONFLICT DO NOTHING;

-- Messages de contact de test
INSERT INTO contact_messages (name, email, phone, subject, message, status, priority) VALUES
('Youssef Alaoui', 'youssef.alaoui@example.com', '0612345678', 'Question sur la livraison', 'Bonjour, je souhaite savoir si vous livrez à Casablanca et quels sont les délais ?', 'new', 'normal'),
('Zineb Benkirane', 'zineb.benkirane@example.com', '0698765432', 'Commande sur mesure', 'Je souhaite une bague personnalisée pour mon mariage. Pouvez-vous me contacter ?', 'new', 'high'),
('Omar Tazi', 'omar.tazi@example.com', '0654321098', 'Retour produit', 'J''ai reçu ma commande mais le bracelet ne correspond pas à la taille commandée.', 'new', 'normal'),
('Hafsa El Mansouri', 'hafsa.elmansouri@example.com', '0678901234', 'Demande de partenariat', 'Je suis propriétaire d''une boutique et souhaite devenir revendeur de vos bijoux.', 'new', 'normal'),
('Rachid Benjelloun', 'rachid.benjelloun@example.com', '0634567890', 'Compliment', 'Félicitations pour la qualité de vos bijoux ! Ma femme adore sa nouvelle bague.', 'new', 'low')
ON CONFLICT DO NOTHING;

-- Notifications de test
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Bienvenue sur INOXYA BIJOUX !', 'Découvrez notre collection exclusive de bijoux artisanaux marocains.', 'system', false),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Nouvelle promotion disponible', 'Profitez de 10% de réduction avec le code WELCOME10 sur votre première commande.', 'promotion', false),
((SELECT id FROM users WHERE phone = 'admin_phone'), 'Livraison gratuite', 'Livraison gratuite à partir de 1000 MAD avec le code FREESHIP.', 'promotion', false)
ON CONFLICT DO NOTHING;

-- 16. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables avancées INOXYA BIJOUX créées avec succès !';
    RAISE NOTICE '💳 Tables ajoutées : payments, shipping_addresses, notifications, promo_codes, contact_messages, testimonials, site_settings';
    RAISE NOTICE '🔒 Politiques de sécurité configurées pour toutes les nouvelles tables';
    RAISE NOTICE '⚙️ Triggers automatiques configurés pour les paiements et notifications';
    RAISE NOTICE '🎁 Codes promo de test insérés (WELCOME10, FREESHIP, LOYALTY20, RAMADAN2024)';
    RAISE NOTICE '⭐ Témoignages clients ajoutés (5 témoignages approuvés)';
    RAISE NOTICE '📧 Messages de contact de test insérés';
    RAISE NOTICE '🔔 Notifications système créées';
    RAISE NOTICE '⚙️ Paramètres du site configurés (15 paramètres)';
    RAISE NOTICE '🚀 Système e-commerce complet et professionnel !';
END $$;
