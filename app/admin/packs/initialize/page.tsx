"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function InitializePacksPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    deleted?: number
    inserted?: number
    error?: string
  } | null>(null)

  const handleInitialize = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir initialiser les packs officiels ?\n\nCette action va :\n- Supprimer les packs existants\n- Insérer les 14 packs officiels\n\nCette opération est irréversible.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/packs/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message || 'Packs initialisés avec succès',
          deleted: data.deleted,
          inserted: data.inserted
        })
        
        // Rediriger vers la page des packs après 3 secondes
        setTimeout(() => {
          router.push('/admin/packs')
        }, 3000)
      } else {
        setResult({
          success: false,
          message: 'Erreur lors de l\'initialisation',
          error: data.error || 'Erreur inconnue'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de l\'initialisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Initialisation des Packs Officiels</h1>
            <p className="text-gray-600">
              Supprimer les packs existants et insérer les 14 packs officiels INOXYA
            </p>
          </div>
          <Link href="/admin/packs">
            <Button variant="outline">
              Retour aux packs
            </Button>
          </Link>
        </div>

        {/* Carte d'information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Instructions
            </CardTitle>
            <CardDescription>
              Cette opération va effectuer les actions suivantes :
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>1. Suppression des packs existants</strong>
                  <p className="text-sm text-gray-600">
                    Supprime tous les packs existants dans la base
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>2. Copie des images</strong>
                  <p className="text-sm text-gray-600">
                    Copie les images depuis <code className="bg-gray-100 px-1 rounded">C:\Users\hassa\Desktop\pack inoxya\</code> vers <code className="bg-gray-100 px-1 rounded">public/images/packs/</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>3. Insertion des 14 packs officiels</strong>
                  <p className="text-sm text-gray-600">
                    Insère les packs avec leurs prix et images
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Attention :</strong> Cette opération est irréversible. 
                Tous les packs existants seront supprimés puis remplacés par les packs officiels.
              </AlertDescription>
            </Alert>

            {/* Liste des 14 packs */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Les 14 packs officiels à insérer :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {[
                  'Pack Prestige',
                  'Pack Émeraude',
                  'Pack Doré Luxe',
                  'Pack Cloue',
                  'Pack Cloue Soft',
                  'Pack Élegancia',
                  'Pack Éclat Suprême',
                  'Pack Trêfle',
                  'Pack Royal',
                  'Pack Papillon',
                  'Pack Impérial',
                  'Pack Glamour',
                  'Pack Doré Luxe',
                  'Pack Black Titanium'
                ].map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton d'initialisation */}
            <div className="pt-4">
              <Button
                onClick={handleInitialize}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initialisation en cours...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Initialiser les Packs Officiels
                  </>
                )}
              </Button>
            </div>

            {/* Résultat */}
            {result && (
              <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-semibold">{result.message}</div>
                    {result.success && (
                      <div className="text-sm space-y-1">
                        {result.deleted !== undefined && (
                          <div>✅ {result.deleted} pack(s) supprimé(s)</div>
                        )}
                        {result.inserted !== undefined && (
                          <div>✅ {result.inserted} pack(s) officiel(s) créé(s)</div>
                        )}
                        <div className="mt-2 text-gray-600">
                          Redirection vers la page des packs dans 3 secondes...
                        </div>
                      </div>
                    )}
                    {result.error && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Erreur :</strong> {result.error}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

