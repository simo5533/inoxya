# 🚀 Déployer sur Vercel en 10 Minutes

**Guide étape par étape avec captures d'écran (clics exacts)**

---

## ⚡ ÉTAPE 1 : CRÉER POSTGRES (2 min)

1. **Dashboard Vercel** → Votre projet → **Storage** (menu gauche)
2. Cliquer **Create Database**
3. Sélectionner **Postgres**
4. Nom: `inoxya-postgres`
5. Région: `fra1` (Europe) ou la plus proche
6. Cliquer **Create**

✅ **Résultat:** `DATABASE_URL` ajouté automatiquement aux variables d'environnement

---

## 📦 ÉTAPE 2 : CRÉER BLOB STORAGE (1 min)

1. **Dashboard Vercel** → Votre projet → **Storage** (menu gauche)
2. Cliquer **Create Database**
3. Sélectionner **Blob**
4. Nom: `inoxya-blob`
5. Cliquer **Create**

✅ **Résultat:** `BLOB_READ_WRITE_TOKEN` ajouté automatiquement aux variables d'environnement

---

## 🔐 ÉTAPE 3 : VARIABLES D'ENVIRONNEMENT (2 min)

1. **Dashboard Vercel** → Votre projet → **Settings** (menu gauche)
2. Cliquer **Environment Variables** (sous-section)
3. Cliquer **Add New** (bouton)

### Ajouter ces variables:

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `NODE_ENV` | `production` | Production, Preview, Development |
| `JWT_SECRET` | `[générer]` | Production, Preview, Development |

**Générer JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANT:** `NEXT_PUBLIC_SITE_URL` sera ajouté **APRÈS** la configuration du domaine (Étape 6)

### Variables déjà ajoutées automatiquement:
- ✅ `DATABASE_URL` (après Étape 1)
- ✅ `BLOB_READ_WRITE_TOKEN` (après Étape 2)

### Variables optionnelles (à ajouter si nécessaire):
- `UPSTASH_REDIS_REST_URL` (si Redis configuré)
- `UPSTASH_REDIS_REST_TOKEN` (si Redis configuré)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (si email configuré)
- `ADMIN_EMAIL` (si email configuré)

4. Cliquer **Save** pour chaque variable

---

## 📦 ÉTAPE 4 : MIGRATION SQLITE → POSTGRES (2 min)

### 4.1 Préparer Localement

```bash
# 1. Tester la migration (dry-run)
npm run db:migrate

# 2. Vérifier le rapport (doit montrer les tables et comptes)
```

**Résultat attendu:**
```
📊 RAPPORT DE MIGRATION
==================================================
Mode: DRY-RUN (aucune modification)
Total lignes source: XXX
```

### 4.2 Exécuter la Migration

```bash
# Migration réelle
npm run db:migrate:execute
```

✅ **Résultat attendu:** `✅ Migration terminée avec succès!`

### 4.3 Vérifier sur Vercel

1. **Dashboard Vercel** → **Storage** → **Postgres** → **Data**
2. Vérifier que les tables existent (products, orders, users, etc.)

---

## 🚀 ÉTAPE 5 : DÉPLOYER PREVIEW (2 min)

### 5.1 Connecter le Repository

1. **Dashboard Vercel** → **Add New Project** (bouton en haut)
2. Importer depuis Git (GitHub/GitLab/Bitbucket)
3. Sélectionner le repository `inoxya-bijoux`
4. Cliquer **Import**

### 5.2 Configuration Automatique

Vercel détecte Next.js automatiquement. Vérifier:
- ✅ **Framework Preset:** `Next.js`
- ✅ **Root Directory:** `./` (vide)
- ✅ **Build Command:** `npm run build`
- ✅ **Output Directory:** `.next`

### 5.3 Premier Déploiement

1. Cliquer **Deploy**
2. Attendre la fin du build (2-3 minutes)
3. Vérifier les logs pour erreurs

**URL Preview:** `https://inoxya-bijoux-xxx.vercel.app`

---

## ✅ ÉTAPE 6 : TESTS PREVIEW (1 min)

### Checklist Rapide

Ouvrir l'URL Preview et vérifier:

- [ ] **Homepage:** `/` charge correctement
- [ ] **"Notre Collection":** Section visible avec catégories
- [ ] **Catégories:** Cliquer sur une catégorie → Filtre les produits
- [ ] **Produits:** `/bijoux` affiche les produits
- [ ] **Packs:** `/packs` affiche les packs
- [ ] **Images:** Toutes les images se chargent (Vercel Blob)
- [ ] **Panier:** Ajouter au panier fonctionne
- [ ] **Checkout:** `/panier/checkout` → Remplir formulaire → "Confirmer" → Commande créée

**Si tout fonctionne → Passer à l'Étape 7**

---

## 🌍 ÉTAPE 7 : CONFIGURER LE DOMAINE (1 min)

### 7.1 Ajouter le Domaine

1. **Dashboard Vercel** → Votre projet → **Settings** → **Domains**
2. Cliquer **Add Domain**
3. Entrer votre domaine (ex: `www.inoxya-bijoux.com`)
4. Suivre les instructions DNS

### 7.2 Mettre à Jour NEXT_PUBLIC_SITE_URL

1. **Dashboard Vercel** → **Settings** → **Environment Variables**
2. Cliquer sur `NEXT_PUBLIC_SITE_URL` → **Edit**
3. Modifier:
   - **Production:** `https://www.inoxya-bijoux.com` (votre domaine)
   - **Preview:** `https://inoxya-bijoux-xxx.vercel.app` (domaine preview)
4. Cliquer **Save**

### 7.3 Redéployer

1. **Dashboard Vercel** → **Deployments**
2. Sélectionner le dernier déploiement
3. Cliquer **⋯** (menu) → **Redeploy**
4. Attendre la fin du build

---

## ✅ ÉTAPE 8 : TESTS PRODUCTION

### Checklist Finale

- [ ] Homepage charge
- [ ] "Notre Collection" + catégories visibles
- [ ] Filtrage par catégorie fonctionne
- [ ] Produits affichés
- [ ] Packs affichés
- [ ] Panier fonctionne
- [ ] Checkout fonctionne (commande créée + admin reçoit notification)
- [ ] Images se chargent
- [ ] HTTPS forcé

---

## 🆘 DÉPANNAGE RAPIDE

| Problème | Solution |
|----------|----------|
| Build échoue | Vérifier les logs Vercel → Erreurs TypeScript |
| Images ne se chargent pas | Vérifier `BLOB_READ_WRITE_TOKEN` est défini |
| Base de données erreur | Vérifier `DATABASE_URL` est défini + Migration exécutée |
| Checkout échoue | Vérifier les logs API → Erreurs de validation |

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

## 📝 NOTES IMPORTANTES

- **Domain:** Ne définissez `NEXT_PUBLIC_SITE_URL` qu'après avoir configuré le domaine
- **Migration:** Exécutez toujours un dry-run avant la migration réelle
- **Preview:** Testez toujours en preview avant de promouvoir en production

**Prêt! 🚀**

