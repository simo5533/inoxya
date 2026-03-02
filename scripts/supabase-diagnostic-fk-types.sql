-- =============================================================================
-- INOXYA BIJOUX — Diagnostic FK et types (lecture seule, Supabase SQL Editor)
-- =============================================================================
-- Exécuter ce script pour lister : FK manquantes, colonnes avec type incohérent
-- (TEXT au lieu d’INTEGER pour référencer users.id ou products.id).
-- Aucune modification des données.
-- =============================================================================

-- 1. Liste des FK attendues vs présentes
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

-- 2. Colonnes potentiellement incohérentes : type TEXT alors que la table référencée a id INTEGER
SELECT
  c.table_name AS "Table",
  c.column_name AS "Colonne",
  c.data_type AS "Type actuel",
  CASE
    WHEN c.table_name = 'orders' AND c.column_name = 'user_id' THEN 'users.id (integer)'
    WHEN c.column_name = 'bijou_id' THEN 'products.id (integer)'
    WHEN c.column_name = 'created_by' THEN 'users.id (integer)'
    WHEN c.column_name = 'customer_id' THEN 'users.id (integer)'
    ELSE 'référence PK integer'
  END AS "Référence attendue"
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('orders','order_items','products','notifications')
  AND (
    (c.table_name = 'orders' AND c.column_name IN ('user_id','customer_id'))
    OR (c.column_name IN ('bijou_id','created_by'))
  )
  AND c.data_type = 'text'
ORDER BY c.table_name, c.column_name;
