/**
 * Rétrocompatibilité — préférez lib/seo/content/registry.ts
 */
export {
  SEO_CONTENT_PAGES as GUIDES,
  SEO_CONTENT_SLUGS as GUIDE_SLUGS,
  getSeoContentPage as getGuide,
} from './content/registry'

export type { SeoContentPage as GuideEntry } from './content/types'
