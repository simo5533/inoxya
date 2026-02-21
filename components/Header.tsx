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
    <header className="bg-white shadow-sm border-b">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-2 text-center">
        <p className="text-sm font-medium">
          {t('freeShipping')}
        </p>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image 
              src="/logo-inoxya.svg" 
              alt="INOXYA - Embellie ton âme" 
              width={150} 
              height={60} 
              className="transition-opacity duration-300 group-hover:opacity-80"
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
          <div className="flex items-center space-x-3">
            {/* Langue */}
            <LanguageSwitcher />

            {/* Recherche */}
            {searchOpen ? (
              <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1 min-w-[200px]">
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
                  className="h-7 px-2 text-gray-500 hover:text-orange-600"
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
                className="text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150"
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
            <Link href={`/${locale}/favoris`}>
              <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150">
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <Badge className={`absolute ${locale === 'ar' ? '-top-1 -left-1' : '-top-1 -right-1'} w-4 h-4 p-0 flex items-center justify-center text-xs bg-orange-500 text-white`}>
                    {favoritesCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Panier */}
            <Link href={`/${locale}/panier`}>
              <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className={`absolute ${locale === 'ar' ? '-top-1 -left-1' : '-top-1 -right-1'} w-4 h-4 p-0 flex items-center justify-center text-xs bg-orange-500 text-white`}>
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



