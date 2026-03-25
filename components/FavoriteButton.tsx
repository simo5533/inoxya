'use client'

import { useCallback, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function fetchCsrfToken(): Promise<string | null> {
  const r = await fetch('/api/csrf-token')
  if (!r.ok) return null
  const d = (await r.json()) as { csrfToken?: string; token?: string }
  return d.csrfToken ?? d.token ?? null
}

interface FavoriteButtonProps {
  bijouId: string | number
  className?: string
  /** Variante carte (icône seule) ou fiche produit (bouton pleine largeur + texte) */
  variant?: 'icon' | 'row'
  labelAdd?: string
  labelRemove?: string
}

export function FavoriteButton({
  bijouId,
  className = '',
  variant = 'icon',
  labelAdd = 'Ajouter aux favoris',
  labelRemove = 'Retirer des favoris',
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const q = encodeURIComponent(String(bijouId))
    fetch(`/api/favorites?bijou_id=${q}`)
      .then((r) => r.json())
      .then((data: { isFavorite?: boolean }) => setIsFavorite(Boolean(data.isFavorite)))
      .catch(() => {})
  }, [bijouId])

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isLoading) return

      const next = !isFavorite
      setIsFavorite(next)
      setIsLoading(true)

      try {
        const csrf = await fetchCsrfToken()
        if (!csrf) {
          setIsFavorite(!next)
          return
        }

        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
          body: JSON.stringify({
            bijou_id: bijouId,
            action: next ? 'add' : 'remove',
          }),
        })

        const data = (await res.json().catch(() => ({}))) as { isFavorite?: boolean }

        if (!res.ok) {
          setIsFavorite(!next)
          return
        }

        if (typeof data.isFavorite === 'boolean') {
          setIsFavorite(data.isFavorite)
        }
      } catch {
        setIsFavorite(!next)
      } finally {
        setIsLoading(false)
      }
    },
    [bijouId, isFavorite, isLoading]
  )

  if (variant === 'row') {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isFavorite ? labelRemove : labelAdd}
        className={`w-full sm:flex-1 min-h-[44px] border-luxury-gold/30 hover:bg-luxury-gold/10 hover:border-luxury-gold ${className}`}
      >
        <Heart
          className={`w-5 h-5 mr-2 shrink-0 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
        />
        {isFavorite ? labelRemove : labelAdd}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorite ? labelRemove : labelAdd}
      className={`${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white'} ${className}`}
    >
      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''} ${isLoading ? 'animate-pulse' : ''}`} />
    </Button>
  )
}
