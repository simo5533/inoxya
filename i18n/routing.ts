import { defineRouting } from 'next-intl/routing'

// Configuration du routage i18n
export const routing = defineRouting({
  // Locales supportées
  locales: ['fr', 'ar'],
  
  // Locale par défaut
  defaultLocale: 'fr',
  
  // Configuration du préfixe de locale
  // 'always' : toujours afficher le préfixe (plus simple, évite les problèmes de compilation)
  // 'as-needed' : peut causer des problèmes avec Next.js 15 + force-dynamic
  localePrefix: 'always', // Toujours afficher le préfixe pour éviter les problèmes de compilation
  
  // Désactiver la détection automatique de la langue du navigateur
  // Pour forcer le français par défaut
  localeDetection: false
})

