# État de la Migration i18n - Pages Publiques

## ✅ Pages Déjà Migrées

1. ✅ `app/[locale]/page.tsx` - Page d'accueil (COMPLÈTE avec traductions)
2. ✅ `app/[locale]/bijoux/page.tsx` - Page bijoux (EN COURS - traductions ajoutées, liens à finaliser)

## 🔄 Pages Copiées (À Finaliser)

3. ⚠️ `app/[locale]/bijoux/[id]/page.tsx` - Détail bijou (copié, à mettre à jour)
4. ⚠️ `app/[locale]/packs/page.tsx` - Page packs (copié, à mettre à jour)
5. ⚠️ `app/[locale]/packs/[id]/page.tsx` - Détail pack (copié, à mettre à jour)
6. ⚠️ `app/[locale]/panier/page.tsx` - Panier (copié, à mettre à jour)
7. ⚠️ `app/[locale]/panier/checkout/page.tsx` - Checkout (copié, à mettre à jour)
8. ⚠️ `app/[locale]/sur-mesure/page.tsx` - Sur mesure (copié, à mettre à jour)
9. ⚠️ `app/[locale]/faq/page.tsx` - FAQ (copié, à mettre à jour)
10. ⚠️ `app/[locale]/a-propos/page.tsx` - À propos (copié, à mettre à jour)
11. ⚠️ `app/[locale]/favoris/page.tsx` - Favoris (copié, à mettre à jour)

## 📋 Actions Requises pour Chaque Page

Pour chaque page copiée, il faut :

1. **Ajouter les paramètres de locale** :
   ```typescript
   interface PageProps {
     params: Promise<{ locale: string }>
     // ... autres props
   }
   ```

2. **Utiliser getTranslations** :
   ```typescript
   const { locale } = await params
   const t = await getTranslations({ locale, namespace: 'pageName' })
   ```

3. **Mettre à jour les metadata** :
   ```typescript
   export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
     const { locale } = await params
     const t = await getTranslations({ locale, namespace: 'pageName' })
     // ... metadata avec traductions
   }
   ```

4. **Mettre à jour tous les liens** :
   - Remplacer `href="/route"` par `href={`/${locale}/route`}`
   - Utiliser `Link` de `next/link` avec la locale

5. **Remplacer les textes en dur** :
   - Utiliser `t('key')` pour tous les textes statiques

6. **Ajouter les traductions** dans `messages/fr.json` et `messages/ar.json`

## 🔍 Routes API - Vérification

Toutes les routes API sont **exclues du middleware i18n** (correct) :
- ✅ `/api/**` → Pas de locale requise
- ✅ Les routes API fonctionnent avec ou sans locale dans l'URL
- ✅ Pas de modification nécessaire pour les routes API

## ⚠️ Problèmes Identifiés

1. **Erreurs de build admin** : Pages admin manquantes (non lié à i18n)
2. **Liens dans composants** : Beaucoup de composants utilisent des liens sans locale
3. **Traductions manquantes** : Beaucoup de textes ne sont pas encore traduits

## 🎯 Priorités

1. **URGENT** : Finaliser la page bijoux (liens et traductions)
2. **HAUTE** : Migrer packs, panier, checkout (pages critiques)
3. **MOYENNE** : Migrer sur-mesure, faq, a-propos, favoris
4. **BASSE** : Nettoyer les anciennes pages à la racine (après migration complète)

## 📝 Notes

- Les pages admin (`app/admin/**`) restent à la racine (correct)
- Les pages auth (`app/login`, `app/inscription`) peuvent rester à la racine ou être migrées plus tard
- Le middleware next-intl redirige automatiquement les routes sans locale vers `/fr/...`

