"use client"

import CategoryCard from "./CategoryCard"

interface HomeCategorySectionProps {
  categories: any[]
}

/**
 * Wrapper client pour la section catégories sur la page d'accueil
 */
export default function HomeCategorySection({ categories }: HomeCategorySectionProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {categories.map((category, index) => (
        <CategoryCard 
          key={category.id} 
          category={category} 
          index={index}
        />
      ))}
    </div>
  )
}

