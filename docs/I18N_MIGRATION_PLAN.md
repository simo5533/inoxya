# Plan de Migration i18n - Déplacer toutes les pages publiques sous [locale]

## Problème identifié
Les pages publiques sont actuellement à la racine (`app/bijoux/`, `app/packs/`, etc.) mais doivent être sous `app/[locale]/` pour fonctionner avec le système i18n.

## Pages à déplacer

### Pages publiques (à déplacer sous `app/[locale]/`)
1. ✅ `app/[locale]/page.tsx` - DÉJÀ FAIT
2. ❌ `app/bijoux/page.tsx` → `app/[locale]/bijoux/page.tsx`
3. ❌ `app/bijoux/[id]/page.tsx` → `app/[locale]/bijoux/[id]/page.tsx`
4. ❌ `app/packs/page.tsx` → `app/[locale]/packs/page.tsx`
5. ❌ `app/packs/[id]/page.tsx` → `app/[locale]/packs/[id]/page.tsx`
6. ❌ `app/panier/page.tsx` → `app/[locale]/panier/page.tsx`
7. ❌ `app/panier/checkout/page.tsx` → `app/[locale]/panier/checkout/page.tsx`
8. ❌ `app/sur-mesure/page.tsx` → `app/[locale]/sur-mesure/page.tsx`
9. ❌ `app/faq/page.tsx` → `app/[locale]/faq/page.tsx`
10. ❌ `app/a-propos/page.tsx` → `app/[locale]/a-propos/page.tsx`
11. ❌ `app/favoris/page.tsx` → `app/[locale]/favoris/page.tsx`

### Pages à garder à la racine (admin, auth, etc.)
- ✅ `app/admin/**` - RESTE À LA RACINE
- ✅ `app/api/**` - RESTE À LA RACINE
- ✅ `app/login/page.tsx` - RESTE À LA RACINE (peut être déplacé plus tard)
- ✅ `app/inscription/page.tsx` - RESTE À LA RACINE (peut être déplacé plus tard)
- ✅ `app/profile/page.tsx` - RESTE À LA RACINE (peut être déplacé plus tard)

## Étapes de migration

### Étape 1 : Créer les dossiers sous [locale]
### Étape 2 : Déplacer les fichiers
### Étape 3 : Mettre à jour les imports et les liens
### Étape 4 : Ajouter les traductions manquantes
### Étape 5 : Tester toutes les routes

## Routes API - Vérification
Toutes les routes API sont exclues du middleware i18n (correct) :
- `/api/**` → Pas de locale requise
- Les routes API fonctionnent avec ou sans locale dans l'URL

