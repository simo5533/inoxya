"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Package } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

export default function HeroBanner() {
  const t = useTranslations('home.hero')
  const locale = useLocale()
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden py-10 sm:py-12 md:min-h-screen md:py-0">
      {/* Static glass luxury background (CSS-only, emerald/teal) – no video */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950" />
        <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-teal-300/12 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-200/8 blur-3xl" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 container mx-auto w-full max-w-full min-w-0 px-4 text-center">
        <div className="max-w-4xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8 md:space-y-12">
          {/* Carte centrale : vidéo premium + fallback reduced-motion */}
          <div className="relative mx-auto w-full min-w-0 max-w-3xl overflow-hidden rounded-2xl aspect-[3/4] sm:aspect-[5/4] md:aspect-[800/300]">
            {/* Glass panel behind card (no blur on video) */}
            <div className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-2xl ring-1 ring-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.45)] rounded-2xl" aria-hidden />
            {/* Reduced-motion placeholder (gradient only, no image) */}
            <div
              className="absolute inset-0 hidden motion-reduce:block rounded-2xl bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-slate-900/90"
              aria-hidden
            />
            <video
              className="relative z-10 h-full w-full object-cover rounded-2xl motion-reduce:hidden"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={t('discoverCollection')}
            >
              <source src="/videos/inoxya-center.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/10 z-10" aria-hidden />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-stretch sm:items-center">
            <Link href={`/${locale}/bijoux`} className="w-full sm:w-auto min-w-0">
              <Button
                size="lg"
                className={`group w-full sm:w-auto min-h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center px-6 py-3 text-sm sm:px-8 sm:py-3 sm:text-base md:px-10 md:py-4 md:text-xl ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                {t('discoverCollection')}
                <ArrowRight className={`w-5 h-5 shrink-0 sm:w-6 sm:h-6 ${locale === 'ar' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'} group-hover:translate-x-1 transition-transform`} />
              </Button>
            </Link>
            <Link href={`/${locale}/packs`} className="w-full sm:w-auto min-w-0">
              <Button
                size="lg"
                variant="outline"
                className={`group w-full sm:w-auto min-h-12 border-2 border-white/40 text-white hover:border-white/80 hover:bg-white/10 font-semibold rounded-full bg-white/5 backdrop-blur-sm transition-all duration-300 flex items-center justify-center px-6 py-3 text-sm sm:px-8 sm:py-3 sm:text-base md:px-10 md:py-4 md:text-xl ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <Package className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('ourPacks')}
                <ArrowRight className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${locale === 'ar' ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-white/60 animate-bounce sm:bottom-6 md:bottom-8">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xs sm:text-sm">{t('discover')}</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
