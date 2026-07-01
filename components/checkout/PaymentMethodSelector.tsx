"use client"

import { Label } from "@/components/ui/label"
import { PAYMENT_METHOD_COD } from "@/lib/config/payment"

export type PaymentMethodSelectorProps = {
  value: typeof PAYMENT_METHOD_COD
  onChange: (value: typeof PAYMENT_METHOD_COD) => void
  labelCod: string
  hintCod: string
  sectionLabel: string
  className?: string
}

/**
 * Paiement à la livraison uniquement (checkout INOXYA).
 */
export function PaymentMethodSelector({
  labelCod,
  hintCod,
  sectionLabel,
  className = '',
}: PaymentMethodSelectorProps) {
  return (
    <div className={className}>
      <Label className="text-base font-semibold text-gray-900">{sectionLabel}</Label>
      <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
        <div className="font-semibold text-gray-900">{labelCod}</div>
        <p className="text-sm text-gray-600 mt-0.5">{hintCod}</p>
      </div>
    </div>
  )
}
