# 🚀 DÉPLOYER INOXYA BIJOUX SUR VERCEL
## Guide Simple — 15 minutes — Zéro compétence technique requise

---

## RÉSUMÉ: 5 choses à faire
1. Variables d'environnement dans Vercel ← **LE PLUS IMPORTANT**
2. Redéployer
3. SQL dans la base de données
4. Créer compte admin
5. Tester

---

## 🔑 ÉTAPE 1 — Variables d'environnement (OBLIGATOIRE)

**Dans Vercel Dashboard → Settings → Environment Variables**

Ajouter ces 4 variables (Add New pour chacune):

### Variable 1
- **Name:** `DATABASE_URL`  
- **Value:** Vercel → Storage → ta DB → onglet ".env.local" → copier `postgresql://...`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Variable 2
- **Name:** `JWT_SECRET`
- **Value:** Aller sur https://generate-secret.vercel.app/32 → copier le résultat
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Variable 3
- **Name:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://inoxya-bijoux.vercel.app` (ou ton vrai domaine Vercel)
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Variable 4
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production ✅ Preview ✅ Development

---

## 🔄 ÉTAPE 2 — Redéployer

1. **Deployments** (menu haut)
2. Cliquer les **3 points** (···) sur le déploiement en erreur
3. **Redeploy**
4. Attendre 2-3 minutes
5. ✅ Build vert = SUCCÈS! 🎉

---

## 🗄️ ÉTAPE 3 — Initialiser la base de données

**Storage → ta DB → onglet "Query" → coller et exécuter:**

```sql
CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, phone VARCHAR(20) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100), email VARCHAR(255), role VARCHAR(20) DEFAULT 'user', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, original_price DECIMAL(10,2), images TEXT DEFAULT '[]', category_id INTEGER REFERENCES categories(id), is_featured BOOLEAN DEFAULT FALSE, is_available BOOLEAN DEFAULT TRUE, stock INTEGER DEFAULT 0, material VARCHAR(100), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS packs (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description TEXT, price DECIMAL(10,2), images TEXT DEFAULT '[]', is_featured BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), total_amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending', shipping_address TEXT, phone VARCHAR(20), notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, bijou_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL DEFAULT 1, price DECIMAL(10,2) NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS cart_items (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, bijou_id INTEGER REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, bijou_id));
CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, bijou_id INTEGER REFERENCES products(id) ON DELETE CASCADE, pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending', method VARCHAR(50) DEFAULT 'cash', created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(200), message TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
INSERT INTO categories (name, slug) VALUES ('Bagues','bagues'),('Colliers','colliers'),('Bracelets','bracelets'),('Boucles d''oreilles','boucles-d-oreilles'),('Ensembles','ensembles') ON CONFLICT (slug) DO NOTHING;
```

Cliquer **"Run Query"** → "Success" ✅

---

## 👑 ÉTAPE 4 — Créer compte admin

1. Aller sur ton site → **s'inscrire** avec ton numéro
2. **Storage → Query** → exécuter (remplacer par ton vrai numéro):
```sql
UPDATE users SET role = 'admin' WHERE phone = '0VOTRE_NUMERO';
```

---

## ✅ ÉTAPE 5 — Vérifier

| URL | Résultat attendu |
|-----|-----------------|
| `https://ton-app.vercel.app` | Page d'accueil |
| `https://ton-app.vercel.app/api/health` | `{"status":"ok","db":"connected"}` |
| `https://ton-app.vercel.app/admin` | Dashboard admin |

---

## ❌ Problèmes fréquents

| Erreur | Solution |
|--------|----------|
| Page blanche | Vercel → Functions → voir logs |
| DATABASE_URL error | Vérifier `?sslmode=require` à la fin |
| JWT error | JWT_SECRET doit faire 32+ caractères |
| Tables vides | Refaire Étape 3 (SQL) |
| Pas admin | Refaire Étape 4 (UPDATE users) |
| Build échoue | Vérifier les 4 variables d'environnement |

---

## 🎉 C'est tout!

Votre boutique **INOXYA BIJOUX** est en ligne!

**URL:** `https://ton-app.vercel.app`  
**Admin:** `https://ton-app.vercel.app/admin`

---

*Pour plus d'aide, voir `CORRIGER_ERREUR_VERCEL.md`*
