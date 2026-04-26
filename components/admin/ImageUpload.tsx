"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  productId?: string
  productName?: string
  categoryId?: string
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  productId,
  productName,
  categoryId
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  // uploadProgress utilisé pour suivre le progrès d'upload (via setUploadProgress)
  const [, setUploadProgress] = useState<Record<number, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const remainingSlots = maxImages - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxImages} images autorisées`,
        variant: "destructive"
      })
      return
    }

    // Si on a les infos du produit, uploader réellement
    if (productId && productName && categoryId) {
      setUploading(true)
      const uploadedUrls: string[] = []

      // Récupérer le token CSRF pour l'upload
      let csrfToken = ''
      try {
        const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
        const csrfData = csrfRes.ok ? await csrfRes.json() : {}
        csrfToken = csrfData.csrfToken ?? ''
      } catch {
        toast({
          title: "Erreur",
          description: "Token CSRF indisponible",
          variant: "destructive"
        })
        setUploading(false)
        return
      }
      if (!csrfToken) {
        toast({
          title: "Erreur",
          description: "Token CSRF invalide ou manquant",
          variant: "destructive"
        })
        setUploading(false)
        return
      }

      // Filtrer les fichiers valides
      const validFiles = filesToUpload.filter((file) => {
        if (!file || !file.type.startsWith('image/')) return false
        if (file.size > 4 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse 4 Mo (limite Vercel / API)`,
            variant: "destructive"
          })
          return false
        }
        return true
      })

      // Uploader tous les fichiers en parallèle avec Promise.all
      const uploadPromises = validFiles.map(async (file, i) => {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('productId', productId)
          formData.append('productName', productName)
          formData.append('categoryId', categoryId)
          
          // Déterminer le type d'image
          if (images.length === 0 && i === 0) {
            formData.append('imageType', 'main')
          } else {
            formData.append('imageType', 'gallery')
            formData.append('galleryIndex', (images.length + i).toString())
          }

          const response = await fetch('/api/upload/product-image', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken },
            credentials: 'include',
            body: formData
          })

          if (!response.ok) {
            const error = (await response.json()) as { error?: string; details?: string }
            throw new Error([error.error, error.details].filter(Boolean).join(' — ') || 'Erreur upload')
          }

          const data = await response.json()
          setUploadProgress(prev => ({ ...prev, [i]: 100 }))
          
          toast({
            title: "Image uploadée",
            description: `${file.name} a été uploadé avec succès`,
          })
          
          return data.imageUrl
        } catch (error: unknown) {
          logger.error('Erreur upload:', error)
          const errorMessage = error instanceof Error ? error.message : 'Impossible d\'uploader l\'image'
          toast({
            title: "Erreur upload",
            description: errorMessage,
            variant: "destructive"
          })
          return null
        }
      })

      // Attendre tous les uploads
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter((url): url is string => url !== null)
      uploadedUrls.push(...successfulUploads)

      setUploading(false)
      setUploadProgress({}) // Réinitialiser le progrès
      onImagesChange([...images, ...uploadedUrls])
    } else {
      // Mode local (prévisualisation seulement)
      const newImages: string[] = []
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        if (file && file.type.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(file)
          newImages.push(imageUrl)
        }
      }
      onImagesChange([...images, ...newImages])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? "border-orange-500 bg-orange-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto text-orange-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
          )}
          <div className="text-sm text-gray-600">
            {uploading ? (
              'Upload en cours...'
            ) : (
              <>
                Glissez-déposez vos images ici ou{" "}
                <button
                  type="button"
                  onClick={openFileDialog}
                  disabled={uploading}
                  className="text-orange-600 hover:text-orange-700 underline disabled:opacity-50"
                >
                  cliquez pour sélectionner
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            PNG, JPG, WEBP jusqu'à 10MB ({images.length}/{maxImages} images)
          </div>
        </div>
      </div>

      {/* Images sélectionnées */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative w-full h-0 pb-[100%] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Bouton de suppression */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  {/* Indicateur d'image principale */}
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Principale
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Bouton d'ajout si pas au maximum */}
          {images.length < maxImages && (
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-2">
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="w-full h-full min-h-[100px] flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-xs">Ajouter</span>
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Conseils */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• La première image sera utilisée comme image principale</p>
        <p>• Recommandé : images carrées (1:1) pour un meilleur rendu</p>
        <p>• Taille optimale : 800x800px minimum</p>
      </div>
    </div>
  )
}
