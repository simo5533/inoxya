"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Crown, AlertTriangle } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: 'admin' | 'moderator' | 'user'
  user: {
    id: string
    role: string
  } | null
  fallback?: React.ReactNode
}

export default function RoleGuard({ children, requiredRole, user, fallback }: RoleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthorization = () => {
      if (!user) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      const roleHierarchy = {
        'user': 1,
        'moderator': 2,
        'admin': 3
      }

      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
      const requiredLevel = roleHierarchy[requiredRole]

      setIsAuthorized(userLevel >= requiredLevel)
      setLoading(false)
    }

    checkAuthorization()
  }, [user, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification des permissions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl text-gray-900">Accès non autorisé</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Rôle requis: {requiredRole}</span>
            </div>
            
            {user && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Crown className="w-4 h-4" />
                <span>Votre rôle: {user.role}</span>
              </div>
            )}

            <div className="pt-4">
              <Button onClick={() => router.push("/")} className="w-full">
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
