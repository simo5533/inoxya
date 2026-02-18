import { defineRouting } from 'next-intl/routing'

// Configuration du routage i18n
export const routing = defineRouting({
  // Locales supportées
  locales: ['fr', 'ar'],
  
  // Locale par défaut
  defaultLocale: 'fr',
  
  // Configuration du préfixe de locale
  // 'as-needed' : /fr/ est optionnel, / est équivalent à /fr/
  // 'always' : toujours afficher le préfixe (peut causer des boucles de redirection)
  localePrefix: 'as-needed', // Permettre / sans préfixe pour éviter les boucles
  
  // Désactiver la détection automatique de la langue du navigateur
  // Pour forcer le français par défaut
  localeDetection: false
})

