import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Rediriger vers la version localisée
export default function SurMesurePage() {
  redirect(`/${routing.defaultLocale}/sur-mesure`)
}
