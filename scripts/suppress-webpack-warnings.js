#!/usr/bin/env node
/**
 * Script pour supprimer les warnings webpack next-intl de la console
 * À exécuter en parallèle avec npm run dev
 */

// Intercepter console.warn pour filtrer les warnings next-intl
const originalWarn = console.warn

console.warn = (...args) => {
  const message = args.join(' ')
  
  // Ignorer les warnings webpack.cache.PackFileCacheStrategy pour next-intl
  if (message.includes('webpack.cache.PackFileCacheStrategy') && 
      message.includes('next-intl')) {
    return // Ne pas afficher
  }
  
  if (message.includes('Build dependencies behind this expression are ignored') &&
      message.includes('next-intl')) {
    return // Ne pas afficher
  }
  
  // Afficher tous les autres warnings
  originalWarn.apply(console, args)
}

// Garder le processus actif
process.stdin.resume()

