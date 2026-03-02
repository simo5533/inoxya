# Supabase — Schéma complet vs schéma actuel

Comparaison entre le schéma **réel** de ton projet (export Supabase) et le schéma **complet** attendu par l’app. Seules les **différences** sont listées ; tout le reste est déjà bon.

---

## Manques dans le schéma actuel

| Élément | Statut actuel | Action |
|--------|----------------|--------|
| **order_items.order_id** → orders(id) | Pas de FK | Ajouter la contrainte (voir script ci‑dessous) |
| **payments.order_id** → orders(id) | Pas de FK | Ajouter la contrainte (voir script ci‑dessous) |

Toutes les autres tables et FK (users, products, cart_items, favorites, reviews, shipping_addresses, etc.) sont déjà correctes.

---

## Script à exécuter pour « compléter » le schéma (sans rien supprimer)

À copier-coller dans **Supabase → SQL Editor**, puis **Run**. Aucun DROP, aucune suppression de données.

```sql
-- Ajout des 2 FK manquantes : order_items → orders, payments → orders
DO $$
BEGIN
  ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'order_items_order_id_fkey existe déjà.';
END
$$;

DO $$
BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'payments_order_id_fkey existe déjà.';
END
$$;
```

Après exécution, le schéma est **complet** pour l’app (checkout, commandes, paiements).

---

## Vérification rapide

En cas de lignes orphelines (order_id qui ne existe pas dans orders), l’ajout des FK peut échouer. Vérifier avant avec :

```bash
npx tsx scripts/checkout-orphans-verify.ts
```

Si le script affiche **0 orphelin** pour order_items et payments, tu peux exécuter le script SQL ci‑dessus sans risque.

---

*Fichier de référence : schéma actuel exporté depuis Supabase vs schéma complet inoxya-bijoux.*
