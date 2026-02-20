"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Package, Search, RefreshCw, Plus, Edit, Trash2, Eye, Star, CheckCircle2, Image as ImageIcon, Upload } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface Pack {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  image_url?: string
  is_featured: boolean
  created_at: string
}

export default function AdminPacksManagement() {
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputPackRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    image_url: "",
    is_featured: false
  })

  const fetchPacks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/packs', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/profile')
          return
        }
        throw new Error('Erreur lors du chargement')
      }
      const data = await res.json()
      const packsList = data.packs || []
      logger.info(`📦 Packs chargés: ${packsList.length} pack(s)`)
      setPacks(packsList)
    } catch (error) {
      logger.error("Erreur lors du chargement des packs:", error)
      alert("Erreur lors du chargement des packs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacks()
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const filteredPacks = packs.filter(pack =>
    pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreatePack = () => {
    setEditingPack(null)
    setUploadError(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      image_url: "",
      is_featured: false
    })
    setShowForm(true)
  }

  const handlePackImageUploadClick = () => {
    setUploadError(null)
    fileInputPackRef.current?.click()
  }

  const handlePackFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    const productName = formData.name.trim() || formData.slug.trim() || `pack-${Date.now()}`
    const categoryId = "cat-broches"

    setUploadingImage(true)
    setUploadError(null)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("productName", productName)
      formDataUpload.append("categoryId", categoryId)
      formDataUpload.append("imageType", "main")

      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formDataUpload
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload")

      const imageUrl = data.imageUrl as string
      setFormData(prev => ({ ...prev, image_url: imageUrl }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditPack = (pack: Pack) => {
    setEditingPack(pack)
    setUploadError(null)
    setFormData({
      name: pack.name,
      slug: pack.slug,
      description: pack.description || "",
      price: pack.price.toString(),
      image_url: pack.image_url || "",
      is_featured: pack.is_featured
    })
    setShowForm(true)
  }

  const handleSavePack = async () => {
    if (!formData.name || !formData.slug || !formData.price) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (parseFloat(formData.price) <= 0) {
      alert("Le prix doit être supérieur à 0")
      return
    }

    setFormLoading(true)
    try {
      // Récupérer le token CSRF
      const csrfRes = await fetch('/api/csrf-token')
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      const url = editingPack
        ? `/api/admin/packs/${editingPack.id}`
        : '/api/admin/packs'
      
      const method = editingPack ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || null,
          price: parseFloat(formData.price),
          image_url: formData.image_url || null,
          is_featured: formData.is_featured
        })
      })

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/profile')
          return
        }
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      await fetchPacks()
      setShowForm(false)
      setEditingPack(null)
      setFormData({
        name: "",
        slug: "",
        description: "",
        price: "",
        image_url: "",
        is_featured: false
      })
    } catch (error: unknown) {
      logger.error("Erreur lors de la sauvegarde:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde du pack"
      alert(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeletePack = async (packId: string) => {
    try {
      // Récupérer le token CSRF
      const csrfRes = await fetch('/api/csrf-token')
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      const res = await fetch(`/api/admin/packs/${packId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      })

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/profile')
          return
        }
        throw new Error('Erreur lors de la suppression')
      }

      await fetchPacks()
    } catch (error) {
      logger.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression du pack")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Chargement des packs...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et bouton d'ajout */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Packs ({packs.length})
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un pack..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={fetchPacks} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Link href="/packs" target="_blank">
                <Button variant="outline" size="sm" className="bg-orange-50 hover:bg-orange-100 border-orange-300">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir page publique
                </Button>
              </Link>
              <Link href="/admin/packs/verify">
                <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-300">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Vérifier les packs
                </Button>
              </Link>
              <Link href="/admin/packs/initialize">
                <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-300">
                  <Package className="w-4 h-4 mr-2" />
                  Initialiser
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-purple-50 hover:bg-purple-100 border-purple-300"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/packs/test')
                    const data = await res.json()
                    alert(`Test: ${data.message}\n\nVia Adapter: ${data.viaAdapter} packs\nVia SQLite: ${data.viaSQLite} packs\nCount: ${data.count}`)
                    console.log('Test packs:', data)
                  } catch (error) {
                    alert('Erreur lors du test')
                    console.error(error)
                  }
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Test DB
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreatePack} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Pack
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPack ? 'Modifier le pack' : 'Créer un nouveau pack'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (!editingPack) {
                            setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                          }
                        }}
                        placeholder="Ex: Pack Premium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Slug *</label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="pack-premium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border rounded-md min-h-[100px]"
                        placeholder="Description du pack..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Prix (MAD) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="299.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">URL de l'image</label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="/images/packs/pack-premium.jpg ou cliquer sur Uploader"
                          className="flex-1"
                        />
                        <input
                          ref={fileInputPackRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handlePackFileUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePackImageUploadClick}
                          disabled={uploadingImage}
                          title="Uploader une image"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              Uploader
                            </>
                          )}
                        </Button>
                      </div>
                      {formData.image_url && (
                        <div className="mt-2 flex items-center gap-3">
                          <Image
                            src={formData.image_url}
                            alt="Aperçu"
                            width={56}
                            height={56}
                            className="h-14 w-14 object-cover rounded border"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                          />
                          <p className="text-xs text-gray-500 truncate flex-1" title={formData.image_url}>
                            {formData.image_url}
                          </p>
                        </div>
                      )}
                      {uploadError && (
                        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="is_featured" className="text-sm font-medium">
                        Pack mis en avant
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowForm(false)
                          setEditingPack(null)
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSavePack}
                        disabled={formLoading || uploadingImage}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {formLoading ? "Enregistrement..." : uploadingImage ? "Upload en cours..." : editingPack ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des packs */}
      {filteredPacks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Aucun pack trouvé' : 'Aucun pack pour le moment'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreatePack} className="mt-4 bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer le premier pack
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack) => (
            <Card key={pack.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {pack.image_url ? (
                <div className="aspect-video bg-gray-200 relative">
                  <Image
                    src={pack.image_url}
                    alt={pack.name || 'Pack'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => {
                      // Gestion d'erreur gérée par Next.js Image
                    }}
                  />
                  {pack.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-orange-600">
                      <Star className="w-3 h-3 mr-1" />
                      Mis en avant
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Aucune image</p>
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{pack.name}</CardTitle>
                <p className="text-sm text-gray-500">Slug: {pack.slug}</p>
              </CardHeader>
              <CardContent>
                {pack.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {pack.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(pack.price)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(pack.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPack(pack)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le pack ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer le pack "{pack.name}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePack(pack.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

