"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslations, useLocale } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import SurMesureHero from "@/components/sur-mesure/SurMesureHero"
import SurMesureAtelier from "@/components/sur-mesure/SurMesureAtelier"
import ProcessTimeline from "@/components/sur-mesure/ProcessTimeline"
import SurMesureFormSection from "@/components/sur-mesure/SurMesureFormSection"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

export default function SurMesurePage() {
  const t = useTranslations('custom')
  const locale = useLocale()
  const [formData, setFormData] = useState<CustomJewelryForm>({
    type: "",
    material: "",
    style: "",
    budget: "",
    description: "",
    name: "",
    email: "",
    phone: ""
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  
  const formSectionRef = useRef<HTMLDivElement>(null)
  const processSectionRef = useRef<HTMLDivElement>(null)
  
  // Récupérer le token CSRF au chargement
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du token CSRF:', err)
      }
    }
    fetchCsrfToken()
  }, [])

  const handleInputChange = (field: keyof CustomJewelryForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Vérifier que le token CSRF est disponible
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          type: formData.type,
          description: formData.description,
          budget: formData.budget,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t('error'))
      }
    
      setIsSubmitted(true)
    } catch (error) {
      console.error('Erreur:', error)
      alert((error as Error)?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToProcess = () => {
    processSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#070A0F] via-[#0B1220] to-[#070A0F] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md text-center shadow-xl border border-[#D6B36A]/30 bg-[#0B1220]/90 backdrop-blur-sm">
            <CardContent className="py-12 px-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-[#F6F1E6] mb-4">
              {t('success.title')}
            </h2>
              <p className="text-[#D6B36A]/80 mb-8 leading-relaxed">
              {t('success.message', { hours: 24 })}
            </p>
            <Button 
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({
                    type: "",
                    material: "",
                    style: "",
                    budget: "",
                    description: "",
                    name: "",
                    email: "",
                    phone: ""
                  })
                }}
                className="bg-[#C9A227] hover:bg-[#D6B36A] text-[#070A0F] font-semibold px-8 py-6 transition-colors duration-300"
            >
              {t('success.newRequest')}
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#070A0F]">
      {/* Hero */}
      <SurMesureHero 
        onStartCreation={scrollToForm}
        onSeeProcess={scrollToProcess}
      />

      {/* Section Atelier */}
      <SurMesureAtelier />

      {/* Section Process */}
      <div ref={processSectionRef}>
        <ProcessTimeline />
      </div>

      {/* Section Formulaire */}
      <div ref={formSectionRef}>
        <SurMesureFormSection
          formData={formData}
          onFormDataChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={loading}
                      />
                    </div>
                    
      {/* Section FAQ */}
      <section className="relative py-24 bg-gradient-to-b from-[#FAF8F3] to-[#F6F1E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12"
            >
              <h2 className={`text-4xl md:text-5xl font-bold text-[#070A0F] mb-4 tracking-tight ${locale === 'ar' ? 'text-right' : ''}`}>
                {t('faqSection.title')}
              </h2>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mx-auto mb-4"></div>
            </motion.div>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                { question: t('faqSection.questions.q1.question'), answer: t('faqSection.questions.q1.answer') },
                { question: t('faqSection.questions.q2.question'), answer: t('faqSection.questions.q2.answer') },
                { question: t('faqSection.questions.q3.question'), answer: t('faqSection.questions.q3.answer') },
                { question: t('faqSection.questions.q4.question'), answer: t('faqSection.questions.q4.answer') },
                { question: t('faqSection.questions.q5.question'), answer: t('faqSection.questions.q5.answer') },
              ].map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white/60 backdrop-blur-sm border border-[#D6B36A]/20 rounded-lg px-6"
                >
                  <AccordionTrigger className={`text-[#070A0F] hover:text-[#C9A227] transition-colors ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className={`text-[#070A0F]/70 leading-relaxed pt-2 ${locale === 'ar' ? 'text-right' : ''}`}>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
                </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#0B1220]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className={`text-4xl md:text-6xl font-bold text-[#F6F1E6] mb-6 tracking-tight ${locale === 'ar' ? 'text-right' : ''}`}>
              {t('finalCta.title')}
            </h2>
            <p className={`text-lg text-[#D6B36A]/70 mb-10 leading-relaxed ${locale === 'ar' ? 'text-right' : ''}`}>
              {t('finalCta.subtitle')}
            </p>
            <Button
              onClick={scrollToForm}
              className="h-12 px-10 bg-[#C9A227] hover:bg-[#D6B36A] text-[#070A0F] font-semibold transition-colors duration-300"
            >
              {t('startCreation')}
            </Button>
            <p className={`mt-10 text-[#D6B36A]/50 text-sm italic ${locale === 'ar' ? 'text-right' : ''}`}>
              {t('finalCta.tagline')}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
