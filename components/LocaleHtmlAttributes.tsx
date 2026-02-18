"use client"

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

export default function LocaleHtmlAttributes() {
  const locale = useLocale()

  useEffect(() => {
    // Mettre à jour les attributs HTML du root layout
    const html = document.documentElement
    const dir = locale === 'ar' ? 'rtl' : 'ltr'
    const lang = locale === 'ar' ? 'ar' : 'fr'
    
    html.setAttribute('dir', dir)
    html.setAttribute('lang', lang)
    
    // Ajouter une classe pour RTL
    if (locale === 'ar') {
      html.classList.add('rtl')
      html.classList.remove('ltr')
    } else {
      html.classList.add('ltr')
      html.classList.remove('rtl')
    }
  }, [locale])

  return null
}

