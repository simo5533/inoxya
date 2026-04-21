import { BANK_TRANSFER_INFO } from '@/lib/bank-transfer-config'

/** Paiement à la livraison */
export const PAYMENT_METHOD_COD = 'cod' as const
/** Virement bancaire */
export const PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer' as const

export type CheckoutPaymentMethod = typeof PAYMENT_METHOD_COD | typeof PAYMENT_METHOD_BANK_TRANSFER

/** Commande en attente de preuve / validation du virement */
export const ORDER_STATUS_AWAITING_BANK_TRANSFER = 'awaiting_bank_transfer' as const

/**
 * Normalise les anciennes valeurs API / BDD vers le duo checkout officiel.
 */
export function normalizeCheckoutPaymentMethod(raw: string | undefined | null): CheckoutPaymentMethod {
  const v = String(raw ?? '').trim()
  if (v === PAYMENT_METHOD_BANK_TRANSFER) return PAYMENT_METHOD_BANK_TRANSFER
  if (v === PAYMENT_METHOD_COD) return PAYMENT_METHOD_COD
  if (v === 'cash_on_delivery' || v === 'cash' || v === 'card') return PAYMENT_METHOD_COD
  return PAYMENT_METHOD_COD
}

export function orderStatusForCheckoutPayment(method: CheckoutPaymentMethod): string {
  return method === PAYMENT_METHOD_BANK_TRANSFER ? ORDER_STATUS_AWAITING_BANK_TRANSFER : 'pending'
}

/** Libellé court pour emails et admin (fr) */
export function formatPaymentMethodLabelFr(method: string): string {
  const m = normalizeCheckoutPaymentMethod(method)
  if (m === PAYMENT_METHOD_BANK_TRANSFER) return 'Virement bancaire'
  return 'Paiement à la livraison'
}

/** Détail pour email HTML (inclut banque + RIB si virement) */
export function formatPaymentMethodDetailHtml(method: string): string {
  const m = normalizeCheckoutPaymentMethod(method)
  if (m === PAYMENT_METHOD_BANK_TRANSFER) {
    return `Virement bancaire — ${BANK_TRANSFER_INFO.bankName}, RIB : ${BANK_TRANSFER_INFO.bankRib}`
  }
  return 'Paiement à la livraison'
}
