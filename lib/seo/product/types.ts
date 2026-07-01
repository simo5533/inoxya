export type ProductSeoInput = {
  id: string
  name: string
  name_ar?: string
  description?: string
  price: number
  original_price?: number
  category?: string
  category_id?: string
  is_available?: boolean
  is_featured?: boolean
  rating?: number
  reviews_count?: number
  images?: string[]
  main_image?: string
}

export type ProductSeoFaqItem = { question: string; answer: string }

export type ProductSeoPackage = {
  seoTitle: string
  metaDescription: string
  h1: string
  shortDescription: string
  longDescriptionHtml: string
  sections: {
    introduction: string
    whyChoose: string
    characteristics: string[]
    advantages: string[]
    usageTips: string[]
    careTips: string[]
    occasions: string[]
    conclusion: string
  }
  faq: ProductSeoFaqItem[]
  keywords: {
    primary: string[]
    secondary: string[]
    searchVariants: string[]
    synonyms: string[]
  }
  imageAlts: string[]
  wordCount: number
  isComplete: boolean
  missingFields: string[]
}
