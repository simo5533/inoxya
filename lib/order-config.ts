/**
 * Configuration pour le système de commandes
 */

export const ORDER_CONFIG = {
  // Numéro WhatsApp pour recevoir les commandes
  whatsappNumber: "212661234567", // Remplacez par votre vrai numéro
  
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
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${ORDER_CONFIG.whatsappNumber}?text=${encodedMessage}`
}
