-- =============================================================================
-- ⚠️  À EXÉCUTER UNIQUEMENT DANS SUPABASE SQL EDITOR — SCRIPT SANS DESTRUCTION
-- =============================================================================
--
-- NE PAS EXÉCUTER LE FICHIER "supabase-schema.sql" EN ENTIER DANS UNE BASE
-- EXISTANTE : IL CONTIENT DES "DROP TABLE ... CASCADE" QUI SUPPRIMENT TOUTES
-- LES DONNÉES (produits, commandes, utilisateurs, etc.).
--
-- CE FICHIER-CI : ajoute SEULEMENT les contraintes de clé étrangère pour le
-- checkout (order_items → orders, payments → orders). Aucune suppression,
-- aucune recréation de tables.
--
-- PRÉREQUIS : avoir vérifié qu'il n'y a pas d'orphelins :
--   npx tsx scripts/checkout-orphans-verify.ts
-- Si le script indique des orphelins, ne pas exécuter le SQL ci-dessous.
--
-- =============================================================================

-- ========== FK order_items.order_id -> orders.id ==========
DO $$
BEGIN
  ALTER TABLE order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint order_items_order_id_fkey already exists.';
END
$$;

-- ========== FK payments.order_id -> orders.id ==========
DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint payments_order_id_fkey already exists.';
END
$$;
