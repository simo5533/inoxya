# 📋 CHECKLIST DE DÉPLOIEMENT - INOXYA BIJOUX

**Date:** 2025-02-14  
**Version:** 1.0.0

---

## ✅ PRÉ-DÉPLOIEMENT

### 1. Build & Tests
- [x] `npm run build` - ✅ SUCCÈS
- [x] `npm run lint` - ✅ Aucune erreur critique
- [x] `npx tsc --noEmit` - ✅ Build OK (warnings non bloquants)
- [x] `npm run verify:all` - ⚠️  Vérifier DB et images

### 2. Variables d'Environnement
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` - Généré (min 32 caractères, 64+ recommandé)
  ```bash
  openssl rand -base64 32
  ```
- [ ] `NEXT_PUBLIC_SITE_URL` - URL production (ex: `https://inoxya-bijoux.com`)
- [ ] `DATABASE_URL` - PostgreSQL (production) ou SQLite (dev)
- [ ] `ENABLE_FALLBACK` - Non défini ou `0` (jamais activé en prod)
- [ ] `ENABLE_DEMO_SEED` - Non défini ou `0` (jamais activé en prod)

### 3. Base de Données
- [ ] Base de données initialisée
- [ ] Tables créées (products, packs, categories, users, orders, etc.)
- [ ] Données réelles importées (pas de demo)
- [ ] Images uploadées dans `public/`
- [ ] Chemins d'images relatifs (pas de chemins absolus Windows)

### 4. Sécurité
- [ ] JWT_SECRET unique et sécurisé
- [ ] Cookies sécurisés (httpOnly, secure, sameSite)
- [ ] Rate limiting activé
- [ ] CSRF protection activée
- [ ] Validation Zod sur toutes les routes API

---

## 🚀 DÉPLOIEMENT VERCEL

### Étapes
1. **Connecter le repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Configurer les variables d'environnement**
   - Aller dans Vercel Dashboard → Settings → Environment Variables
   - Ajouter toutes les variables de `env.example`

3. **Déployer**
   ```bash
   vercel --prod
   ```

### Variables Vercel Requises
```
NODE_ENV=production
JWT_SECRET=<généré-avec-openssl>
NEXT_PUBLIC_SITE_URL=https://votredomaine.com
DATABASE_URL=<postgresql-url>
```

### Notes Vercel
- ⚠️  **SQLite ne fonctionne PAS sur Vercel** (système de fichiers éphémère)
- ✅ Utiliser PostgreSQL (Supabase, Railway, Neon, etc.)
- ✅ Les images doivent être dans `public/` ou sur un CDN

---

## 🐳 DÉPLOIEMENT DOCKER

### Dockerfile
Le projet inclut un `Dockerfile`. Pour construire et lancer:

```bash
# Build
docker build -t inoxya-bijoux .

# Run
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=<votre-secret> \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -v $(pwd)/data:/app/data \
  inoxya-bijoux
```

### Docker Compose
```bash
# Avec PostgreSQL
docker-compose up -d
```

---

## 🖥️ DÉPLOIEMENT VPS

### Prérequis
- Node.js 18+
- npm ou yarn
- PostgreSQL (optionnel, SQLite par défaut)

### Étapes
1. **Cloner le repository**
   ```bash
   git clone <repo-url>
   cd inoxya-bijoux
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp env.example .env.local
   # Éditer .env.local avec les valeurs production
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Lancer avec PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "inoxya-bijoux" -- start
   pm2 save
   pm2 startup
   ```

### Nginx (Reverse Proxy)
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

## ✅ POST-DÉPLOIEMENT

### Vérifications
- [ ] Site accessible (https://votredomaine.com)
- [ ] Pages produits s'affichent
- [ ] Pages packs s'affichent
- [ ] Login admin fonctionne
- [ ] CRUD produits fonctionne
- [ ] Images s'affichent correctement
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs dans les logs

### Tests Manuels
1. **Frontend**
   - [ ] Page d'accueil
   - [ ] Page bijoux (toutes catégories)
   - [ ] Page packs
   - [ ] Page produit individuel
   - [ ] Panier
   - [ ] Favoris
   - [ ] Checkout

2. **Admin**
   - [ ] Login admin
   - [ ] Dashboard
   - [ ] Créer produit
   - [ ] Modifier produit
   - [ ] Supprimer produit
   - [ ] Gestion packs
   - [ ] Gestion commandes

3. **API**
   - [ ] `GET /api/products` - 200
   - [ ] `GET /api/products?category=bagues` - 200
   - [ ] `GET /api/packs` - 200
   - [ ] `POST /api/auth/login` - 200/401
   - [ ] `GET /api/orders` (admin) - 200/403

---

## 🔧 TROUBLESHOOTING

### Erreur: "JWT_SECRET must be set"
**Solution:** Ajouter `JWT_SECRET` dans les variables d'environnement (min 32 caractères)

### Erreur: "Base de données indisponible"
**Solution:** 
- Vérifier `DATABASE_URL` (PostgreSQL) ou créer `data/inoxya_bijoux.db` (SQLite)
- Vérifier les permissions d'écriture sur `data/`

### Erreur: "Images non trouvées"
**Solution:**
- Vérifier que les images sont dans `public/`
- Vérifier que les chemins sont relatifs (pas absolus Windows)
- Exécuter `npm run verify:images`

### Erreur: "Fallback activé en production"
**Solution:** 
- Vérifier que `ENABLE_FALLBACK` n'est pas défini ou = `0`
- Vérifier que `NODE_ENV=production`
- Le fallback est automatiquement désactivé en production

---

## 📞 SUPPORT

Pour toute question ou problème:
1. Vérifier les logs: `npm run verify:all`
2. Vérifier les variables d'environnement
3. Consulter `docs/FINAL_RELEASE_REPORT.md`

---

**Dernière mise à jour:** 2025-02-14
