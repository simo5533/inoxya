# 🔍 DÉBOGAGE ERREUR 500 - MIDDLEWARE_INVOCATION_FAILED

## ⚠️ PROBLÈME

L'erreur `500: INTERNAL_SERVER_ERROR` avec `MIDDLEWARE_INVOCATION_FAILED` persiste même après l'exécution des migrations SQL.

---

## 🔍 CAUSES POSSIBLES

### 1. ❌ DATABASE_URL non configuré dans Vercel

**Vérification:**
1. Vercel Dashboard → Projet `inoxya-bijoux`
2. Settings → Environment Variables
3. Cherchez `DATABASE_URL`
4. **Elle DOIT exister et commencer par `postgresql://`**

**Solution:**
- Si elle n'existe pas, ajoutez-la depuis Neon Dashboard → Connection Details

---

### 2. ❌ Migrations SQL non exécutées ou incomplètes

**Vérification dans Neon:**
1. Neon Dashboard → SQL Editor
2. Exécutez cette requête:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Vous devriez voir:**
- ✅ users
- ✅ categories
- ✅ products
- ✅ bijoux
- ✅ packs
- ✅ orders
- ✅ order_items
- ✅ cart_items
- ✅ favorites
- ✅ payments
- ✅ notifications
- ✅ user_sessions
- ✅ custom_requests

**Si des tables manquent:**
- Réexécutez `scripts/neon-setup-complete.sql` dans Neon SQL Editor

---

### 3. ❌ Redéploiement non fait après configuration DATABASE_URL

**Vérification:**
- Si vous avez ajouté/modifié `DATABASE_URL` dans Vercel, vous DEVEZ redéployer!

**Solution:**
```bash
vercel --prod
```

OU via Dashboard:
- Deployments → [Dernier] → Menu (3 points) → Redeploy

---

### 4. ❌ Erreur dans les logs Vercel

**Vérification:**
1. Vercel Dashboard → Projet
2. Deployments → [Dernier déploiement]
3. Cliquez sur "Functions" ou "Runtime Logs"
4. Cherchez les erreurs de connexion à la base

**Erreurs communes:**
- `relation "users" does not exist` → Tables non créées
- `connection refused` → DATABASE_URL incorrect
- `password authentication failed` → Credentials incorrects

---

### 5. ❌ Problème avec next-intl middleware

**Vérification:**
- Le middleware pourrait échouer si `i18n/routing.ts` a un problème

**Solution:**
- J'ai ajouté une gestion d'erreur robuste dans `middleware.ts`
- Redéployez pour appliquer les changements

---

## ✅ ACTIONS IMMÉDIATES

### ÉTAPE 1: Vérifier DATABASE_URL dans Vercel

1. Vercel Dashboard → Projet `inoxya-bijoux`
2. Settings → Environment Variables
3. Vérifiez que `DATABASE_URL` existe
4. Si elle n'existe pas, ajoutez-la depuis Neon

---

### ÉTAPE 2: Vérifier les tables dans Neon

1. Neon Dashboard → SQL Editor
2. Exécutez:
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Résultat attendu:** Au moins 13 tables

Si moins de 13 tables:
- Réexécutez `scripts/neon-setup-complete.sql`

---

### ÉTAPE 3: Redéployer

```bash
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
vercel --prod
```

---

### ÉTAPE 4: Vérifier les logs

1. Vercel Dashboard → Deployments → [Dernier]
2. Functions → Runtime Logs
3. Cherchez les erreurs

---

## 🆘 SI RIEN NE FONCTIONNE

### Option 1: Vérifier la connexion PostgreSQL manuellement

Dans Neon SQL Editor, testez:
```sql
SELECT 1;
```

Si ça fonctionne, la base est accessible.

---

### Option 2: Tester DATABASE_URL localement

Créez un fichier `test-db.js`:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT 1')
  .then(() => console.log('✅ Connexion OK'))
  .catch(err => console.error('❌ Erreur:', err))
  .finally(() => pool.end());
```

Exécutez:
```bash
node test-db.js
```

---

### Option 3: Vérifier le format de DATABASE_URL

Elle doit ressembler à:
```
postgresql://user:password@host:port/database?sslmode=require
```

OU

```
postgres://user:password@host:port/database?sslmode=require
```

---

## 📋 CHECKLIST COMPLÈTE

- [ ] DATABASE_URL configurée dans Vercel
- [ ] DATABASE_URL commence par `postgresql://` ou `postgres://`
- [ ] Migrations SQL exécutées dans Neon
- [ ] Au moins 13 tables créées (vérifié avec SELECT)
- [ ] Redéploiement fait après configuration DATABASE_URL
- [ ] Logs Vercel vérifiés (pas d'erreurs de connexion)
- [ ] Test de connexion PostgreSQL réussi (SELECT 1)

---

## 🎯 PROCHAINES ÉTAPES

1. **Vérifiez DATABASE_URL dans Vercel** (priorité 1)
2. **Vérifiez les tables dans Neon** (priorité 2)
3. **Redéployez** (priorité 3)
4. **Vérifiez les logs** (priorité 4)

---

**Dites-moi ce que vous trouvez dans les logs Vercel et je vous aiderai à résoudre le problème spécifique! 🔍**

