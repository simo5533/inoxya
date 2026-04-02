import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getDatabaseAdapter } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, ExternalLink } from "lucide-react"
import type { Pack } from "@/lib/db/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeImg(url: string | undefined): string {
  if (!url?.trim()) return "/placeholder.svg"
  const u = url.trim().replace(/^"|"$/g, "")
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/")) return u
  return "/placeholder.svg"
}

async function fetchPack(id: string): Promise<Pack | null> {
  try {
    const adapter = await getDatabaseAdapter()
    const p = await adapter.getPackById(id)
    if (p) return p
  } catch {
    /* sqlite / pack-management en secours */
  }
  const { getPackById } = await import("@/lib/pack-management")
  const legacy = await getPackById(id)
  if (!legacy) return null
  return {
    id: String(legacy.id),
    name: legacy.name,
    slug: legacy.slug,
    description: legacy.description,
    price: Number(legacy.price),
    image_url: legacy.image_url,
    is_featured: Boolean(legacy.is_featured),
  }
}

export default async function AdminPackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/fr/login?redirect=/admin/packs")
  }
  if (user.role !== "admin") {
    redirect("/fr")
  }

  const { id } = await params
  const rawId = id?.trim()
  if (!rawId) {
    notFound()
  }

  const pack = await fetchPack(rawId)
  if (!pack) {
    notFound()
  }

  const img = safeImg(pack.image_url)
  const priceLabel = new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
  }).format(pack.price)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/packs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Gestion des packs
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/packs/verify">Vérification</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/fr/packs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Catalogue public
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex flex-wrap items-center gap-2">
              <Package className="w-6 h-6 shrink-0" />
              <span>{pack.name}</span>
              {pack.is_featured ? (
                <Badge className="bg-orange-600">Mis en avant</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-video relative max-w-md bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={img}
                alt={pack.name}
                fill
                className="object-cover"
                sizes="448px"
                unoptimized={img.startsWith("http")}
              />
            </div>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-gray-500">ID</dt>
                <dd>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{pack.id}</code>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Slug</dt>
                <dd>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{pack.slug}</code>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Prix</dt>
                <dd className="text-xl font-bold text-orange-600">{priceLabel}</dd>
              </div>
              {pack.description ? (
                <div>
                  <dt className="text-gray-500 mb-1">Description</dt>
                  <dd className="text-gray-800 whitespace-pre-wrap">{pack.description}</dd>
                </div>
              ) : null}
              {pack.image_url ? (
                <div>
                  <dt className="text-gray-500">Chemin / URL image</dt>
                  <dd className="break-all text-xs text-gray-700">{pack.image_url}</dd>
                </div>
              ) : null}
            </dl>
            <p className="text-sm text-gray-500 border-t pt-4">
              Pour modifier ce pack, ouvrez la{" "}
              <Link className="text-orange-600 underline hover:no-underline" href="/admin/packs">
                gestion des packs
              </Link>{" "}
              et utilisez « Modifier » sur la carte correspondante.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
