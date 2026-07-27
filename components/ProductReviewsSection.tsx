"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ReviewFormData = {
  name: string
  rating: number
  comment: string
}

type ProductReviewsSectionProps = {
  productId: string
  title: string
  leaveReviewLabel: string
}

type ReviewItem = {
  id: number | string
  name: string
  rating: number
  comment: string
  created_at?: string
}

const EMPTY_FORM: ReviewFormData = {
  name: "",
  rating: 0,
  comment: "",
}

export default function ProductReviewsSection({
  productId,
  title,
  leaveReviewLabel,
}: ProductReviewsSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ReviewFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [csrfLoading, setCsrfLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCsrfToken(null)
    setCsrfLoading(true)
    ;(async () => {
      try {
        const r = await fetch("/api/csrf-token", { credentials: "same-origin" })
        const data = (await r.json()) as { csrfToken?: string }
        if (!cancelled && data.csrfToken) setCsrfToken(data.csrfToken)
      } catch {
        if (!cancelled) setCsrfToken(null)
      } finally {
        if (!cancelled) setCsrfLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const canSubmit = useMemo(() => {
    return form.rating > 0 && !submitting && !!csrfToken && !csrfLoading
  }, [form.rating, submitting, csrfToken, csrfLoading])

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true)
    try {
      const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error("REVIEWS_FETCH_FAILED")
      }
      const data = await response.json() as { reviews?: ReviewItem[] }
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
    } catch {
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setError("")
    setSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccessMessage("")

    if (form.rating < 1 || form.rating > 5) {
      setError("Veuillez selectionner une note entre 1 et 5.")
      return
    }

    if (!csrfToken) {
      setError("Securite : rechargez la page ou rouvrez la fenetre.")
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
          name: form.name.trim() || "Client",
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string
          details?: string[]
        }
        if (response.status === 429) {
          setError("Trop d'avis envoyes depuis cette connexion. Reessayez plus tard.")
          return
        }
        if (response.status === 403) {
          setError("Session de securite expiree. Fermez et rouvrez cette fenetre.")
          return
        }
        if (response.status === 422 && Array.isArray(data.details) && data.details[0]) {
          setError(data.details[0])
          return
        }
        throw new Error("REQUEST_FAILED")
      }

      const data = await response.json() as { review?: ReviewItem | null }
      if (data.review) {
        setReviews((prev) => [data.review as ReviewItem, ...prev])
      }
      await fetchReviews()
      router.refresh()
      setSuccessMessage("Merci pour votre avis !")
      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 900)
    } catch {
      setError("Impossible d'envoyer l'avis pour le moment. Reessayez dans quelques instants.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] px-3 py-2 w-full sm:w-auto flex-shrink-0"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {leaveReviewLabel}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
            <DialogDescription>
              Partagez votre experience avec ce bijou.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Votre note</p>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Selection de la note">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-label={`Noter ${value} etoile${value > 1 ? "s" : ""}`}
                    aria-checked={form.rating === value}
                    onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-luxury-gold/40"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        value <= form.rating ? "fill-luxury-gold text-luxury-gold" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-name" className="mb-1 block text-sm font-medium text-gray-800">
                Nom complet
              </label>
              <input
                id="review-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-luxury-gold"
                aria-label="Nom complet"
              />
            </div>

            <div>
              <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-gray-800">
                Votre avis <span className="font-normal text-gray-500">(optionnel)</span>
              </label>
              <textarea
                id="review-comment"
                name="comment"
                rows={3}
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-luxury-gold"
                aria-label="Texte de l'avis"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}

            <Button type="submit" disabled={!canSubmit} className="w-full min-h-[44px]">
              {csrfLoading
                ? "Preparation securisee..."
                : submitting
                  ? "Envoi en cours..."
                  : "Envoyer mon avis"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loadingReviews ? (
        <p className="text-sm text-gray-500">Chargement des avis...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">Soyez le premier à laisser un avis !</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${
                        j < Math.max(0, Math.min(5, Number(review.rating) || 0))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {review.name || "Client"} • {formatRelativeDate(review.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelativeDate(dateValue?: string): string {
  if (!dateValue) return "A l'instant"
  const reviewDate = new Date(dateValue)
  if (Number.isNaN(reviewDate.getTime())) return "A l'instant"

  const diffMs = Date.now() - reviewDate.getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return "A l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`
}
