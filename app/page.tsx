// Page racine - redirection vers /fr
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'

export default function RootPage() {
  // Rediriger vers /fr/ (avec localePrefix: 'always', le préfixe est obligatoire)
  redirect('/fr')
}
