import { logger } from './logger'

// Import conditionnel de nodemailer (optionnel)
let nodemailer: any = null
try {
  nodemailer = require('nodemailer')
} catch {
  // nodemailer non installé - fonctionnalité email désactivée
}

export async function sendAdminEmail(subject: string, htmlBody: string) {
  // Si nodemailer n'est pas disponible, retourner false silencieusement
  if (!nodemailer) {
    return false
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    ADMIN_EMAIL
  } = process.env as Record<string, string | undefined>

  // Fallback propre: pas de crash si SMTP non configuré (production-safe)
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })

    const toAddress = ADMIN_EMAIL || SMTP_USER

    await transporter.sendMail({
      from: `Inoxya Bijoux <${SMTP_USER}>`,
      to: toAddress,
      subject,
      html: htmlBody
    })
    return true
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email admin:', error, {})
    return false
  }
}

export function renderPaymentEmail(params: {
  orderId: string
  amount: number
  method: string
  status: string
  transactionId?: string | null
}) {
  const { orderId, amount, method, status, transactionId } = params
  return `
    <h2>Nouvelle tentative de paiement</h2>
    <p><strong>Commande:</strong> ${orderId}</p>
    <p><strong>Montant:</strong> ${amount} MAD</p>
    <p><strong>Méthode:</strong> ${method}</p>
    <p><strong>Statut:</strong> ${status}</p>
    ${transactionId ? `<p><strong>Transaction:</strong> ${transactionId}</p>` : ''}
    <p>Consultez l'espace admin pour plus de détails.</p>
  `
}


