-- Exécuter une fois dans Supabase > SQL Editor pour activer la sauvegarde des paramètres admin
-- Run once in Supabase > SQL Editor to enable admin settings save

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
