"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Search, RefreshCw, Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

interface Bijou {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  is_available: boolean
  is_featured: boolean
  is_custom: boolean
  created_at: string
}

export default function AdminProducts() {
  const [bijoux, setBijoux] = useState<Bijou[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchBijoux = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products', { 
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Base de données indisponible. Veuillez réessayer plus tard.')
        }
        throw new Error(`Erreur ${res.status}: Impossible de charger les produits`)
      }

      const data = await res.json()
      // L'API retourne { products: [...], total: ... }
      const productsArray = Array.isArray(data) ? data : (data?.products || [])
      const bijouxData = productsArray.map((p: { 
        id: string | number
        name: string
        price: number
        main_image?: string
        image_url?: string
        description?: string
        is_active?: boolean
        is_featured?: boolean
        is_custom?: boolean
        created_at?: string
      }) => ({
        id: String(p.id),
        name: p.name,
        price: p.price,
        image_url: p.main_image || p.image_url,
        description: p.description,
        is_available: p.is_active !== false,
        is_featured: p.is_featured || false,
        is_custom: p.is_custom || false,
        created_at: p.created_at || new Date().toISOString()
      }))
      setBijoux(bijouxData)
    } catch (error) {
      console.error("Erreur lors du chargement des bijoux:", error)
      alert(error instanceof Error ? error.message : "Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBijoux()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const filteredBijoux = bijoux.filter(bijou => 
    bijou.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bijou.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Chargement des produits...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Produits</h2>
          <p className="text-sm text-gray-600 mt-1">
            {bijoux.length} produit{bijoux.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchBijoux}
            disabled={loading}
            className="hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/produits/nouveau">
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-gray-500 hover:text-gray-700"
              >
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des produits */}
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900">Produit</TableHead>
                  <TableHead className="font-semibold text-gray-900">Prix</TableHead>
                  <TableHead className="font-semibold text-gray-900">Statut</TableHead>
                  <TableHead className="font-semibold text-gray-900">Date de création</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBijoux.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm ? 'Aucun produit trouvé pour votre recherche' : 'Aucun produit disponible'}
                      </p>
                      {!searchTerm && (
                        <Link href="/admin/produits/nouveau" className="inline-block mt-4">
                          <Button className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Créer le premier produit
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBijoux.map((bijou) => (
                    <TableRow key={bijou.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {bijou.image_url ? (
                              <Image 
                                src={bijou.image_url} 
                                alt={bijou.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                  const parent = (e.target as HTMLImageElement).parentElement
                                  if (parent) {
                                    parent.innerHTML = '<Package class="w-6 h-6 text-gray-400" />'
                                  }
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{bijou.name}</div>
                            {bijou.description && (
                              <div className="text-sm text-gray-500 truncate mt-1">
                                {bijou.description.substring(0, 60)}
                                {bijou.description.length > 60 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-gray-900">{formatCurrency(bijou.price)}</div>
                          {bijou.original_price && bijou.original_price > bijou.price && (
                            <div className="text-sm text-gray-400 line-through">
                              {formatCurrency(bijou.original_price)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge 
                            variant={bijou.is_available ? "default" : "secondary"}
                            className={bijou.is_available ? "bg-green-100 text-green-800 border-green-300" : ""}
                          >
                            {bijou.is_available ? "Disponible" : "Indisponible"}
                          </Badge>
                          {bijou.is_featured && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              ⭐ Vedette
                            </Badge>
                          )}
                          {bijou.is_custom && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                              ✨ Sur mesure
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {bijou.created_at ? new Date(bijou.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/bijoux/${bijou.id}`} target="_blank">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Voir sur le site"
                              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/produits/${bijou.id}/modifier`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Modifier le produit"
                              className="hover:bg-orange-50 hover:border-orange-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                            onClick={async () => {
                              if (!confirm(`Êtes-vous sûr de vouloir supprimer "${bijou.name}" ?\n\nCette action est irréversible et supprimera définitivement le produit de la base de données.`)) {
                                return
                              }
                              
                              try {
                                // Vérifier que l'ID est valide
                                if (!bijou.id || bijou.id === 'undefined' || bijou.id === 'null') {
                                  throw new Error('ID produit invalide')
                                }

                                // Récupérer le token CSRF (OBLIGATOIRE pour DELETE)
                                const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
                                if (!csrfRes.ok) {
                                  throw new Error('Impossible de récupérer le token CSRF')
                                }
                                const csrfData = await csrfRes.json()
                                const csrfToken = csrfData.csrfToken

                                const res = await fetch(`/api/products/${bijou.id}`, {
                                  method: 'DELETE',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'X-CSRF-Token': csrfToken
                                  },
                                  credentials: 'include'
                                })

                                const data = await res.json()

                                if (!res.ok) {
                                  // Gérer les différents codes d'erreur
                                  if (res.status === 404) {
                                    // Produit déjà supprimé ou n'existe pas
                                    await fetchBijoux() // Rafraîchir la liste
                                    alert(`Le produit "${bijou.name}" n'existe plus dans la base de données. La liste a été actualisée.`)
                                    return
                                  } else if (res.status === 403) {
                                    throw new Error('Accès non autorisé. Vous devez être administrateur.')
                                  } else if (res.status === 503) {
                                    throw new Error('Base de données indisponible. Veuillez réessayer plus tard.')
                                  } else {
                                    throw new Error(data.error || `Erreur ${res.status}: Erreur lors de la suppression`)
                                  }
                                }

                                // Succès
                                await fetchBijoux()
                                alert(`✅ Produit "${bijou.name}" supprimé avec succès de la base de données.`)
                              } catch (error) {
                                console.error("Erreur lors de la suppression:", error)
                                const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression"
                                alert(`❌ ${errorMessage}`)
                              }
                            }}
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
