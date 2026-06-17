INSERT INTO users (phone, password_hash, first_name, last_name, role)
VALUES
  ('admin_phone', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin'),
  ('0612345678', '$2a$10$EUFwcX8aABzEZt3U8.TSSuwlpYcKSKSIeYwUik8o9kH9arblw9BIe', 'Admin', 'INOXYA', 'admin')
ON CONFLICT (phone) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();

SELECT phone, role FROM users WHERE role = 'admin';
