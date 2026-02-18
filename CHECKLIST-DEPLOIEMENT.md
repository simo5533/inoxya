# Checklist déploiement – INOXYA BIJOUX

**Date :** 2025  
**Objectif :** Vérifier si le projet est prêt pour le déploiement.

---

## 1. Résumé : prêt pour le déploiement ?

| Critère | Statut | Note |
|--------|--------|------|
| Build production | ✅ | `npm run build` réussit |
| Configuration (vercel.json) | ✅ | Next.js + en-têtes sécurité |
| Variables d'environnement | ⚠️ | À configurer selon la cible |
| **Base de données (SQLite)** | ⚠️ **Important** | Voir § 4 |
| Sécurité (headers, auth) | ✅ | Headers HSTS, XSS, etc. |

**Verdict :** Le projet **peut être déployé** une fois les points ci-dessous traités, en particulier le choix de l’hébergement et de la base de données pour la production.

---

## 2. Ce qui est prêt

### 2.1 Build et application
- **Next.js 15** : build OK, 40 routes générées.
- **TypeScript** : compilé (ignoreBuildErrors: true dans next.config si besoin).
- **Pages** : accueil, bijoux, panier, checkout, admin, login, etc.

### 2.2 Sécurité
- **En-têtes** (next.config.mjs + vercel.json) : HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy.
- **Authentification** : cookies httpOnly, rôles admin/moderator/user.
- **API** : validation des entrées, vérification des prix côté serveur au checkout, rate limiting (login, checkout).
- **Powered-by** : désactivé (`poweredByHeader: false`).

### 2.3 Configuration déploiement (Vercel)
- **vercel.json** présent : `installCommand`, `buildCommand`, `outputDirectory: ".next"`, `framework: "nextjs"`, headers sécurité.

### 2.4 Base de données (en local / hébergement avec disque)
- **SQLite** : tables créées dans `initializeDatabase()` (products, users, orders, payments, etc.).
- Fichier : `data/inoxya_bijoux.db` (créé au premier run).
- **Scripts** : `node scripts/test-final-integration.js` pour vérifier la DB.

---

## 3. À faire avant de déployer

### 3.1 Variables d'environnement (production)

Créer `.env.local` (ou configurer dans le dashboard Vercel / autre hébergeur) :

```env
# Obligatoire en production si vous utilisez lib/security.ts (JWT)
JWT_SECRET=votre-secret-long-minimum-32-caracteres

# Optionnel – notifications email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=

# Optionnel – URL du site (pour CORS / emails)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

- **JWT_SECRET** : requis si des fonctionnalités utilisent les JWT de `lib/security.ts` (sinon l’app tourne avec cookies uniquement).
- **SMTP** : uniquement si vous voulez les emails admin (nouvelles commandes, etc.).

### 3.2 Images et chemins
- Remplacer les **chemins absolus Windows** (ex. `C:\...\boucle1.jpeg`) par des URLs ou chemins relatifs sous `/images/...` pour que les images s’affichent correctement en production.
- Les images dans `public/images/` sont servies correctement ; vérifier que toutes les images produits pointent vers ce dossier ou un CDN.

### 3.3 Tests manuels recommandés après déploiement
- [ ] Page d’accueil et /bijoux
- [ ] Connexion (login) et inscription
- [ ] Ajout au panier et favoris
- [ ] Checkout (création commande)
- [ ] Admin : produits, commandes, utilisateurs (avec compte admin)

---

## 4. Point critique : base de données en production

### 4.1 SQLite et Vercel (serverless)

- **Problème :** Sur **Vercel**, le système de fichiers est **éphémère** et **non persistant**. Le fichier `data/inoxya_bijoux.db` ne serait pas conservé entre les invocations et pourrait être en lecture seule selon les runtimes.
- **Conséquence :** Déployer tel quel sur Vercel avec SQLite **ne convient pas** pour une base de données persistante (utilisateurs, commandes, produits).

### 4.2 Options recommandées pour la production

1. **Vercel + base externe**
   - Utiliser **Vercel Postgres** (ou autre base gérée) et adapter le code pour utiliser `lib/postgres.ts` (ou un adapter) au lieu de SQLite en production.
   - Ou utiliser une base **SQLite hébergée** (ex. **Turso**) avec un client compatible serverless.

2. **Hébergement avec disque persistant**
   - Déployer sur un **VPS** (OVH, DigitalOcean, etc.) ou une **Plateforme (Node.js)** qui monte un volume persistant.
   - Lancer l’app avec `npm run build` puis `npm run start`.
   - Le fichier `data/inoxya_bijoux.db` reste sur le disque et SQLite fonctionne comme en local.

3. **Docker**
   - Le projet contient un **Dockerfile** : build d’image et run avec un volume pour `data/` permet de garder SQLite en production sur une machine ou un hébergeur qui supporte Docker.

### 4.3 Résumé

- **Déploiement sur Vercel “pur”** : prévoir une **base de données externe** (Postgres ou Turso), pas SQLite locale.
- **Déploiement sur VPS / Node avec disque (ou Docker avec volume)** : le projet est **prêt** avec SQLite après configuration des variables d’environnement et correction des chemins d’images.

---

## 5. Commandes utiles

| Action | Commande |
|--------|----------|
| Build | `npm run build` |
| Démarrer (prod) | `npm run start` |
| Dev | `npm run dev` |
| Test DB | `node scripts/test-final-integration.js` |
| Test API (serveur lancé) | `node scripts/test-api-products.js` |

---

## 6. Conclusion

- **Fonctionnel :** Oui – build OK, app testée, sécurité de base en place.
- **Prêt pour déploiement :** **Oui**, sous conditions :
  1. Choisir un hébergement adapté à la base de données (Vercel + DB externe, ou VPS/Docker avec SQLite).
  2. Configurer les variables d’environnement (au minimum `JWT_SECRET` si utilisé, et SMTP si besoin).
  3. Corriger les chemins d’images absolus pour la production.
  4. Tester les parcours critiques après le premier déploiement.

Une fois ces points traités, le projet **INOXYA BIJOUX** est prêt pour le déploiement.
