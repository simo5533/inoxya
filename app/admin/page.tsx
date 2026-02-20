import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/AdminDashboard"
import RoleGuard from "@/components/admin/RoleGuard"

export default async function AdminPage() {
  // Le layout admin vérifie déjà l'authentification avec requireAdmin()
  // On peut directement afficher le dashboard
  const user = await getCurrentUser()
  
  // Double vérification de sécurité (le layout a déjà vérifié)
  if (!user || user.role !== 'admin') {
    redirect("/fr/login?redirect=/admin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleGuard requiredRole="admin" user={user}>
        <AdminDashboard user={user} />
      </RoleGuard>
    </div>
  )
}
