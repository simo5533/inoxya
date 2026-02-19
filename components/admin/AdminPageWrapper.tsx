"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

interface AdminPageWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper de sécurité pour les pages admin client-side
 * Vérifie l'authentification et le rôle admin côté client
 */
export default function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        
        if (!user) {
          router.push('/login?redirect=/admin')
          return
        }
        
        if (user.role !== 'admin') {
          router.push('/profile?error=unauthorized')
          return
        }
        
        setIsAuthorized(true)
      } catch {
        router.push('/login?redirect=/admin')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // La redirection est en cours
  }

  return <>{children}</>
}

