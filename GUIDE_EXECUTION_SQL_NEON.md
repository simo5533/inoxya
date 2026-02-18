# 📋 GUIDE - EXÉCUTER LE SCRIPT SQL DANS NEON

## ✅ ÉTAPE 1 : ALLER SUR NEON SQL EDITOR

1. **Ouvrez votre navigateur**
2. **Allez sur:** https://console.neon.tech
3. **Connectez-vous** si nécessaire
4. **Sélectionnez votre projet:** `inoxya-postgres`
5. **Dans la barre latérale gauche, cliquez sur "SQL Editor"**
   - C'est l'icône avec `</>` ou "SQL Editor"

---

## ✅ ÉTAPE 2 : COPIER LE SCRIPT SQL

1. **Dans votre éditeur (Cursor), ouvrez le fichier:**
   - `scripts/neon-setup-complete.sql`

2. **Sélectionnez TOUT le contenu:**
   - `Ctrl+A` (Windows)
   - `Cmd+A` (Mac)

3. **Copiez:**
   - `Ctrl+C` (Windows)
   - `Cmd+C` (Mac)

---

## ✅ ÉTAPE 3 : COLLER ET EXÉCUTER DANS NEON

1. **Dans Neon SQL Editor, cliquez dans la zone de texte**
2. **Collez le script:**
   - `Ctrl+V` (Windows)
   - `Cmd+V` (Mac)

3. **Cliquez sur le bouton "Run"** (ou appuyez sur `F5`)

4. **Attendez quelques secondes** que le script s'exécute

---

## ✅ ÉTAPE 4 : VÉRIFIER QUE ÇA A FONCTIONNÉ

**Dans Neon SQL Editor, exécutez cette requête:**

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Résultat attendu:** Au moins **13** (ou plus)

**Si vous voyez 0 ou un nombre très petit:**
- Le script n'a pas fonctionné
- Réessayez en copiant-collant à nouveau

---

## ✅ ÉTAPE 5 : VÉRIFIER LES TABLES CRÉÉES

**Exécutez cette requête pour voir toutes les tables:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Vous devriez voir:**
- `bijoux`
- `cart_items`
- `categories`
- `custom_requests`
- `favorites`
- `notifications`
- `order_items`
- `orders`
- `packs`
- `payments`
- `products`
- `user_sessions`
- `users`
- Et d'autres...

---

## ✅ ÉTAPE 6 : VÉRIFIER L'UTILISATEUR ADMIN

**Exécutez cette requête:**

```sql
SELECT phone, first_name, last_name, role 
FROM users 
WHERE role = 'admin';
```

**Vous devriez voir au moins un utilisateur admin.**

---

## 🎯 RÉSUMÉ

1. ✅ Allez sur Neon SQL Editor
2. ✅ Copiez `scripts/neon-setup-complete.sql`
3. ✅ Collez dans Neon SQL Editor
4. ✅ Cliquez sur "Run"
5. ✅ Vérifiez avec `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';`
6. ✅ Doit retourner >= 13

---

**Une fois terminé, dites-moi et je redéploierai le projet !**

