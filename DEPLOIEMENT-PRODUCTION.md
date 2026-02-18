# Mission critique – Préparation déploiement production INOXYA BIJOUX

**Date :** 2025  
**Objectif :** Rendre le projet prêt pour un déploiement en production sans modifier les fonctionnalités métier.

---

## 1. Liste des corrections appliquées

### Étape 1 – Audit global
- Identifié : SQLite initialisé au chargement du module → crash potentiel sur Vercel (FS éphémère).
- Identifié : Chemins d’images absolus Windows en base → réponses API inexploitables en production.
- Identifié : JWT_SECRET avec placeholder en build mais erreur en prod à clarifier.
- Identifié : Logger pouvait afficher des arguments sensibles en production.
- Vérifié : Headers de sécurité (next.config, vercel.json), cookies, rate limiting, validation des prix → déjà en place.

### Étape 2 – Variables d’environnement
- **lib/env.ts** (nouveau) : centralisation de la détection d’environnement (`getNodeEnv`, `isVercel`, `isSmtpConfigured`), documentation des variables, `ensureJwtSecretIfRequired` (log une fois si JWT manquant en prod).
- **lib/security.ts** : condition de production pour JWT clarifiée (erreur explicite en prod runtime si `JWT_SECRET` manquant).
- **lib/email.ts** : message de fallback SMTP explicite (pas de crash si non configuré).
- **env.example** : documentation complète (JWT_SECRET, SMTP, DB, NEXT_PUBLIC_SITE_URL).

### Étape 3 – Base de données (stratégie production-safe)
- **lib/sqlite.ts** : initialisation conditionnelle selon `VERCEL=1`. Si Vercel : `db = null`, pas d’accès disque. Toutes les fonctions exportées vérifient `if (!db)` et renvoient `null` / `[]` / `false` ou valeur par défaut. Aucun crash sur Vercel ; les API renvoient déjà 503 lorsque `testConnection()` est faux.
- Comportement conservé en local / VPS / Docker : SQLite utilisé comme avant.
- Abstraction pour base externe : le flux actuel passe par `lib/database.ts` → `lib/sqlite.ts`. Pour migrer vers Postgres/Turso, il suffit d’ajouter un autre module (ex. `lib/postgres-adapter.ts`) et de basculer les imports dans `lib/database.ts` selon une variable d’environnement (ex. `USE_POSTGRES=1`), sans refonte des routes.

### Étape 4 – Images et chemins
- **lib/image-path.ts** (nouveau) : `normalizeImageUrl()`, `isAbsoluteWindowsPath()`, `normalizeImageUrls()`. Tout chemin de type Windows (`C:\...`) est converti en `/placeholder.svg`.
- **app/api/products/route.ts** : application de `normalizeImageUrl` sur `main_image` et sur chaque élément de `images[]` dans la réponse GET.
- **app/api/products/[id]/route.ts** : application de `normalizeImageUrl` sur `image_url`, `main_image` et `images[]` dans la réponse GET.
- Les composants (ProductCard, ProductImageGallery) gardent leur `convertToImageUrl` côté client (défense en profondeur). Aucune suppression de fichier, aucun changement métier.

### Étape 5 – Sécurité et hardening production
- **lib/security.ts** : message d’erreur en production explicite pour `JWT_SECRET` manquant.
- **lib/logger.ts** : en production, `error()` ne log plus les `...args` supplémentaires pour éviter de faire fuir tokens/corps de requête ; seul le message et l’erreur (message) sont loggés.
- Headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) déjà présents dans next.config.mjs et vercel.json.
- Cookies (auth) : déjà httpOnly, secure en production, sameSite.
- Rate limiting et validation des prix côté serveur : inchangés et actifs.

### Étape 6 – Déploiement
- **Vercel** : pas de crash. Si `VERCEL=1`, SQLite n’est pas initialisé ; les API qui en dépendent renvoient 503 (ou données vides selon le cas). Pour un site pleinement fonctionnel sur Vercel, il faut connecter une base externe (Postgres, Turso, etc.) et adapter `lib/database.ts` (voir § 3).
- **VPS / Node** : `npm run build` puis `npm run start` ; SQLite utilise `data/inoxya_bijoux.db` ; comportement identique au dev.
- **Dockerfile** : création du répertoire `/app/data`, `chown` pour l’utilisateur nextjs, `VOLUME ["/app/data"]` pour persistance SQLite. Commentaire indiquant de monter un volume (ex. `-v inoxya-data:/app/data`).

