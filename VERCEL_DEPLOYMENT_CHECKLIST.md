# 🚀 CHECKLIST DÉPLOIEMENT VERCEL - INOXYA BIJOUX

**Date:** 2025-01-XX  
**Version:** Production Ready ✅

---

## 📋 PRÉ-DÉPLOIEMENT

### 1. ✅ Configuration Vercel

#### Intégrations Requises
- [ ] **Vercel Postgres** : Créer une base de données Postgres
- [ ] **Vercel Blob** : Créer un storage Blob pour les images
- [ ] **Upstash Redis** (optionnel) : Pour rate limiting en production

#### Variables d'Environnement

```env
# Production (OBLIGATOIRES)
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
JWT_SECRET=<générer-un-secret-32-caracteres-minimum>
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Vercel Blob (OBLIGATOIRE pour uploads)
BLOB_READ_WRITE_TOKEN=<token-vercel-blob>

# Upstash Redis (OPTIONNEL - pour rate limiting)
UPSTASH_REDIS_REST_URL=<url-upstash>
UPSTASH_REDIS_REST_TOKEN=<token-upstash>

# Email (OPTIONNEL)
SMTP_HOST=<smtp-host>
SMTP_PORT=<smtp-port>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
ADMIN_EMAIL=<admin-email>
```

---

## 🔧 ÉTAPES DE DÉPLOIEMENT

### Étape 1 : Préparer la Base de Données

```bash
# 1. Créer la base Postgres sur Vercel
# Via Dashboard Vercel > Storage > Create Database > Postgres

# 2. Récupérer DATABASE_URL depuis Vercel Dashboard
# Format: postgresql://user:password@host:5432/dbname?sslmode=require
```

### Étape 2 : Migration SQLite → Postgres

⚠️ **À CRÉER** : Script de migration

```bash
# Script à créer: scripts/migrate-to-postgres.ts
# - Mode dry-run pour tester
# - Validation des comptes
# - Logs détaillés
# - Gestion des JSON columns
```

**Commandes:**
```bash
# Test migration (dry-run)
npm run migrate:dry-run

# Migration réelle
npm run migrate:postgres
```

### Étape 3 : Configurer Vercel Blob

```bash
# 1. Créer Blob Storage sur Vercel
# Via Dashboard Vercel > Storage > Create Database > Blob

# 2. Récupérer BLOB_READ_WRITE_TOKEN
# 3. Ajouter dans Variables d'Environnement Vercel
```

### Étape 4 : Déployer sur Vercel

```bash
# Option 1: Via CLI
vercel --prod

# Option 2: Via Git (recommandé)
# Push sur main branch → Auto-deploy
```

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Tests de Base

- [ ] **Homepage** : `/` charge correctement
- [ ] **Produits** : `/bijoux` affiche les produits
- [ ] **Packs** : `/packs` affiche les packs
- [ ] **Images** : Toutes les images se chargent (Vercel Blob)

### 2. Tests Fonctionnels

- [ ] **Authentification** : Login/Register fonctionne
- [ ] **Panier** : Ajout au panier fonctionne
- [ ] **Checkout** : Processus de commande complet
- [ ] **Admin** : Interface admin accessible (role admin requis)

### 3. Tests de Performance

- [ ] **Lighthouse** : Score > 90
- [ ] **Images** : Chargement optimisé (WebP/AVIF)
- [ ] **Bundle Size** : < 500 KB First Load JS ✅ (actuel: 485 KB)

### 4. Tests de Sécurité

- [ ] **HTTPS** : Forcé en production
- [ ] **Headers** : Security headers présents
- [ ] **CSRF** : Protection active sur mutations
- [ ] **Rate Limiting** : Fonctionne (Redis si configuré)

---

## 🔄 ROLLBACK STRATEGY

### Si Déploiement Échoue

1. **Vercel Dashboard** : Rollback vers version précédente
2. **Database** : Restaurer depuis backup SQLite
3. **Blob** : Images restent accessibles (pas de perte)

### Commandes de Rollback

```bash
# Via Vercel CLI
vercel rollback

# Via Dashboard
# Deployments > Select previous version > Promote to Production
```

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Métriques à Surveiller

1. **Performance**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

2. **Erreurs**
   - Vercel Logs : Erreurs 500
   - Sentry (si configuré) : Erreurs frontend

3. **Base de Données**
   - Connexions actives
   - Temps de requête
   - Erreurs de connexion

---

## 🎯 CHECKLIST FINALE

### Avant Production
- [x] ✅ Build réussi (`npm run build`)
- [x] ✅ Types TypeScript valides
- [x] ✅ Lint passé
- [x] ✅ Tests passent (si disponibles)
- [ ] ⚠️ Migration script créé et testé
- [ ] ⚠️ Variables d'environnement configurées
- [ ] ⚠️ Vercel Postgres créé
- [ ] ⚠️ Vercel Blob créé
- [ ] ⚠️ Upstash Redis créé (optionnel)

### Après Production
- [ ] ⚠️ Smoke tests passent
- [ ] ⚠️ Monitoring configuré
- [ ] ⚠️ Backup automatique configuré
- [ ] ⚠️ Alerts configurées

---

## 📝 NOTES IMPORTANTES

1. **SQLite → Postgres** : Migration nécessaire avant production
2. **Images** : Vercel Blob obligatoire (filesystem éphémère)
3. **Rate Limiting** : Redis recommandé pour production
4. **Monitoring** : Configurer Vercel Analytics + Logs

---

## ✅ STATUT ACTUEL

- **Code:** ✅ Production Ready
- **Configuration:** ⚠️ Nécessite setup Vercel
- **Migration:** ⚠️ Script à créer
- **Tests:** ✅ Build réussi

**Prochaine Étape:** Créer le script de migration SQLite → Postgres

