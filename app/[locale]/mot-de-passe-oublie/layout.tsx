import type { Metadata } from 'next'
import type React from 'react'
import { privatePageMetadata } from '@/lib/seo/private-metadata'

export const metadata: Metadata = privatePageMetadata('Mot de passe oublié')

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
