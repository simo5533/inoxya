'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-luxury-ivory flex items-center justify-center p-4">
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
              Erreur globale
            </h1>

            {/* Message */}
            <p className="text-gray-600 text-lg mb-8">
              {error?.message || "Une erreur critique s'est produite. Veuillez recharger la page."}
            </p>

            {/* Action */}
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-luxury-black hover:bg-luxury-charcoal text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
