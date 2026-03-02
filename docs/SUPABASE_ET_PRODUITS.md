# Base de données (Supabase) et produits

## Pourquoi « 0 produit » et erreur sur la page produit ?

En production (Vercel), l’app utilise **Supabase**. Si la table **products** est vide ou si les variables d’environnement Supabase ne sont pas configurées sur Vercel, vous aurez :
- **Admin** : « 0 produit au total »
- **Page produit** (ex. /fr/bijoux/41) : erreur ou 404

## Checklist à faire

### 1. Variables d’environnement sur Vercel

Dans **Vercel** → projet **inoxya-bijoux** → **Settings** → **Environment Variables**, vérifier que ces variables existent (Production + Preview) :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (ex. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme (anon/public) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase (pour l’admin) |

Sans elles, l’app ne peut pas se connecter à Supabase et les produits ne s’affichent pas.

### 2. Table `products` dans Supabase

Dans **Supabase** → **Table Editor** (ou SQL Editor) :

- Vérifier qu’une table **products** existe.
- Si elle est vide, il faut **ajouter des produits**.

Structure minimale utile : `id`, `name`, `price`, `description`, `image_url` (ou `main_image`), `category`, `is_active`, `created_at`, `updated_at`.

### 3. Ajouter des produits

**Option A – Via l’admin du site**

1. Aller sur **inoxya-bijoux.vercel.app/admin** et se connecter.
2. Onglet **Produits** → **+ Nouveau produit**.
3. Renseigner nom, prix, description, image (URL publique ou upload Supabase Storage), catégorie, puis enregistrer.

**Option B – Via Supabase**

1. **Supabase** → **Table Editor** → table **products**.
2. **Insert row** et remplir les colonnes (id, name, price, image_url, etc.).

**Option C – Import / seed**

Si vous avez un script ou un fichier JSON de produits, il faut un script qui fait des `INSERT` dans la table **products** (ou utilise l’API de l’admin) en se connectant à Supabase avec la même URL et les mêmes clés que sur Vercel.

### 4. Images des produits

- **image_url** (ou **main_image**) doit être une **URL publique** (ex. `https://xxx.supabase.co/storage/v1/object/public/bucket/photo.jpg`).
- Pour stocker les images dans Supabase : **Storage** → créer un bucket (ex. `products`) → activer l’accès public si besoin → uploader les images → copier l’URL publique dans le champ image du produit.

## Résumé

1. **Vercel** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` correctement renseignées.
2. **Supabase** : table **products** créée et remplie (à la main, via l’admin ou un script).
3. **Images** : URLs accessibles (hébergement Supabase Storage ou autre).

Après ça, l’admin doit afficher les produits et les pages type `/fr/bijoux/41` doivent s’afficher sans erreur (ou en 404 si l’id n’existe pas).
