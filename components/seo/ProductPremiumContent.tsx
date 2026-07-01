import { FAQPageJsonLd } from '@/components/SEOJsonLd'
import { GeoQaBlock } from '@/components/seo/GeoQaBlock'
import type { ProductSeoPackage } from '@/lib/seo/product/types'

type ProductPremiumContentProps = {
  seo: ProductSeoPackage
  productName: string
  locale?: string
  className?: string
}

export function ProductPremiumContent({ seo, productName, className }: ProductPremiumContentProps) {
  const { sections } = seo
  const sectionClass = className ?? 'mt-12 border-t border-gray-200 pt-10'

  return (
    <section className={sectionClass} aria-labelledby="product-seo-heading">
      <FAQPageJsonLd items={seo.faq} />
      <h2 id="product-seo-heading" className="sr-only">
        Description détaillée — {productName}
      </h2>

      <div className="prose prose-gray max-w-none text-gray-700">
        <p className="text-lg leading-relaxed">{sections.introduction}</p>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Pourquoi choisir {productName}</h3>
        <p className="leading-relaxed">{sections.whyChoose}</p>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Caractéristiques</h3>
        <ul className="list-disc pl-5 space-y-1">
          {sections.characteristics.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Avantages</h3>
        <ul className="list-disc pl-5 space-y-1">
          {sections.advantages.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Conseils d&apos;utilisation</h3>
        <ul className="list-disc pl-5 space-y-1">
          {sections.usageTips.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Entretien</h3>
        <ul className="list-disc pl-5 space-y-1">
          {sections.careTips.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Occasions</h3>
        <p className="leading-relaxed">{sections.occasions.join(' · ')}</p>

        <p className="mt-8 leading-relaxed text-gray-800">{sections.conclusion}</p>
      </div>

      <GeoQaBlock items={seo.faq} title="Questions sur ce bijou" includeJsonLd={false} className="mt-8" />
    </section>
  )
}
