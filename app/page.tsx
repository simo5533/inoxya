// Page racine - redirection vers /fr
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'

export default function RootPage() {
  // OPTIMISATION: Redirection immédiate sans await
  // Avec localePrefix: 'always', le préfixe est obligatoire
  redirect('/fr')
  
  // Code jamais atteint mais nécessaire pour TypeScript
  return null
}
