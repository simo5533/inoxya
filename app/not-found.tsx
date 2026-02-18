// Page not-found globale - Désactiver le prerendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function NotFound() {
  // Rediriger vers la page d'accueil avec la locale par défaut
  redirect(`/${routing.defaultLocale}`)
}
