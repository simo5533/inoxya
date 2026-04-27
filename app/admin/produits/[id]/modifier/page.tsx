"use client"

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, Edit, X, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { logger } from "@/lib/logger"
import type { Product } from "@/lib/types"
import { shouldUnoptimizeImageUrl } from "@/lib/image-path"

function getSafeImageSrc(url: string | undefined): string {
  if (!url || !url.trim()) return '/placeholder.svg'
  const u = url.trim().replace(/^"|"$/g, '')
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')) return u
  if (/^[A-Za-z]:\\/i.test(u) || u.includes('\\') || u.startsWith('/Users/') || u.startsWith('/home/')) {
    return `/api/admin/serve-local-image?path=${encodeURIComponent(u)}`
  }
  return '/placeholder.svg'
}

function isLocalImageSrc(url: string | undefined): boolean {
  if (!url || !url.trim()) return false
  const u = url.trim().replace(/^"|"$/g, '')
  return /^[A-Za-z]:\\/i.test(u) || u.includes('\\') || u.startsWith('/Users/') || u.startsWith('/home/')
}

/** Utiliser unoptimized pour chemins locaux ou URLs API (éviter échec optimiseur Next) */
function shouldUnoptimizePreview(url: string | undefined): boolean {
  if (shouldUnoptimizeImageUrl(url)) return true
  if (!url || !url.trim()) return false
  const u = url.trim().replace(/^"|"$/g, '')
  return isLocalImageSrc(url) || u.startsWith('/api/admin/serve-local-image')
}

interface ProductFormData {
  name: string
  name_ar: string
  description: string
  price: string
  original_price: string
  category_id: string
  pack_id: string
  image_url: string
  imageSecondary1: string
  imageSecondary2: string
  imageSecondary3: string
  imageSecondary4: string
  imageSecondary5: string
  imageSecondary6: string
  images: string[]
  rating: string
  reviews_count: string
  is_available: boolean
  is_featured: boolean
  is_custom: boolean
  stock_quantity: string
}

const categories = [
  { id: "cat-bagues", name: "Bagues", slug: "bagues" },
  { id: "cat-colliers", name: "Colliers", slug: "colliers" },
  { id: "cat-bracelets", name: "Bracelets", slug: "bracelets" },
  { id: "cat-boucles", name: "Boucles d'oreilles", slug: "boucles-oreilles" },
  { id: "cat-broches", name: "Nos packs", slug: "broches" }
]

const availableTags = ["promo", "nouveau", "bestseller", "premium"]

