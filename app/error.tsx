'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-luxury-ivory flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 text-center">
          {/* Icône d'erreur */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl md:text-4xl font-bold text-luxury-black mb-4">
            Une erreur s'est produite
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-lg mb-2">
            {error?.message || "Une erreur inattendue s'est produite. Veuillez réessayer."}
          </p>

          {/* Détails en développement */}
          {process.env.NODE_ENV === 'development' && error?.digest && (
            <p className="text-sm text-gray-500 mt-4 font-mono">
              Digest: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button
              onClick={() => reset()}
              className="bg-luxury-black hover:bg-luxury-charcoal text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
