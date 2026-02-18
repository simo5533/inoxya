'use client'

import dynamic from 'next/dynamic'

// Charger le composant uniquement côté client pour éviter les erreurs SSR
const FAQClient = dynamic(() => import('./FAQClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-luxury-ivory/70">Chargement...</p>
      </div>
    </div>
  ),
})

export default function FAQWrapper() {
  return <FAQClient />
}

