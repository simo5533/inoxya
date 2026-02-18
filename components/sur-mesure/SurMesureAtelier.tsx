"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Hammer, Palette, Sparkles } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

export default function SurMesureAtelier() {
  const t = useTranslations('custom')
  const locale = useLocale()
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#06080D] via-[#070A12] to-[#06080D] overflow-hidden">
      {/* Background details ultra subtils */}
      <div className="absolute inset-0">
        {/* Engraved pattern très léger */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(214, 179, 106, 0.1) 2px, rgba(214, 179, 106, 0.1) 4px),
              url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjkiIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')
            `,
            backgroundSize: '100px 100px, 200px 200px',
          }}
        />
        
        {/* Gold glint minimal (coin supérieur droit) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C9A24A]/5 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Spotlight gris/bleu nuit très doux */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(11, 18, 32, 0.2) 0%, transparent 70%)'
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-16 items-start">
            
            {/* Left column (45%) - Editorial */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Sur-titre discret */}
              <div>
                <span className="text-xs tracking-[0.3em] uppercase text-white/50 font-light">
                  {t('atelierTitle')}
                </span>
              </div>

              {/* Titre principal */}
              <h2 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
                {locale === 'fr' ? (
                  <>
                    <span className="text-white/90">INOXYA </span>
                    <span className="bg-gradient-to-r from-[#C9A24A] via-[#D6B36A] to-[#C9A24A] bg-clip-text text-transparent">
                      Sur Mesure
                    </span>
                  </>
                ) : (
                  <span className="bg-gradient-to-r from-[#C9A24A] via-[#D6B36A] to-[#C9A24A] bg-clip-text text-transparent">
                    {t('atelierSubtitle')}
                  </span>
                )}
              </h2>

              {/* Hairline */}
              <div className="w-20 h-px bg-gradient-to-r from-[#C9A24A]/40 to-transparent"></div>

              {/* Texte impactant (2-3 lignes) */}
              <p className="text-lg text-white/70 leading-relaxed max-w-md font-light">
                {t('atelierDescription')}
              </p>

              {/* Stamp detail */}
              <div className="pt-4 border-t border-white/10">
                <div className={`flex items-center gap-3 text-xs text-white/40 tracking-wider uppercase ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {t('atelierDetails').split(' • ').map((detail, i, arr) => (
                    <span key={i}>
                      {detail}
                      {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-[#C9A24A]/30 mx-2"></span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Signature detail luxury (bas à gauche) */}
              <div className="pt-8 mt-8 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/60 tracking-wide">
                    {t('atelierSignature')}
                  </p>
                  <p className="text-xs text-white/40 font-light">
                    {t('atelierSignatureDesc')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right column (55%) - Mosaic premium */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              {/* Grande card "Artisanat expert" */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -2, transition: { duration: 0.3 } }}
                className="transition-transform duration-300"
              >
                <Card className="bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-full bg-[#C9A24A]/10 border border-[#C9A24A]/20 flex items-center justify-center flex-shrink-0">
                        <Hammer className="w-7 h-7 text-[#C9A24A]" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-2xl font-semibold text-white/90 mb-3 tracking-tight ${locale === 'ar' ? 'text-right' : ''}`}>
                          {t('atelierCards.expertCraft.title')}
                        </h3>
                        <p className={`text-sm text-white/60 leading-relaxed font-light ${locale === 'ar' ? 'text-right' : ''}`}>
                          {t('atelierCards.expertCraft.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 2 petites cards en dessous */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  whileHover={{ y: -2, transition: { duration: 0.3 } }}
                  className="transition-transform duration-300"
                >
                  <Card className="bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl shadow-lg h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#C9A24A]/10 border border-[#C9A24A]/20 flex items-center justify-center flex-shrink-0">
                          <Palette className="w-6 h-6 text-[#C9A24A]" />
                        </div>
                        <div className={locale === 'ar' ? 'text-right' : ''}>
                          <h3 className="text-lg font-semibold text-white/90 mb-2 tracking-tight">
                            {t('atelierCards.customDesign.title')}
                          </h3>
                          <p className="text-sm text-white/60 leading-relaxed font-light">
                            {t('atelierCards.customDesign.description')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  whileHover={{ y: -2, transition: { duration: 0.3 } }}
                  className="transition-transform duration-300"
                >
                  <Card className="bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 rounded-3xl shadow-lg h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#C9A24A]/10 border border-[#C9A24A]/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-[#C9A24A]" />
                        </div>
                        <div className={locale === 'ar' ? 'text-right' : ''}>
                          <h3 className="text-lg font-semibold text-white/90 mb-2 tracking-tight">
                            {t('atelierCards.premiumFinish.title')}
                          </h3>
                          <p className="text-sm text-white/60 leading-relaxed font-light">
                            {t('atelierCards.premiumFinish.description')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
