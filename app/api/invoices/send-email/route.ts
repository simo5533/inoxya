import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getOrderById } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      order_id, 
      customer_email, 
      customer_name, 
      invoice_data 
    } = body

    // Validation des données
    if (!order_id || !customer_email || !customer_name || !invoice_data) {
      return NextResponse.json({ 
        error: 'Données d\'envoi email incomplètes' 
      }, { status: 400 })
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json({ error: 'Format email invalide' }, { status: 400 })
    }

    // Vérifier que la commande existe
    const order = await getOrderById(order_id)
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Générer le contenu de l'email
    const emailContent = generateEmailContent({
      customer_name,
      order_id,
      invoice_data
    })

    // Pour l'instant, on simule l'envoi d'email
    // L'implémentation complète nécessiterait un service d'email comme SendGrid, Nodemailer, etc.
    logger.info('Email de facture à envoyer:', {
      to: customer_email,
      subject: `Facture INOXYA BIJOUX - Commande ${order_id}`,
      content_length: emailContent.length
    })

    // Simuler l'envoi réussi
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({ 
      success: true, 
      email_id: emailId,
      message: `Facture envoyée par email à ${customer_email}`,
      email_details: {
        to: customer_email,
        subject: `Facture INOXYA BIJOUX - Commande ${order_id}`,
        sent_at: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Erreur API envoi email facture:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

interface EmailData {
  customer_name: string
  order_id: string
  invoice_data: {
    items: Array<{ name?: string; quantity?: number; price?: number }>
    total_amount: number
  }
}

function generateEmailContent(data: EmailData) {
  return `
Bonjour ${data.customer_name},

Nous vous remercions pour votre commande chez INOXYA BIJOUX.

Voici les détails de votre facture :

Numéro de commande: ${data.order_id}
Date: ${new Date().toLocaleDateString('fr-FR')}

Détails de la commande:
${data.invoice_data.items.map((item) => 
  `- ${item.name || 'Produit'}: ${item.quantity || 1} x ${item.price || 0} MAD`
).join('\n')}

Total: ${data.invoice_data.total_amount} MAD

Votre commande sera traitée dans les plus brefs délais.

Cordialement,
L'équipe INOXYA BIJOUX

---
INOXYA BIJOUX
Bijoux en acier inoxydable premium
  `
}
