import type { Metadata } from 'next'
import type React from 'react'
import { privatePageMetadata } from '@/lib/seo/private-metadata'

export const metadata: Metadata = privatePageMetadata('Inscription')

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children
}
