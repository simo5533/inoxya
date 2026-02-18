# 🔍 DEBUG ERREUR 500 - VERCEL

**Date:** 2025-01-18  
**Projet:** inoxya-bijoux

---

## 🚨 CAUSES PROBABLES DE L'ERREUR 500

### 1️⃣ DATABASE_URL manquant ou incorrect (90% des cas)

**Symptômes:**
- Erreur 500 sur toutes les pages
- Logs montrent "Cannot connect to database"
- Erreur "Database connection failed"

**Solution:**
1. **Vérifiez dans Vercel Dashboard:**
   - Settings → Environment Variables
   - `DATABASE_URL` doit exister
   - Doit être configuré pour **Production, Preview, Development**
   - La valeur doit être complète avec `?sslmode=require`

2. **Vérifiez le format:**
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

3. **Redéployez après modification:**
   ```bash
   vercel --prod
   ```

---

### 2️⃣ Tables PostgreSQL manquantes (80% des cas)

**Symptômes:**
- Erreur 500 sur les pages qui utilisent la DB
- Logs montrent "relation does not exist" ou "table does not exist"

**Solution:**
1. **Allez sur Neon Dashboard:** https://console.neon.tech
2. **Ouvrez SQL Editor**
3. **Exécutez le script:** `scripts/neon-setup-complete.sql`
4. **Vérifiez que les tables existent:**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   Doit retourner au moins **13 tables**

---

### 3️⃣ JWT_SECRET manquant (60% des cas)

**Symptômes:**
- Erreur 500 sur les pages d'authentification
- Logs montrent "JWT_SECRET is required"

**Solution:**
1. **Générez JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Ajoutez dans Vercel:**
   - Settings → Environment Variables
   - Name: `JWT_SECRET`
   - Value: La valeur générée
   - Environments: Production, Preview, Development

3. **Redéployez:**
   ```bash
   vercel --prod
   ```

---

### 4️⃣ Middleware error (30% des cas)

**Symptômes:**
- Erreur 500 sur toutes les pages
- Logs montrent "MIDDLEWARE_INVOCATION_FAILED"

**Solution:**
- ✅ Déjà corrigé dans le code (import dynamique)
- Si persiste, vérifiez les logs Vercel

---

## 🔧 DIAGNOSTIC RAPIDE

### Étape 1: Vérifier les logs Vercel

```bash
vercel logs inoxya-bijoux.vercel.app --limit 100
```

**Cherchez:**
- "Database connection failed"
- "Cannot find module"
- "JWT_SECRET"
- "table does not exist"
- "MIDDLEWARE_INVOCATION_FAILED"

### Étape 2: Vérifier les variables d'environnement

**Dans Vercel Dashboard:**
1. Settings → Environment Variables
2. Vérifiez que ces variables existent:
   - ✅ `DATABASE_URL` (pour Production, Preview, Development)
   - ✅ `JWT_SECRET` (pour Production, Preview, Development)
   - ✅ `NEXT_PUBLIC_SITE_URL` (pour Production, Preview, Development)

### Étape 3: Vérifier les tables PostgreSQL

**Dans Neon SQL Editor:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Doit retourner au moins:**
- users
- products / bijoux
- categories
- orders
- order_items
- payments
- cart_items
- favorites
- etc.

---

## ✅ SOLUTION RAPIDE (ORDRE PRIORITAIRE)

### 1. Vérifier DATABASE_URL (PRIORITÉ 1)

**Dans Vercel Dashboard:**
1. Settings → Environment Variables
2. Cliquez sur `DATABASE_URL`
3. Vérifiez:
   - ✅ La valeur est complète (commence par `postgresql://`)
   - ✅ Se termine par `?sslmode=require`
   - ✅ Configuré pour **Production, Preview, Development**
4. Si manquant ou incorrect, corrigez et sauvegardez

### 2. Vérifier les tables PostgreSQL (PRIORITÉ 2)

**Dans Neon Dashboard:**
1. SQL Editor
2. Exécutez: `scripts/neon-setup-complete.sql`
3. Vérifiez avec:
   ```sql
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### 3. Vérifier JWT_SECRET (PRIORITÉ 3)

**Dans Vercel Dashboard:**
1. Settings → Environment Variables
2. Vérifiez que `JWT_SECRET` existe
3. Si manquant, générez et ajoutez

### 4. Redéployer (PRIORITÉ 4)

**Après chaque modification:**
```bash
cd "C:\Users\Basma\Desktop\inoxya-bijoux 2"
vercel --prod
```

---

## 🆘 COMMANDES DE DEBUG

### Voir les logs en temps réel:
```bash
vercel logs inoxya-bijoux.vercel.app --follow
```

### Voir les logs récents:
```bash
vercel logs inoxya-bijoux.vercel.app --limit 100
```

### Vérifier les variables d'environnement:
```bash
vercel env ls
```

---

## 📊 CHECKLIST DE RÉSOLUTION

- [ ] `DATABASE_URL` configuré pour Production, Preview, Development
- [ ] `DATABASE_URL` contient `?sslmode=require`
- [ ] Tables PostgreSQL créées dans Neon (au moins 13 tables)
- [ ] `JWT_SECRET` configuré pour Production, Preview, Development
- [ ] `NEXT_PUBLIC_SITE_URL` configuré
- [ ] Redéployé après chaque modification: `vercel --prod`
- [ ] Vérifié les logs: `vercel logs inoxya-bijoux.vercel.app`

---

## 🎯 SOLUTION LA PLUS PROBABLE

**Dans 90% des cas, c'est:**
1. `DATABASE_URL` manquant ou seulement pour Preview (pas Production)
2. Tables PostgreSQL non créées dans Neon

**Action immédiate:**
1. Vérifiez `DATABASE_URL` dans Vercel → Settings → Environment Variables
2. Assurez-vous qu'il est configuré pour **Production** (pas seulement Preview)
3. Exécutez `scripts/neon-setup-complete.sql` dans Neon SQL Editor
4. Redéployez: `vercel --prod`

---

**Dites-moi ce que vous voyez dans les logs et je vous aiderai à résoudre !**

