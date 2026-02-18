# 🌍 Progression i18n (FR/AR) - INOXYA BIJOUX

## ✅ ÉTAPE 1 : LanguageSwitcher créé
- ✅ Composant `LanguageSwitcher.tsx` avec dropdown FR/AR
- ✅ Intégré dans le Header
- ✅ Utilise les hooks de next-intl

## ✅ ÉTAPE 2 : Header mis à jour
- ✅ Traductions intégrées (banner, navigation)
- ✅ Liens mis à jour avec locale (`/${locale}/...`)
- ✅ Support RTL pour les badges (position dynamique)
- ✅ Logo redirige vers `/${locale}`

## ⏳ ÉTAPE 3 : Footer à mettre à jour
- [ ] Ajouter traductions dans Footer
- [ ] Mettre à jour les liens avec locale

## ✅ ÉTAPE 4 : Support RTL
- ✅ Layout `[locale]` avec `dir={dir}` et `lang={lang}`
- ✅ Classes conditionnelles pour RTL
- ✅ Badges positionnés dynamiquement selon locale

## ⏳ ÉTAPE 5 : Déplacer les routes publiques
Routes à déplacer dans `app/[locale]/` :
- [ ] `bijoux/` → `[locale]/bijoux/`
- [ ] `packs/` → `[locale]/packs/`
- [ ] `panier/` → `[locale]/panier/`
- [ ] `favoris/` → `[locale]/favoris/`
- [ ] `sur-mesure/` → `[locale]/sur-mesure/`
- [ ] `a-propos/` → `[locale]/a-propos/`
- [ ] `faq/` → `[locale]/faq/`
- [ ] `login/` → `[locale]/login/`
- [ ] `inscription/` → `[locale]/inscription/`
- [ ] `profile/` → `[locale]/profile/`

## 📝 Notes
- Admin reste à `/admin` (non affecté)
- API routes restent à `/api/*` (non affectées)
- Build fonctionne ✅

