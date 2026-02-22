# Supabase — Vérification orphelins et FK checkout (additif, sans destruction)

**Règle :** Ne jamais exécuter de DROP / TRUNCATE / suppression de données. Uniquement des vérifications en lecture et des ajouts de contraintes **si** il n’y a pas d’orphelins.

---

## 1. Vérifier les orphelins (à exécuter en premier, lecture seule)

À exécuter dans **Supabase → SQL Editor**. Tout est en **SELECT**, aucune modification.

```sql
-- ========== ORPHELINS : order_items dont order_id n'existe pas dans orders ==========
SELECT COUNT(*) AS orphan_order_items
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;

-- ========== ORPHELINS : payments dont order_id n'existe pas dans orders ==========
SELECT COUNT(*) AS orphan_payments
FROM payments p
LEFT JOIN orders o ON o.id = p.order_id
WHERE o.id IS NULL;
```

**Interprétation :**
- Si les deux comptes sont **0** → pas d’orphelins, vous pouvez ajouter les FK (section 2).
- Si l’un des deux est **> 0** → ne pas ajouter les FK tant que les orphelins ne sont pas traités (correction de données ou stratégie de nettoyage sans suppression automatique).

---

## 2. Ajouter les FK (uniquement si orphelins = 0)

À exécuter dans **Supabase → SQL Editor**, **seulement après** avoir confirmé 0 orphelin.

PostgreSQL ne supporte pas `ADD CONSTRAINT IF NOT EXISTS` pour les FK. On utilise un bloc **DO** avec **EXCEPTION** pour éviter l’erreur si la contrainte existe déjà.

```sql
-- ========== FK order_items.order_id -> orders.id (à exécuter seulement si 0 orphelin) ==========
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

-- ========== FK payments.order_id -> orders.id (à exécuter seulement si 0 orphelin) ==========
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
```

---

## 3. Vérification après ajout des FK

```sql
-- Lister les contraintes FK sur order_items et payments
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('order_items', 'payments');
```

Vous devez voir au moins `order_items_order_id_fkey` et `payments_order_id_fkey` (si vous les avez ajoutées).

---

*Document généré dans le cadre du fix checkout Supabase (branche fix/supabase-checkout-db).*
