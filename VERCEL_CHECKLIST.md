# Checklist manuelle Vercel (à faire après push)

## 1. Variables d'environnement (Settings → Environment Variables)

- [ ] **SUPPRIMER** la variable `NODE_ENV` si elle existe (Vercel la gère automatiquement ; un espace parasite "production " cause l’avertissement).
- [ ] Vérifier **NEXT_PUBLIC_SUPABASE_URL** : pas d’espace au début ni à la fin.
- [ ] Vérifier **NEXT_PUBLIC_SUPABASE_ANON_KEY** (ou publishable key) : pas d’espace.
- [ ] Vérifier **SUPABASE_SERVICE_ROLE_KEY** : pas d’espace.
- [ ] Vérifier toutes les autres variables : pas d’espace en début/fin de valeur.

## 2. Supabase (supabase.com → Authentication → URL Configuration)

- [ ] **Site URL** = `https://inoxya-bijoux.vercel.app` (ou ton domaine Vercel).
- [ ] **Redirect URLs** = `https://inoxya-bijoux.vercel.app/**`

## 3. Projet déployé

Les logs peuvent venir du projet **inoxya-bijoux-kg**. Vérifier que le déploiement qui pose problème est bien lié au repo **basmaouarid/inoxya-bijoux** et à la branche **main** (avec les derniers correctifs).
