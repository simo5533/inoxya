"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Package } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

export default function HeroBanner() {
  const t = useTranslations('home.hero')
  const locale = useLocale()
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
      {/* Video background (hidden when prefers-reduced-motion) */}
      <div className="heroVideo absolute inset-0 h-full w-full">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        >
          <source src="/videos/banniere-inoxya.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/35 z-[1]" aria-hidden />

      {/* Animated background elements (fallback when video hidden) */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-orange-400/15 to-yellow-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-500/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Centered content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Logo/Banner Image (above video for branding) */}
          <div className="relative mx-auto max-w-3xl">
            <Image
              src="/banner-inoxya.jpg"
              alt="INOXYA BIJOUX - Collection de bijoux en acier inoxydable premium - Embellie ton âme"
              width={800}
              height={300}
              className="w-full h-auto rounded-2xl shadow-2xl"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
            />
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
