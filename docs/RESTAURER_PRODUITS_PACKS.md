# Restaurer produits et packs (retour à l’état correct)

## Ce qui s’est passé

En exécutant le **script complet** Supabase (DROP toutes les tables puis recréation), toutes les données ont été supprimées. Le script ne réinsère que :
- 2 utilisateurs (Admin, Test Client)
- 3 produits et 1 pack de démo (Partie 3b)

Donc vos **anciens** produits et packs (ceux que vous aviez avant) ne sont plus dans Supabase.

---

## Option A : Vous avez encore la base SQLite locale

Si vous aviez des produits/packs dans une base SQLite (fichier `data/inoxya_bijoux.db` ou équivalent) et que ce fichier existe encore sur votre machine :

### 1. Vider les tables produits et packs dans Supabase

Dans **Supabase → SQL Editor**, exécutez le script :

**`scripts/supabase-clear-products-packs.sql`**

(Cela supprime les lignes des tables qui dépendent de `products`/`packs`, puis vide `products` et `packs`.)

### 2. Réimporter depuis SQLite vers Supabase

Dans le terminal, à la racine du projet :

```bash
npx tsx scripts/sync-products-to-supabase.ts
npx tsx scripts/sync-packs-to-supabase.ts
```

Prérequis : `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.

Après ça, rechargez `/fr/bijoux` et `/fr/packs` : les données viennent de nouveau de Supabase (avec le contenu de votre SQLite).

---

## Option B : Vous n’avez plus la SQLite ni de backup Supabase

Dans ce cas on ne peut pas retrouver exactement l’ancien état. Vous pouvez :

1. **Ré-importer votre catalogue**  
   Via l’admin du site (si vous avez une interface d’import produits/packs) ou en insérant les données à la main dans Supabase (Table Editor ou CSV).

2. **Utiliser un catalogue de démo**  
   Exécuter dans Supabase SQL Editor le script :  
   **`scripts/supabase-seed-full-catalog.sql`**  
   Cela insère un ensemble de produits et packs de démo (avec images placeholder) pour que le site soit à nouveau rempli.

---

## Récap

| Situation | Action |
|----------|--------|
| Fichier `data/inoxya_bijoux.db` (ou autre .db) présent | Exécuter `supabase-clear-products-packs.sql` puis `sync-products-to-supabase.ts` et `sync-packs-to-supabase.ts`. |
| Plus de SQLite, pas de backup | Importer votre catalogue à la main ou exécuter `supabase-seed-full-catalog.sql` pour un catalogue de démo. |

**À l’avenir** : avant de lancer un script qui fait `DROP TABLE ... CASCADE`, faire un export ou une sauvegarde des tables importantes (ou du projet Supabase) si vous voulez pouvoir revenir en arrière.
