/**
 * Système de fallback pour afficher les packs depuis les images disponibles
 * Utilisé quand la base de données SQLite n'est pas accessible
 */

import fs from 'fs'
import path from 'path'

export interface FallbackPack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price?: number
  image_url: string
  is_featured: boolean
  category: string
}

// Mapping des noms de fichiers vers des noms de packs
const packNameMapping: Record<string, { name: string; price: number; original_price?: number; description: string }> = {
  'pack-black-titanium': {
    name: 'Pack Black Titanium',
    price: 299.99,
    original_price: 399.99,
    description: 'Collection élégante en titane noir, design moderne et résistant.'
  },
  'pack-cloue-soft': {
    name: 'Pack Cloué Soft',
    price: 249.99,
    original_price: 329.99,
    description: 'Bijoux délicats avec finition clouée douce, parfaits pour le quotidien.'
  },
  'pack-cloue': {
    name: 'Pack Cloué Premium',
    price: 279.99,
    original_price: 359.99,
    description: 'Collection premium avec finition clouée, élégance et raffinement.'
  },
  'pack-dore-luxe': {
    name: 'Pack Doré Luxe',
    price: 349.99,
    original_price: 449.99,
    description: 'Collection dorée luxueuse, éclat et sophistication.'
  },
  'pack-eclat-supreme': {
    name: 'Pack Éclat Suprême',
    price: 399.99,
    original_price: 499.99,
    description: 'Collection exceptionnelle avec finitions premium, éclat maximal.'
  },
  'pack-elegance-berbere': {
    name: 'Pack Élégance Berbère',
    price: 329.99,
    original_price: 429.99,
    description: 'Collection authentique inspirée de l\'art berbère, élégance traditionnelle.'
  },
  'pack-elegancia': {
    name: 'Pack Elegancia',
    price: 299.99,
    original_price: 379.99,
    description: 'Collection élégante et raffinée, parfaite pour toutes les occasions.'
  },
  'pack-emeraude': {
    name: 'Pack Émeraude',
    price: 379.99,
    original_price: 479.99,
    description: 'Collection verte émeraude, fraîcheur et élégance naturelle.'
  },
  'pack-glamour': {
    name: 'Pack Glamour',
    price: 349.99,
    original_price: 449.99,
    description: 'Collection glamour pour soirées et occasions spéciales.'
  },
  'pack-imperial': {
    name: 'Pack Impérial',
    price: 449.99,
    original_price: 549.99,
    description: 'Collection impériale, luxe et prestige absolus.'
  },
  'pack-mariee-royale': {
    name: 'Pack Mariée Royale',
    price: 499.99,
    original_price: 649.99,
    description: 'Collection complète pour mariage, élégance royale et sophistication.'
  },
  'pack-moderne-chic': {
    name: 'Pack Moderne Chic',
    price: 279.99,
    original_price: 359.99,
    description: 'Collection moderne et chic, design contemporain et tendance.'
  },
  'pack-papillon': {
    name: 'Pack Papillon',
    price: 229.99,
    original_price: 299.99,
    description: 'Collection délicate avec motifs papillon, légèreté et grâce.'
  },
  'pack-prestige': {
    name: 'Pack Prestige',
    price: 399.99,
    original_price: 499.99,
    description: 'Collection prestige, qualité exceptionnelle et finitions soignées.'
  },
  'pack-royal': {
    name: 'Pack Royal',
    price: 449.99,
    original_price: 579.99,
    description: 'Collection royale, luxe et élégance suprêmes.'
  },
  'pack-trefle': {
    name: 'Pack Trèfle',
    price: 269.99,
    original_price: 349.99,
    description: 'Collection avec motifs trèfle, chance et élégance.'
  }
}

/**
 * Récupère tous les packs depuis les images disponibles dans public/images/packs/
 */
export function getFallbackPacks(): FallbackPack[] {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const packsDir = path.join(publicDir, 'images', 'packs')
    
    if (!fs.existsSync(packsDir)) {
      return []
    }
    
    const packs: FallbackPack[] = []
    const seenIds = new Set<string>() // Pour éviter les doublons
    const entries = fs.readdirSync(packsDir, { withFileTypes: true })
    
    // Traiter d'abord les dossiers (priorité)
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Dossier avec plusieurs images (ex: pack-elegance-berbere/)
        const packId = `fallback-${entry.name}`
        
        // Éviter les doublons
        if (seenIds.has(packId)) {
          continue
        }
        seenIds.add(packId)
        
        const dirPath = path.join(packsDir, entry.name)
        const mainImage = path.join(dirPath, 'main.jpg')
        const mainImageWebp = path.join(dirPath, 'main.webp')
        const thumbnailImage = path.join(dirPath, 'thumbnail.jpg')
        
        // Utiliser main.webp si disponible, sinon main.jpg, sinon thumbnail.jpg
        let imagePath = '/images/packs/' + entry.name + '/main.webp'
        if (!fs.existsSync(mainImageWebp)) {
          if (fs.existsSync(mainImage)) {
            imagePath = '/images/packs/' + entry.name + '/main.jpg'
          } else if (fs.existsSync(thumbnailImage)) {
            imagePath = '/images/packs/' + entry.name + '/thumbnail.jpg'
          } else {
            continue // Pas d'image valide
          }
        }
        
        const packInfo = packNameMapping[entry.name] || {
          name: entry.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          price: 299.99,
          original_price: 399.99,
          description: 'Collection premium de bijoux soigneusement sélectionnés.'
        }
        
        packs.push({
          id: packId,
          name: packInfo.name,
          slug: entry.name,
          description: packInfo.description,
          price: packInfo.price,
          original_price: packInfo.original_price,
          image_url: imagePath,
          is_featured: ['pack-elegance-berbere', 'pack-mariee-royale', 'pack-imperial', 'pack-royal'].includes(entry.name),
          category: 'general'
        })
      }
    }
    
    // Ensuite traiter les fichiers (seulement si pas déjà traité comme dossier)
    for (const entry of entries) {
      if (entry.isFile()) {
        // Fichier image direct (ex: pack-prestige.jpg)
        const ext = path.extname(entry.name).toLowerCase()
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          continue
        }
        
        const baseName = path.parse(entry.name).name
        const packId = `fallback-${baseName}`
        
        // Éviter les doublons (si déjà traité comme dossier)
        if (seenIds.has(packId)) {
          continue
        }
        seenIds.add(packId)
        
        const imagePath = '/images/packs/' + entry.name
        
        const packInfo = packNameMapping[baseName] || {
          name: baseName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          price: 299.99,
          original_price: 399.99,
          description: 'Collection premium de bijoux soigneusement sélectionnés.'
        }
        
        packs.push({
          id: packId,
          name: packInfo.name,
          slug: baseName,
          description: packInfo.description,
          price: packInfo.price,
          original_price: packInfo.original_price,
          image_url: imagePath,
          is_featured: ['pack-prestige', 'pack-royal', 'pack-imperial'].includes(baseName),
          category: 'general'
        })
      }
    }
    
    // Trier : featured d'abord, puis par prix décroissant
    packs.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return b.price - a.price
    })
    
    return packs
  } catch (error) {
    console.error('[getFallbackPacks] Erreur:', error)
    return []
  }
}

