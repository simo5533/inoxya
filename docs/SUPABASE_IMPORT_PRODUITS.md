# Importer les produits dans Supabase

Pour que la page **/fr/bijoux** (et le reste du site) affiche les produits depuis **Supabase** et plus depuis la base SQLite locale, il faut que la table **products** dans Supabase contienne des données.

---

## Une seule fois : importer depuis la base locale (SQLite)

À la racine du projet :

```bash
npx tsx scripts/sync-products-to-supabase.ts
```

- Lit tous les produits dans **data/inoxya_bijoux.db** (ou la base sql.js utilisée en dev).
- Les envoie par lots vers la table **products** de Supabase.
- Prérequis : **.env.local** avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.

Si Supabase a déjà des produits, le script ajoute quand même les lignes (risque de doublons en cas de relance). Pour repartir de zéro, vider d’abord la table **products** dans Supabase (Table Editor → supprimer les lignes ou truncate), puis relancer le script.

---

## Pour ne plus avoir le problème « aucun produit affiché »

1. **Supabase connecté mais table products vide**  
   → L’app affiche 0 produit. **Solution :** exécuter le script ci-dessus une fois pour remplir **products** dans Supabase.

2. **En développement**  
   Si Supabase est vide, l’app utilise désormais un **fallback SQLite** (voir `lib/database.ts`) pour afficher les produits locaux. Une fois Supabase rempli, les produits viennent de Supabase sans changer le code.

3. **En production (Vercel)**  
   Il n’y a pas de SQLite. Les produits **doivent** être dans Supabase. Soit vous avez déjà lancé le script avant déploiement, soit vous importez via l’admin du site (création de produits) ou en relançant le script en local (avec la même base Supabase que en prod).

---

## Résumé

| Action | Commande / lieu |
|--------|------------------|
| Importer tous les produits SQLite → Supabase | `npx tsx scripts/sync-products-to-supabase.ts` |
| Vérifier que Supabase a des produits | Supabase → Table Editor → **products** |
| Vérifier la connexion + tables | `npx tsx scripts/health-check.ts` |

Après import, recharger **/fr/bijoux** : les produits doivent s’afficher depuis Supabase.
