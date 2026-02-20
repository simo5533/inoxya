"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Lightbulb, CheckCircle2, Hammer, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations, useLocale } from "next-intl"

export default function ProcessTimeline() {
  const t = useTranslations('custom.process')
  const locale = useLocale()
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const steps = [
    {
      icon: Lightbulb,
      title: t('steps.inspiration.title'),
      description: t('steps.inspiration.description'),
    },
    {
      icon: CheckCircle2,
      title: t('steps.validation.title'),
      description: t('steps.validation.description'),
    },
    {
      icon: Hammer,
      title: t('steps.fabrication.title'),
      description: t('steps.fabrication.description'),
    },
    {
      icon: Truck,
      title: t('steps.delivery.title'),
      description: t('steps.delivery.description'),
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-b from-[#070A0F] via-[#0B1220] to-[#070A0F]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl md:text-5xl font-bold text-[#F6F1E6] mb-4 tracking-tight ${locale === 'ar' ? 'text-right' : ''}`}>
            {t('title')}
          </h2>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mx-auto mb-4"></div>
          <p className={`text-lg text-[#D6B36A]/70 max-w-2xl mx-auto ${locale === 'ar' ? 'text-right' : ''}`}>
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Grid 2x2 desktop, 1 colonne mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="transition-transform duration-300"
              >
                <Card className="bg-[#0B1220]/60 backdrop-blur-sm border border-[#D6B36A]/20 hover:border-[#D6B36A]/40 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className={`flex items-start gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="w-12 h-12 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-[#C9A227]" />
                      </div>
                      <div className={locale === 'ar' ? 'text-right' : ''}>
                        <h3 className="text-lg font-semibold text-[#F6F1E6] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-[#D6B36A]/60 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="mt-3 text-xs text-[#C9A227]/60 font-medium">
                          {t('step')} {index + 1}/4
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
