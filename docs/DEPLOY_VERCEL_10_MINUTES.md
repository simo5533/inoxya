# 🚀 Déployer sur Vercel en 10 Minutes

**Guide étape par étape pour déployer INOXYA BIJOUX sur Vercel**

---

## ⚡ ÉTAPE 1 : CRÉER LES INTÉGRATIONS (3 min)

### 1.1 Vercel Postgres

1. **Dashboard Vercel** → Votre projet → **Storage** → **Create Database**
2. Sélectionner **Postgres**
3. Nom: `inoxya-postgres`
4. Région: `fra1` (Europe) ou la plus proche
5. Cliquer **Create**

✅ **Résultat:** `DATABASE_URL` ajouté automatiquement

### 1.2 Vercel Blob Storage

1. **Dashboard Vercel** → Votre projet → **Storage** → **Create Database**
2. Sélectionner **Blob**
3. Nom: `inoxya-blob`
4. Cliquer **Create**

✅ **Résultat:** `BLOB_READ_WRITE_TOKEN` ajouté automatiquement

### 1.3 Upstash Redis (Optionnel - Rate Limiting)

1. Aller sur [upstash.com](https://upstash.com) → Créer un compte
2. Créer une base Redis
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
4. Les ajouter dans Vercel (voir Étape 2)

---

## 🔐 ÉTAPE 2 : VARIABLES D'ENVIRONNEMENT (2 min)

**Dashboard Vercel** → Votre projet → **Settings** → **Environment Variables**

### Variables OBLIGATOIRES

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement |
| `JWT_SECRET` | `[générer 32+ caractères]` | **Générer:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.com` | **⚠️ À définir APRÈS le domaine** |

### Variables OPTIONNELLES

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `UPSTASH_REDIS_REST_URL` | `[URL Upstash]` | Si Redis configuré |
| `UPSTASH_REDIS_REST_TOKEN` | `[Token Upstash]` | Si Redis configuré |
| `SMTP_HOST` | `[smtp.example.com]` | Si email configuré |
| `SMTP_PORT` | `587` | Si email configuré |
| `SMTP_USER` | `[user@example.com]` | Si email configuré |
| `SMTP_PASS` | `[password]` | Si email configuré |
| `ADMIN_EMAIL` | `[admin@example.com]` | Si email configuré |

**Note:** `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` sont **automatiquement ajoutés** par Vercel.

---

## 📦 ÉTAPE 3 : MIGRATION SQLITE → POSTGRES (2 min)

### 3.1 Préparer Localement

```bash
# 1. Tester la migration (dry-run)
npm run db:migrate

# 2. Vérifier le rapport (doit montrer les tables et comptes)
```

### 3.2 Exécuter la Migration

```bash
# Migration réelle
npm run db:migrate:execute
```

✅ **Résultat attendu:** `✅ Migration terminée avec succès!`

### 3.3 Vérifier sur Vercel

**Dashboard Vercel** → **Storage** → **Postgres** → **Data** → Vérifier les tables

---

## 🚀 ÉTAPE 4 : DÉPLOYER (2 min)

### 4.1 Connecter le Repository

1. **Dashboard Vercel** → **Add New Project**
2. Importer depuis Git (GitHub/GitLab/Bitbucket)
3. Sélectionner `inoxya-bijoux`
4. Cliquer **Import**

### 4.2 Premier Déploiement (Preview)

1. Vercel détecte Next.js automatiquement
2. Cliquer **Deploy**
3. Attendre la fin du build

**URL Preview:** `https://inoxya-bijoux-xxx.vercel.app`

---

## ✅ ÉTAPE 5 : TESTS PREVIEW (1 min)

### Checklist Rapide

- [ ] Homepage charge: `/`
- [ ] Produits affichés: `/bijoux`
- [ ] Packs affichés: `/packs`
- [ ] Images se chargent (Vercel Blob)
- [ ] Admin login: `/login` (si admin créé)

**Si tout fonctionne → Passer à l'Étape 6**

---

## 🌍 ÉTAPE 6 : CONFIGURER LE DOMAINE (1 min)

### 6.1 Ajouter le Domaine

1. **Dashboard Vercel** → Votre projet → **Settings** → **Domains**
2. Cliquer **Add Domain**
3. Entrer votre domaine (ex: `www.inoxya-bijoux.com`)
4. Suivre les instructions DNS

### 6.2 Mettre à Jour NEXT_PUBLIC_SITE_URL

1. **Dashboard Vercel** → **Settings** → **Environment Variables**
2. Modifier `NEXT_PUBLIC_SITE_URL`:
   - **Production:** `https://www.inoxya-bijoux.com` (votre domaine)
   - **Preview:** `https://inoxya-bijoux-xxx.vercel.app`
3. **Redeploy** le projet

---

## ✅ ÉTAPE 7 : TESTS PRODUCTION

### Checklist Finale

- [ ] Homepage charge
- [ ] Produits affichés
- [ ] Packs affichés
- [ ] Panier fonctionne
- [ ] Checkout fonctionne
- [ ] Admin fonctionne
- [ ] Images se chargent
- [ ] HTTPS forcé

---

## 🆘 DÉPANNAGE RAPIDE

| Problème | Solution |
|----------|----------|
| Build échoue | Vérifier les logs Vercel → Erreurs TypeScript |
| Images ne se chargent pas | Vérifier `BLOB_READ_WRITE_TOKEN` est défini |
| Base de données erreur | Vérifier `DATABASE_URL` est défini + Migration exécutée |
| Rate limiting ne fonctionne pas | Optionnel - Fallback mémoire si Redis non configuré |

---

## ✅ CHECKLIST FINALE

- [ ] Postgres créé
- [ ] Blob créé
- [ ] Variables d'environnement configurées
- [ ] Migration exécutée
- [ ] Preview déployé et testé
- [ ] Domaine configuré
- [ ] `NEXT_PUBLIC_SITE_URL` mis à jour
- [ ] Production testée

**Temps total: ~10 minutes** ⏱️

---

## 📝 NOTES

- **Domain:** Ne définissez `NEXT_PUBLIC_SITE_URL` qu'après avoir configuré le domaine
- **Migration:** Exécutez toujours un dry-run avant la migration réelle
- **Backup:** Vercel Postgres inclut des backups automatiques

**Prêt! 🚀**

