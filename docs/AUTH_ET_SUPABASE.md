# Authentification et liaison avec Supabase

Vérification du flux d’authentification et de son lien avec la base Supabase.

---

## 1. Principe : pas de Supabase Auth, tout passe par la table **users**

L’app **n’utilise pas** Supabase Authentication (Auth → Users dans le dashboard). Elle utilise :

- La table **`public.users`** (id, phone, password_hash, first_name, last_name, role, created_at, updated_at).
- Un **cookie** `user_id` (valeur = `users.id`) pour la session.
- L’adapter Supabase : `getUserByPhone`, `getUserById`, `createUser` sur la table **users**.

Aucune table **user_sessions** ni **Supabase Auth** n’est utilisée pour la connexion.

---

## 2. Liaison auth ↔ Supabase

| Étape | Code / route | Table Supabase | Opération |
|-------|----------------|----------------|-----------|
| **Login** | `lib/auth.ts` → `loginUser()` | **users** | `adapter.getUserByPhone(phone)` puis `bcrypt.compare(password, password_hash)` |
| **Session** | Cookie `user_id` | — | Stocke `users.id` (côté navigateur) |
| **Utilisateur courant** | `lib/auth.ts` → `getCurrentUser()` | **users** | Lit cookie `user_id` → `adapter.getUserById(userId)` |
| **Inscription** | `lib/auth.ts` → `registerUser()` | **users** | `adapter.getUserByPhone` (existe ?) puis `adapter.createUser()` |
| **Déconnexion** | `lib/auth.ts` → `logoutUser()` | — | Suppression du cookie `user_id` |

Variables d’environnement côté serveur : **SUPABASE_SERVICE_ROLE_KEY** et **NEXT_PUBLIC_SUPABASE_URL** (utilisées par `getDatabaseAdapter()`). La clé service role permet de lire/écrire la table **users** sans RLS.

---

## 3. Colonnes requises sur `public.users`

Pour que l’auth fonctionne avec Supabase, la table **users** doit avoir au minimum :

| Colonne | Type | Obligatoire | Usage |
|---------|------|-------------|--------|
| id | integer (SERIAL) | oui | PK, renvoyé par `getUserById` / cookie |
| phone | text, UNIQUE | oui | Login, recherche par `getUserByPhone` |
| password_hash | text | oui | Comparaison bcrypt au login |
| first_name | text | non | Affichage |
| last_name | text | non | Affichage |
| role | text | oui (défaut 'user') | Contrôle d’accès (admin, moderator, user) |
| created_at | timestamp | non | Optionnel |
| updated_at | timestamp | non | Optionnel |

---

## 4. Vérification rapide (Supabase SQL Editor)

Exécuter le script **`scripts/supabase-verify-auth.sql`** dans Supabase → SQL Editor pour vérifier la structure de **users** et l’existence d’au moins un utilisateur (sans afficher les mots de passe).

---

## 5. En cas de problème

- **« Utilisateur non trouvé ou mot de passe incorrect »** avec des identifiants corrects : vérifier que la table **users** existe, contient bien la colonne **password_hash**, et que le hash est au format bcrypt (généré par l’app ou par `scripts/supabase-seed-users.sql` avec `pgcrypto`).
- **getCurrentUser retourne null** après login : vérifier que le cookie `user_id` est bien envoyé (même domaine, pas en cross-origin) et que `adapter.getUserById(userId)` lit bien la table **users** (pas de blocage RLS si utilisation de la clé service role).

---

*Référence : lib/auth.ts, lib/db/supabase-adapter.ts (getUserByPhone, getUserById, createUser), table public.users.*
