export function HomeSeoIntro({ locale }: { locale: string }) {
  if (locale !== 'fr') return null

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight text-center">
          Bijoux en acier inoxydable au Maroc — INOXYA BIJOUX
        </h1>
        <p className="text-gray-700 text-center leading-relaxed text-base md:text-lg">
          Découvrez INOXYA BIJOUX, boutique marocaine de bijoux en acier inoxydable 316L : bagues,
          bracelets, colliers, boucles d&apos;oreilles, montres et packs cadeaux. Livraison partout au
          Maroc, paiement à la livraison et retour gratuit sous 30 jours.
        </p>
      </div>
    </section>
  )
}
