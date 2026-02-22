# Configuration finale — Supabase (sans secrets dans Git)

> **Ne jamais commiter** d'URL projet réelle, de clé `anon` ou de clé `service_role`.  
> Copier les vraies valeurs uniquement dans **Vercel** / **`.env.local`** (voir `docs/ENV_ET_CLES.md`).

## Variables d'environnement requises

### Pour `.env.local` (développement local) :

```env
# Exemples de noms — valeurs = dashboard Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Pour Vercel (production)

**Vercel Dashboard → Settings → Environment Variables**

Ajoutez les **3 mêmes variables** qu'en local, avec les **valeurs** copiées depuis Supabase (pas dans ce dépôt) :

1. `NEXT_PUBLIC_SUPABASE_URL` — *Project URL*
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` — *anon (public)*
3. `SUPABASE_SERVICE_ROLE_KEY` — *service_role* (réservée au serveur)

Environnements : Production, Preview, Development selon vos besoins.

---

## État de la base de données (indicatif)

- Produits, catégories, packs, commandes, utilisateurs : suivre le dashboard Supabase / l'admin.

---

## Commandes utiles

### Tester la connexion Supabase :

```bash
npm run db:test-supabase
```

### Migrer les données (si nécessaire) :

```bash
npm run db:migrate
```

### Générer le schéma SQL :

```bash
npm run db:schema
```

---

## Vérifications finales

1. `SupabaseAdapter` créé et fonctionnel
2. Détection automatique Supabase activée
3. API modifiée pour utiliser Supabase
4. Images normalisées et vérifiées
5. Test de connexion réussi après configuration des variables

---

## Prochaines étapes

1. Renseigner les variables sur Vercel
2. Redéployer si besoin
3. Vérifier le site en production

---

## Notes

- Le code choisit **Supabase → PostgreSQL → SQLite** selon la configuration.
- Les chemins d'images sont normalisés si besoin.
- **Si une clé a fuité dans l'historique Git** : la révoquer / régénérer dans **Supabase → Settings → API** et mettre à jour Vercel / `.env.local`.
