# 🔐 Variables d'Environnement Vercel - INOXYA BIJOUX

**Template complet pour configuration Vercel**

---

## ✅ VARIABLES OBLIGATOIRES

### Production + Preview + Development

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement (production/preview/development) |
| `JWT_SECRET` | `[générer 32+ caractères]` | **Générer:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Production + Preview

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.com` | **⚠️ À définir APRÈS configuration du domaine** |
| `DATABASE_URL` | `postgresql://...` | **Auto-ajouté** par Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_...` | **Auto-ajouté** par Vercel Blob |

---

## ⚠️ VARIABLES OPTIONNELLES

### Rate Limiting (Recommandé en Production)

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `UPSTASH_REDIS_REST_URL` | `https://...` | URL Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | Token Upstash Redis |

**Note:** Si non configuré, le système utilise un fallback en mémoire (fonctionne mais non partagé entre instances).

### Email (Optionnel)

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `SMTP_HOST` | `smtp.example.com` | Serveur SMTP |
| `SMTP_PORT` | `587` | Port SMTP (généralement 587) |
| `SMTP_USER` | `user@example.com` | Utilisateur SMTP |
| `SMTP_PASS` | `[password]` | Mot de passe SMTP |
| `ADMIN_EMAIL` | `admin@example.com` | Email admin (notifications) |

**Note:** Si non configuré, les emails ne seront pas envoyés (non bloquant).

---

## 📋 CONFIGURATION PAR ENVIRONNEMENT

### Production

**Variables à définir:**
- ✅ `NODE_ENV` = `production`
- ✅ `JWT_SECRET` = `[généré]`
- ✅ `NEXT_PUBLIC_SITE_URL` = `https://www.votre-domaine.com` (après domaine)
- ✅ `DATABASE_URL` = Auto-ajouté (Postgres)
- ✅ `BLOB_READ_WRITE_TOKEN` = Auto-ajouté (Blob)
- ⚠️ `UPSTASH_REDIS_REST_URL` = Optionnel
- ⚠️ `UPSTASH_REDIS_REST_TOKEN` = Optionnel
- ⚠️ `SMTP_*` = Optionnel

### Preview

**Variables à définir:**
- ✅ `NODE_ENV` = `production` (ou laisser vide)
- ✅ `JWT_SECRET` = `[généré]`
- ✅ `NEXT_PUBLIC_SITE_URL` = `https://inoxya-bijoux-xxx.vercel.app` (URL preview)
- ✅ `DATABASE_URL` = Auto-ajouté (Postgres)
- ✅ `BLOB_READ_WRITE_TOKEN` = Auto-ajouté (Blob)

### Development

**Variables à définir:**
- ✅ `NODE_ENV` = `development`
- ✅ `JWT_SECRET` = `[généré]` (peut être le même que production)

**Note:** En développement, SQLite est utilisé si `DATABASE_URL` n'est pas défini.

---

## 🔄 VARIABLES AUTO-AJOUTÉES PAR VERCEL

Ces variables sont **automatiquement ajoutées** lors de la création des intégrations:

| Variable | Créée par | Quand |
|----------|-----------|-------|
| `DATABASE_URL` | Vercel Postgres | Après création Postgres (Étape 1) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Après création Blob (Étape 2) |

**Vous n'avez pas besoin de les ajouter manuellement.**

---

## ⚠️ IMPORTANT: NEXT_PUBLIC_SITE_URL

### Comportement

- **Si défini:** Utilisé pour toutes les URLs (canonical, OpenGraph, sitemap, etc.)
- **Si non défini:** Fallback sur placeholder (`https://your-domain.vercel.app`)

### Quand le définir?

1. **Preview:** Utiliser l'URL preview Vercel (`https://inoxya-bijoux-xxx.vercel.app`)
2. **Production:** Utiliser votre domaine final (`https://www.votre-domaine.com`)

**⚠️ Ne pas hardcoder.** Le système supporte les placeholders jusqu'à ce que vous définissiez le domaine final.

---

## 📝 EXEMPLE DE CONFIGURATION COMPLÈTE

### Production (après domaine configuré)

```
NODE_ENV=production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NEXT_PUBLIC_SITE_URL=https://www.inoxya-bijoux.com
DATABASE_URL=postgresql://... (auto-ajouté)
BLOB_READ_WRITE_TOKEN=vercel_blob_... (auto-ajouté)
UPSTASH_REDIS_REST_URL=https://... (optionnel)
UPSTASH_REDIS_REST_TOKEN=... (optionnel)
```

### Preview

```
NODE_ENV=production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NEXT_PUBLIC_SITE_URL=https://inoxya-bijoux-xxx.vercel.app
DATABASE_URL=postgresql://... (auto-ajouté)
BLOB_READ_WRITE_TOKEN=vercel_blob_... (auto-ajouté)
```

---

## ✅ VALIDATION

Le système valide automatiquement les variables d'environnement au démarrage:

- ✅ **Production:** Fail-fast si variables critiques manquantes
- ✅ **Development:** Warnings seulement (continue malgré erreurs)

**Messages d'erreur clairs:**
- `NEXT_PUBLIC_SITE_URL est obligatoire en production`
- `JWT_SECRET est obligatoire en production et doit contenir au moins 32 caractères`
- `DATABASE_URL est obligatoire sur Vercel (SQLite non supporté)`

---

## 🎯 RÉSUMÉ

**Obligatoires:**
- `NODE_ENV`
- `JWT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (après domaine)
- `DATABASE_URL` (auto-ajouté)
- `BLOB_READ_WRITE_TOKEN` (auto-ajouté)

**Optionnelles:**
- `UPSTASH_REDIS_*` (rate limiting)
- `SMTP_*` (email)

**Aucune variable hardcodée.** ✅

