"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  RefreshCw,
  Eye,
  Save,
  X,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Layers
} from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface Product {
  id: string
  name: string
  name_ar?: string
  description: string
  price: number
  original_price?: number
  category: string
  stock: number
  is_active: boolean
  image_url?: string
  main_image?: string
  images?: string[] | string  // Images secondaires (array ou JSON string)
  created_at: string
  updated_at: string
}

interface ProductFormData {
  name: string
  name_ar: string
  description: string
  price: number
  original_price: number
  category: string
  stock: number
  is_active: boolean
  main_image: string  // Image principale (obligatoire)
  secondary_image_1: string  // Image secondaire 1 (optionnelle)
  secondary_image_2: string  // Image secondaire 2 (optionnelle)
}

const categories = [
  "Bagues",
  "Colliers",
  "Bracelets",
  "Boucles d'oreilles",
  "Pendentifs",
  "Chaînes",
  "Autres"
]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_ar: "",
    description: "",
    price: 0,
    original_price: 0,
    category: "",
    stock: 0,
    is_active: true,
    main_image: "",
    secondary_image_1: "",
    secondary_image_2: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Charger les produits depuis la base de données
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits')
      }

      const productsData = await response.json()
      setProducts(productsData)
      
    } catch (error) {
      logger.error("Erreur lors du chargement des produits:", error)
      // En cas d'erreur, retourner un tableau vide (pas de données demo)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDiscountPercentage = (price: number, originalPrice?: number) => {
    if (!originalPrice) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors['name'] = "Le nom du produit est requis"
    }

    if (!formData.description.trim()) {
      newErrors['description'] = "La description est requise"
    }

    if (formData.price <= 0) {
      newErrors['price'] = "Le prix doit être supérieur à 0"
    }

    if (!formData.category) {
      newErrors['category'] = "La catégorie est requise"
    }

    if (formData.stock < 0) {
      newErrors['stock'] = "Le stock ne peut pas être négatif"
    }

    // Validation: Image principale obligatoire
    if (!formData.main_image.trim()) {
      newErrors['main_image'] = "L'image principale est obligatoire"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      price: 0,
      original_price: 0,
      category: "",
      stock: 0,
      is_active: true,
      main_image: "",
      secondary_image_1: "",
      secondary_image_2: ""
    })
    setErrors({})
  }

  const handleInputChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  // AJOUTER UN PRODUIT
  const handleAddProduct = async () => {
    if (!validateForm()) {
      alert("❌ Veuillez corriger les erreurs dans le formulaire")
      return
    }

    try {
      setLoading(true)
      
      // Préparer les données avec les images
      const productData = {
        name: formData.name,
        name_ar: formData.name_ar,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price || null,
        category: formData.category,
        stock: formData.stock,
        is_active: formData.is_active,
        image_url: formData.main_image, // Image principale pour compatibilité
        main_image: formData.main_image,
        images: [
          formData.secondary_image_1,
          formData.secondary_image_2
        ].filter(img => img.trim() !== '') // Filtrer les images vides
      }
      
      // Appel à l'API pour créer le produit
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      const newProduct = await response.json()
      setProducts(prev => [newProduct, ...prev])
      resetForm()
      setShowAddDialog(false)
      
      alert(`✅ Produit "${formData.name}" ajouté avec succès en base de données !`)
      
    } catch (error) {
      logger.error("Erreur lors de l'ajout du produit:", { error: error instanceof Error ? error.message : String(error) })
      alert(`❌ Erreur lors de l'ajout du produit: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  // MODIFIER UN PRODUIT
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    
    // Parser les images secondaires depuis le champ images (JSON string ou array)
    let secondaryImages: string[] = []
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          secondaryImages = JSON.parse(product.images)
        } catch (e) {
          secondaryImages = []
        }
      } else if (Array.isArray(product.images)) {
        secondaryImages = product.images
      }
    }
    
    setFormData({
      name: product.name,
      name_ar: product.name_ar || "",
      description: product.description,
      price: product.price,
      original_price: product.original_price || 0,
      category: product.category,
      stock: product.stock,
      is_active: product.is_active,
      main_image: product.image_url || product.main_image || "",
      secondary_image_1: secondaryImages[0] || "",
      secondary_image_2: secondaryImages[1] || ""
    })
    setShowEditDialog(true)
  }

  const handleUpdateProduct = async () => {
    if (!validateForm() || !selectedProduct) {
      alert("❌ Veuillez corriger les erreurs dans le formulaire")
      return
    }

    try {
      setLoading(true)
      
      // Préparer les données avec les images
      const productData = {
        name: formData.name,
        name_ar: formData.name_ar,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price || null,
        category: formData.category,
        stock: formData.stock,
        is_active: formData.is_active,
        image_url: formData.main_image, // Image principale pour compatibilité
        main_image: formData.main_image,
        images: [
          formData.secondary_image_1,
          formData.secondary_image_2
        ].filter(img => img.trim() !== '') // Filtrer les images vides
      }
      
      // Appel à l'API pour modifier le produit
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la modification du produit')
      }

      const updatedProduct = await response.json()
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p))
      resetForm()
      setShowEditDialog(false)
      setSelectedProduct(null)
      
      alert(`✅ Produit "${formData.name}" modifié avec succès en base de données !`)
      
    } catch (error) {
      logger.error("Erreur lors de la modification du produit:", { error: error instanceof Error ? error.message : String(error) })
      alert(`❌ Erreur lors de la modification du produit: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  // SUPPRIMER UN PRODUIT
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?\n\nCette action est irréversible et supprimera le produit de la base de données.`)) {
      return
    }

    try {
      setLoading(true)
      
      // Appel à l'API pour supprimer le produit
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du produit')
      }

      // Supprimer le produit de la liste locale
      setProducts(prev => prev.filter(p => p.id !== product.id))
      
      alert(`✅ Produit "${product.name}" supprimé avec succès de la base de données !`)
      
    } catch (error) {
      logger.error("Erreur lors de la suppression du produit:", { error: error instanceof Error ? error.message : String(error) })
      alert(`❌ Erreur lors de la suppression du produit: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  // VOIR UN PRODUIT
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowViewDialog(true)
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons d'action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Gestion des Produits
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez votre catalogue de bijoux : ajoutez, modifiez et supprimez des produits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/collections">
            <Button 
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Layers className="w-4 h-4 mr-2" />
              Ajouter une Collection
            </Button>
          </Link>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => resetForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Ajouter un Nouveau Produit
                </DialogTitle>
              </DialogHeader>
              <ProductForm 
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
                onSubmit={handleAddProduct}
                onCancel={() => setShowAddDialog(false)}
                loading={loading}
                submitText="Ajouter le Produit"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Produits</div>
                <div className="text-2xl font-bold">{products.length}</div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Produits Actifs</div>
                <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
              </div>
              <Tag className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Stock Total</div>
                <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</div>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Valeur Stock</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des produits */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.name_ar && (
                          <div className="text-sm text-gray-500">{product.name_ar}</div>
                        )}
                        {product.original_price && (
                          <Badge variant="destructive" className="text-xs">
                            -{getDiscountPercentage(product.price, product.original_price)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-bold">{formatCurrency(product.price)}</div>
                      {product.original_price && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.original_price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.stock}</div>
                    <div className="text-xs text-gray-500">
                      {product.stock < 5 ? "Stock faible" : "En stock"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">Aucun produit trouvé</div>
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Modifier le Produit
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onSubmit={handleUpdateProduct}
            onCancel={() => setShowEditDialog(false)}
            loading={loading}
            submitText="Modifier le Produit"
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Détails du Produit
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <div className="font-medium">{selectedProduct.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom en arabe</label>
                  <div className="font-medium">{selectedProduct.name_ar || "Non renseigné"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prix</label>
                  <div className="font-bold text-lg">{formatCurrency(selectedProduct.price)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prix original</label>
                  <div className="font-medium">
                    {selectedProduct.original_price ? formatCurrency(selectedProduct.original_price) : "Non renseigné"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Catégorie</label>
                  <div><Badge variant="outline">{selectedProduct.category}</Badge></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock</label>
                  <div className="font-medium">{selectedProduct.stock}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <div>
                    <Badge variant={selectedProduct.is_active ? "default" : "secondary"}>
                      {selectedProduct.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de création</label>
                  <div className="text-sm">{formatDate(selectedProduct.created_at)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedProduct.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant formulaire réutilisable
interface ProductFormProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: unknown) => void
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
  submitText: string
}

function ProductForm({ formData, errors, onInputChange, onSubmit, onCancel, loading, submitText }: ProductFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            placeholder="Ex: Bague Berbère Or 18K"
            className={errors['name'] ? "border-red-500" : ""}
          />
          {errors['name'] && <p className="text-sm text-red-500">{errors['name']}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_ar">Nom en arabe</Label>
          <Input
            id="name_ar"
            value={formData.name_ar}
            onChange={(e) => onInputChange("name_ar", e.target.value)}
            placeholder="Ex: خاتم بربري ذهبي"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Prix (MAD) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => onInputChange("price", parseFloat(e.target.value) || 0)}
            placeholder="Ex: 2999"
            className={errors['price'] ? "border-red-500" : ""}
          />
          {errors['price'] && <p className="text-sm text-red-500">{errors['price']}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_price">Prix original (MAD)</Label>
          <Input
            id="original_price"
            type="number"
            value={formData.original_price}
            onChange={(e) => onInputChange("original_price", parseFloat(e.target.value) || 0)}
            placeholder="Ex: 3999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select value={formData.category} onValueChange={(value) => onInputChange("category", value)}>
            <SelectTrigger className={errors['category'] ? "border-red-500" : ""}>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['category'] && <p className="text-sm text-red-500">{errors['category']}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => onInputChange("stock", parseInt(e.target.value) || 0)}
            placeholder="Ex: 10"
            className={errors['stock'] ? "border-red-500" : ""}
          />
          {errors['stock'] && <p className="text-sm text-red-500">{errors['stock']}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange("description", e.target.value)}
          placeholder="Description détaillée du produit..."
          rows={4}
          className={errors['description'] ? "border-red-500" : ""}
        />
        {errors['description'] && <p className="text-sm text-red-500">{errors['description']}</p>}
      </div>

      {/* Images du produit */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="main_image">
            Image principale <span className="text-red-500">*</span>
          </Label>
          <Input
            id="main_image"
            value={formData.main_image}
            onChange={(e) => onInputChange("main_image", e.target.value)}
            placeholder="https://example.com/main-image.jpg ou /images/products/image.jpg"
            className={errors['main_image'] ? "border-red-500" : ""}
          />
          {errors['main_image'] && <p className="text-sm text-red-500">{errors['main_image']}</p>}
          <p className="text-xs text-gray-500">
            URL de l'image principale du produit (obligatoire)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_image_1">Image secondaire 1</Label>
          <Input
            id="secondary_image_1"
            value={formData.secondary_image_1}
            onChange={(e) => onInputChange("secondary_image_1", e.target.value)}
            placeholder="https://example.com/secondary-1.jpg ou /images/products/image-1.jpg"
          />
          <p className="text-xs text-gray-500">
            Première image secondaire pour la galerie (optionnelle)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_image_2">Image secondaire 2</Label>
          <Input
            id="secondary_image_2"
            value={formData.secondary_image_2}
            onChange={(e) => onInputChange("secondary_image_2", e.target.value)}
            placeholder="https://example.com/secondary-2.jpg ou /images/products/image-2.jpg"
          />
          <p className="text-xs text-gray-500">
            Deuxième image secondaire pour la galerie (optionnelle)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => onInputChange("is_active", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="is_active">Produit actif (visible sur le site)</Label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {submitText}
        </Button>
      </div>
    </div>
  )
}
