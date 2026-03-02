# INOXYA BIJOUX — Audit complet & checklist 0 erreur / 0 warning

**Objectif :** Vérification complète du projet (sécurité, clés, DB, build, déploiement) pour un état « prêt prod » avec le minimum d’erreurs et de warnings.

---

## Prompt « audit complet » (copier-coller)

Tu peux donner ce bloc à un assistant (Cursor, etc.) pour lancer un audit complet :

```
Fais un audit complet du projet inoxya-bijoux (Next.js 15, Supabase, Vercel) :

1. Vulnérabilités : exécuter npm audit ; viser 0 vulnérabilités.
2. Clés API : vérifier que les 5 variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, JWT_SECRET) sont documentées et correctement configurées sur GitHub (Secrets), Vercel (Environment Variables) et en local (.env.local). Vérifier que JWT_SECRET = secret de l’app (pas le Legacy JWT Supabase) et que service_role ≠ anon.
3. Base de données : exécuter npm run health-check ; confirmer connexion Supabase, tables accessibles, produits actifs.
4. Qualité & build : npx tsc --noEmit, npm run lint, npm run build ; viser 0 erreurs. Les warnings "Module not found: better-sqlite3" au build sont acceptés.
5. Fichiers recommandés : app/error.tsx, app/not-found.tsx, app/loading.tsx, app/[locale]/error.tsx présents.
6. Warnings restants : traiter ou documenter (NODE_ENV dans .env.local, etc.).

Suivre docs/FULL_AUDIT_CHECKLIST.md et docs/ENV_ET_CLES.md. Ne pas supprimer de routes/pages/code sans nécessité ; changements minimaux. À la fin : résumer état (vulnérabilités, clés, DB, build, warnings restants) et donner la checklist finale.
```

---

## 1. Vulnérabilités

```bash
npm audit
# ou pour échouer uniquement sur moderate+ :
npm audit --audit-level=moderate
```

- **Cible :** 0 vulnérabilités.
- Si des vulnérabilités existent : `npm audit fix` (ou `npm audit fix --force` avec précaution), puis revérifier.

---

## 2. Clés API — GitHub, Vercel, Supabase

### 2.1 Où sont les clés

| Variable | GitHub (Secrets → Actions) | Vercel (Env Variables) | .env.local (dev) |
|----------|----------------------------|------------------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ | ✅ |
| `JWT_SECRET` | ✅ | ✅ | ✅ |

### 2.2 Vérifications manuelles

**GitHub** (Settings → Secrets and variables → Actions)  
- Les 5 secrets ci-dessus sont créés.  
- Les valeurs n’ont **pas d’espace** en début/fin.  
- `SUPABASE_SERVICE_ROLE_KEY` ≠ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (deux clés différentes).

**Vercel** (Settings → Environment Variables)  
- Les 5 variables ci-dessus sont définies pour l’environnement cible (Production / Preview).  
- **Ne pas** définir `NODE_ENV` (Vercel le gère).  
- `JWT_SECRET` = secret **de l’app** (ex. `openssl rand -base64 32`), **pas** le Legacy JWT Secret Supabase.  
- Après toute modification → **Redeploy**.

**Supabase** (Dashboard → Settings → API)  
- Récupérer **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.  
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
- **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`.  
- Vérifier que les clés sont bien celles du bon projet.

Voir aussi : `docs/ENV_ET_CLES.md`.

---

## 3. Base de données (Supabase)

```bash
npm run health-check
```

- **Connexion :** Supabase connecté.  
- **Tables :** products, users, categories, packs, orders, cart_items, favorites, payments, notifications accessibles.  
- **Produits actifs :** au moins 1 produit actif pour que le site affiche du contenu.

Si le health-check signale que `SUPABASE_SERVICE_ROLE_KEY` ne ressemble pas à une clé JWT :  
- Supabase propose aussi des clés au format `sb_secret_...` ; le script accepte `eyJ...` et `sb_secret_...`.  
- S’assurer que c’est bien la clé **service_role**, pas l’anon.

---

## 4. Qualité de code & build

```bash
# 1. Patch ESLint (minimatch) si nécessaire
node scripts/patch-eslint-minimatch.js

# 2. TypeScript
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Health-check
npm run health-check

# 5. Build production
rm -rf .next   # ou sur Windows : Remove-Item -Recurse -Force .next
npm run build
```

- **Cible :** 0 erreurs TypeScript, 0 erreurs ESLint, health-check vert, build qui se termine avec succès (exit 0).
- Les warnings **« Module not found: better-sqlite3 »** au build sont **attendus** si le paquet n’est pas installé/compilé (CI/Vercel) ; le runtime utilise Supabase ou sql.js. Le build reste réussi.

---

## 5. Fichiers recommandés

| Fichier | Rôle |
|---------|------|
| `app/error.tsx` | Page d’erreur globale |
| `app/not-found.tsx` | 404 |
| `app/loading.tsx` | Loading global |
| `app/[locale]/error.tsx` | Page d’erreur par locale (recommandé) |

Si un de ces fichiers manque, le health-check l’indique en warning.

---

## 6. Warnings à traiter (pour tendre vers 0)

1. **`app/[locale]/error.tsx` manquant**  
   → Créer une page d’erreur client dans `app/[locale]/error.tsx` (voir `app/error.tsx` comme base).

2. **`.env.local: NODE_ENV`**  
   → Recommandation : ne pas mettre `NODE_ENV` dans `.env.local` (Vercel le gère). Voir `docs/ENV_ET_CLES.md`. Le health-check ne compte plus ce cas comme warning ; il ne bloque que si `NODE_ENV=production` contient un espace parasite.

3. **`SUPABASE_SERVICE_ROLE_KEY` format inattendu**  
   → Vérifier que la valeur est bien la clé **service_role** (format `eyJ...` ou `sb_secret_...`), pas l’anon.

4. **Warnings build « better-sqlite3 »**  
   → Attendus en environnement sans better-sqlite3 ; pas bloquants. Optionnel : `next.config.mjs` peut ignorer ces warnings (déjà en place).

---

## 7. Audit automatisé (script)

```bash
npm run full-audit
```

Exécute : patch minimatch, TypeScript, ESLint, vérification des variables d’environnement, health-check, et build. Utiliser ce script pour une vérification rapide avant chaque déploiement.

---

## 8. Checklist finale « 0 erreur / prêt déploiement »

- [ ] `npm audit` : 0 vulnérabilités  
- [ ] GitHub : 5 secrets définis, sans espace parasite  
- [ ] Vercel : 5 variables définies, pas de `NODE_ENV`, `JWT_SECRET` = secret app  
- [ ] Supabase : URL + anon + service_role du bon projet  
- [ ] `npm run health-check` : tout vert (0 échecs)  
- [ ] `npx tsc --noEmit` : 0 erreurs  
- [ ] `npm run lint` : 0 erreurs  
- [ ] `npm run build` : succès (warnings better-sqlite3 acceptés)  
- [ ] Fichiers recommandés présents (`app/[locale]/error.tsx`, etc.)  
- [ ] Après changement d’env sur Vercel : Redeploy  

Quand tous les points sont cochés, le projet est **complet, bien connecté et prêt pour un déploiement avec 0 erreur bloquante**.
