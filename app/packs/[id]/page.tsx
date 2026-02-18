// Forcer le rendu dynamique pour éviter l'erreur dynamicAccess
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Rediriger vers la version localisée
export default async function PackDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  redirect(`/${routing.defaultLocale}/packs/${id}`)
}
