'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, Package, Tag, AlertTriangle } from 'lucide-react'

interface AnalysisResult {
  timestamp: string
  connection: { status: boolean; method: string | null; error: string | null }
  database: { path: string; exists: boolean; size: number }
  tables: { list: string[]; structure: Record<string, any[]>; counts: Record<string, number>; problems: any[] }
  products: { total: number; active: number; inactive: number; list: any[]; problems: any[] }
  packs: { total: number; list: any[]; problems: any[] }
  categories: { total: number; list: any[]; problems: any[] }
  integrity: { foreignKeys: any[]; orphaned: any[]; duplicates: any[] }
  recommendations: string[]
}

export default function DatabaseAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/database/analyze')
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Analyse de la base de données en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchAnalysis} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <p>Aucune donnée disponible</p>
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyse de la Base de Données</h1>
          <p className="text-gray-600 mt-2">
            Dernière analyse: {new Date(analysis.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>
        <Button onClick={fetchAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Connexion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connexion à la Base de Données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {analysis.connection.status ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold">
                Statut: {analysis.connection.status ? 'Connecté' : 'Non connecté'}
              </span>
            </div>
            {analysis.connection.method && (
              <p className="text-sm text-gray-600">Méthode: {analysis.connection.method}</p>
            )}
            {analysis.connection.error && (
              <p className="text-sm text-red-600">Erreur: {analysis.connection.error}</p>
            )}
            <p className="text-sm text-gray-600">Chemin: {analysis.database.path}</p>
            <p className="text-sm text-gray-600">
              Taille: {formatBytes(analysis.database.size)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Tables de la Base de Données</CardTitle>
          <CardDescription>{analysis.tables.list.length} table(s) trouvée(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analysis.tables.list.map((table) => (
              <div key={table} className="border rounded-lg p-3">
                <p className="font-semibold">{table}</p>
                <p className="text-sm text-gray-600">
                  {analysis.tables.counts[table] || 0} enregistrement(s)
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produits
          </CardTitle>
          <CardDescription>
            Total: {analysis.products.total} | Actifs: {analysis.products.active} | Inactifs: {analysis.products.inactive}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.products.problems.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {analysis.products.problems.length} produit(s) avec problème(s)
              </h3>
              <div className="space-y-2">
                {analysis.products.problems.slice(0, 10).map((problem, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold">ID {problem.product_id}:</span> {problem.name}
                    <ul className="ml-4 mt-1">
                      {problem.problems.map((p: string, i: number) => (
                        <li key={i} className="text-yellow-700">• {p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">Liste des Produits ({analysis.products.list.length})</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Nom</th>
                    <th className="p-2 text-left">Prix</th>
                    <th className="p-2 text-left">Catégorie</th>
                    <th className="p-2 text-left">Stock</th>
                    <th className="p-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.products.list.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-2">{product.id}</td>
                      <td className="p-2 font-medium">{product.name}</td>
                      <td className="p-2">{product.price} MAD</td>
                      <td className="p-2">{product.category}</td>
                      <td className="p-2">{product.stock ?? 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Packs
          </CardTitle>
          <CardDescription>Total: {analysis.packs.total}</CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.packs.problems.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">
                {analysis.packs.problems.length} pack(s) avec problème(s)
              </h3>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">Liste des Packs</h3>
            {analysis.packs.list.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.packs.list.map((pack) => (
                  <div key={pack.id} className="border rounded-lg p-4">
                    <p className="font-semibold">{pack.name}</p>
                    <p className="text-sm text-gray-600">Slug: {pack.slug}</p>
                    <p className="text-sm font-medium">{pack.price} MAD</p>
                    {pack.is_featured && (
                      <Badge className="mt-2">Vedette</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Aucun pack trouvé</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories</CardTitle>
          <CardDescription>Total: {analysis.categories.total}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analysis.categories.list.map((cat) => (
              <div key={cat.id} className="border rounded-lg p-3">
                <p className="font-semibold">{cat.name}</p>
                <p className="text-sm text-gray-600">{cat.slug}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intégrité */}
      {(analysis.integrity.orphaned.length > 0 || analysis.integrity.duplicates.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Problèmes d&apos;Intégrité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.integrity.orphaned.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Produits avec catégories invalides</h3>
                <p className="text-sm">{analysis.integrity.orphaned[0]?.count || 0} produit(s)</p>
              </div>
            )}
            {analysis.integrity.duplicates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Doublons détectés</h3>
                <p className="text-sm">{analysis.integrity.duplicates.length} type(s) de doublons</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-1 text-blue-600" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

