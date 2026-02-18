import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/AdminDashboard"
import RoleGuard from "@/components/admin/RoleGuard"

export default async function AdminPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleGuard requiredRole="admin" user={user}>
        <AdminDashboard user={user} />
      </RoleGuard>
    </div>
  )
}
