# 🚀 GUIDE DE DÉPLOIEMENT - INOXYA BIJOUX
**Version:** 1.0  
**Date:** $(date)

---

## 📋 PRÉREQUIS

### Environnement
- Node.js 18+ (recommandé: 20.x)
- npm ou yarn
- Base de données SQLite (`data/inoxya_bijoux.db`)

### Variables d'Environnement
Créer un fichier `.env.local` avec:

```env
# Site URL (obligatoire)
NEXT_PUBLIC_SITE_URL=https://inoxya-bijoux.com

# Environnement
NODE_ENV=production

# Base de données (optionnel, par défaut: data/inoxya_bijoux.db)
DATABASE_PATH=./data/inoxya_bijoux.db

# Fallback (désactivé en production)
ENABLE_FALLBACK=0
```

---

## 🔧 COMMANDES DE BUILD

### Développement
```bash
npm install
npm run dev
```

### Production (Build)
```bash
npm install
npm run build
npm run start
```

### Vérification
```bash
# Vérifier les erreurs TypeScript
npm run type-check

# Vérifier le linting
npm run lint

# Vérifier la build
npm run build
```

---

## ✅ CHECKLIST PRÉ-DÉPLOIEMENT

### Configuration
- [ ] Variables d'environnement configurées (`.env.local`)
- [ ] `NEXT_PUBLIC_SITE_URL` défini correctement
- [ ] Base de données présente (`data/inoxya_bijoux.db`)
- [ ] Images présentes dans `public/images/`

### Build
- [ ] `npm run build` réussit sans erreurs
- [ ] `npm run start` démarre correctement
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur ESLint critique

### Fonctionnalités
- [ ] Page d'accueil charge correctement
- [ ] Catalogue produits (`/bijoux`) fonctionne
- [ ] Pages produits (`/bijoux/[id]`) fonctionnent
- [ ] Pages packs (`/packs`, `/packs/[id]`) fonctionnent
- [ ] Panier fonctionne
- [ ] Checkout fonctionne
- [ ] Admin accessible et fonctionnel

### SEO
- [ ] Sitemap accessible (`/sitemap.xml`)
- [ ] Robots.txt accessible (`/robots.txt`)
- [ ] Metadata correcte sur toutes les pages
- [ ] JSON-LD présent (Organization, Product, BreadcrumbList)
- [ ] Images avec alt text descriptif

### Performance
- [ ] Images optimisées (Next/Image avec sizes)
- [ ] Pas de warnings Next/Image
- [ ] Lazy loading activé
- [ ] Core Web Vitals acceptables

### Sécurité
- [ ] Routes admin protégées
- [ ] CSRF protection activée
- [ ] Validation Zod sur toutes les routes API
- [ ] Headers de sécurité configurés

---

## 🌐 HÉBERGEMENT RECOMMANDÉ

### Option 1: Vercel (Recommandé)
1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

**Avantages:**
- Optimisé pour Next.js
- Déploiement automatique
- CDN global
- SSL automatique

### Option 2: VPS (DigitalOcean, AWS, etc.)
1. Installer Node.js 20+
2. Cloner le repository
3. Configurer nginx comme reverse proxy
4. Utiliser PM2 pour gérer le processus
5. Configurer SSL avec Let's Encrypt

**Configuration nginx:**
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

**PM2:**
```bash
npm install -g pm2
pm2 start npm --name "inoxya-bijoux" -- start
pm2 save
pm2 startup
```

### Option 3: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 MONITORING

### Recommandations
- [ ] Google Analytics configuré
- [ ] Google Search Console configuré
- [ ] Monitoring d'erreurs (Sentry, LogRocket)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

### Logs
- Logs d'erreurs: `lib/logger.ts`
- Logs en développement: console
- Logs en production: fichiers ou service externe

---

## 🔄 MAINTENANCE

### Mises à jour
1. `git pull` pour récupérer les dernières modifications
2. `npm install` pour mettre à jour les dépendances
3. `npm run build` pour vérifier la build
4. Redémarrer le serveur

### Backup
- [ ] Backup régulier de `data/inoxya_bijoux.db`
- [ ] Backup des images dans `public/images/`
- [ ] Backup de la configuration (`.env.local`)

### Performance
- [ ] Vérifier régulièrement les Core Web Vitals
- [ ] Optimiser les images si nécessaire
- [ ] Nettoyer les logs régulièrement
- [ ] Vérifier l'utilisation de la base de données

---

## 🐛 DÉPANNAGE

### Erreurs courantes

#### "Database not found"
- Vérifier que `data/inoxya_bijoux.db` existe
- Vérifier les permissions du fichier

#### "Internal Server Error"
- Vérifier les logs (`lib/logger.ts`)
- Vérifier la connexion à la base de données
- Vérifier les variables d'environnement

#### "Module not found"
- Exécuter `npm install`
- Vérifier que toutes les dépendances sont installées

#### "Build failed"
- Vérifier les erreurs TypeScript: `npm run type-check`
- Vérifier les erreurs ESLint: `npm run lint`
- Vérifier que toutes les images existent

---

## 📞 SUPPORT

### Contact
- Email: inoxya@gmail.ma
- Téléphone: 07 17 58 19 40
- WhatsApp: https://wa.me/212717581940

### Documentation
- Next.js: https://nextjs.org/docs
- TypeScript: https://www.typescriptlang.org/docs
- SQLite: https://www.sqlite.org/docs.html

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

- [ ] Site accessible publiquement
- [ ] Toutes les pages fonctionnent
- [ ] Images chargent correctement
- [ ] Formulaires fonctionnent (checkout, contact)
- [ ] Admin accessible
- [ ] Sitemap accessible
- [ ] Robots.txt accessible
- [ ] SSL configuré (HTTPS)
- [ ] Google Search Console configuré
- [ ] Analytics configuré

---

**Status:** ✅ Projet prêt pour déploiement

