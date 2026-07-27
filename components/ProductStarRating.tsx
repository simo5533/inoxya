"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ProductStarRatingProps = {
  productId: string
  initialRating?: number
  initialReviewsCount?: number
  rateLabel?: string
}

/**
 * Affiche la moyenne réelle et permet au client de noter en cliquant sur les étoiles.
 */
export default function ProductStarRating({
  productId,
  initialRating = 0,
  initialReviewsCount = 0,
  rateLabel = "Noter ce produit",
}: ProductStarRatingProps) {
  const router = useRouter()
  const [avg, setAvg] = useState(initialRating)
  const [count, setCount] = useState(initialReviewsCount)
  const [hover, setHover] = useState(0)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    setAvg(initialRating)
    setCount(initialReviewsCount)
  }, [initialRating, initialReviewsCount])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/csrf-token", { credentials: "same-origin" })
        const data = (await r.json()) as { csrfToken?: string }
        if (!cancelled && data.csrfToken) setCsrfToken(data.csrfToken)
      } catch {
        if (!cancelled) setCsrfToken(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const openWithRating = (value: number) => {
    setSelected(value)
    setError("")
    setSuccess("")
    setOpen(true)
  }

  const displayValue = hover || (count > 0 ? Math.round(avg) : 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (selected < 1 || selected > 5) {
      setError("Choisissez une note de 1 à 5 étoiles.")
      return
    }
    if (!csrfToken) {
      setError("Sécurité : rechargez la page et réessayez.")
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("/api/reviews/create", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          productId,
          name: name.trim() || "Client",
          rating: selected,
          comment: comment.trim() || undefined,
        }),
      })
      if (!response.ok) {
        if (response.status === 429) {
          setError("Trop d'avis envoyés. Réessayez plus tard.")
          return
        }
        throw new Error("FAILED")
      }
      const nextCount = count + 1
      const nextAvg =
        count > 0
          ? Math.round(((avg * count + selected) / nextCount) * 10) / 10
          : selected
      setAvg(nextAvg)
      setCount(nextCount)
      setSuccess("Merci pour votre note !")
      router.refresh()
      setTimeout(() => {
        setOpen(false)
        setComment("")
        setName("")
        setSelected(0)
        setSuccess("")
      }, 900)
    } catch {
      setError("Impossible d'envoyer la note. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-0.5"
          role="radiogroup"
          aria-label="Noter ce produit"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-label={`Noter ${value} étoile${value > 1 ? "s" : ""}`}
              aria-checked={selected === value}
              onMouseEnter={() => setHover(value)}
              onClick={() => openWithRating(value)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-luxury-gold/40"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  value <= displayValue
                    ? "fill-luxury-gold text-luxury-gold"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {count > 0 ? (
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{avg.toFixed(1)}</span>
            {" "}
            ({count} avis)
          </span>
        ) : (
          <span className="text-sm text-gray-500">Soyez le premier à noter</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[40px]"
          onClick={() => openWithRating(selected || 5)}
        >
          {rateLabel}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Noter ce produit</DialogTitle>
            <DialogDescription>
              Cliquez sur les étoiles pour donner votre avis (commentaire optionnel).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Votre note">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected === value}
                  onClick={() => setSelected(value)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md hover:bg-gray-100"
                >
                  <Star
                    className={`w-7 h-7 ${
                      value <= selected ? "fill-luxury-gold text-luxury-gold" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="star-rate-name" className="mb-1 block text-sm font-medium">
                Votre nom (optionnel)
              </label>
              <input
                id="star-rate-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-luxury-gold"
              />
            </div>
            <div>
              <label htmlFor="star-rate-comment" className="mb-1 block text-sm font-medium">
                Commentaire (optionnel)
              </label>
              <textarea
                id="star-rate-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-luxury-gold"
                placeholder="Qu'avez-vous pensé de ce bijou ?"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
            <Button type="submit" disabled={submitting || selected < 1} className="w-full min-h-[44px]">
              {submitting ? "Envoi..." : "Envoyer ma note"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
