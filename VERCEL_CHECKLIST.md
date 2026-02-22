# Guide pas à pas — Vercel et Supabase

## A. Savoir si tu es sur le BON projet Vercel

1. Va sur **vercel.com** et connecte-toi.
2. En haut à gauche, tu vois le nom du projet (ex. **inoxya-bijoux**).
3. **Juste en dessous du titre "Deployments"**, tu dois voir une ligne du type :
   - **"Automatically created for pushes to `basmaouarid/inoxya-bijoux`"**
4. **Si tu vois ça** → tu es sur le bon projet (celui lié au repo GitHub basmaouarid/inoxya-bijoux). C’est là que tu dois faire Redeploy.
5. **Si le nom du projet est différent** (ex. inoxya-bijoux-kg) ou si la ligne indique un **autre repo** → tu es sur un autre projet. Clique sur le sélecteur de projet (en haut) et choisis **inoxya-bijoux** (celui relié à basmaouarid/inoxya-bijoux).

**Résumé :** Bon projet = onglet **Deployments** + texte "pushes to `basmaouarid/inoxya-bijoux`".

---

## B. Variables d’environnement sur Vercel (où cliquer)

1. Toujours sur **vercel.com**, dans le projet **inoxya-bijoux**.
2. En haut de la page, clique sur l’onglet **Settings** (à côté de Deployments, Logs, etc.).
3. Dans le menu de gauche des Settings, clique sur **Environment Variables**.
4. Tu vois la liste des variables (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, etc.).

### B.1 Supprimer NODE_ENV (si elle existe)

- Dans la liste, cherche une variable nommée **NODE_ENV**.
- Si elle existe : clique sur les **3 points** (⋮) à droite de la ligne → **Delete** → confirme.
- Vercel définit NODE_ENV tout seul ; ne pas la créer/modifier évite l’avertissement "production ".

### B.2 Corriger SUPABASE_SERVICE_ROLE_KEY

- Trouve la ligne **SUPABASE_SERVICE_ROLE_KEY**.
- La valeur doit être la clé **service_role** (secret), pas la clé "publishable" / "anon".
  - **Correct** : longue chaîne type JWT (souvent commence par `eyJ...`).
  - **Incorrect** : valeur qui commence par `sb_publishable_...` (c’est l’anon key).
- Pour la bonne valeur : **Supabase** → ton projet → **Project Settings** (icône engrenage) → **API** → section **Project API keys** → copie **service_role** (secret, avec cadenas).
- Sur Vercel : clique sur **SUPABASE_SERVICE_ROLE_KEY** → **Edit** → colle la clé **service_role** (sans espace avant/après) → **Save**.

### B.3 Vérifier les espaces (toutes les variables)

- Pour **chaque** variable (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL, etc.) : clique dessus pour voir la valeur.
- Vérifie qu’il n’y a **pas d’espace** au tout début ni à la toute fin. Si tu en vois, édite et supprime-les → **Save**.

---

## C. Redeploy après changement de variable

- Si une bannière bleue dit **"Updated Environment Variable successfully. A new deployment is needed..."** :
  - Clique sur le bouton bleu **Redeploy** dans cette bannière.
- Sinon : onglet **Deployments** → sur le déploiement **Current** (en haut), clique sur les **3 points** (⋮) → **Redeploy** → confirme.

---

## D. Supabase — Site URL et Redirect URLs (où cliquer)

1. Va sur **supabase.com** → connecte-toi → ouvre ton projet (ex. **inoxya-bijoux**).
2. Dans le menu de gauche, clique sur **Authentication** (icône cadenas / utilisateur).
3. Dans le sous-menu d’Authentication, clique sur **URL Configuration** (ou **Providers** puis onglet URL selon l’interface).
4. **Site URL** :
   - Mets exactement : `https://inoxya-bijoux.vercel.app`  
     (ou ton domaine Vercel personnalisé si tu en as un, sans slash à la fin).
5. **Redirect URLs** :
   - Ajoute : `https://inoxya-bijoux.vercel.app/**`  
   - Tu peux avoir plusieurs lignes ; une doit être celle-ci pour autoriser les redirections après login.
6. Clique sur **Save** en bas de la section.

**Résumé :**  
Vercel = bon projet (basmaouarid/inoxya-bijoux) → Settings → Environment Variables → NODE_ENV supprimée, SERVICE_ROLE_KEY = service_role, pas d’espaces → Redeploy.  
Supabase = Authentication → URL Configuration → Site URL + Redirect URLs = ton domaine Vercel.
