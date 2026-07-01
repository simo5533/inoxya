import type { Metadata } from 'next'
import type React from 'react'
import { privatePageMetadata } from '@/lib/seo/private-metadata'

export const metadata: Metadata = privatePageMetadata('Checkout')

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
