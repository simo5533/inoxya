"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X, Package } from "lucide-react"
import { logger } from "@/lib/logger"

interface ProductFormData {
  name: string
  name_ar: string
  description: string
  price: number
  original_price: number
  category_id: string
  image_url: string
  stock_quantity: number
  is_available: boolean
  is_featured: boolean
  is_custom: boolean
}

interface ProductFormProps {
  product?: {
    name?: string
    name_ar?: string
    description?: string
    price?: number
    original_price?: number
    category_id?: string
    image_url?: string
    stock_quantity?: number
    is_available?: boolean
    is_featured?: boolean
    is_custom?: boolean
  }
  onSave: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export default function ProductForm({ product, onSave, onCancel, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_ar: "",
    description: "",
    price: 0,
    original_price: 0,
    category_id: "",
    image_url: "",
    stock_quantity: 0,
    is_available: true,
    is_featured: false,
    is_custom: false
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name || "",
        name_ar: product.name_ar || "",
        description: product.description || "",
        price: product.price || 0,
        original_price: product.original_price || 0,
        category_id: product.category_id || "",
        image_url: product.image_url || "",
        stock_quantity: product.stock_quantity || 0,
        is_available: product.is_available ?? true,
        is_featured: product.is_featured ?? false,
        is_custom: product.is_custom ?? false
      })
    }
  }, [product, isEditing])

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

    if (formData.stock_quantity < 0) {
      newErrors['stock_quantity'] = "Le stock ne peut pas être négatif"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {isEditing ? "Modifier le produit" : "Nouveau produit"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Bague en or"
                className={errors['name'] ? "border-red-500" : ""}
              />
              {errors['name'] && <p className="text-sm text-red-500">{errors['name']}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_ar">Nom en arabe</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => handleInputChange("name_ar", e.target.value)}
                placeholder="Ex: خاتم ذهبي"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description du produit..."
              rows={3}
              className={errors['description'] ? "border-red-500" : ""}
            />
            {errors['description'] && <p className="text-sm text-red-500">{errors['description']}</p>}
          </div>

          {/* Prix et stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (MAD) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
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
                onChange={(e) => handleInputChange("original_price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock *</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange("stock_quantity", parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors['stock_quantity'] ? "border-red-500" : ""}
              />
              {errors['stock_quantity'] && <p className="text-sm text-red-500">{errors['stock_quantity']}</p>}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit disponible</Label>
                <p className="text-sm text-gray-500">Le produit est visible et peut être commandé</p>
              </div>
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => handleInputChange("is_available", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit en vedette</Label>
                <p className="text-sm text-gray-500">Afficher le produit en page d'accueil</p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit personnalisé</Label>
                <p className="text-sm text-gray-500">Le produit peut être personnalisé</p>
              </div>
              <Switch
                checked={formData.is_custom}
                onCheckedChange={(checked) => handleInputChange("is_custom", checked)}
              />
            </div>
          </div>

          {/* Actions */}
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
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
