import { defineRouting } from 'next-intl/routing'

// Configuration du routage i18n
export const routing = defineRouting({
  // Locales supportées
  locales: ['fr', 'ar'],
  
  // Locale par défaut
  defaultLocale: 'fr',
  
  // Ne pas utiliser de préfixe pour la locale par défaut (optionnel)
  // Si false, /fr/... sera toujours requis
  // Si true, / sera équivalent à /fr/
  localePrefix: 'always', // Toujours afficher le préfixe de locale dans l'URL
  
  // Désactiver la détection automatique de la langue du navigateur
  // Pour forcer le français par défaut
  localeDetection: false
})

