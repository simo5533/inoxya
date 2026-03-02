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
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Static glass luxury background (CSS-only, emerald/teal) – no video */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950" />
        <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-teal-300/12 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-200/8 blur-3xl" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Carte centrale : vidéo premium + fallback reduced-motion */}
          <div className="relative mx-auto max-w-3xl w-full overflow-hidden rounded-2xl aspect-[800/300]">
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
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href={`/${locale}/bijoux`}>
              <Button
                size="lg"
                className={`group bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-10 py-4 text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                {t('discoverCollection')}
                <ArrowRight className={`w-6 h-6 ${locale === 'ar' ? 'mr-3 rotate-180' : 'ml-3'} group-hover:translate-x-1 transition-transform`} />
              </Button>
            </Link>
            <Link href={`/${locale}/packs`}>
              <Button
                size="lg"
                variant="outline"
                className={`group border-2 border-white/40 text-white hover:border-white/80 hover:bg-white/10 font-semibold px-10 py-4 text-xl rounded-full bg-white/5 backdrop-blur-sm transition-all duration-300 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <Package className={`w-5 h-5 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('ourPacks')}
                <ArrowRight className={`w-5 h-5 ${locale === 'ar' ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm">{t('discover')}</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
