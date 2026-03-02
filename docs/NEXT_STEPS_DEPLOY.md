# Prochaines étapes — déploiement (après commit security-audit)

## ✅ Déjà fait par Cursor

- Commit des 3 fichiers : `package.json`, `package-lock.json`, `docs/SECURITY_AUDIT_SAFE_REPORT.md`
- Push de la branche `chore/security-audit-safe` vers `origin`
- Gate local : `lint`, `type-check`, `build`, `health-check` → **tous OK**

---

## Ce que TU fais maintenant

### 1. Ouvrir la Pull Request

- Lien direct : **https://github.com/basmaouarid/inoxya-bijoux/pull/new/chore/security-audit-safe**
- Base : choisis **`fix/vercel-deploy-stable`** (ou `main` si c’est ta branche de déploiement Vercel)
- Titre suggéré : `chore(security): fix npm audit high vulns via overrides`
- Ne pas modifier d’autres fichiers dans cette PR.

### 2. Merger la PR

- Après revue (ou direct si tu es seul), merge la PR dans la branche sur laquelle Vercel déploie.

### 3. Vercel — variables d’environnement

Dans **Vercel → Project → Settings → Environment Variables**, vérifier que tu as au moins :

| Variable | Obligatoire | Valeur pour l’instant |
|----------|-------------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service_role |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anon |
| `JWT_SECRET` | Recommandé | ≥ 32 caractères |
| `NEXT_PUBLIC_SITE_URL` | Recommandé | `https://inoxya-bijoux.vercel.app` (tant que tu n’as pas inoxya.ma) |

Tu n’as pas besoin de recréer le projet Vercel. Quand tu achèteras le domaine **inoxya.ma**, tu changeras `NEXT_PUBLIC_SITE_URL` vers `https://www.inoxya.ma` et tu ajouteras le domaine dans Vercel.

### 4. Redeploy

- Après merge (et éventuellement après avoir ajouté/modifié des variables), déclencher un **Redeploy** du dernier déploiement (ou laisser Vercel le faire au push).

---

## Résumé

- **Aucun changement destructif.** Uniquement overrides npm + rapport.
- **Build OK**, **health-check OK** en local.
- **Bloquant :** aucun. Tu peux merger et déployer dès que la PR est validée.
