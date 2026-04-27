-- =============================================================================
-- Si le login admin échoue en prod (Supabase) : le seed utilise parfois pgcrypto
-- crypt() alors que l’app vérifie avec bcryptjs. Ce patch impose un hash bcrypt
-- connu, identique à scripts/create-admin.sql (mot de passe : Admin123!).
-- Exécuter dans Supabase → SQL Editor (Role: postgres), une seule fois.
-- =============================================================================

INSERT INTO public.users (phone, password_hash, first_name, last_name, role)
VALUES (
  '0612345678',
  '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe',
  'Admin',
  'Inoxya',
  'admin'
)
ON CONFLICT (phone) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name     = EXCLUDED.first_name,
  last_name      = EXCLUDED.last_name,
  role           = 'admin',
  updated_at     = now();

-- Vérification (ne montre pas le mot de passe)
SELECT id, phone, left(password_hash, 7) || '…' AS hash_prefix, role FROM public.users WHERE phone = '0612345678';
