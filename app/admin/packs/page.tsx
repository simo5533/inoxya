import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminPacksManagement from "@/components/admin/AdminPacksManagement"

export const dynamic = 'force-dynamic'

export default async function AdminPacksPage() {
  const user = await getCurrentUser()
  
  // Protection admin obligatoire
  if (!user) {
    redirect("/fr/login?redirect=/admin/packs")
  }

  if (user.role !== 'admin') {
    redirect("/fr")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Packs</h1>
              <div className="text-gray-600 mt-2">
                Bienvenue, {user.first_name || user.phone}
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">Admin</span>
              </div>
            </div>
          </div>
        </div>

        <AdminPacksManagement />
      </div>
    </div>
  )
}

