"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, Plus, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { logger } from "@/lib/logger"

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

const initialFormData: ProductFormData = {
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
}

const categories = [
  { id: "cat-bagues", name: "Bagues", slug: "bagues" },
  { id: "cat-colliers", name: "Colliers", slug: "colliers" },
  { id: "cat-bracelets", name: "Bracelets", slug: "bracelets" },
  { id: "cat-boucles", name: "Boucles d&apos;oreilles", slug: "boucles-oreilles" },
  { id: "cat-broches", name: "Nos packs", slug: "broches" }
]

const availableTags = ["promo", "nouveau", "bestseller", "premium"]

type UploadTarget = 'main' | 'secondary1' | 'secondary2' | 'secondary3' | 'secondary4' | 'secondary5' | 'secondary6'

export default function NouveauProduitPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<UploadTarget | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const fileInputMainRef = useRef<HTMLInputElement>(null)
  const fileInputSecondary1Ref = useRef<HTMLInputElement>(null)
  const fileInputSecondary2Ref = useRef<HTMLInputElement>(null)
  const fileInputSecondary3Ref = useRef<HTMLInputElement>(null)
  const fileInputSecondary4Ref = useRef<HTMLInputElement>(null)
  const fileInputSecondary5Ref = useRef<HTMLInputElement>(null)
  const fileInputSecondary6Ref = useRef<HTMLInputElement>(null)
  const tempProductSlugRef = useRef<string | null>(null)

  useEffect(() => {
    fetch('/api/csrf-token', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { csrfToken?: string }) => setCsrfToken(d.csrfToken ?? null))
      .catch(() => {})
  }, [])

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleTagToggle = (tag: string) => {
    const newTags = formData.images.includes(tag)
      ? formData.images.filter(t => t !== tag)
      : [...formData.images, tag]
    handleInputChange("images", newTags)
  }

  const handleUploadClick = (target: UploadTarget) => {
    setUploadError(null)
    if (target === 'main') fileInputMainRef.current?.click()
    else if (target === 'secondary1') fileInputSecondary1Ref.current?.click()
    else fileInputSecondary2Ref.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const productName = formData.name.trim() || (tempProductSlugRef.current ??= `produit-${Date.now()}`)
    const categoryId = formData.category_id || 'cat-bagues'

    setUploadingImage(target)
    setUploadError(null)
    try {
      let token = csrfToken
      if (!token) {
        const tr = await fetch('/api/csrf-token', { credentials: 'include' })
        const td = tr.ok ? await tr.json() : {}
        token = td.csrfToken ?? ''
        if (token) setCsrfToken(token)
      }
      if (!token) {
        setUploadError('Token CSRF invalide ou manquant')
        setUploadingImage(null)
        return
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('productName', productName)
      formDataUpload.append('categoryId', categoryId)
      if (target === 'main') {
        formDataUpload.append('imageType', 'main')
      } else {
        formDataUpload.append('imageType', 'gallery')
        const idx =
          target === 'secondary1' ? 0 :
          target === 'secondary2' ? 1 :
          target === 'secondary3' ? 2 :
          target === 'secondary4' ? 3 :
          target === 'secondary5' ? 4 : 5
        formDataUpload.append('galleryIndex', String(idx))
      }

      const res = await fetch('/api/upload/product-image', {
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
        credentials: 'include',
        body: formDataUpload
      })

      const text = await res.text()
      let data: { imageUrl?: string; error?: string; details?: string }
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { error: res.ok ? 'Réponse invalide' : (text || 'Erreur lors de l\'upload') }
      }
      if (!res.ok) {
        const isHtml = text.trim().startsWith('<!') || text.includes('<!DOCTYPE')
        const fromApi = [data.details, data.error].filter(Boolean).join(' — ')
        const msg =
          fromApi ||
          (isHtml
            ? "Réponse serveur invalide (page d'erreur HTML). Ouvrez F12 → Réseau → product-image, ou consultez les logs Vercel."
            : text || "Erreur lors de l'upload")
        throw new Error(msg)
      }

      const imageUrl = data.imageUrl as string
      if (target === 'main') handleInputChange('image_url', imageUrl)
      else if (target === 'secondary1') handleInputChange('imageSecondary1', imageUrl)
      else handleInputChange('imageSecondary2', imageUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploadingImage(null)
    }
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

  const categoryIdToName: Record<string, string> = {
    "cat-bagues": "Bagues",
    "cat-colliers": "Colliers",
    "cat-bracelets": "Bracelets",
    "cat-boucles": "Boucles d'oreilles",
    "cat-broches": "Nos packs"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Récupérer le token CSRF
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
      const csrfText = await csrfRes.text()
      let csrfData: { csrfToken?: string } = {}
      try {
        csrfData = csrfText ? JSON.parse(csrfText) : {}
      } catch {
        csrfData = {}
      }
      const csrfToken = csrfData.csrfToken
      if (!csrfToken) {
        throw new Error("Token CSRF manquant. Rechargez la page et réessayez.")
      }
      const categoryName = categoryIdToName[formData.category_id] || formData.category_id
      
      // Validation de la catégorie
      if (!categoryName || categoryName.trim() === '') {
        throw new Error("Catégorie invalide. Veuillez sélectionner une catégorie.")
      }
      
      // Filtrer et valider les images secondaires (URL https ou chemins /images/…)
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
      // IMPORTANT: image_url doit être une URL valide ou null/undefined (pas une chaîne vide)
      const imageUrl = formData.image_url && formData.image_url.trim() !== '' 
        ? formData.image_url.trim() 
        : null
      
      // Validation: au moins une image principale est requise
      if (!imageUrl) {
        throw new Error("Une image principale est requise. Veuillez utiliser le bouton 'Upload' (📤) pour télécharger une image depuis votre ordinateur.")
      }
      
      // Vérifier si c'est un chemin local Windows/Linux (C:\... ou /home/... ou /Users/...)
      if (imageUrl.includes('\\') || imageUrl.match(/^[A-Z]:\\/) || imageUrl.match(/^\/home\//) || imageUrl.match(/^\/Users\//)) {
        // C'est un chemin de fichier local, pas une URL web
        throw new Error("Les chemins de fichiers locaux ne sont pas acceptés. Veuillez utiliser le bouton 'Upload' (📤) pour télécharger l'image depuis votre ordinateur.")
      }
      
      // Accepter les chemins relatifs Next.js (commençant par /images/ ou /)
      const isRelativePath = imageUrl.startsWith('/images/') || (imageUrl.startsWith('/') && !imageUrl.startsWith('//'))
      
      // Accepter les URLs web complètes (http:// ou https://)
      const isWebUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
      
      // Si ce n'est ni un chemin relatif Next.js ni une URL web, c'est invalide
      if (!isRelativePath && !isWebUrl) {
        throw new Error("Format d'image invalide. Veuillez utiliser le bouton 'Upload' (📤) pour télécharger une image depuis votre ordinateur, ou fournir une URL web complète (ex: https://example.com/image.jpg) ou un chemin relatif (ex: /images/products/image.jpg).")
      }
      
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

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      })

      if (!res.ok) {
        const responseText = await res.text()
        let errorMessage = "Erreur lors de la création"
        try {
          const err = responseText ? JSON.parse(responseText) : {}
          if (err.details && Array.isArray(err.details)) {
            errorMessage = `Données invalides:\n${err.details.join('\n')}`
          } else if (err.error) {
            errorMessage = err.error
          } else if (responseText) {
            errorMessage = responseText
          }
        } catch {
          if (responseText) errorMessage = responseText
        }
        throw new Error(errorMessage)
      }

      router.push("/admin/produits?created=1")
    } catch (error) {
      logger.error("Erreur lors de la création:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Erreur lors de la création" })
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Nouveau Produit</h1>
              <div className="text-gray-600 mt-2">Créez un nouveau bijou pour votre collection</div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Plus className="w-4 h-4 mr-1" />
              Création
            </Badge>
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
                        onChange={(e) => handleInputChange("name", e.target.value)}
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
                        onChange={(e) => handleInputChange("name_ar", e.target.value)}
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
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Décrivez le produit en détail..."
                      rows={4}
                      className={errors['description'] ? "border-red-500" : ""}
                    />
                    {errors['description'] && <p className="text-sm text-red-500 mt-1">{errors['description']}</p>}
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
                        onChange={(e) => handleInputChange("price", e.target.value)}
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
                        onChange={(e) => handleInputChange("original_price", e.target.value)}
                        placeholder="3999.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stock_quantity">Stock</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
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
                      <Select value={formData['category_id']} onValueChange={(value) => handleInputChange("category_id", value)}>
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
                      {errors['category_id'] && <div className="text-sm text-red-500 mt-1">{errors['category_id']}</div>}
                    </div>
                    
                    <div>
                      <Label htmlFor="pack">Pack (optionnel)</Label>
                      <Select value={formData.pack_id || "none"} onValueChange={(value) => handleInputChange("pack_id", value === "none" ? "" : value)}>
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
                    <Label htmlFor="image_url">Image principale *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="image_url"
                          value={formData['image_url']}
                          onChange={(e) => handleInputChange("image_url", e.target.value)}
                          placeholder="Cliquez sur 📤 pour uploader depuis votre ordinateur"
                          className={errors['image_url'] ? "border-red-500" : ""}
                        />
                        <input
                          ref={fileInputMainRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'main')}
                        />
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          onClick={() => handleUploadClick('main')}
                          disabled={!!uploadingImage}
                          title="Télécharger une image depuis votre ordinateur"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {uploadingImage === 'main' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                        💡 <strong>Recommandé:</strong> Utilisez le bouton <strong className="text-orange-600">📤 Upload</strong> pour télécharger une image depuis votre ordinateur. 
                        Vous pouvez aussi coller une URL web (https://...).
                      </p>
                    {formData.image_url && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="relative h-20 w-20">
                            <Image 
                              src={formData.image_url} 
                              alt="Aperçu" 
                              fill
                              className="object-cover rounded border-2 border-green-300" 
                              onError={() => {
                                // Error handled by Next.js Image component
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-800 mb-1">✅ Image principale définie</p>
                            <p className="text-xs text-gray-600 truncate" title={formData.image_url}>{formData.image_url}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        ⚠️ {uploadError}
                      </div>
                    )}
                    {errors['image_url'] && <p className="text-sm text-red-500 mt-1">{errors['image_url']}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageSecondary1">Image secondaire 1</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageSecondary1"
                        value={formData.imageSecondary1}
                        onChange={(e) => handleInputChange("imageSecondary1", e.target.value)}
                        placeholder="URL ou cliquer sur le bouton pour uploader"
                      />
                      <input
                        ref={fileInputSecondary1Ref}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'secondary1')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleUploadClick('secondary1')}
                        disabled={!!uploadingImage}
                        title="Upload image secondaire 1"
                      >
                        {uploadingImage === 'secondary1' ? (
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {formData.imageSecondary1 && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-16 w-16">
                          <Image src={formData.imageSecondary1} alt="Aperçu 1" fill className="object-cover rounded border" />
                        </div>
                        <p className="text-xs text-gray-500 truncate flex-1" title={formData.imageSecondary1}>{formData.imageSecondary1}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="imageSecondary2">Image secondaire 2</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageSecondary2"
                        value={formData.imageSecondary2}
                        onChange={(e) => handleInputChange("imageSecondary2", e.target.value)}
                        placeholder="URL ou cliquer sur le bouton pour uploader"
                      />
                      <input
                        ref={fileInputSecondary2Ref}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'secondary2')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleUploadClick('secondary2')}
                        disabled={!!uploadingImage}
                        title="Upload image secondaire 2"
                      >
                        {uploadingImage === 'secondary2' ? (
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {formData.imageSecondary2 && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-16 w-16">
                          <Image src={formData.imageSecondary2} alt="Aperçu 2" fill className="object-cover rounded border" />
                        </div>
                        <p className="text-xs text-gray-500 truncate flex-1" title={formData.imageSecondary2}>{formData.imageSecondary2}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">Images secondaires 3 à 6 (optionnel, galerie produit — max 6 au total)</p>
                  {([
                    { n: 3, key: 'imageSecondary3' as const, ref: fileInputSecondary3Ref, ut: 'secondary3' as const },
                    { n: 4, key: 'imageSecondary4' as const, ref: fileInputSecondary4Ref, ut: 'secondary4' as const },
                    { n: 5, key: 'imageSecondary5' as const, ref: fileInputSecondary5Ref, ut: 'secondary5' as const },
                    { n: 6, key: 'imageSecondary6' as const, ref: fileInputSecondary6Ref, ut: 'secondary6' as const },
                  ] as const).map(({ n, key, ref, ut }) => (
                    <div key={key}>
                      <Label htmlFor={key}>Image secondaire {n}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          placeholder="URL ou cliquer sur le bouton pour uploader"
                        />
                        <input
                          ref={ref}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, ut)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleUploadClick(ut)}
                          disabled={!!uploadingImage}
                          title={`Upload image secondaire ${n}`}
                        >
                          {uploadingImage === ut ? (
                            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {formData[key] && (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="relative h-16 w-16">
                            <Image src={formData[key]} alt={`Aperçu ${n}`} fill className="object-cover rounded border" />
                          </div>
                          <p className="text-xs text-gray-500 truncate flex-1" title={formData[key]}>{formData[key]}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}
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
                      onCheckedChange={(checked) => handleInputChange("is_available", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured">Produit vedette</Label>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_custom">Sur mesure</Label>
                    <Switch
                      id="is_custom"
                      checked={formData.is_custom}
                      onCheckedChange={(checked) => handleInputChange("is_custom", checked)}
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
                    {availableTags.map((tag) => (
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
                      {formData.images.map((tag) => (
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
                      onChange={(e) => handleInputChange("rating", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reviews_count">Nombre d&apos;avis</Label>
                    <Input
                      id="reviews_count"
                      type="number"
                      value={formData.reviews_count}
                      onChange={(e) => handleInputChange("reviews_count", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Erreur globale */}
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
              disabled={loading || !!uploadingImage}
              className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer le produit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
