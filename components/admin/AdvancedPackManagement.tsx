"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Package, Star, Users, TrendingUp } from 'lucide-react'
import { logger } from '@/lib/logger'

interface PackItem {
  id: string
  bijou_id: string
  bijou_name: string
  bijou_price: number
  quantity: number
  is_required: boolean
  is_customizable: boolean
}

interface AdvancedPack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price?: number
  image_url: string
  images: string[]
  category: string
  tags: string[]
  is_featured: boolean
  is_active: boolean
  stock_quantity: number
  min_items: number
  max_items: number
  discount: {
    type: 'percentage' | 'fixed' | 'bundle'
    value: number
  }
  composition: PackItem[]
  rating: number
  reviews_count: number
  created_at: string
  updated_at: string
}

export default function AdvancedPackManagement() {
  const [packs, setPacks] = useState<AdvancedPack[]>([])
  const [selectedPack, setSelectedPack] = useState<AdvancedPack | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    original_price: 0,
    image_url: '',
    category: 'general',
    tags: [] as string[],
    is_featured: false,
    is_active: true,
    stock_quantity: 100,
    min_items: 1,
    max_items: 5,
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'bundle',
    discount_value: 0
  })

  // Charger les packs
  useEffect(() => {
    loadPacks()
  }, [])

  const loadPacks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/packs')
      if (response.ok) {
        const data = await response.json()
        setPacks(data)
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des packs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePack = async () => {
    try {
      const response = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadPacks()
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      logger.error('Erreur lors de la création du pack:', error)
    }
  }

  const handleUpdatePack = async () => {
    if (!selectedPack) return

    try {
      const response = await fetch(`/api/packs/${selectedPack.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadPacks()
        setIsEditDialogOpen(false)
        setSelectedPack(null)
        resetForm()
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du pack:', error)
    }
  }

  const handleDeletePack = async (packId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack ?')) return

    try {
      const response = await fetch(`/api/packs/${packId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPacks()
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression du pack:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      original_price: 0,
      image_url: '',
      category: 'general',
      tags: [],
      is_featured: false,
      is_active: true,
      stock_quantity: 100,
      min_items: 1,
      max_items: 5,
      discount_type: 'percentage',
      discount_value: 0
    })
  }

  const openEditDialog = (pack: AdvancedPack) => {
    setSelectedPack(pack)
    setFormData({
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      price: pack.price,
      original_price: pack.original_price || 0,
      image_url: pack.image_url,
      category: pack.category,
      tags: pack.tags,
      is_featured: pack.is_featured,
      is_active: pack.is_active,
      stock_quantity: pack.stock_quantity,
      min_items: pack.min_items,
      max_items: pack.max_items,
      discount_type: pack.discount.type,
      discount_value: pack.discount.value
    })
    setIsEditDialogOpen(true)
  }

  // Filtrer les packs
  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pack.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || pack.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Statistiques
  const stats = {
    total: packs.length,
    active: packs.filter(p => p.is_active).length,
    featured: packs.filter(p => p.is_featured).length,
    totalStock: packs.reduce((sum, p) => sum + p.stock_quantity, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des packs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion Avancée des Packs</h2>
          <p className="text-gray-600">Créez et gérez vos packs de bijoux avec des fonctionnalités avancées</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Pack</DialogTitle>
            </DialogHeader>
            <PackForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleCreatePack}
              submitLabel="Créer le Pack"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Packs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Vedettes</p>
                <p className="text-2xl font-bold">{stats.featured}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold">{stats.totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou description du pack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="traditionnel">Traditionnel</SelectItem>
                  <SelectItem value="moderne">Moderne</SelectItem>
                  <SelectItem value="mariage">Mariage</SelectItem>
                  <SelectItem value="quotidien">Quotidien</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des packs */}
      <Card>
        <CardHeader>
          <CardTitle>Packs ({filteredPacks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pack</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacks.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pack.name}</p>
                      <p className="text-sm text-gray-600">{pack.composition.length} articles</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{pack.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pack.price} MAD</p>
                      {pack.original_price && (
                        <p className="text-sm text-gray-500 line-through">{pack.original_price} MAD</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{pack.stock_quantity}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {pack.is_featured && <Badge className="bg-yellow-100 text-yellow-800">Vedette</Badge>}
                      {pack.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(pack)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeletePack(pack.id)}>
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

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le Pack</DialogTitle>
          </DialogHeader>
          <PackForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleUpdatePack}
            submitLabel="Mettre à jour"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Type pour le formulaire de pack
type PackFormData = {
  name: string
  slug: string
  description: string
  price: number
  original_price: number
  image_url: string
  category: string
  tags: string[]
  is_featured: boolean
  is_active: boolean
  stock_quantity: number
  min_items: number
  max_items: number
  discount_type: 'percentage' | 'fixed' | 'bundle'
  discount_value: number
}

// Composant de formulaire pour les packs
function PackForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitLabel 
}: {
  formData: PackFormData
  setFormData: React.Dispatch<React.SetStateAction<PackFormData>>
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="pricing">Prix & Remises</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du pack</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Pack Élégance Berbère"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="pack-elegance-berbere"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du pack..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image_url">URL de l'image</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="/images/packs/pack-elegance-berbere/main.jpg"
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traditionnel">Traditionnel</SelectItem>
                <SelectItem value="moderne">Moderne</SelectItem>
                <SelectItem value="mariage">Mariage</SelectItem>
                <SelectItem value="quotidien">Quotidien</SelectItem>
                <SelectItem value="soiree">Soirée</SelectItem>
                <SelectItem value="romantique">Romantique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Prix (MAD)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="1599.00"
              />
            </div>
            <div>
              <Label htmlFor="original_price">Prix original (MAD)</Label>
              <Input
                id="original_price"
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                placeholder="1999.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_type">Type de remise</Label>
              <Select value={formData.discount_type} onValueChange={(value) => {
                if (value === 'fixed' || value === 'percentage' || value === 'bundle') {
                  setFormData({ ...formData, discount_type: value })
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="fixed">Montant fixe</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount_value">Valeur de la remise</Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                placeholder={formData.discount_type === 'percentage' ? '20' : '200'}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock_quantity">Stock</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="min_items">Min articles</Label>
              <Input
                id="min_items"
                type="number"
                value={formData.min_items}
                onChange={(e) => setFormData({ ...formData, min_items: parseInt(e.target.value) || 1 })}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="max_items">Max articles</Label>
              <Input
                id="max_items"
                type="number"
                value={formData.max_items}
                onChange={(e) => setFormData({ ...formData, max_items: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Pack vedette</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Actif</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button onClick={onSubmit} className="bg-orange-500 hover:bg-orange-600">
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