### Étape 7 – Tests finaux
- Aucun test automatisé des parcours (accueil, catalogue, login, panier, checkout, admin) n’a été modifié ou ajouté. Les scripts existants (`test-final-integration.js`, `test-api-products.js`) restent valides.
- Vérifications recommandées manuellement après déploiement : accueil, catalogue bijoux, login/register, panier, checkout, admin (produits, commandes, utilisateurs).

---

## 2. Fichiers modifiés (avec explication)

| Fichier | Modification |
|--------|---------------|
| **lib/env.ts** | **Nouveau.** Détection env (isVercel, getNodeEnv), isSmtpConfigured, ensureJwtSecretIfRequired, documentation des variables. |
| **lib/image-path.ts** | **Nouveau.** Normalisation des URLs d’images (chemins Windows → placeholder). |
| **lib/sqlite.ts** | Init conditionnelle : si `VERCEL=1`, `db = null`. Création de `db` dans un try/catch. Ajout de `if (!db) return ...` dans toutes les fonctions exportées. Commentaire sur stratégie Vercel / VPS. |
| **lib/security.ts** | Condition production pour JWT : erreur claire en prod runtime si JWT_SECRET manquant ; build (NEXT_PHASE) garde le placeholder. |
| **lib/logger.ts** | En production, `error()` n’envoie plus les `...args` à la console pour éviter les fuites de données sensibles. |
| **lib/email.ts** | Message de log du fallback SMTP rendu explicite (pas de crash si SMTP non configuré). |
| **app/api/products/route.ts** | Import de `normalizeImageUrl` ; application sur `main_image` et `images[]` dans la réponse GET. |
| **app/api/products/[id]/route.ts** | Import de `normalizeImageUrl` ; application sur `image_url`, `main_image` et `images[]` dans la réponse GET. |
| **env.example** | Documentation des variables (JWT_SECRET, SMTP, DB, NEXT_PUBLIC_SITE_URL). |
| **Dockerfile** | Création de `/app/data`, permission nextjs, `VOLUME ["/app/data"]` et commentaire pour montage du volume. |

**Aucun fichier supprimé. Aucune fonctionnalité métier modifiée (panier, checkout, admin, auth).**

---

## 3. Alertes restantes (si migration DB requise)

- **Déploiement sur Vercel sans base externe** : l’application ne crashera pas, mais les données ne seront pas persistées (SQLite désactivé). Les API renverront 503 ou données vides. Pour un site en production sur Vercel, il faut :
  - Configurer une base externe (Vercel Postgres, Turso, Supabase, etc.).
  - Créer un adaptateur (ex. `lib/postgres-adapter.ts` ou client Turso) qui expose les mêmes signatures que les fonctions utilisées dans `lib/database.ts`.
  - Dans `lib/database.ts`, choisir l’adaptateur selon une variable d’environnement (ex. `DATABASE_URL` présent → Postgres, sinon SQLite). Aucune refonte des routes API n’est nécessaire.

- **Images produits** : les URLs déjà stockées en base (chemins Windows) sont désormais normalisées **en sortie API** vers `/placeholder.svg`. Pour avoir les vraies images en production, mettre à jour en base les champs `image_url` / `images` avec des chemins relatifs (ex. `/images/bijoux/...`) ou des URLs hébergées, puis re-déployer.

---

## 4. Confirmation finale

**PRÊT POUR DÉPLOIEMENT SUR :**

- **Vercel + DB externe**  
  - Build et runtime : pas de crash.  
  - Configurer `JWT_SECRET` (et optionnellement SMTP).  
  - Connecter une base (Postgres/Turso/etc.) et brancher l’adapter dans `lib/database.ts` pour une expérience complète.

- **VPS / Docker avec SQLite**  
  - `npm run build` puis `npm run start` (ou image Docker avec `VOLUME /app/data`).  
  - Configurer `JWT_SECRET` (et optionnellement SMTP).  
  - La base `data/inoxya_bijoux.db` est créée et persistée sur le disque (ou dans le volume Docker).

Aucune régression intentionnelle des fonctionnalités existantes. Toutes les modifications visent la robustesse, la compatibilité production et la sécurité, conformément à la checklist et aux règles demandées.
