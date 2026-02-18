"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { useTranslations, useLocale } from "next-intl"

interface SurMesureHeroProps {
  onStartCreation: () => void
  onSeeProcess: () => void
}

export default function SurMesureHero({ onStartCreation, onSeeProcess }: SurMesureHeroProps) {
  const t = useTranslations('custom')
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 50])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <section ref={ref} className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background clean - noir profond */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A0F] via-[#0B1220] to-[#070A0F]">
        {/* Grain texture très légère */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjkiIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]"></div>
      </div>

      {/* Content avec parallax très subtil */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 container mx-auto px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-[#D6B36A]/70 border border-[#D6B36A]/30 bg-[#0B1220]/50 backdrop-blur-sm">
              {t('heroBadge')}
            </span>
          </motion.div>

          {/* H1 avec gold gradient très léger */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            {locale === 'fr' ? (
              <>
                <span className="text-[#F6F1E6]">Bijoux </span>
                <span className="bg-gradient-to-r from-[#D6B36A] via-[#C9A227] to-[#D6B36A] bg-clip-text text-transparent">
                  Sur Mesure
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-[#D6B36A] via-[#C9A227] to-[#D6B36A] bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            )}
          </motion.h1>

          {/* Sous-titre court */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-[#D6B36A]/80 mb-10 font-light leading-relaxed max-w-2xl mx-auto"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={onStartCreation}
              className="h-12 px-8 bg-[#C9A227] hover:bg-[#D6B36A] text-[#070A0F] font-semibold transition-colors duration-300"
            >
              {t('startCreation')}
            </Button>
            
            <Button
              onClick={onSeeProcess}
              variant="outline"
              className="h-12 px-8 bg-white/[0.03] backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/[0.05] hover:border-[#C9A24A]/40 hover:text-[#E7D3A1] font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_10px_30px_-12px_rgba(201,162,74,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A12]"
            >
              {t('seeProcess')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Séparateur hairline */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D6B36A]/20 to-transparent"></div>
    </section>
  )
}
