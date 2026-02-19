import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

// OPTIMISATION: Chargement simplifié avec timeout et fallback immédiat
export default getRequestConfig(async ({ locale }) => {
  // Valider que la locale est supportée
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  // OPTIMISATION: Charger les messages avec timeout pour éviter les blocages
  let messages: Record<string, unknown> = {}
  
  // Fonction helper avec timeout (augmenté à 5s pour connexions lentes)
  const loadMessagesWithTimeout = async (localeToLoad: string, timeoutMs = 5000): Promise<Record<string, unknown>> => {
    try {
      return await Promise.race([
        import(`../messages/${localeToLoad}.json`).then(m => m.default || {}).catch(() => ({})),
        new Promise<Record<string, unknown>>((resolve) => {
          setTimeout(() => {
            resolve({}) // Retourner objet vide au lieu de rejeter
          }, timeoutMs)
        })
      ])
    } catch {
      return {} // Toujours retourner un objet, jamais undefined
    }
  }

  // Messages par défaut en cas d'échec complet (évite UI vide)
  const defaultMessages: Record<string, unknown> = {
    common: {
      language: 'Langue',
      french: 'Français',
      arabic: 'العربية',
      search: 'Recherche',
      cart: 'Panier',
      favorites: 'Favoris',
      login: 'Connexion',
      register: 'S\'inscrire',
      logout: 'Déconnexion',
      admin: 'Admin',
      myAccount: 'Mon Compte'
    },
    header: {
      freeShipping: 'Livraison gratuite dès 200 MAD',
      navigation: {
        jewelry: 'Bijoux',
        collections: 'Collections',
        custom: 'Sur Mesure',
        about: 'À propos'
      }
    },
    home: {
      hero: {
        discoverCollection: 'Découvrir la Collection',
        ourPacks: 'Nos Packs',
        discover: 'Découvrir'
      },
      featured: {
        title: 'Bijoux Vedettes',
        subtitle: 'Découvrez nos pièces les plus appréciées',
        viewAll: 'Voir tout',
        noProducts: 'Aucun bijou vedette disponible pour le moment'
      }
    },
    products: {
      title: 'Nos Bijoux',
      subtitle: 'Découvrez notre collection complète',
      noProducts: 'Aucun produit trouvé',
      addToCart: 'Ajouter au panier',
      addToFavorites: 'Ajouter aux favoris',
      viewDetails: 'Voir les détails',
      price: 'Prix',
      inStock: 'En stock',
      outOfStock: 'Rupture de stock'
    }
  }

  try {
    // Essayer de charger les messages pour la locale demandée avec timeout
    try {
      messages = await loadMessagesWithTimeout(locale)
    } catch {
      // Si échec, essayer la locale par défaut avec timeout
      try {
        console.warn(`[i18n] Messages pour ${locale} non trouvés ou timeout, utilisation de ${routing.defaultLocale}`)
        messages = await loadMessagesWithTimeout(routing.defaultLocale)
      } catch {
        // Si même la locale par défaut échoue, utiliser messages par défaut au lieu d'objet vide
        console.warn(`[i18n] Impossible de charger les messages, utilisation de messages par défaut`)
        messages = defaultMessages
      }
    }
  } catch (error) {
    // En cas d'erreur globale, utiliser messages par défaut pour éviter UI vide
    console.error(`[i18n] Erreur chargement messages pour ${locale}:`, error)
    messages = defaultMessages
  }

  return {
    locale,
    messages
  }
})

