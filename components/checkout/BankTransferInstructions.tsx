"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { BANK_TRANSFER_INFO } from "@/lib/config/payment"
import { ORDER_CONFIG, generateWhatsAppUrl } from "@/lib/order-config"

export type BankTransferInstructionsProps = {
  title: string
  shortIntro: string
  mainInstruction: string
  motifHint: string
  securityNote: string
  copyLabel: string
  copiedLabel: string
  whatsappCta: string
  whatsappFooterHint: string
  /** Texte si aucun numéro WhatsApp exploitable (pas de bouton) */
  whatsappNoNumberText: string
  orderId?: string | null
  totalFormatted?: string
  locale?: string
}

/**
 * Bloc coordonnées bancaires + copie RIB + lien WhatsApp si configuré.
 */
export function BankTransferInstructions({
  title,
  shortIntro,
  mainInstruction,
  motifHint,
  securityNote,
  copyLabel,
  copiedLabel,
  whatsappCta,
  whatsappFooterHint,
  whatsappNoNumberText,
  orderId,
  totalFormatted,
  locale = "fr",
}: BankTransferInstructionsProps) {
  const [copied, setCopied] = useState(false)

  const ribCompact = BANK_TRANSFER_INFO.bankRib.replace(/\s/g, "")

  const copyRib = async () => {
    try {
      await navigator.clipboard.writeText(ribCompact)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      try {
        await navigator.clipboard.writeText(BANK_TRANSFER_INFO.bankRib)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        /* ignore */
      }
    }
  }

  const waDigits = ORDER_CONFIG.whatsappNumber?.replace(/\D/g, "").trim() ?? ""
  const proofMessage =
    orderId && totalFormatted
      ? `Bonjour Inoxya — commande ${orderId} (${totalFormatted}). Ci-joint capture d’écran de la commande et preuve de virement.`
      : `Bonjour Inoxya — ci-joint capture d’écran de la commande et preuve de virement.`
  const whatsappHref =
    waDigits.length >= 8 ? generateWhatsAppUrl(proofMessage) : null

  return (
    <div
      className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-stone-50 p-4 sm:p-5 shadow-sm ring-1 ring-black/5"
      dir={locale === "ar" ? "rtl" : "ltr"}
      role="region"
      aria-label={title}
    >
      <h3 className="text-base font-semibold text-stone-900 tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{shortIntro}</p>
      <p className="mt-3 text-sm text-stone-800 leading-relaxed">{mainInstruction}</p>

      <div className="mt-4 rounded-lg bg-white/80 border border-stone-200/80 p-4 space-y-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Banque</div>
          <div className="text-lg font-semibold text-stone-900">{BANK_TRANSFER_INFO.bankName}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">RIB</div>
          <div
            className="mt-1 font-mono text-lg sm:text-xl font-semibold tracking-wide text-stone-900 break-all select-all"
            title={BANK_TRANSFER_INFO.bankRib}
          >
            {BANK_TRANSFER_INFO.bankRib}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-stone-300 bg-white hover:bg-stone-50"
          onClick={copyRib}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600 shrink-0" aria-hidden />
              {copiedLabel}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2 shrink-0" aria-hidden />
              {copyLabel}
            </>
          )}
        </Button>
      </div>

      <p className="mt-3 text-sm text-stone-700 leading-relaxed">{motifHint}</p>
      <p className="mt-2 text-xs text-stone-500 leading-relaxed">{securityNote}</p>

      <div className="mt-4 pt-3 border-t border-stone-200/80">
        <p className="text-sm text-stone-700 mb-2">{whatsappFooterHint}</p>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 transition-colors"
          >
            {whatsappCta}
          </a>
        ) : (
          <p className="text-sm text-stone-600">{whatsappNoNumberText}</p>
        )}
      </div>
    </div>
  )
}
