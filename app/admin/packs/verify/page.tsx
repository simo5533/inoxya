"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface PackVerification {
  pack: {
    id: string
    name: string
    slug: string
    price: number
    image_url?: string
    is_featured: boolean
    created_at: string
  }
  imageExists: boolean
  imagePath?: string
  imagePathType?: 'web' | 'relative' | 'local'
  imageError?: string
  isValid: boolean
}

interface VerificationResult {
  success: boolean
  total: number
  valid: number
  invalid: number
  withImages: number
  withoutImages: number
  verifications: PackVerification[]
  error?: string
}

export default function VerifyPacksPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const loadVerification = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/packs/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data)
      } else {
        setResult({
          success: false,
          total: 0,
          valid: 0,
          invalid: 0,
          withImages: 0,
          withoutImages: 0,
          verifications: [],
          error: data.error || 'Erreur inconnue'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        total: 0,
        valid: 0,
        invalid: 0,
        withImages: 0,
        withoutImages: 0,
        verifications: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVerification()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vérification des Packs</h1>
            <p className="text-gray-600">
              Vérification de tous les packs et de leurs images
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadVerification} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Link href="/admin/packs">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        {result && result.success && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-gray-600">Total des packs</div>
              </CardContent>
            </Card>
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{result.valid}</div>
                <div className="text-sm text-gray-600">Packs valides</div>
              </CardContent>
            </Card>
            <Card className="border-red-500">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{result.invalid}</div>
                <div className="text-sm text-gray-600">Packs invalides</div>
              </CardContent>
            </Card>
            <Card className="border-blue-500">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{result.withImages}</div>
                <div className="text-sm text-gray-600">Avec images</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultat d'erreur */}
        {result && !result.success && (
          <Alert className="border-red-500 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <div className="font-semibold text-red-700">Erreur lors de la vérification</div>
              <div className="text-sm text-red-600 mt-1">{result.error}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Liste des packs */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-gray-600">Vérification en cours...</p>
            </CardContent>
          </Card>
        ) : result && result.success ? (
          <Card>
            <CardHeader>
              <CardTitle>Détails des Packs</CardTitle>
              <CardDescription>
                Liste complète de tous les packs avec leur statut de vérification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.verifications.map((verification) => (
                  <div
                    key={verification.pack.id}
                    className={`border rounded-lg p-4 ${
                      verification.isValid 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {verification.imageExists && verification.pack.image_url ? (
                          <Image
                            src={
                              verification.imagePathType === 'local'
                                ? `/api/admin/serve-local-image?path=${encodeURIComponent(verification.pack.image_url)}`
                                : verification.pack.image_url
                            }
                            alt={verification.pack.name}
                            fill
                            className="object-cover"
                            unoptimized={verification.imagePathType === 'local'}
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholder-pack.jpg'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{verification.pack.name}</h3>
                              {verification.isValid ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Valide
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Invalide
                                </Badge>
                              )}
                              {verification.pack.is_featured && (
                                <Badge variant="outline">Vedette</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>ID: <code className="bg-gray-100 px-1 rounded">{verification.pack.id}</code></div>
                              <div>Slug: <code className="bg-gray-100 px-1 rounded">{verification.pack.slug}</code></div>
                              <div>Prix: <strong className="text-orange-600">{formatCurrency(verification.pack.price)}</strong></div>
                              {verification.pack.image_url && (
                                <div className="flex items-center gap-2">
                                  Image: 
                                  <code className="bg-gray-100 px-1 rounded text-xs">
                                    {verification.pack.image_url}
                                  </code>
                                  {verification.imageExists ? (
                                    <Badge className="bg-green-500 text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Trouvée
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Manquante
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {verification.imageError && (
                                <div className="text-red-600 text-xs">
                                  ⚠️ {verification.imageError}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/packs/${verification.pack.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

