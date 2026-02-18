import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

type InvoiceCustomerInfo = {
  name?: string
  address?: string
  phone?: string
}

type InvoiceItem = {
  name?: string
  quantity?: number
  price?: number
}

type InvoiceData = {
  order_id: string
  customer_info: InvoiceCustomerInfo
  items: InvoiceItem[]
  total_amount: number
  date: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      order_id, 
      customer_info, 
      items, 
      total_amount 
    } = body
    const orderId = String(order_id)
    const invoiceItems: InvoiceItem[] = Array.isArray(items) ? (items as InvoiceItem[]) : []
    const totalAmount = Number(total_amount)

    // Validation des données
    if (!order_id || !customer_info || !Array.isArray(items) || items.length === 0 || Number.isNaN(totalAmount)) {
      return NextResponse.json({ 
        error: 'Données de facture incomplètes' 
      }, { status: 400 })
    }

    // Vérifier que la commande existe
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Générer le contenu HTML de la facture
    const invoiceHtml = generateInvoiceHTML({
      order_id: orderId,
      customer_info: customer_info as InvoiceCustomerInfo,
      items: invoiceItems,
      total_amount: totalAmount,
      date: new Date().toLocaleDateString('fr-FR')
    })

    // Pour l'instant, on retourne le HTML
    // L'implémentation complète nécessiterait une librairie comme puppeteer pour générer le PDF
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="facture_${orderId}_${new Date().toISOString().split('T')[0]}.html"`
      }
    })

  } catch (error) {
    logger.error('Erreur API génération PDF facture:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function generateInvoiceHTML(data: InvoiceData) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${data.order_id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-info { margin-bottom: 20px; }
        .customer-info { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INOXYA BIJOUX</h1>
        <h2>FACTURE</h2>
    </div>
    
    <div class="invoice-info">
        <div><strong>Numéro de facture:</strong> ${data.order_id}</p>
        <div><strong>Date:</strong> ${data.date}</p>
    </div>
    
    <div class="customer-info">
        <h3>Informations client:</h3>
        <p><strong>Nom:</strong> ${data.customer_info.name}</p>
        <p><strong>Adresse:</strong> ${data.customer_info.address}</p>
        <p><strong>Téléphone:</strong> ${data.customer_info.phone}</p>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map((item) => `
                <tr>
                    <td>${item.name ?? 'Produit'}</td>
                    <td>${item.quantity ?? 1}</td>
                    <td>${item.price ?? 0} MAD</td>
                    <td>${(item.quantity ?? 1) * (item.price ?? 0)} MAD</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total">
        <p>Total: ${data.total_amount} MAD</div>
    </div>
    
    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        <p>Merci pour votre confiance - INOXYA BIJOUX</div>
    </div>
</body>
</html>
  `
}
