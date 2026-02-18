"use client"

import { useState, useEffect } from "react"

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  Star,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react"
interface Product {
  id: string
  name: string
  name_ar?: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  images?: string[]
  rating?: number
  reviews_count?: number
  category_id?: string
  pack_id?: string
  is_available: boolean
  is_featured: boolean
  is_custom: boolean
  created_at: string
}

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Charger les produits depuis l'API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        // PHASE 3: no-store pour éviter le cache Next.js
        const res = await fetch("/api/products", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        const data = await res.json()
        const productsData = Array.isArray(data) ? data.map((p: { id: string; name: string; price: number; main_image?: string; images?: string[] }) => ({
          id: String(p.id),
          name: p.name,
          price: p.price,
          image_url: p.main_image,
          images: p.images || [],
          is_available: true,
          is_featured: false,
          is_custom: false,
          created_at: ""
        })) : []
        setProducts(productsData)
        setFilteredProducts(productsData)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur lors du chargement des produits:", error)
        }
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Filtrer et trier les produits
  useEffect(() => {
    let filtered = [...products]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "available":
          filtered = filtered.filter(p => p.is_available)
          break
        case "unavailable":
          filtered = filtered.filter(p => !p.is_available)
          break
        case "featured":
          filtered = filtered.filter(p => p.is_featured)
          break
        case "custom":
          filtered = filtered.filter(p => p.is_custom)
          break
      }
    }

    // Filtre par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category_id === categoryFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, categoryFilter, sortBy])

  const handleDelete = async (productId: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce produit ?\n\nCette action est irréversible et supprimera définitivement le produit de la base de données.`)) {
      return
    }

    try {
      // Vérifier que l'ID est valide
      if (!productId || productId === 'undefined' || productId === 'null') {
        throw new Error('ID produit invalide')
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!res.ok) {
        // Essayer de parser la réponse JSON
        let errorMessage: string = `Erreur ${res.status}: Erreur lors de la suppression`
        
        try {
          // Cloner la réponse pour pouvoir la lire plusieurs fois si nécessaire
          const responseClone = res.clone()
          const errorData = await responseClone.json()
          
          if (errorData && typeof errorData === 'object') {
            const extractedError = errorData.error || errorData.message
            if (extractedError && typeof extractedError === 'string' && extractedError.trim()) {
              errorMessage = extractedError
            }
          }
        } catch (jsonError) {
          // Si ce n'est pas du JSON, essayer de lire le texte
          try {
            const responseClone = res.clone()
            const text = await responseClone.text()
            if (text && text.trim()) {
              // Essayer de parser le texte comme JSON si possible
              try {
                const parsed = JSON.parse(text)
                if (parsed && typeof parsed === 'object') {
                  errorMessage = parsed.error || parsed.message || text
                } else {
                  errorMessage = text
                }
              } catch {
                errorMessage = text
              }
            }
          } catch (textError) {
            // Si tout échoue, utiliser le message par défaut basé sur le status
            if (res.status === 404) {
              errorMessage = 'Produit non trouvé'
            } else if (res.status === 403) {
              errorMessage = 'Accès non autorisé'
            } else if (res.status === 503) {
              errorMessage = 'Base de données indisponible'
            } else {
              const statusCode = res.status || 500
              errorMessage = `Erreur ${statusCode}: Erreur lors de la suppression`
            }
          }
        }

        // S'assurer que errorMessage n'est jamais vide ou undefined
        if (!errorMessage || typeof errorMessage !== 'string' || !errorMessage.trim()) {
          errorMessage = `Erreur ${res.status}: Erreur lors de la suppression`
        }

        // Gérer les différents codes d'erreur
        if (res.status === 404) {
          // Produit déjà supprimé ou n'existe pas - Rafraîchir la liste
          try {
            const refreshRes = await fetch("/api/products", { 
              cache: 'no-store',
              credentials: 'include'
            })
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json()
              const productsData = Array.isArray(refreshData) ? refreshData.map((p: { 
                id: string | number
                name: string
                price: number
                main_image?: string
                images?: string[]
                description?: string
                is_active?: boolean
                is_featured?: boolean
                is_custom?: boolean
                created_at?: string
              }) => ({
                id: String(p.id),
                name: p.name,
                price: p.price,
                image_url: p.main_image,
                images: p.images || [],
                description: p.description,
                is_available: p.is_active !== false,
                is_featured: p.is_featured || false,
                is_custom: p.is_custom || false,
                created_at: p.created_at || new Date().toISOString()
              })) : []
              setProducts(productsData)
              setFilteredProducts(productsData)
            }
          } catch (refreshError) {
            if (process.env.NODE_ENV === 'development') {
              console.error("Erreur lors du rafraîchissement:", refreshError)
            }
          }
          alert(`Le produit n'existe plus dans la base de données. La liste a été actualisée.`)
          return
        } else if (res.status === 403) {
          throw new Error('Accès non autorisé. Vous devez être administrateur.')
        } else if (res.status === 503) {
          throw new Error('Base de données indisponible. Veuillez réessayer plus tard.')
        } else {
          // S'assurer que errorMessage est toujours une string valide
          let finalErrorMessage: string
          if (typeof errorMessage === 'string' && errorMessage.trim()) {
            finalErrorMessage = errorMessage.trim()
          } else {
            const statusCode = res.status || 500
            finalErrorMessage = `Erreur ${statusCode}: Erreur lors de la suppression`
          }
          throw new Error(finalErrorMessage)
        }
      }

      // Succès - Mettre à jour la liste locale
      setProducts(prev => prev.filter(p => p.id !== productId))
      setFilteredProducts(prev => prev.filter(p => p.id !== productId))
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Produit supprimé avec succès:", { productId })
      }
      alert(`✅ Produit supprimé avec succès de la base de données.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression"
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de la suppression:", error)
      }
      alert(`❌ ${errorMessage}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (product: Product) => {
    if (!product.is_available) {
      return <Badge variant="destructive">Indisponible</Badge>
    }
    if (product.is_featured) {
      return <Badge className="bg-yellow-500 text-black">Vedette</Badge>
    }
    if (product.is_custom) {
      return <Badge className="bg-purple-500 text-white">Sur mesure</Badge>
    }
    return <Badge variant="secondary">Disponible</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement des produits...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
              <div className="text-gray-600 mt-2">
                Gérez votre catalogue de bijoux ({filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''})
              </div>
            </div>
            <Link href="/admin/produits/nouveau">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau produit
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Total Produits</div>
                  <div className="text-2xl font-bold">{products.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Produits Vedettes</div>
                  <div className="text-2xl font-bold">{products.filter(p => p.is_featured).length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Moyenne Notes</div>
                  <div className="text-2xl font-bold">
                    {products.length > 0 
                      ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
                      : "0.0"
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Prix Moyen</div>
                  <p className="text-2xl font-bold">
                    {products.length > 0 
                      ? formatPrice(products.reduce((sum, p) => sum + p.price, 0) / products.length)
                      : "0 MAD"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="unavailable">Indisponibles</SelectItem>
                  <SelectItem value="featured">Vedettes</SelectItem>
                  <SelectItem value="custom">Sur mesure</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="cat-bagues">Bagues</SelectItem>
                  <SelectItem value="cat-colliers">Colliers</SelectItem>
                  <SelectItem value="cat-bracelets">Bracelets</SelectItem>
                  <SelectItem value="cat-boucles">Boucles d'oreilles</SelectItem>
                  <SelectItem value="cat-broches">Nos packs</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="name">Nom (A-Z)</SelectItem>
                  <SelectItem value="price-low">Prix croissant</SelectItem>
                  <SelectItem value="price-high">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits */}
        <div className="grid gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Image du produit */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Informations du produit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        {product.name_ar && (
                          <p className="text-sm text-gray-600 mb-2 font-arabic">
                            {product.name_ar}
                          </p>
                        )}
                        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatPrice(product.price)}
                            {product.original_price && product.original_price > product.price && (
                              <span className="line-through text-gray-400 ml-1">
                                {formatPrice(product.original_price)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {product.rating?.toFixed(1) || "0.0"} ({product.reviews_count || 0})
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(product.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(product)}
                        
                        <div className="flex items-center gap-1">
                          <Link href={`/bijoux/${product.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          <Link href={`/admin/produits/${product.id}/modifier`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message si aucun produit */}
        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Modifiez vos filtres pour voir plus de produits"
                  : "Commencez par créer votre premier produit"
                }
              </p>
              {(!searchTerm && statusFilter === "all" && categoryFilter === "all") && (
                <Link href="/admin/produits/nouveau">
                  <Button className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un produit
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
