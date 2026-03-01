# Checklist déploiement Vercel — INOXYA BIJOUX

**Variables à configurer sur Vercel (Settings → Environment Variables) — ne jamais committer de `.env` ni de clés :**  
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (optionnel si Vercel), `JWT_SECRET` (optionnel).

## Option A — Domaine par défaut (maintenant)

- **URL** : `https://inoxya-bijoux.vercel.app`
- Le projet Vercel existe déjà ; ne pas en créer un nouveau.

### 1. Build local (vérification)
```bash
npm ci
npm run type-check
npm run build
```
→ Doit sortir avec code 0.

### 2. Variables d’environnement Vercel (Option A)
Dans **Vercel → Project → Settings → Environment Variables** :

| Variable | Obligatoire | Remarque |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service_role (côté serveur) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anon |
| `JWT_SECRET` | Recommandé | ≥ 32 caractères |
| `NEXT_PUBLIC_SITE_URL` | Optionnel en A | Si absent, l’app utilise `VERCEL_URL` (ex. https://inoxya-bijoux.vercel.app) |

Pour Option A, vous pouvez laisser **NEXT_PUBLIC_SITE_URL** vide ; le code utilise `VERCEL_URL` automatiquement.

### 3. Déploiement
- Push de la branche `fix/vercel-deploy-stable` (ou merge dans `main`).
- Vercel déclenche le build. Vérifier que le build passe.
- URL de prod : **https://inoxya-bijoux.vercel.app**

### 4. Vérifications après déploiement (Option A)
- [ ] `https://inoxya-bijoux.vercel.app` → redirige vers `/fr`
- [ ] `https://inoxya-bijoux.vercel.app/fr` → 200
- [ ] `https://inoxya-bijoux.vercel.app/fr/bijoux` → 200
- [ ] `https://inoxya-bijoux.vercel.app/fr/packs` → 200
- [ ] `https://inoxya-bijoux.vercel.app/api/health` → 200
- [ ] Pas de boucle de redirection, pas d’erreur MIDDLEWARE_INVOCATION_FAILED dans les logs Vercel

---

## Option B — Domaine personnalisé (plus tard : www.inoxya.ma)

### 1. Ajouter les domaines dans Vercel
- **Vercel → Project → Settings → Domains**
- Ajouter : `inoxya.ma`
- Ajouter : `www.inoxya.ma`

### 2. Définir le domaine principal
- Mettre **www.inoxya.ma** comme domaine principal (primary).

### 3. DNS (chez votre registrar)
Selon ce que Vercel affiche après ajout des domaines (recommandations Vercel) :
- **A** : `76.76.21.21` (ou la cible indiquée par Vercel) pour la racine si nécessaire.
- **CNAME** : `www` → `cname.vercel-dns.com` (ou la cible indiquée par Vercel).

Vérifier avec Vercel → Domains → chaque domaine → “Configure DNS”.

### 4. Attendre la vérification
- Une fois les domaines vérifiés (check vert), passer à l’étape suivante.

### 5. Variable d’environnement Production
- **Settings → Environment Variables**
- Pour **Production** uniquement :  
  `NEXT_PUBLIC_SITE_URL` = `https://www.inoxya.ma`  
  (sans slash final)

### 6. Redéploiement
- **Deployments → … sur le dernier déploiement → Redeploy** (ou push un commit).

### 7. Vérifications après déploiement (Option B)
- [ ] `https://www.inoxya.ma` → redirige vers `/fr`
- [ ] `https://www.inoxya.ma/fr`, `/fr/bijoux`, `/fr/packs` → 200
- [ ] Canonicals et sitemap utilisent `https://www.inoxya.ma`
- [ ] `https://www.inoxya.ma/api/health` → 200

---

## Rollback
- **Vercel → Deployments** : ouvrir un déploiement précédent → **Promote to Production**.
- Ou : revert du commit Git puis push (nouveau déploiement automatique).

---

## Fichiers modifiés (branche fix/vercel-deploy-stable)

- `lib/site-url.ts` — Fallback `VERCEL_URL` si `NEXT_PUBLIC_SITE_URL` absent
- `lib/env-validator.ts` — `NEXT_PUBLIC_SITE_URL` optionnel quand `VERCEL_URL` présent
- `middleware.ts` — try/catch pour éviter 500 MIDDLEWARE_INVOCATION_FAILED
- `scripts/health-check.ts` — Accepte `VERCEL_URL` quand `NEXT_PUBLIC_SITE_URL` manquant
- `docs/PHASE_0_BASELINE_REPORT.md` — Rapport Phase 0 (lecture seule)
- `docs/VERCEL_DEPLOY_CHECKLIST.md` — Cette checklist
