import type { Metadata } from "next"
import type React from "react"
import { requireAdmin } from "@/lib/admin-auth"
import { redirect } from "next/navigation"
import { logger } from "@/lib/logger"
import "@/styles/admin-premium.css"
import AdminNavBar from "@/components/admin/AdminNavBar"

export const metadata: Metadata = {
  title: "Administration",
  description: "Panneau d'administration INOXYA BIJOUX",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protection côté serveur - redirige si non admin
  try {
    const user = await requireAdmin()
    // Logger pour diagnostic
    logger.debug('[AdminLayout] Utilisateur admin authentifié', { userId: user.id, phone: user.phone, role: user.role })
  } catch (error) {
    // Logger pour diagnostic
    logger.error('[AdminLayout] Erreur requireAdmin', error)
    // Rediriger vers la page de login avec locale par défaut
    redirect('/fr/login?redirect=/admin')
  }

  return (
    <div data-admin-page className="admin-premium-container min-h-screen">
      <AdminNavBar />
      {children}
    </div>
  )
}

AdminLayout.displayName = 'AdminLayout'

export default AdminLayout

