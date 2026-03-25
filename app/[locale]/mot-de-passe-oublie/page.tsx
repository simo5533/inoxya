"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"

export default function ForgotPasswordPage() {
  const locale = useLocale()
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phone.replace(/[\s\-\.]/g, "").trim()
    if (!trimmed) {
      setError(
        locale === "ar"
          ? "يرجى إدخال رقم الهاتف"
          : "Veuillez entrer votre numéro de téléphone"
      )
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      })

      // Toujours afficher le succès (pas d’énumération de numéros)
      void res
      setIsSuccess(true)
    } catch {
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {locale === "ar" ? "تم إرسال الطلب" : "Demande envoyée"}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {locale === "ar" ? (
                <>
                  إذا كان هذا الرقم مرتبطًا بحساب INOXYA، ستصلك تعليمات إعادة التعيين.
                  <br />
                  <br />
                  إذا لم تتلقَّ شيئًا، يرجى الاتصال بنا مباشرة.
                </>
              ) : (
                <>
                  Si ce numéro est associé à un compte INOXYA, vous recevrez les
                  instructions de réinitialisation.
                  <br />
                  <br />
                  Si vous ne recevez rien, contactez-nous directement.
                </>
              )}
            </p>
            <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
              <Link href={`/${locale}/login`}>
                {locale === "ar" ? "العودة لتسجيل الدخول" : "Retour à la connexion"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "ar" ? "العودة لتسجيل الدخول" : "Retour à la connexion"}
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {locale === "ar" ? "نسيت كلمة المرور؟" : "Mot de passe oublié ?"}
            </CardTitle>
            <p className="text-sm text-gray-600 pt-2">
              {locale === "ar"
                ? "أدخل رقم هاتفك لإعادة تعيين كلمة المرور."
                : "Entrez votre numéro de téléphone pour réinitialiser votre mot de passe."}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="forgot-phone">
                  {locale === "ar" ? "رقم الهاتف" : "Numéro de téléphone"}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="06 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800"
                disabled={isLoading || !phone.trim()}
              >
                {isLoading
                  ? locale === "ar"
                    ? "جاري الإرسال..."
                    : "Envoi en cours..."
                  : locale === "ar"
                    ? "إرسال التعليمات"
                    : "Envoyer les instructions"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-xs text-gray-600">
                {locale === "ar" ? "تحتاج مساعدة؟ " : "Besoin d'aide ? "}
                <Link
                  href={`/${locale}/a-propos#contact`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  {locale === "ar" ? "اتصل بنا" : "Contactez-nous"}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
