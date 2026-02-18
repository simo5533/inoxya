"use client"

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { routing } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Remplacer la locale dans le pathname
    const segments = pathname.split('/').filter(Boolean)
    
    // Si le premier segment est une locale valide, la remplacer
    if (segments[0] && routing.locales.includes(segments[0] as any)) {
      segments[0] = newLocale
    } else {
      // Sinon, insérer la nouvelle locale au début
      segments.unshift(newLocale)
    }
    
    const newPath = '/' + segments.join('/')
    router.push(newPath)
    router.refresh() // Rafraîchir pour charger les nouvelles traductions
  }

  const currentLocaleCode = locale.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 text-gray-600 hover:text-orange-600 cursor-pointer transition-all duration-150"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLocaleCode}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => switchLocale('fr')}
          className="flex items-center justify-between cursor-pointer"
        >
          <span>Français</span>
          {locale === 'fr' && <Check className="w-4 h-4 text-orange-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale('ar')}
          className="flex items-center justify-between cursor-pointer"
        >
          <span>العربية</span>
          {locale === 'ar' && <Check className="w-4 h-4 text-orange-600" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

