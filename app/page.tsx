import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Rediriger la racine vers la locale par défaut
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`)
}
