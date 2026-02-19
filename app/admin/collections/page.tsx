"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Package } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface CollectionFormData {
  name: string
  name_ar: string
  description: string
  price: string
  original_price: string
  image_url: string
  is_featured: boolean
}

const initialFormData: CollectionFormData = {
  name: "",
  name_ar: "",
  description: "",
  price: "",
  original_price: "",
  image_url: "",
  is_featured: false
}

export default function NouvelleCollectionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CollectionFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof CollectionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData['name'].trim()) newErrors['name'] = "Le nom est requis"
    if (!formData['description'].trim()) newErrors['description'] = "La description est requise"
    if (!formData['price'] || parseFloat(formData['price']) <= 0) newErrors['price'] = "Le prix doit être supérieur à 0"
    if (!formData['image_url'].trim()) newErrors['image_url'] = "L'URL de l'image est requise"

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
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          name_ar: formData.name_ar || null,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          category: 'Bagues',
          stock: 1,
          is_active: true,
          main_image: formData.image_url,
          image_url: formData.image_url,
          images: []
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Erreur ${response.status}`)
      }
      
      router.push("/admin/collections")
    } catch (error) {
      logger.error("Erreur lors de la création:", error)
      setErrors(prev => ({ ...prev, _form: error instanceof Error ? error.message : 'Erreur lors de la création' }))
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
            href="/admin" 
            className="inline-flex items-center text-sm text-gray-600 mb-4 hover:text-orange-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à l&apos;administration
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouvelle Collection</h1>
              <div className="text-gray-600 mt-2">Créez une nouvelle collection de bijoux</div>
            </div>
            <div className="flex items-center gap-2 text-orange-600">
              <Package className="w-6 h-6" />
              <span className="font-semibold">Collection</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors['_form'] && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{errors['_form']}</div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Informations de la collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la collection *</Label>
                  <Input
                    id="name"
                    value={formData['name']}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Collection Berbère Premium"
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
                    placeholder="Ex: مجموعة بربرية فاخرة"
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
                  placeholder="Décrivez la collection en détail..."
                  rows={4}
                  className={errors['description'] ? "border-red-500" : ""}
                />
                {errors['description'] && <p className="text-sm text-red-500 mt-1">{errors['description']}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="image_url">URL de l&apos;image *</Label>
                <Input
                  id="image_url"
                  value={formData['image_url']}
                  onChange={(e) => handleInputChange("image_url", e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... ou /images/collections/image.jpg"
                  className={errors['image_url'] ? "border-red-500" : ""}
                />
                {errors['image_url'] && <p className="text-sm text-red-500 mt-1">{errors['image_url']}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange("is_featured", e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_featured">Collection vedette (mise en avant)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href="/admin">
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
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer la collection
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

