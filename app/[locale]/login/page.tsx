"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useLocale } from 'next-intl'

// Type pour la réponse d'authentification
interface AuthResponse {
  success: boolean
  error?: string
  user?: {
    id: string
    phone: string
    first_name?: string
    last_name?: string
    role: 'user' | 'moderator' | 'admin'
  }
  redirect?: string
}

export default function LoginPage() {
  const locale = useLocale()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  // Récupérer le token CSRF au chargement de la page
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération du token CSRF:', err)
        }
      }
    }
    fetchCsrfToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Normaliser le téléphone: supprimer les espaces, tirets, points
    const normalizedPhone = phone.replace(/[\s\-\.]/g, '').trim()

    const fallbackError =
      locale === 'ar' ? 'خطأ في تسجيل الدخول' : 'Erreur lors de la connexion'

    try {
      // Rafraîchir le CSRF juste avant l'envoi (évite token expiré / onglet longtemps ouvert)
      let tokenToUse = csrfToken
      try {
        const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json()
          if (csrfData.csrfToken) {
            tokenToUse = csrfData.csrfToken
            setCsrfToken(csrfData.csrfToken)
          }
        }
      } catch {
        // garder le token déjà en mémoire
      }

      if (!tokenToUse) {
        setError(
          locale === 'ar'
            ? 'رمز الأمان مفقود. يرجى تحديث الصفحة.'
            : 'Token de sécurité manquant. Veuillez rafraîchir la page.'
        )
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': tokenToUse,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password: password,
        }),
        credentials: 'include',
      })

      const result: AuthResponse & { redirect?: string } = await response
        .json()
        .catch(() => ({ success: false, error: fallbackError }))

      if (!response.ok || !result.success || !result.user) {
        setError(result.error || fallbackError)
        setIsLoading(false)
        return
      }

      if (result.user.role === 'admin') {
        const maxAttempts = 15
        let attempts = 0
        const verifyAndRedirect = async () => {
          attempts += 1
          try {
            const checkResponse = await fetch('/api/auth/me', {
              credentials: 'include',
            })
            const checkData = await checkResponse.json()

            if (checkData.user && checkData.user.role === 'admin') {
              window.location.replace('/admin')
              return
            }
          } catch {
            // retry below
          }

          if (attempts >= maxAttempts) {
            // Session créée côté API : rediriger quand même
            window.location.replace('/admin')
            return
          }
          setTimeout(verifyAndRedirect, 200)
        }

        setTimeout(verifyAndRedirect, 200)
      } else {
        setTimeout(() => {
          window.location.replace(result.redirect || `/${locale}`)
        }, 200)
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : fallbackError
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Connexion'}
          </CardTitle>
          <div className="text-gray-600 mt-2">{locale === 'ar' ? 'الوصول إلى مساحتك INOXYA' : 'Accédez à votre espace INOXYA'}</div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">{locale === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={locale === 'ar' ? '06 12 34 56 78' : '06 12 34 56 78'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={locale === 'ar' ? 'كلمة المرور الخاصة بك' : 'Votre mot de passe'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? (locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Connexion...') : (locale === 'ar' ? 'تسجيل الدخول' : 'Se connecter')}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <Link href={`/${locale}/mot-de-passe-oublie`} className="text-sm text-gray-600 hover:text-gray-900">
              {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
            </Link>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                {locale === 'ar' ? 'ليس لديك حساب؟' : 'Pas encore de compte ?'}{" "}
                <Link href={`/${locale}/inscription`} className="font-semibold text-gray-900 hover:underline">
                  {locale === 'ar' ? 'سجل الآن' : "S'inscrire"}
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

