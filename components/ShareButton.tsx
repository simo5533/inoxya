'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Link, X, Check } from 'lucide-react'

interface ShareButtonProps {
  productName: string
  productUrl?: string
  className?: string
}

const SHARE_OPTIONS = [
  {
    name: 'WhatsApp',
    bgColor: 'bg-[#25D366]',
    icon: '💬',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
  },
  {
    name: 'Facebook',
    bgColor: 'bg-[#1877F2]',
    icon: '📘',
    getUrl: (url: string, _title: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'Instagram',
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    icon: '📸',
    getUrl: (_url: string, _title: string) => 'https://www.instagram.com/',
  },
  {
    name: 'TikTok',
    bgColor: 'bg-black',
    icon: '🎵',
    getUrl: (_url: string, _title: string) => 'https://www.tiktok.com/',
  },
  {
    name: 'Twitter / X',
    bgColor: 'bg-black',
    icon: '✖️',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Pinterest',
    bgColor: 'bg-[#E60023]',
    icon: '📌',
    getUrl: (url: string, title: string) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
  },
]

export function ShareButton({
  productName,
  productUrl,
  className = '',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const currentUrl =
    productUrl ?? (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = currentUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Découvrez ${productName} sur INOXYA Bijoux`,
          url: currentUrl,
        })
        return
      } catch {
        // ouvrir la modale
      }
    }
    setIsOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Partager ce produit"
        className={`flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 hover:opacity-80 ${className}`}
      >
        <Share2 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-2xl border border-luxury-gold/20 bg-luxury-ivory shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-luxury-gold/15">
              <div>
                <h3 className="font-bold text-luxury-black text-base">
                  Partager ce bijou
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                  {productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-luxury-black/5 hover:bg-luxury-black/10 transition-colors"
              >
                <X className="w-4 h-4 text-luxury-black" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-3">
                {SHARE_OPTIONS.map((option) => (
                  <a
                    key={option.name}
                    href={option.getUrl(currentUrl, productName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-luxury-gold/10 transition-colors active:scale-95"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${option.bgColor}`}
                    >
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium text-luxury-black text-center leading-tight">
                      {option.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl border border-luxury-gold/20">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Lien du produit</p>
                  <p className="text-sm text-luxury-black truncate font-mono">
                    {currentUrl.replace(/^https?:\/\//, '')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-luxury-black hover:bg-luxury-charcoal text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Link className="w-3.5 h-3.5" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
