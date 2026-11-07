-- Migration : slug produit persistants (SEO URLs /fr/bijoux/{slug})
-- Exécuter sur Neon / Supabase / Postgres production.
-- Idempotent.

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Index unique partiel (ignore NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON products (slug)
  WHERE slug IS NOT NULL AND slug <> '';

-- Remplir les slugs manquants côté appli (ensureProductSlug) après déploiement.
-- Optionnel : backfill SQL approximatif (accents non gérés ici) :
-- UPDATE products SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
-- WHERE slug IS NULL OR slug = '';
