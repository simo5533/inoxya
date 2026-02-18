import type { Metadata } from "next"
import type React from "react"
import { requireAdmin } from "@/lib/admin-auth"
import { redirect } from "next/navigation"
import "@/styles/admin-premium.css"
import AdminNavBar from "@/components/admin/AdminNavBar"

export const metadata: Metadata = {
  title: "Administration - INOXYA BIJOUX",
  description: "Panneau d'administration INOXYA BIJOUX"
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protection côté serveur - redirige si non admin
  try {
    const user = await requireAdmin()
    // Logger pour diagnostic
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminLayout] Utilisateur admin authentifié:', { userId: user.id, phone: user.phone, role: user.role })
    }
  } catch (error) {
    // Logger pour diagnostic
    if (process.env.NODE_ENV === 'development') {
      console.error('[AdminLayout] Erreur requireAdmin:', error)
    }
    redirect('/login?redirect=/admin')
  }

  return (
    <div data-admin-page className="admin-premium-container min-h-screen">
      <AdminNavBar />
      {children}
    </div>
  )
}

