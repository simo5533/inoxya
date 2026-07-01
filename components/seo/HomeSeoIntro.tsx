import Link from 'next/link'
import { GeoQaBlock } from '@/components/seo/GeoQaBlock'
import { GEO_QA_HOME } from '@/lib/seo/geo-qa'

export function HomeSeoIntro({ locale }: { locale: string }) {
  if (locale !== 'fr') return null

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight text-center">
          Bijoux en acier inoxydable au Maroc — INOXYA BIJOUX
        </h1>
        <p className="text-gray-700 text-center leading-relaxed text-base md:text-lg mb-8">
          Découvrez INOXYA BIJOUX, boutique marocaine de bijoux en acier inoxydable 316L : bagues,
          bracelets, colliers, boucles d&apos;oreilles, montres et packs cadeaux. Livraison partout au
          Maroc, paiement à la livraison et retour gratuit sous 30 jours.
        </p>
        <nav
          className="flex flex-wrap justify-center gap-2 text-sm mb-4"
          aria-label="Catégories bijoux"
        >
          {[
            ['bagues', 'Bagues'],
            ['colliers', 'Colliers'],
            ['bracelets', 'Bracelets'],
            ['boucles-oreilles', "Boucles d'oreilles"],
            ['montres', 'Montres'],
          ].map(([slug, label]) => (
            <Link
              key={slug}
              href={`/${locale}/bijoux/${slug}`}
              className="rounded-full bg-gray-100 px-4 py-2 hover:bg-orange-50 hover:text-orange-800 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href={`/${locale}/packs`}
            className="rounded-full bg-gray-100 px-4 py-2 hover:bg-orange-50 hover:text-orange-800 transition-colors"
          >
            Packs
          </Link>
        </nav>
        <GeoQaBlock items={GEO_QA_HOME} title="Questions fréquentes INOXYA" className="mt-8" />
      </div>
    </section>
  )
}
