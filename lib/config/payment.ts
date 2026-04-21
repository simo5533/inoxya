/**
 * Point d’entrée unique pour la config checkout / paiement (constantes bancaires + helpers).
 * Importer depuis `@/lib/config/payment` côté UI et serveur.
 */
export { BANK_TRANSFER_INFO } from '../bank-transfer-config'
export {
  PAYMENT_METHOD_BANK_TRANSFER,
  PAYMENT_METHOD_COD,
  ORDER_STATUS_AWAITING_BANK_TRANSFER,
  normalizeCheckoutPaymentMethod,
  orderStatusForCheckoutPayment,
  formatPaymentMethodLabelFr,
  formatPaymentMethodDetailHtml,
  type CheckoutPaymentMethod,
} from '../payment-methods'
