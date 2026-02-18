# 🚀 GUIDE DE DÉPLOIEMENT - INOXYA BIJOUX

**Version:** 1.0.0  
**Date:** 2026-02-13

---

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Base de données SQLite (développement) ou PostgreSQL (production)
- Variables d'environnement configurées

---

## 🔧 Configuration

### 1. Variables d'Environnement

Copier `env.example` vers `.env.local`:

```bash
cp env.example .env.local
```

**Variables essentielles:**

```env
# Base de données
DATABASE_URL=file:./data/inoxya_bijoux.db  # SQLite (dev)
# ou
DATABASE_URL=postgresql://user:password@host:5432/dbname  # PostgreSQL (prod)

# Application
NEXT_PUBLIC_SITE_URL=https://inoxya-bijoux.com
NODE_ENV=production

# Sécurité
JWT_SECRET=your-secret-key-here
CSRF_SECRET=your-csrf-secret-here

# Email (optionnel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

---

## 🗄️ Stratégie Base de Données

### Développement (SQLite)

**Avantages:**
- Simple, pas de serveur externe
- Fichier unique : `data/inoxya_bijoux.db`
- Parfait pour développement local

**Utilisation:**
```bash
# La DB est créée automatiquement au premier démarrage
npm run dev
```

**Scripts utiles:**
```bash
npm run verify:sqlite          # Vérifier l'intégrité
npm run db:normalize-categories # Normaliser les catégories
npm run db:diagnose-categories  # Diagnostiquer les problèmes
```

### Production (PostgreSQL)

**Recommandé pour:**
- Déploiement VPS/Dedicated
- Haute disponibilité
- Concurrence élevée

**Migration SQLite → PostgreSQL:**
```bash
# 1. Configurer PostgreSQL
npm run db:start  # Docker Compose (local)
# ou configurer votre instance PostgreSQL

# 2. Migrer les données
npm run db:migrate

# 3. Vérifier
npm run db:verify
```

**Configuration Docker (optionnel):**
```bash
# Démarrer PostgreSQL
docker-compose up -d

# Initialiser la DB
npm run db:setup
```

---

## 🏗️ Build & Déploiement

### Build de Production

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier la base de données
npm run verify:all

# 3. Normaliser les catégories (si nécessaire)
npm run db:normalize-categories:execute

# 4. Build
npm run build

# 5. Vérifier le build
npm run start
```

### Déploiement Vercel

1. **Connecter le repository**
2. **Configurer les variables d'environnement** dans Vercel Dashboard
3. **Important:** SQLite ne fonctionne PAS sur Vercel (système de fichiers éphémère)
   - Utiliser PostgreSQL (Supabase, Neon, etc.)
   - Ou déployer sur VPS avec SQLite

### Déploiement VPS

**Recommandé:** VPS avec Node.js + PM2 + Nginx

```bash
# 1. Cloner le projet
git clone <repo-url>
cd inoxya-bijoux

# 2. Installer
npm install

# 3. Configurer .env.local
cp env.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Normaliser la DB (si nécessaire)
npm run db:normalize-categories:execute

# 5. Build
npm run build

# 6. Démarrer avec PM2
pm2 start npm --name "inoxya-bijoux" -- start
pm2 save
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name inoxya-bijoux.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ Vérifications Post-Déploiement

### 1. Smoke Tests

```bash
# Tester l'API
curl https://inoxya-bijoux.com/api/products
curl https://inoxya-bijoux.com/api/products?category=bracelets

# Tester les pages
# Ouvrir dans navigateur:
# - https://inoxya-bijoux.com
# - https://inoxya-bijoux.com/bijoux
# - https://inoxya-bijoux.com/bijoux?category=bracelets
# - https://inoxya-bijoux.com/packs
```

### 2. Vérifications Manuelles

- [ ] Page d'accueil charge correctement
- [ ] Catalogue bijoux affiche les produits
- [ ] Filtrage par catégorie fonctionne (cliquer sur cartes)
- [ ] Images s'affichent correctement
- [ ] Pas d'erreur console (F12)
- [ ] Responsive fonctionnel (mobile/tablet/desktop)

### 3. Vérifications Admin

- [ ] Connexion admin fonctionne
- [ ] CRUD produits fonctionne
- [ ] Gestion des commandes fonctionne
- [ ] Upload d'images fonctionne

---

## 🔒 Sécurité Production

### Checklist Sécurité

- [x] Variables d'environnement sécurisées (pas dans le code)
- [x] JWT secret fort et unique
- [x] CSRF protection activée
- [x] Rate limiting sur login/checkout
- [x] Requêtes SQL paramétrées
- [x] Validation Zod sur toutes les APIs
- [x] HTTPS activé (production)
- [x] Headers de sécurité (CSP, HSTS, etc.)

### Variables Sensibles

**NE JAMAIS COMMITER:**
- `.env.local`
- `data/inoxya_bijoux.db` (si SQLite)
- Clés API
- Secrets JWT/CSRF

---

## 📊 Monitoring

### Logs

Les logs sont gérés par `lib/logger.ts`:
- Erreurs API
- Erreurs DB
- Actions importantes

**En production, configurer:**
- Sentry (optionnel) pour tracking d'erreurs
- Logs centralisés (CloudWatch, Datadog, etc.)

### Métriques à Surveiller

- Temps de réponse API
- Taux d'erreur 500
- Utilisation DB
- Espace disque (si SQLite)

---

## 🐛 Troubleshooting

### Problème: "Aucun bijou trouvé" après clic sur catégorie

**Solution:**
```bash
# 1. Vérifier la normalisation
npm run db:diagnose-categories

# 2. Normaliser si nécessaire
npm run db:normalize-categories:execute

# 3. Redémarrer
npm run start
```

### Problème: Images ne s'affichent pas

**Solution:**
```bash
# Vérifier les images
npm run verify:images

# Vérifier que public/images/ existe
ls -la public/images/
```

### Problème: Build échoue

**Solution:**
```bash
# Nettoyer le cache
rm -rf .next
npm run build
```

---

## 📚 Scripts Disponibles

### Base de Données

```bash
npm run db:diagnose-categories      # Diagnostiquer catégories
npm run db:normalize-categories     # Dry-run normalisation
npm run db:normalize-categories:execute  # Exécuter normalisation
npm run verify:sqlite               # Vérifier DB
npm run verify:images               # Vérifier images produits
npm run verify:packs                # Vérifier images packs
npm run verify:all                  # Toutes les vérifications
```

### Tests

```bash
npm run test:category-filter       # Tester filtrage API
```

### Développement

```bash
npm run dev                         # Serveur dev
npm run build                       # Build production
npm run start                       # Serveur production
npm run lint                        # Linter
```

---

## 📞 Support

En cas de problème:
1. Vérifier les logs (`lib/logger.ts`)
2. Exécuter les scripts de diagnostic
3. Consulter `docs/FINAL_AUDIT.md` pour les problèmes connus

---

**Dernière mise à jour:** 2026-02-13
