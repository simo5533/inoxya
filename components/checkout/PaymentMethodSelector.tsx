"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PAYMENT_METHOD_BANK_TRANSFER, PAYMENT_METHOD_COD } from "@/lib/config/payment"

export type PaymentMethodSelectorProps = {
  value: typeof PAYMENT_METHOD_COD | typeof PAYMENT_METHOD_BANK_TRANSFER
  onChange: (value: typeof PAYMENT_METHOD_COD | typeof PAYMENT_METHOD_BANK_TRANSFER) => void
  labelCod: string
  hintCod: string
  labelBank: string
  hintBank: string
  sectionLabel: string
  className?: string
}

/**
 * Sélecteur premium (radio + cartes) pour le mode de paiement checkout.
 */
export function PaymentMethodSelector({
  value,
  onChange,
  labelCod,
  hintCod,
  labelBank,
  hintBank,
  sectionLabel,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn("space-y-3 min-w-0 w-full", className)}>
      <Label className="text-base font-semibold text-gray-900">{sectionLabel}</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) =>
          onChange(v === PAYMENT_METHOD_BANK_TRANSFER ? PAYMENT_METHOD_BANK_TRANSFER : PAYMENT_METHOD_COD)
        }
        className="grid gap-3"
        aria-label={sectionLabel}
      >
        <label
          htmlFor="pm-cod"
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors shadow-sm",
            value === PAYMENT_METHOD_COD
              ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-200"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <RadioGroupItem value={PAYMENT_METHOD_COD} id="pm-cod" className="mt-1 shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <div className="font-semibold text-gray-900">{labelCod}</div>
            <p className="text-sm text-gray-600 mt-0.5">{hintCod}</p>
          </div>
        </label>
        <label
          htmlFor="pm-bank"
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors shadow-sm",
            value === PAYMENT_METHOD_BANK_TRANSFER
              ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-200"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <RadioGroupItem
            value={PAYMENT_METHOD_BANK_TRANSFER}
            id="pm-bank"
            className="mt-1 shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <div className="font-semibold text-gray-900">{labelBank}</div>
            <p className="text-sm text-gray-600 mt-0.5">{hintBank}</p>
          </div>
        </label>
      </RadioGroup>
    </div>
  )
}
