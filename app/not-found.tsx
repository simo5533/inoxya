import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-luxury-ivory flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          {/* Code 404 */}
          <div className="mb-6">
            <h1 className="text-8xl md:text-9xl font-bold text-luxury-gold mb-4">404</h1>
          </div>

          {/* Titre */}
          <h2 className="text-3xl md:text-4xl font-bold text-luxury-black mb-4">
            Page non trouvée
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-lg mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-luxury-black hover:bg-luxury-charcoal text-white"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10"
            >
              <Link href="/bijoux">
                <Search className="w-4 h-4 mr-2" />
                Voir nos bijoux
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
