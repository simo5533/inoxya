/**
 * Configuration pour le système de commandes
 */
import { socialLinks } from './social-links'

function resolveWhatsAppDigits(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_WHATSAPP_ORDER']) ||
    (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_WHATSAPP'])
  if (fromEnv) {
    const d = String(fromEnv).replace(/\D/g, '')
    if (d.length >= 8) return d
  }
  const m = socialLinks.whatsapp.url.match(/(\d{10,15})/)
  return m ? m[1] : ''
}

export const ORDER_CONFIG = {
  /** Chiffres uniquement (format wa.me), aligné sur le footer / env */
  whatsappNumber: resolveWhatsAppDigits(),

  // Email de contact (optionnel)
  contactEmail: "contact@inoxya-bijoux.com",
  
  // Messages par défaut
  messages: {
    orderTitle: "🛍️ **NOUVELLE COMMANDE INOXYA**",
    orderFooter: "⏰ **Date :** {date}",
    confirmation: "Votre commande a été envoyée par WhatsApp. Nous vous contacterons dans les plus brefs délais pour confirmer.",
    error: "Erreur lors de l'envoi de la commande. Veuillez réessayer."
  },
  
  // Délais de réponse
  responseTime: "24h",
  
  // Informations de livraison
  delivery: {
    freeFrom: 200, // MAD
    delay: "2-5 jours ouvrés",
    payment: "Paiement à la livraison (Cash ou Carte)"
  }
}

/**
 * Formate un message de commande
 */
export function formatOrderMessage(data: {
  productName: string
  price: number
  productId: string
  phone: string
  city: string
  address: string
  notes?: string
}) {
  const { productName, price, productId, phone, city, address, notes } = data
  
  return `
${ORDER_CONFIG.messages.orderTitle}

📦 **Produit :** ${productName}
💰 **Prix :** ${price} MAD
🆔 **ID Produit :** ${productId}

👤 **Informations client :**
📞 Téléphone : ${phone}
🏙️ Ville : ${city}
📍 Adresse : ${address}
📝 Notes : ${notes || 'Aucune'}

${ORDER_CONFIG.messages.orderFooter.replace('{date}', new Date().toLocaleString('fr-FR'))}
  `.trim()
}

/**
 * Génère l'URL WhatsApp pour une commande
 */
export function generateWhatsAppUrl(message: string) {
  const n = ORDER_CONFIG.whatsappNumber?.replace(/\D/g, '') ?? ''
  if (n.length < 8) return '#'
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${n}?text=${encodedMessage}`
}
