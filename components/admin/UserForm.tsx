"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, X, User, Lock, Phone } from "lucide-react"
import { logger } from "@/lib/logger"

interface UserFormData {
  phone: string
  first_name: string
  last_name: string
  role: 'user' | 'moderator' | 'admin'
  is_active: boolean
  password?: string
}

interface UserFormProps {
  user?: {
    phone?: string
    first_name?: string
    last_name?: string
    role?: 'user' | 'moderator' | 'admin'
    is_active?: boolean
  }
  onSave: (data: UserFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export default function UserForm({ user, onSave, onCancel, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    phone: "",
    first_name: "",
    last_name: "",
    role: "user",
    is_active: true,
    password: ""
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        phone: user.phone || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role || "user",
        is_active: user.is_active ?? true,
        password: "" // Ne pas pré-remplir le mot de passe
      })
    }
  }, [user, isEditing])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors['phone'] = "Le numéro de téléphone est requis"
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors['phone'] = "Format de téléphone invalide"
    }

    if (!formData.first_name.trim()) {
      newErrors['first_name'] = "Le prénom est requis"
    }

    if (!formData.last_name.trim()) {
      newErrors['last_name'] = "Le nom est requis"
    }

    if (!isEditing && !formData.password) {
      newErrors['password'] = "Le mot de passe est requis pour un nouvel utilisateur"
    } else if (formData.password && formData.password.length < 6) {
      newErrors['password'] = "Le mot de passe doit contenir au moins 6 caractères"
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
      // Si on édite et qu'aucun mot de passe n'est fourni, on ne l'inclut pas
      const dataToSave = { ...formData }
      if (isEditing && !formData.password) {
        delete dataToSave.password
      }
      
      await onSave(dataToSave)
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: unknown) => {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return "👑 Administrateur"
      case 'moderator':
        return "🛡️ Modérateur"
      default:
        return "👤 Utilisateur"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Ex: Ahmed"
                className={errors['first_name'] ? "border-red-500" : ""}
              />
              {errors['first_name'] && <div className="text-sm text-red-500">{errors['first_name']}</div>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Ex: Alami"
                className={errors['last_name'] ? "border-red-500" : ""}
              />
              {errors['last_name'] && <div className="text-sm text-red-500">{errors['last_name']}</div>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Ex: 0612345678"
                className={`pl-10 ${errors['phone'] ? "border-red-500" : ""}`}
              />
            </div>
            {errors['phone'] && <div className="text-sm text-red-500">{errors['phone']}</div>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Mot de passe {isEditing ? "(optionnel)" : "*"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Mot de passe"}
                className={`pl-10 ${errors['password'] ? "border-red-500" : ""}`}
              />
            </div>
            {errors['password'] && <div className="text-sm text-red-500">{errors['password']}</div>}
            {isEditing && (
              <p className="text-sm text-gray-500">
                Laissez vide pour conserver le mot de passe actuel
              </p>
            )}
          </div>

          {/* Rôle et statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'user' | 'moderator' | 'admin') => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">👤 Utilisateur</SelectItem>
                  <SelectItem value="moderator">🛡️ Modérateur</SelectItem>
                  <SelectItem value="admin">👑 Administrateur</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Rôle sélectionné : {getRoleBadge(formData.role)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Statut du compte</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Compte actif</Label>
                  <p className="text-sm text-gray-500">L'utilisateur peut se connecter</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>
            </div>
          </div>

          {/* Informations sur les rôles */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Description des rôles :</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>👤 Utilisateur :</strong> Peut voir et acheter des produits</li>
              <li><strong>🛡️ Modérateur :</strong> Peut gérer les produits et catégories</li>
              <li><strong>👑 Administrateur :</strong> Accès complet à toutes les fonctionnalités</li>
            </ul>
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
