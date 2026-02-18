import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import RoleGuard from "@/components/admin/RoleGuard"
import AdminSettings from "@/components/admin/AdminSettings"

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleGuard requiredRole="admin" user={user}>
        <AdminSettings user={user} />
      </RoleGuard>
    </div>
  )
}

