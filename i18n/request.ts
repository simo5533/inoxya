import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ locale }) => {
  // Valider que la locale est supportée
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  // Charger les messages de manière sécurisée
  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch (error) {
    // Fallback vers la locale par défaut si le fichier n'existe pas
    console.warn(`Messages pour ${locale} non trouvés, utilisation de ${routing.defaultLocale}`)
    messages = (await import(`../messages/${routing.defaultLocale}.json`)).default
  }

  return {
    locale,
    messages
  }
})

