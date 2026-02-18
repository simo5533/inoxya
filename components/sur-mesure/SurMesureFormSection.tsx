"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Clock, Shield } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

interface CustomJewelryForm {
  type: string
  material: string
  style: string
  budget: string
  description: string
  name: string
  email: string
  phone: string
}

interface SurMesureFormSectionProps {
  formData: CustomJewelryForm
  onFormDataChange: (field: keyof CustomJewelryForm, value: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  loading: boolean
}

export default function SurMesureFormSection({
  formData,
  onFormDataChange,
  onSubmit,
  loading
}: SurMesureFormSectionProps) {
  const t = useTranslations('custom')
  const locale = useLocale()
  
  const jewelryTypes = [
    { value: "bague", label: t('jewelryTypes.ring'), icon: "💍" },
    { value: "collier", label: t('jewelryTypes.necklace'), icon: "📿" },
    { value: "boucles", label: t('jewelryTypes.earrings'), icon: "👂" },
    { value: "bracelet", label: t('jewelryTypes.bracelet'), icon: "🤲" },
    { value: "pendentif", label: t('jewelryTypes.pendant'), icon: "✨" }
  ]

  const materials = [
    { value: "or_18k", label: t('materials.gold18k') },
    { value: "or_14k", label: t('materials.gold14k') },
    { value: "argent", label: t('materials.silver') },
    { value: "platine", label: t('materials.platinum') },
    { value: "acier_inox", label: t('materials.steel') }
  ]

  const styles = [
    { value: "berbere", label: t('styles.berber') },
    { value: "moderne", label: t('styles.modern') },
    { value: "classique", label: t('styles.classic') },
    { value: "contemporain", label: t('styles.contemporary') }
  ]
  
  const budgets = [
    { value: "1000-3000", label: t('budgets.1000-3000') },
    { value: "3000-5000", label: t('budgets.3000-5000') },
    { value: "5000-10000", label: t('budgets.5000-10000') },
    { value: "10000+", label: t('budgets.10000+') }
  ]

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#FAF8F3] via-[#F6F1E6] to-[#FAF8F3]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#070A0F] mb-4 tracking-tight">
            {t('formTitle')}
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mx-auto mb-4"></div>
          <p className="text-lg text-[#070A0F]/70 max-w-2xl mx-auto">
            {t('formSubtitle')}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border border-[#D6B36A]/20 shadow-xl">
              <CardHeader className="border-b border-[#D6B36A]/10 p-8">
                <CardTitle className="text-2xl text-[#070A0F] font-bold text-center">
                  {t('formCardTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 md:p-12">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Grille 2 colonnes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#070A0F] font-medium text-sm">{t('jewelryType')} *</Label>
                      <Select value={formData.type} onValueChange={(value) => onFormDataChange("type", value)}>
                        <SelectTrigger className="h-11 border-[#070A0F]/20 focus:border-[#C9A227] focus:ring-[#C9A227]">
                          <SelectValue placeholder={t('placeholders.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          {jewelryTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#070A0F] font-medium text-sm">{t('material')} *</Label>
                      <Select value={formData.material} onValueChange={(value) => onFormDataChange("material", value)}>
                        <SelectTrigger className="h-11 border-[#070A0F]/20 focus:border-[#C9A227] focus:ring-[#C9A227]">
                          <SelectValue placeholder={t('placeholders.choose')} />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.value} value={material.value}>
                              {material.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#070A0F] font-medium text-sm">{t('style')} *</Label>
                      <Select value={formData.style} onValueChange={(value) => onFormDataChange("style", value)}>
                        <SelectTrigger className="h-11 border-[#070A0F]/20 focus:border-[#C9A227] focus:ring-[#C9A227]">
                          <SelectValue placeholder={t('placeholders.choose')} />
                        </SelectTrigger>
                        <SelectContent>
                          {styles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#070A0F] font-medium text-sm">{t('budget')} *</Label>
                      <Select value={formData.budget} onValueChange={(value) => onFormDataChange("budget", value)}>
                        <SelectTrigger className="h-11 border-[#070A0F]/20 focus:border-[#C9A227] focus:ring-[#C9A227]">
                          <SelectValue placeholder={t('placeholders.indicate')} />
                        </SelectTrigger>
                        <SelectContent>
                          {budgets.map((budget) => (
                            <SelectItem key={budget.value} value={budget.value}>
                              {budget.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-[#070A0F] font-medium text-sm">{t('descriptionLabel')} *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => onFormDataChange("description", e.target.value)}
                      placeholder={t('placeholders.describe')}
                      rows={5}
                      className="resize-none border-[#070A0F]/20 text-[#070A0F] placeholder:text-[#070A0F]/40 focus:border-[#C9A227] focus:ring-[#C9A227]"
                      dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Informations de contact */}
                  <div className="border-t border-[#070A0F]/10 pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-[#070A0F]">Vos informations de contact</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[#070A0F] font-medium text-sm">{t('fullName')} *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => onFormDataChange("name", e.target.value)}
                          placeholder={t('placeholders.yourName')}
                          className="h-11 border-[#070A0F]/20 text-[#070A0F] placeholder:text-[#070A0F]/40 focus:border-[#C9A227] focus:ring-[#C9A227]"
                          required
                          dir={locale === 'ar' ? 'rtl' : 'ltr'}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#070A0F] font-medium text-sm">{t('email')} *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => onFormDataChange("email", e.target.value)}
                          placeholder={t('placeholders.yourEmail')}
                          className="h-11 border-[#070A0F]/20 text-[#070A0F] placeholder:text-[#070A0F]/40 focus:border-[#C9A227] focus:ring-[#C9A227]"
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-6">
                      <Label className="text-[#070A0F] font-medium text-sm">{t('phone')} *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => onFormDataChange("phone", e.target.value)}
                        placeholder={t('placeholders.yourPhone')}
                        className="h-11 border-[#070A0F]/20 text-[#070A0F] placeholder:text-[#070A0F]/40 focus:border-[#C9A227] focus:ring-[#C9A227]"
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Bloc rassurant */}
                  <div className="bg-[#070A0F]/5 border border-[#D6B36A]/20 rounded-lg p-5">
                    <div className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1 space-y-2">
                        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-4 h-4 text-[#C9A227]" />
                          <span className="text-sm font-medium text-[#070A0F]">{t('reassurance.responseTime')}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <Shield className="w-4 h-4 text-[#C9A227]" />
                          <span className="text-sm font-medium text-[#070A0F]">{t('reassurance.privacy')}</span>
                        </div>
                        <p className={`text-xs text-[#070A0F]/60 mt-2 ${locale === 'ar' ? 'text-right' : ''}`}>
                          {t('reassurance.security')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton submit premium */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-[#C9A227] hover:bg-[#D6B36A] text-[#070A0F] font-semibold transition-colors duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#070A0F]"></div>
                          <span>{t('submitting')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          <span>{t('submit')}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
