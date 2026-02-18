import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Star, 
  Users, 
  Award,
  Shield,
  Droplet,
  Sparkles,
  CheckCircle2,
  Package,
  Truck,
  Headphones,
  Gem,
  ArrowRight
} from "lucide-react"
import { getSiteUrlSync } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'

const siteUrl = getSiteUrlSync()

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}/${locale}/a-propos`,
      siteName: "INOXYA BIJOUX",
      images: [
        {
          url: `${siteUrl}/images/packs/pack-elegancia.jpg`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: [`${siteUrl}/images/packs/pack-elegancia.jpg`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/a-propos`,
      languages: {
        'fr': `${siteUrl}/fr/a-propos`,
        'ar': `${siteUrl}/ar/a-propos`,
      },
    },
  }
}

export default async function AProposPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  
  return (
    <div className="min-h-screen bg-luxury-ivory">
      {/* 1. HERO SECTION - Premium Editorial */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/packs/pack-elegancia.jpg"
            alt="INOXYA BIJOUX - Collection Premium"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/90 via-luxury-black/70 to-luxury-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            {locale === 'fr' ? (
              <>
                À propos d'<span className="text-luxury-gold">INOXYA</span>
              </>
            ) : (
              <>
                {t('heroTitle').split(' - ')[0]} <span className="text-luxury-gold">INOXYA</span>
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-luxury-ivory/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-semibold px-8 py-6 text-lg"
            >
              <Link href={`/${locale}/bijoux`} className={`flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                {t('discoverCollection')}
                <ArrowRight className={`w-5 h-5 ${locale === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10 bg-transparent px-8 py-6 text-lg font-semibold"
            >
              <Link href={`/${locale}/packs`}>
                {t('viewPacks')}
              </Link>
            </Button>
          </div>

          {/* Trust Micro-line */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-luxury-ivory/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
              <span>{t('trustReturns')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
              <span>{t('trustShipping')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
              <span>{t('trustSteel')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND STORY - 2 Column */}
      <section className="py-20 bg-luxury-ivory">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left: Text Narrative */}
            <div className={`space-y-6 ${locale === 'ar' ? 'text-right' : ''}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-luxury-black mb-6">
                {t('storyTitle')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('storyP1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('storyP2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('storyP3')}
              </p>

              {/* Notre Promesse */}
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-luxury-black mb-6">{t('promiseTitle')}</h3>
                <ul className="space-y-4">
                  <li className={`flex items-start gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t('promiseQuality')}</span>
                  </li>
                  <li className={`flex items-start gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t('promiseFinishing')}</span>
                  </li>
                  <li className={`flex items-start gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t('promiseService')}</span>
                  </li>
                  <li className={`flex items-start gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{t('promiseAuthenticity')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Image Card */}
            <div className="relative">
              <Card className="overflow-hidden border border-gray-200 shadow-xl">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/5] bg-gray-100">
                    <Image
                      src="/images/bijoux/bagues/bague-berbere-or-18k/main.jpg"
                      alt="Artisanat INOXYA BIJOUX"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VALUES - Luxury Grid */}
      <section className="py-20 bg-luxury-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('valuesTitle')}
            </h2>
            <p className="text-xl text-luxury-ivory/80 max-w-2xl mx-auto">
              {t('valuesSubtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="bg-luxury-charcoal border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all duration-300 text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-luxury-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('valuePassion')}</h3>
                <p className="text-luxury-ivory/80 text-sm leading-relaxed">
                  {t('valuePassionDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all duration-300 text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-luxury-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('valueExcellence')}</h3>
                <p className="text-luxury-ivory/80 text-sm leading-relaxed">
                  {t('valueExcellenceDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all duration-300 text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-luxury-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('valueTrust')}</h3>
                <p className="text-luxury-ivory/80 text-sm leading-relaxed">
                  {t('valueTrustDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-luxury-charcoal border border-luxury-gold/20 hover:border-luxury-gold/40 transition-all duration-300 text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-luxury-gold" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('valueInnovation')}</h3>
                <p className="text-luxury-ivory/80 text-sm leading-relaxed">
                  {t('valueInnovationDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. MATERIALS & QUALITY */}
      <section className="py-20 bg-luxury-ivory">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-luxury-black mb-4">
              {t('materialsTitle')}
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              {t('materialsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">
                  {t('material316L')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('material316LDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Droplet className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">
                  {t('materialWater')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('materialWaterDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">
                  {t('materialFinishing')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('materialFinishingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Gem className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">
                  {t('materialQuality')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('materialQualityDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. PROCESS / CRAFT - Timeline */}
      <section className="py-20 bg-luxury-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('processTitle')}
            </h2>
            <p className="text-xl text-luxury-ivory/80 max-w-2xl mx-auto">
              {t('processSubtitle')}
            </p>
          </div>

          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block max-w-6xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-luxury-gold/30" />
              
              <div className="grid grid-cols-6 gap-4 relative">
                {[
                  { step: t('stepInspiration'), icon: Sparkles },
                  { step: t('stepDesign'), icon: Award },
                  { step: t('stepSelection'), icon: Gem },
                  { step: t('stepAssembly'), icon: Package },
                  { step: t('stepControl'), icon: Shield },
                  { step: t('stepShipping'), icon: Truck },
                ].map(({ step, icon: Icon }) => (
                  <div key={step} className="text-center">
                    <div className="relative z-10 w-24 h-24 bg-luxury-charcoal border-2 border-luxury-gold rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-10 h-10 text-luxury-gold" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{step}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="lg:hidden max-w-md mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-luxury-gold/30" />
              
              <div className="space-y-8">
                {[
                  { step: t('stepInspiration'), icon: Sparkles },
                  { step: t('stepDesign'), icon: Award },
                  { step: t('stepSelection'), icon: Gem },
                  { step: t('stepAssembly'), icon: Package },
                  { step: t('stepControl'), icon: Shield },
                  { step: t('stepShipping'), icon: Truck },
                ].map(({ step, icon: Icon }) => (
                  <div key={step} className={`flex items-start gap-4 relative ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="relative z-10 w-12 h-12 bg-luxury-charcoal border-2 border-luxury-gold rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-luxury-gold" />
                    </div>
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-white">{step}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF / REASSURANCE */}
      <section className="py-20 bg-luxury-ivory">
        <div className="container mx-auto px-4">
          {/* Rating Display */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={`star-${i}`} className="w-5 h-5 fill-luxury-gold text-luxury-gold" />
                ))}
              </div>
              <span className="text-lg font-semibold text-luxury-black">{t('rating')}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">{t('ratingDesc')}</span>
            </div>
          </div>

          {/* Reassurance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">{t('reassuranceShippingTitle')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('reassuranceShippingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">{t('reassuranceReturnsTitle')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('reassuranceReturnsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:border-luxury-gold/40 transition-all duration-300 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-luxury-gold/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-7 h-7 text-luxury-gold" />
                </div>
                <h3 className="text-lg font-bold text-luxury-black mb-2">{t('reassuranceSupportTitle')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('reassuranceSupportDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Final CTA Banner */}
          <div className="bg-luxury-black border-2 border-luxury-gold rounded-2xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prête à trouver votre bijou signature ?
            </h2>
            <p className="text-luxury-ivory/80 text-lg mb-8">
              Explorez notre collection exclusive de bijoux en acier inoxydable 316L
            </p>
            <Button
              asChild
              size="lg"
              className="bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-semibold px-8 py-6 text-lg"
            >
              <Link href={`/${locale}/bijoux`}>
                Voir la collection
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
