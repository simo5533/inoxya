"use client"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Heart, Search, Crown } from "lucide-react"
import ConnexionSection from "./ConnexionSection"
import LanguageSwitcher from "./LanguageSwitcher"
import { useState, useEffect, useRef } from "react"
import { getCartCount, getFavorites } from "@/lib/cart-favorites"
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { BRAND_LOGO, BRAND_LOGO_ALT } from '@/lib/brand'

export default function Header() {
  const t = useTranslations('header')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [user, setUser] = useState<{ id: string; phone: string; first_name?: string; last_name?: string; role: string } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Mettre à jour les compteurs
    setCartCount(getCartCount())
    setFavoritesCount(getFavorites().length)

    // Récupérer l'utilisateur via API route
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          // Si la réponse n'est pas OK, essayer de parser le JSON d'erreur
          try {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Erreur serveur')
          } catch {
            // Si ce n'est pas du JSON, ignorer silencieusement
            return null
          }
        }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      })
      .catch(err => {
        console.error('Erreur récupération utilisateur:', err)
        setUser(null)
      })

    // Écouter les changements dans le localStorage
    const handleStorageChange = () => {
      setCartCount(getCartCount())
      setFavoritesCount(getFavorites().length)
    }

    window.addEventListener("storage", handleStorageChange)

    // Vérifier périodiquement les changements (pour les changements dans la même page)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="bg-white shadow-sm border-b w-full max-w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white text-center py-2 px-3">
        <p className="text-xs sm:text-sm font-medium leading-snug">
          {t('freeShipping')}
        </p>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 w-full max-w-full">
        <div className="flex items-center justify-between w-full max-w-full overflow-x-hidden gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0 min-w-0">
            <Image 
              src={BRAND_LOGO} 
              alt={BRAND_LOGO_ALT} 
              width={72} 
              height={72} 
              className="h-10 sm:h-12 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className={`hidden lg:flex items-center ${locale === 'ar' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
            <Link href={`/${locale}/bijoux`} className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
              {t('navigation.jewelry')}
            </Link>
            <Link href={`/${locale}/packs`} className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
              {t('navigation.collections')}
            </Link>
            <Link href={`/${locale}/sur-mesure`} className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
              {t('navigation.custom')}
            </Link>
            <Link href={`/${locale}/a-propos`} className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
              {t('navigation.about')}
            </Link>
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 min-w-0">
            {/* Langue */}
            <LanguageSwitcher />

            {/* Recherche */}
            {searchOpen ? (
              <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1 min-w-0 w-[42vw] max-w-[190px] sm:min-w-[200px] sm:w-auto">
                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const q = searchQuery.trim()
                      setSearchOpen(false)
                      setSearchQuery('')
                      if (q) router.push(`/${locale}/bijoux?search=${encodeURIComponent(q)}`)
                    }
                    if (e.key === 'Escape') {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }
                  }}
                  className="border-0 bg-transparent h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-500 hover:text-orange-600 min-h-[44px] sm:min-h-0"
                  onClick={() => {
                    const q = searchQuery.trim()
                    setSearchOpen(false)
                    setSearchQuery('')
                    if (q) router.push(`/${locale}/bijoux?search=${encodeURIComponent(q)}`)
                  }}
                >
                  OK
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150 min-w-[44px] min-h-[44px] p-2"
                onClick={() => {
                  setSearchOpen(true)
                  setSearchQuery('')
                  setTimeout(() => searchInputRef.current?.focus(), 50)
                }}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Favoris */}
            <Link href={`/${locale}/favoris`} className="relative shrink-0 overflow-visible inline-flex">
              <Button variant="ghost" size="icon" className="relative overflow-visible text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150 min-w-[44px] min-h-[44px] p-2">
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <Badge className={`absolute ${locale === 'ar' ? 'top-1 left-1' : 'top-1 right-1'} w-4 h-4 p-0 flex items-center justify-center text-xs bg-orange-500 text-white`}>
                    {favoritesCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Panier — même pattern que Favoris (overflow + badge dans le bouton) */}
            <Link href={`/${locale}/panier`} className="relative shrink-0 overflow-visible inline-flex">
              <Button variant="ghost" size="icon" className="relative overflow-visible text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150 min-w-[44px] min-h-[44px] p-2">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className={`absolute ${locale === 'ar' ? 'top-1 left-1' : 'top-1 right-1'} w-4 h-4 p-0 flex items-center justify-center text-xs bg-orange-500 text-white`}>
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Connexion */}
            <ConnexionSection user={user} />
            
            {/* Accès Admin */}
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 cursor-pointer transition-all duration-150">
                  <Crown className={`w-4 h-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  <span className="hidden sm:inline">{tCommon('admin')}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}



