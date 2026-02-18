# ⚡ VÉRIFICATION RAPIDE - ERREUR 500

## 🎯 3 POINTS CRITIQUES À VÉRIFIER MAINTENANT

### ✅ POINT 1: DATABASE_URL dans Vercel (2 minutes)

1. **Allez sur:** https://vercel.com/dashboard
2. **Projet:** `inoxya-bijoux`
3. **Settings** (menu de gauche)
4. **Environment Variables**
5. **Cherchez `DATABASE_URL`**

**❌ Si elle n'existe PAS:**
- Neon Dashboard → Connection Details → Copier la connection string
- Vercel → Add New → Nom: `DATABASE_URL` → Valeur: connection string
- **Redéployer:** `vercel --prod`

**✅ Si elle existe:**
- Passez au point 2

---

### ✅ POINT 2: Tables dans Neon (2 minutes)

1. **Neon Dashboard** → SQL Editor
2. **Exécutez:**
```sql
SELECT COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**❌ Si le résultat est moins de 13:**
- Ouvrir `scripts/neon-setup-complete.sql`
- Copier TOUT le contenu
- Coller dans Neon SQL Editor
- Cliquer "Run"
- Attendre "Configuration terminée avec succès!"

**✅ Si le résultat est 13 ou plus:**
- Passez au point 3

---

### ✅ POINT 3: Redéployer (1 minute)

**Si vous avez modifié DATABASE_URL ou exécuté les migrations:**

```bash
vercel --prod
```

**Attendre 1-2 minutes, puis tester le site.**

---

## 🔍 VÉRIFIER LES LOGS (si erreur persiste)

**Via Dashboard:**
1. Vercel Dashboard → Deployments
2. Dernier déploiement → Functions
3. Chercher les erreurs (icône rouge)

**Partagez les erreurs que vous voyez!**

---

## ✅ RÉSUMÉ

**Les 2 causes les plus probables:**
1. ❌ DATABASE_URL non configurée dans Vercel
2. ❌ Tables non créées dans Neon

**Vérifiez ces 2 points et redéployez!**

---

**Dites-moi ce que vous trouvez pour chaque point! 🔍**

