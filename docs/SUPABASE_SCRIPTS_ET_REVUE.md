# Scripts Supabase et revue des corrections

Résumé des corrections appliquées suite à la revue du schéma SQL (doublons, types, bonnes pratiques).

## Fichiers concernés

| Fichier | Rôle |
|--------|------|
| `scripts/supabase-full-setup.sql` | Schéma complet + seed + FK (une seule fois par contrainte) |
| `scripts/supabase-fixes-and-migrations.sql` | Corrections idempotentes (types, trigger, diagnostic) |
| `scripts/supabase-diagnostic-fk-types.sql` | Diagnostic lecture seule : FK manquantes, colonnes TEXT vs INTEGER |
| `scripts/supabase-link-orders-packs-to-users.sql` | Liaison orders.customer_id, packs.created_by vers users |
| `scripts/supabase-favorites-fk.sql` | FK + UNIQUE sur favorites (à exécuter seul) |
| `scripts/supabase-verify-all-fk.sql` | Vérification de toutes les FK attendues |

## Corrections appliquées

- **Doublons** : Dans `supabase-full-setup.sql`, une seule occurrence par FK (order_items, payments, orders.customer_id, packs.created_by, favorites). Ne pas coller plusieurs scripts ensemble pour éviter les blocs en double.
- **Types** : `supabase-fixes-and-migrations.sql` propose :
  - `notifications.is_read` → BOOLEAN (si actuellement INTEGER)
  - `products.images` → JSONB (si la colonne existe)
- **Liaisons** : `orders.customer_id` et `packs.created_by` vers `users(id)` (script dédié ou Partie 2 du script de fixes).
- **UNIQUE favorites** : Gestion d’exception élargie (`duplicate_object`, `duplicate_table`, `OTHERS`) pour éviter les erreurs si la contrainte existe déjà.
- **Trigger `updated_at`** : Optionnel dans le script de fixes (Partie 3) ; à attacher aux tables qui ont une colonne `updated_at`.
- **Types FK TEXT vs INTEGER** : Les colonnes `orders.user_id`, `order_items.bijou_id`, `products.created_by` restent en TEXT dans le schéma pour ne pas casser l’app (identifiants ou téléphone). Une Partie 6 **optionnelle** (commentée) dans `supabase-fixes-and-migrations.sql` permet de les passer en INTEGER si toutes les valeurs sont numériques.

## Ordre d’exécution recommandé

1. **Nouvelle base** : exécuter `supabase-full-setup.sql` en entier (Partie 1 à 5).
2. **Base existante** : exécuter uniquement les parties utiles de `supabase-fixes-and-migrations.sql` (Parties 1, 2, éventuellement 3 et 4). Partie 5 = diagnostic uniquement.
3. **Diagnostic** : exécuter `supabase-diagnostic-fk-types.sql` pour lister les FK manquantes et les colonnes avec type potentiellement incohérent.

## Option « appliquer les correctifs automatiquement »

On ne peut pas exécuter du SQL directement sur ton projet Supabase depuis ici. Pour « appliquer les correctifs » :

1. Ouvrir **Supabase → SQL Editor**.
2. Copier-coller **tout** le contenu de `scripts/supabase-fixes-and-migrations.sql` (ou partie par partie).
3. Exécuter. Les blocs `DO $$ ... EXCEPTION` évitent les erreurs si une contrainte/colonne existe déjà.

Si tu veux que je génère un seul script « tout-en-un » corrigé (schéma + fixes) pour un copier-coller unique, je peux le faire à partir de `supabase-full-setup.sql` + les parties sûres de `supabase-fixes-and-migrations.sql`.
