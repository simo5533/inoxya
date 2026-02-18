# 🔍 VÉRIFIER LES LOGS VERCEL POUR L'ERREUR 500

## 📋 INSTRUCTIONS POUR VOIR L'ERREUR EXACTE

### Méthode 1: Via Vercel Dashboard (RECOMMANDÉ)

1. **Allez sur:** https://vercel.com/dashboard
2. **Sélectionnez le projet:** `inoxya-bijoux`
3. **Cliquez sur "Deployments"** (menu de gauche)
4. **Cliquez sur le dernier déploiement** (celui avec le statut "Ready")
5. **Cliquez sur "Functions"** (onglet en haut)
6. **Cherchez les fonctions qui ont des erreurs** (icône rouge ⚠️)
7. **Cliquez sur une fonction avec erreur** pour voir les logs

### Méthode 2: Via Vercel CLI

```bash
vercel logs inoxya-bijoux.vercel.app
```

OU pour un déploiement spécifique:

```bash
vercel logs inoxya-bijoux-70tbvq96r-aomarlaasri-9900s-projects.vercel.app
```

---

## 🔍 CE QU'IL FAUT CHERCHER

### Erreurs communes:

1. **`relation "users" does not exist`**
   - **Cause:** Tables non créées dans PostgreSQL
   - **Solution:** Exécuter `scripts/neon-setup-complete.sql` dans Neon SQL Editor

2. **`connection refused` ou `ECONNREFUSED`**
   - **Cause:** DATABASE_URL incorrect ou base inaccessible
   - **Solution:** Vérifier DATABASE_URL dans Vercel Dashboard → Settings → Environment Variables

3. **`password authentication failed`**
   - **Cause:** Credentials PostgreSQL incorrects
   - **Solution:** Vérifier DATABASE_URL depuis Neon Dashboard → Connection Details

4. **`MIDDLEWARE_INVOCATION_FAILED`**
   - **Cause:** Erreur dans le middleware (i18n, sécurité, etc.)
   - **Solution:** Vérifier les logs pour voir l'erreur exacte

5. **`Cannot find module` ou `Module not found`**
   - **Cause:** Dépendance manquante
   - **Solution:** Vérifier `package.json` et réinstaller les dépendances

---

## 📸 PARTAGEZ LES LOGS

**Copiez-collez les erreurs que vous voyez dans les logs**, et je vous aiderai à les résoudre!

**Format:**
```
[Timestamp] Erreur: ...
[Timestamp] Stack trace: ...
```

---

## ✅ CHECKLIST

- [ ] Logs Vercel Dashboard vérifiés
- [ ] Erreurs identifiées et notées
- [ ] Erreurs partagées pour analyse
- [ ] Solution appliquée selon l'erreur

---

**Une fois que vous avez les logs, partagez-les et je vous aiderai à résoudre le problème spécifique! 🔍**