export default function ModifierProduitPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params['id'] as string
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_ar: "",
    description: "",
    price: "",
    original_price: "",
    category_id: "",
    pack_id: "",
    image_url: "",
    imageSecondary1: "",
    imageSecondary2: "",
    imageSecondary3: "",
    imageSecondary4: "",
    imageSecondary5: "",
    imageSecondary6: "",
    images: [],
    rating: "4.5",
    reviews_count: "0",
    is_available: true,
    is_featured: false,
    is_custom: false,
    stock_quantity: "100"
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [uploadImageLoading, setUploadImageLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [product, setProduct] = useState<Product | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger le produit depuis l'API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoadingProduct(true)
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) {
          router.push("/admin/produits")
          return
        }
        const productData = await res.json()
        if (!productData) {
          router.push("/admin/produits")
          return
        }
        setProduct(productData as Product)
        const categoryNameToId: Record<string, string> = {
          "Bagues": "cat-bagues",
          "Colliers": "cat-colliers",
          "Bracelets": "cat-bracelets",
          "Boucles d'oreilles": "cat-boucles",
          "Nos packs": "cat-broches"
        }
        const cat = productData.category as string
        const imagesArr = Array.isArray(productData.images) ? productData.images : 
          (typeof productData.images === 'string' ? JSON.parse(productData.images || '[]') : [])
        setFormData({
          name: productData.name || "",
          name_ar: productData.name_ar || "",
          description: productData.description || "",
          price: productData.price?.toString() || "",
          original_price: productData.original_price?.toString() || "",
          category_id: categoryNameToId[cat] || cat || "",
          pack_id: productData.pack_id || "",
          image_url: productData.image_url || productData.main_image || "",
          imageSecondary1: imagesArr[0] || "",
          imageSecondary2: imagesArr[1] || "",
          imageSecondary3: imagesArr[2] || "",
          imageSecondary4: imagesArr[3] || "",
          imageSecondary5: imagesArr[4] || "",
          imageSecondary6: imagesArr[5] || "",
          images: [],
          rating: productData.rating?.toString() || "4.5",
          reviews_count: productData.reviews_count?.toString() || "0",
          is_available: productData.is_available ?? true,
          is_featured: productData.is_featured ?? false,
          is_custom: productData.is_custom ?? false,
          stock_quantity: productData.stock?.toString() || "100"
        })
      } catch (error) {
        logger.error("Erreur lors du chargement du produit:", error)
        router.push("/admin/produits")
      } finally {
        setLoadingProduct(false)
      }
    }
    loadProduct()
  }, [productId, router])

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | string[]) => {
    setFormData((prev: ProductFormData) => ({ ...prev, [field]: value }))
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: "" }))
    }
  }

  const handleImageFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    e.target.value = ''
    setUploadImageLoading(true)
    setErrors((prev) => ({ ...prev, image_url: '' }))
    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      if (!csrfRes.ok) throw new Error('Token CSRF indisponible')
      const { csrfToken } = await csrfRes.json()
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken || '' },
        body: form,
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string; url?: string }
      if (!res.ok) {
        handleInputChange('image_url', '')
        const msg = [data.error, data.details].filter(Boolean).join(' — ') || "Échec de l'upload"
        setErrors((prev) => ({ ...prev, image_url: msg }))
        return
      }
      if (data.url) {
        handleInputChange('image_url', data.url)
      }
    } catch (err) {
      handleInputChange('image_url', '')
      setErrors((prev) => ({ ...prev, image_url: err instanceof Error ? err.message : "Erreur lors de l'upload" }))
    } finally {
      setUploadImageLoading(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    const newTags = formData.images.includes(tag)
      ? formData.images.filter((t: string) => t !== tag)
      : [...formData.images, tag]
    handleInputChange("images", newTags)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData['name'].trim()) newErrors['name'] = "Le nom est requis"
    if (!formData['description'].trim()) newErrors['description'] = "La description est requise"
    if (!formData['price'] || parseFloat(formData['price']) <= 0) newErrors['price'] = "Le prix doit être supérieur à 0"
    if (!formData['category_id']) newErrors['category_id'] = "La catégorie est requise"
    if (!formData['image_url'].trim()) newErrors['image_url'] = "L'URL de l'image est requise"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors((prev) => ({ ...prev, submit: '' }))
    try {
      // Récupérer le token CSRF (credentials pour envoi des cookies de session)
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      if (!csrfRes.ok) throw new Error('Impossible de récupérer le token CSRF')
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      const categoryIdToName: Record<string, string> = {
        "cat-bagues": "Bagues",
        "cat-colliers": "Colliers",
        "cat-bracelets": "Bracelets",
        "cat-boucles": "Boucles d'oreilles",
        "cat-broches": "Nos packs"
      }
      const categoryName = categoryIdToName[formData.category_id] || formData.category_id
      
      // Validation de la catégorie
      if (!categoryName || categoryName.trim() === '') {
        throw new Error("Catégorie invalide. Veuillez sélectionner une catégorie.")
      }
      
      // Filtrer et valider les images secondaires (URL ou chemins /images/…)
      const secondaryImages = [
        formData.imageSecondary1,
        formData.imageSecondary2,
        formData.imageSecondary3,
        formData.imageSecondary4,
        formData.imageSecondary5,
        formData.imageSecondary6,
      ]
        .filter((img) => img && img.trim() !== '' && (img.startsWith('http') || img.startsWith('/')))
        .slice(0, 6)
      
      // Préparer les données du produit
      // Accepter URL complète, chemin relatif ou chemin local (Windows/Unix)
      const rawImage = formData.image_url && formData.image_url.trim() !== '' 
        ? formData.image_url.trim().replace(/^["']|["']$/g, '') 
        : null
      
      if (!rawImage) {
        throw new Error("Une image principale est requise. Veuillez télécharger ou fournir une URL ou un chemin d'image.")
      }
      
      // Validation: accepter URL (http/https), chemin relatif (/...) ou chemin local (C:\, /Users/, /home/)
      const isHttpUrl = /^https?:\/\//i.test(rawImage)
      const isRelativePath = rawImage.startsWith('/')
      const isLocalPath = /^[A-Za-z]:[\\/]/.test(rawImage) || /^[\\/]/.test(rawImage) || rawImage.includes('\\') || /^\/Users\//.test(rawImage) || /^\/home\//.test(rawImage)
      if (!isHttpUrl && !isRelativePath && !isLocalPath) {
        try {
          new URL(rawImage)
        } catch {
          throw new Error("L'image doit être une URL (https://...), un chemin relatif (/images/...) ou un chemin local (C:\\... ou /Users/...).")
        }
      }
      const imageUrl = rawImage
      
      const productData = {
        name: formData.name.trim(),
        name_ar: formData.name_ar && formData.name_ar.trim() !== '' ? formData.name_ar.trim() : undefined,
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        original_price: formData.original_price && formData.original_price.trim() !== '' 
          ? parseFloat(formData.original_price) 
          : undefined,
        category: categoryName.trim(),
        stock: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_available !== undefined ? formData.is_available : true,
        image_url: imageUrl,
        main_image: imageUrl,
        images: secondaryImages.length > 0 ? secondaryImages : []
      }
      
      // Validation supplémentaire: original_price doit être > price si fourni
      if (productData.original_price && productData.original_price <= productData.price) {
        throw new Error("Le prix original doit être supérieur au prix actuel.")
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      })

      if (!res.ok) {
        let errorMessage = "Erreur lors de la modification"
        try {
          const err = await res.json()
          // Afficher les détails de validation si disponibles
          if (err.details && Array.isArray(err.details)) {
            errorMessage = `Données invalides:\n${err.details.join('\n')}`
          } else if (err.error) {
            errorMessage = err.error
          }
        } catch {
          // Si la réponse n'est pas du JSON, essayer de lire le texte
          try {
            const text = await res.text()
            if (text) {
              errorMessage = text
            }
          } catch {
            // Utiliser le message par défaut
          }
        }
        throw new Error(errorMessage)
      }

      router.refresh()
      router.push("/admin/produits?updated=1")
    } catch (error) {
      logger.error("Erreur lors de la modification:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Erreur lors de la modification" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce produit ?\n\nCette action est irréversible et supprimera définitivement le produit de la base de données.`)) {
      return
    }

    setLoading(true)
    try {
      // Vérifier que l'ID est valide
      if (!productId || productId === 'undefined' || productId === 'null') {
        throw new Error('ID produit invalide')
      }

      // Récupérer le token CSRF
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      if (!csrfRes.ok) {
        throw new Error('Impossible de récupérer le token CSRF')
      }
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      })

      let errorData: { error?: string; message?: string } = {}
      try {
        errorData = await res.json()
      } catch {
        const text = await res.text()
        errorData = { error: text || 'Erreur lors de la suppression' }
      }

      if (!res.ok) {
        if (res.status === 404) {
          // Produit déjà supprimé
          alert(`Le produit n'existe plus dans la base de données.`)
          router.push("/admin/produits")
          return
        } else if (res.status === 403) {
          throw new Error('Accès non autorisé. Vous devez être administrateur.')
        } else if (res.status === 503) {
          throw new Error('Base de données indisponible. Veuillez réessayer plus tard.')
        } else {
          throw new Error(errorData.error || errorData.message || `Erreur ${res.status}: Erreur lors de la suppression`)
        }
      }

      alert(`✅ Produit supprimé avec succès de la base de données.`)
      router.push("/admin/produits")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression"
      logger.error("Erreur lors de la suppression:", error)
      alert(`❌ ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement du produit...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <Link href="/admin/produits">
            <Button>Retour aux produits</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link 
            href="/admin/produits" 
            className="inline-flex items-center text-sm text-gray-600 mb-4 hover:text-orange-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux produits
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le produit</h1>
              <div className="text-gray-600 mt-2">Modifiez les informations de "{product?.['name'] || 'produit'}"</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                <Edit className="w-4 h-4 mr-1" />
                Modification
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulaire principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de base</CardTitle>
                  <CardDescription>
                    Nom, description et détails du produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        value={formData['name']}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}
                        placeholder="Ex: Bague Berbère Or 18K"
                        className={errors['name'] ? "border-red-500" : ""}
                      />
                      {errors['name'] && <div className="text-sm text-red-500 mt-1">{errors['name']}</div>}
                    </div>
                    
                    <div>
                      <Label htmlFor="name_ar">Nom en arabe</Label>
                      <Input
                        id="name_ar"
                        value={formData['name_ar']}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("name_ar", e.target.value)}
                        placeholder="Ex: خاتم بربري ذهب"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData['description']}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
                        placeholder="Décrivez le produit en détail..."
                        rows={4}
                        className={errors['description'] ? "border-red-500" : ""}
                      />
                    {errors['description'] && <div className="text-sm text-red-500 mt-1">{errors['description']}</div>}
                  </div>
                </CardContent>
              </Card>

              {/* Prix et stock */}
              <Card>
                <CardHeader>
                  <CardTitle>Prix et stock</CardTitle>
                  <CardDescription>
                    Définissez le prix et la quantité disponible
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Prix (MAD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData['price']}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("price", e.target.value)}
                        placeholder="2999.00"
                        className={errors['price'] ? "border-red-500" : ""}
                      />
                      {errors['price'] && <div className="text-sm text-red-500 mt-1">{errors['price']}</div>}
                    </div>
                    
                    <div>
                      <Label htmlFor="original_price">Prix original (MAD)</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("original_price", e.target.value)}
                        placeholder="3999.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stock_quantity">Stock</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("stock_quantity", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Catégorie et image */}
              <Card>
                <CardHeader>
                  <CardTitle>Catégorie et image</CardTitle>
                  <CardDescription>
                    Sélectionnez la catégorie et ajoutez une image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Catégorie *</Label>
                      <Select value={formData['category_id']} onValueChange={(value: string) => handleInputChange("category_id", value)}>
                        <SelectTrigger className={errors['category_id'] ? "border-red-500" : ""}>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors['category_id'] && <p className="text-sm text-red-500 mt-1">{errors['category_id']}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="pack">Pack (optionnel)</Label>
                      <Select value={formData.pack_id || "none"} onValueChange={(value: string) => handleInputChange("pack_id", value === "none" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun pack" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun pack</SelectItem>
                          <SelectItem value="pack-1">Pack Élégance Berbère</SelectItem>
                          <SelectItem value="pack-2">Pack Moderne Chic</SelectItem>
                          <SelectItem value="pack-3">Pack Mariée Royale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image_url">URL de l'image *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image_url"
                        value={formData['image_url']}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("image_url", e.target.value)}
                        placeholder="https://... ou C:\Users\...\image.jpg — ou cliquez sur l'icône pour envoyer un fichier"
                        className={errors['image_url'] ? "border-red-500" : ""}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        aria-hidden
                        onChange={handleImageFileSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Envoyer une image depuis votre ordinateur"
                        disabled={uploadImageLoading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadImageLoading ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {formData['image_url']?.trim() && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
                          <Image
                            src={getSafeImageSrc(formData['image_url'])}
                            alt="Aperçu"
                            fill
                            className="object-cover"
                            unoptimized={shouldUnoptimizePreview(formData['image_url'])}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-xs" title={formData['image_url']}>
                          {formData['image_url']}
                        </p>
                      </div>
                    )}
                    {errors['image_url'] && <p className="text-sm text-red-500 mt-1">{errors['image_url']}</p>}
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <Label>Images galerie (optionnel, max 6)</Label>
                    <p className="text-xs text-gray-500">URLs https ou chemins commençant par /images/</p>
                    {([
                      'imageSecondary1',
                      'imageSecondary2',
                      'imageSecondary3',
                      'imageSecondary4',
                      'imageSecondary5',
                      'imageSecondary6',
                    ] as const).map((field, idx) => (
                      <div key={field}>
                        <Label htmlFor={field} className="text-xs">Image {idx + 1}</Label>
                        <Input
                          id={field}
                          value={formData[field]}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(field, e.target.value)}
                          placeholder="https://... ou /images/..."
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panneau latéral */}
            <div className="space-y-6">
              {/* Statut et options */}
              <Card>
                <CardHeader>
                  <CardTitle>Statut et options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_available">Disponible</Label>
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked: boolean) => handleInputChange("is_available", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured">Produit vedette</Label>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked: boolean) => handleInputChange("is_featured", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_custom">Sur mesure</Label>
                    <Switch
                      id="is_custom"
                      checked={formData.is_custom}
                      onCheckedChange={(checked: boolean) => handleInputChange("is_custom", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Étiquettes */}
              <Card>
                <CardHeader>
                  <CardTitle>Étiquettes</CardTitle>
                  <CardDescription>
                    Ajoutez des étiquettes pour mettre en valeur le produit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableTags.map((tag: string) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={tag}
                          checked={formData.images.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={tag} className="capitalize">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.images.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="capitalize">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Avis et notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Avis et notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rating">Note (1-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("rating", e.target.value)}
                      />
                  </div>
                  
                  <div>
                    <Label htmlFor="reviews_count">Nombre d'avis</Label>
                      <Input
                        id="reviews_count"
                        type="number"
                        value={formData.reviews_count}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("reviews_count", e.target.value)}
                      />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {errors['submit'] && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors['submit']}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href="/admin/produits">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
