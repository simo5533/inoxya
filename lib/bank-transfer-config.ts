/**
 * Coordonnées bancaires affichées au checkout (virement).
 * Source unique pour éviter les divergences UI / emails.
 */
export const BANK_TRANSFER_INFO = {
  bankName: 'CIH BANK',
  bankRib: '230 810 380107021100610056',
} as const
