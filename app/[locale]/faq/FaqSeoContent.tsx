import { getTranslations } from 'next-intl/server'
import { FAQPageJsonLd } from '@/components/SEOJsonLd'

/** FAQ statique pour le HTML initial + JSON-LD (indexation). */
export async function FaqSeoContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'faq' })

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map((n) => {
      try {
        return {
          question: t(`questions.q${n}`),
          answer: t(`questions.a${n}`),
        }
      } catch {
        return null
      }
    })
    .filter((x): x is { question: string; answer: string } => Boolean(x?.question && x?.answer))

  if (items.length === 0) return null

  return (
    <>
      <FAQPageJsonLd items={items} />
      {/* Contenu visible pour crawlers même si le client hydrate l’accordéon */}
      <section className="sr-only" aria-hidden="false">
        <h2>{t('title')}</h2>
        {items.map((item, i) => (
          <div key={i}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    </>
  )
}
