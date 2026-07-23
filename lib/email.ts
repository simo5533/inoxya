import { logger } from './logger'
import { SEO_EMAIL } from './seo/config'
import {
  formatPaymentMethodDetailHtml,
  formatPaymentMethodLabelFr,
  normalizeCheckoutPaymentMethod,
  PAYMENT_METHOD_BANK_TRANSFER,
} from './payment-methods'

// Import conditionnel de nodemailer (optionnel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nodemailer = require('nodemailer')
} catch {
  // nodemailer non installé - fonctionnalité email désactivée
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSmtpConfig() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    ADMIN_EMAIL,
  } = process.env as Record<string, string | undefined>

  return {
    host: SMTP_HOST?.trim() || '',
    port: SMTP_PORT?.trim() || '',
    user: SMTP_USER?.trim() || '',
    pass: SMTP_PASS?.trim() || '',
    adminEmail: (ADMIN_EMAIL?.trim() || 'aomarlaasri@gmail.com').trim(),
  }
}

export function isSmtpConfigured(): boolean {
  if (!nodemailer) return false
  const { host, port, user, pass } = getSmtpConfig()
  return Boolean(host && port && user && pass)
}

export async function sendAdminEmail(subject: string, htmlBody: string): Promise<boolean> {
  if (!nodemailer) {
    logger.warn('[email] nodemailer indisponible — notification commande non envoyée')
    return false
  }

  const { host, port, user, pass, adminEmail } = getSmtpConfig()

  if (!host || !port || !user || !pass) {
    logger.warn(
      '[email] SMTP non configuré (SMTP_HOST/PORT/USER/PASS) — notification commande non envoyée',
      { to: adminEmail }
    )
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: `INOXYA Bijoux <${user}>`,
      to: adminEmail,
      subject,
      html: htmlBody,
    })

    logger.info('[email] Notification commande envoyée au patron', {
      to: adminEmail,
      subject,
    })
    return true
  } catch (error) {
    logger.error("Erreur lors de l'envoi de l'email admin:", error, {})
    return false
  }
}

export type OrderEmailItem = {
  name: string
  quantity: number
  price: number
  isPack?: boolean
}

export function renderOrderNotificationEmail(params: {
  orderId: string
  amount: number
  method: string
  orderStatus?: string
  customerName?: string | null
  customerPhone: string
  city: string
  address: string
  items: OrderEmailItem[]
  adminOrderUrl?: string
}) {
  const {
    orderId,
    amount,
    method,
    customerName,
    customerPhone,
    city,
    address,
    items,
    adminOrderUrl,
  } = params
  const orderStatus = params.orderStatus ?? 'pending'
  const methodLine = formatPaymentMethodDetailHtml(method)
  const methodShort = formatPaymentMethodLabelFr(method)
  const isBank = normalizeCheckoutPaymentMethod(method) === PAYMENT_METHOD_BANK_TRANSFER
  const bankNote = isBank
    ? '<p><em>Virement : le client doit envoyer la capture de commande + preuve de paiement (WhatsApp) pour validation.</em></p>'
    : ''

  const rows = items
    .map((item) => {
      const label = escapeHtml(item.name) + (item.isPack ? ' (pack)' : '')
      const lineTotal = (Number(item.price) * Number(item.quantity)).toFixed(2)
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${label}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${Number(item.price).toFixed(2)} MAD</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${lineTotal} MAD</td>
      </tr>`
    })
    .join('')

  const adminLink = adminOrderUrl
    ? `<p><a href="${escapeHtml(adminOrderUrl)}" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Voir la commande dans l’admin</a></p>`
    : '<p>Consultez l’espace admin pour plus de détails.</p>'

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">
      <h2 style="color:#ea580c;margin-bottom:8px;">Nouvelle commande INOXYA</h2>
      <p style="margin-top:0;">Un client vient de commander sur le site.</p>

      <h3>Client</h3>
      <p><strong>Nom :</strong> ${escapeHtml(customerName || 'Non renseigné')}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(customerPhone)}</p>
      <p><strong>Ville :</strong> ${escapeHtml(city)}</p>
      <p><strong>Adresse :</strong> ${escapeHtml(address)}</p>

      <h3>Commande</h3>
      <p><strong>N° :</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Montant :</strong> ${Number(amount).toFixed(2)} MAD</p>
      <p><strong>Paiement :</strong> ${escapeHtml(methodShort)}</p>
      <p><strong>Détail paiement :</strong> ${methodLine}</p>
      <p><strong>Statut :</strong> ${escapeHtml(orderStatus)}</p>
      ${bankNote}

      <h3>Produits commandés</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;text-align:left;">
            <th style="padding:8px;">Produit</th>
            <th style="padding:8px;text-align:center;">Qté</th>
            <th style="padding:8px;text-align:right;">Prix</th>
            <th style="padding:8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="padding:8px;">Aucun article</td></tr>'}
        </tbody>
      </table>

      ${adminLink}
    </div>
  `
}

/** @deprecated Préférer renderOrderNotificationEmail */
export function renderPaymentEmail(params: {
  orderId: string
  amount: number
  method: string
  orderStatus?: string
  status?: string
  transactionId?: string | null
}) {
  return renderOrderNotificationEmail({
    orderId: params.orderId,
    amount: params.amount,
    method: params.method,
    orderStatus: params.orderStatus ?? params.status ?? 'pending',
    customerPhone: '—',
    city: '—',
    address: '—',
    items: 