import CategorySeoPage, { generateCategoryMetadata } from '@/components/seo/CategorySeoPage'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  return generateCategoryMetadata('bracelets', locale)
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <CategorySeoPage slug="bracelets" locale={locale} />
}
