import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Rediriger vers la version localisée
export default function PanierPage() {
  redirect(`/${routing.defaultLocale}/panier`)
}
