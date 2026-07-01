import type { GeoQaItem } from '@/lib/seo/geo-qa'
import { FAQPageJsonLd } from '@/components/SEOJsonLd'

type GeoQaBlockProps = {
  items: GeoQaItem[]
  title?: string
  className?: string
  includeJsonLd?: boolean
}

export function GeoQaBlock({
  items,
  title = 'Questions fréquentes',
  className = '',
  includeJsonLd = true,
}: GeoQaBlockProps) {
  if (!items.length) return null

  return (
    <section className={`mt-12 border-t border-gray-200 pt-10 ${className}`} aria-labelledby="geo-qa-heading">
      {includeJsonLd ? <FAQPageJsonLd items={items} /> : null}
      <h2 id="geo-qa-heading" className="text-2xl font-bold text-gray-900 mb-6">
        {title}
      </h2>
      <dl className="space-y-6">
        {items.map((item) => (
          <div key={item.question} className="rounded-xl border border-gray-100 bg-gray-50/80 p-5">
            <dt className="font-semibold text-gray-900 mb-2">{item.question}</dt>
            <dd className="text-gray-700 leading-relaxed text-sm md:text-base">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
