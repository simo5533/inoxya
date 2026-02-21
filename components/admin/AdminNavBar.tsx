"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  ShoppingCart, 
  Activity, 
  Box,
  CheckCircle2,
  Settings,
  LogOut
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { routing } from '@/i18n/routing'

function AdminNavBar() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/packs/verify', label: 'Vérifier Packs', icon: CheckCircle2 },
    { href: '/admin/packs/initialize', label: 'Initialiser Packs', icon: Box },
    { href: '/admin/produits', label: 'Produits', icon: Package },
    { href: '/admin/collections', label: 'Collections', icon: Box },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
    { href: '/admin/paniers', label: 'Paniers', icon: ShoppingCart },
    { href: '/admin/notifications', label: 'Notifications', icon: Activity },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    try {
      setIsLoggingOut(true)
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      const csrfData = csrfRes.ok ? await csrfRes.json() : {}
      const csrfToken = csrfData.csrfToken ?? ''
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      
      // Attendre un peu pour que le cookie soit supprimé
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, 100)
      })
      
      // Rediriger vers la page d'accueil localisée avec window.location pour forcer la navigation
      // Utiliser replace() pour éviter que l'utilisateur puisse revenir en arrière
      window.location.replace(`/${routing.defaultLocale}`)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // En cas d'erreur, rediriger quand même
      window.location.replace(`/${routing.defaultLocale}`)
    }
    // Note: setIsLoggingOut(false) n'est pas nécessaire car on quitte la page
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="font-semibold">
                <Home className="w-4 h-4 mr-2" />
                Admin INOXYA
              </Button>
            </Link>
          </div>
          
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className={`whitespace-nowrap ${
                      active 
                        ? "bg-orange-600 hover:bg-orange-700 text-white" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

AdminNavBar.displayName = 'AdminNavBar'

export default AdminNavBar

