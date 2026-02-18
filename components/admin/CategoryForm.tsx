"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, X, Tag } from "lucide-react"
import { logger } from "@/lib/logger"

interface CategoryFormData {
  name: string
  name_ar: string
  description: string
  is_active: boolean
}

interface CategoryFormProps {
  category?: unknown
  onSave: (data: CategoryFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export default function CategoryForm({ category, onSave, onCancel, isEditing = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    name_ar: "",
    description: "",
    is_active: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category && isEditing) {
      const cat = category as { name?: string; name_ar?: string; description?: string; is_active?: boolean }
      setFormData({
        name: cat['name'] || "",
        name_ar: cat['name_ar'] || "",
        description: cat['description'] || "",
        is_active: cat['is_active'] ?? true
      })
    }
  }, [category, isEditing])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData['name'].trim()) {
      newErrors['name'] = "Le nom de la catégorie est requis"
    }

    if (!formData['description'].trim()) {
      newErrors['description'] = "La description est requise"
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

  const handleInputChange = (field: keyof CategoryFormData, value: unknown) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                value={formData['name']}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Bagues"
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
                placeholder="Ex: خواتم"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData['description']}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description de la catégorie..."
              rows={3}
              className={errors['description'] ? "border-red-500" : ""}
            />
            {errors['description'] && <p className="text-sm text-red-500">{errors['description']}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Catégorie active</Label>
                <p className="text-sm text-gray-500">La catégorie est visible sur le site</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
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