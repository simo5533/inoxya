-- =============================================================================
-- INOXYA BIJOUX — Vérification de toutes les liaisons (FK) — Supabase SQL Editor
-- =============================================================================
-- Exécuter ce script dans Supabase → SQL Editor pour vérifier que toutes les
-- clés étrangères (admin + checkout) existent. Aucune modification des données.
--
-- Résultat attendu : la 2e requête doit afficher "OK" pour toutes les lignes.
-- Si "MANQUANT" apparaît :
--   - pour order_items ou payments : exécuter scripts/supabase-add-fk-checkout.sql
--   - pour les autres tables : les FK sont normalement créées avec la table ;
--     en cas de base importée sans FK, les ajouter manuellement (ALTER TABLE ... ADD CONSTRAINT).
-- =============================================================================

-- 1. Liste de toutes les FK du schéma public (table, colonne, référence)
SELECT
  c.conrelid::regclass AS table_name,
  a.attname AS column_name,
  c.confrelid::regclass AS references_table,
  c.conname AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid AND a.attnum > 0 AND NOT a.attisdropped
WHERE c.contype = 'f'
  AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.conrelid::regclass::text, a.attname;

-- 2. Vérification ciblée : FK attendues (admin + checkout)
-- Si une ligne manque dans le résultat ci-dessous, la contrainte n'existe pas.
WITH expected AS (
  SELECT * FROM (VALUES
    ('cart_items', 'user_id', 'users'),
    ('cart_items', 'bijou_id', 'products'),
    ('custom_requests', 'user_id', 'users'),
    ('favorites', 'user_id', 'users'),
    ('favorites', 'bijou_id', 'products'),
    ('order_items', 'order_id', 'orders'),
    ('orders', 'customer_id', 'users'),
    ('packs', 'created_by', 'users'),
    ('payments', 'order_id', 'orders'),
    ('reviews', 'user_id', 'users'),
    ('reviews', 'bijou_id', 'products'),
    ('shipping_addresses', 'user_id', 'users'),
    ('shipping_addresses', 'order_id', 'orders'),
    ('testimonials', 'user_id', 'users'),
    ('testimonials', 'product_id', 'products'),
    ('user_sessions', 'user_id', 'users')
  ) AS t(table_name, column_name, references_table)
),
actual AS (
  SELECT
    regexp_replace(c.conrelid::regclass::text, '^[^.]*\.', '') AS table_name,
    a.attname AS column_name,
    regexp_replace(c.confrelid::regclass::text, '^[^.]*\.', '') AS references_table
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid AND a.attnum > 0 AND NOT a.attisdropped
  WHERE c.contype = 'f'
    AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
SELECT
  e.table_name AS "Table",
  e.column_name AS "Colonne",
  e.references_table AS "Référence",
  CASE WHEN a.table_name IS NOT NULL THEN 'OK' ELSE 'MANQUANT' END AS "Statut"
FROM expected e
LEFT JOIN actual a ON e.table_name = a.table_name AND e.column_name = a.column_name AND e.references_table = a.references_table
ORDER BY "Statut" DESC, e.table_name, e.column_name;
