"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ShoppingBag, Sparkles, Trash2 } from "lucide-react"
import {
  computePackTotals,
  PACK_BUILDER_MAX_ITEMS,
  STOCK_UNKNOWN,
  type PackBuilderLine,
} from "@/lib/custom-pack"
import { addCustomPackToCart } from "@/lib/cart-favorites"
import { getSafeImageSrc } from "@/lib/image-path"

type ApiProduct = {
  id: number | string
  name: string
  price: number
  image_url?: string | null
  main_image?: string | null
  stock?: number
  category?: string
}

function productImage(p: ApiProduct): string {
  const raw = p.main_image || p.image_url || "/placeholder.svg"
  return getSafeImageSrc(String(raw))
}

function stockValue(p: ApiProduct): number {
  return typeof p.stock === "number" ? p.stock : STOCK_UNKNOWN
}

export default function CreerPackPage() {
  const t = useTranslations("packs.creer")
  const tProducts = useTranslations("products")
  const locale = useLocale()
  const { toast } = useToast()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [lines, setLines] = useState<PackBuilderLine[]>([])
  const linesRef = useRef<PackBuilderLine[]>([])
  linesRef.current = lines

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setFetchError(false)
      try {
        const res = await fetch("/api/products?for_pack=1", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })
        if (!res.ok) {
          if (!cancelled) {
            setProducts([])
            setFetchError(true)
          }
          return
        }
        const data = await res.json()
        const list: ApiProduct[] = Array.isArray(data) ? data : data?.products ?? []
        if (!cancelled) setProducts(list)
      } catch {
        if (!cancelled) {
          setProducts([])
          setFetchError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const eligibleProducts = useMemo(() => {
    return products.filter((p) => {
      const pr = Number(p.price)
      return Number.isFinite(pr) && pr > 0
    })
  }, [products])

  const totals = useMemo(() => computePackTotals(lines), [lines])

  const stockFor = useCallback(
    (productId: string) => {
      const p = products.find((x) => String(x.id) === productId)
      if (!p) return 0
      const st = stockValue(p)
      if (st === STOCK_UNKNOWN) return 9999
      return st
    },
    [products]
  )

  const toggleProduct = useCallback(
    (p: ApiProduct) => {
      const id = String(p.id)
      const st = stockValue(p)
      if (st === 0) {
        toast({
          title: t("stockError"),
          variant: "destructive",
        })
        return
      }
      const price = Number(p.price) || 0
      if (price <= 0 || !Number.isFinite(price)) return

      const prev = linesRef.current
      const existing = prev.find((l) => l.productId === id)
      if (existing) {
        setLines((cur) => cur.filter((l) => l.productId !== id))
        toast({
          title: t("removedFromPack"),
          description: p.name,
        })
        return
      }
      if (prev.length >= PACK_BUILDER_MAX_ITEMS) {
        toast({
          title: t("packFull"),
          description: t("packFullHint"),
        })
        return
      }
      const img = productImage(p)
      setLines((cur) => [
        ...cur,
        {
          productId: id,
          name: p.name,
          price,
          image_url: img,
          quantity: 1,
        },
      ])
      toast({
        title: t("addedToPack"),
        description: p.name,
      })
    },
    [toast, t]
  )

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const handleAddToCart = () => {
    if (lines.length === 0) {
      toast({
        title: t("needOne"),
        variant: "destructive",
      })
      return
    }
    for (const line of lines) {
      if (stockFor(line.productId) < line.quantity) {
        toast({
          title: t("stockError"),
          description: line.name,
          variant: "destructive",
        })
        return
      }
    }
    addCustomPackToCart(lines)
    window.dispatchEvent(new CustomEvent("cart-updated"))
    toast({
      title: t("added"),
      description: t("addedDesc"),
    })
    setLines([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-amber-50/30 pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-12">
      <div className="container mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <Link
          href={`/${locale}/packs`}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-amber-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backPacks")}
        </Link>

        <div className="mb-8 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-amber-900/90">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {t("discountAuto")}
            </div>
            <div className="inline-flex items-center rounded-full border border-stone-200/90 bg-white/70 px-3 py-1 text-xs text-stone-700">
              {t("chooseUpTo6")}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto md:mx-0 text-sm md:text-base">
            {t("subtitle")}
          </p>
          <p className="text-xs text-stone-500 mt-2">{t("addHint")}</p>
        </div>

        {fetchError && !loading && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
          >
            {t("fetchError")}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 rounded-full border-2 border-amber-600/30 border-t-amber-700 animate-spin" />
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : eligibleProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-stone-200 bg-white/60">
            <p className="text-stone-700 mb-2">{t("empty")}</p>
            <p className="text-sm text-stone-500 mb-6">{t("emptyHint")}</p>
            <Button asChild variant="outline" className="border-amber-300">
              <Link href={`/${locale}/bijoux`}>{t("browseJewelry")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {eligibleProducts.map((p) => {
                  const id = String(p.id)
                  const inPack = lines.some((l) => l.productId === id)
                  const st = stockValue(p)
                  const disabled = st === 0
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={disabled}
                      aria-pressed={inPack}
                      onClick={() => toggleProduct(p)}
                      className={`group text-left rounded-2xl border overflow-hidden bg-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                        inPack
                          ? "ring-2 ring-amber-500/70 border-amber-400/90 shadow-md"
                          : "border-stone-200/80"
                      } ${
                        disabled
                          ? "opacity-50 cursor-not-allowed border-stone-200"
                          : "hover:border-amber-300/80 hover:shadow-md active:scale-[0.99]"
                      }`}
                    >
                      <div className="relative aspect-square bg-stone-100">
                        <Image
                          src={productImage(p)}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width:640px) 50vw, 33vw"
                        />
                        {inPack && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                            <Badge className="bg-amber-600 text-white border-0 shadow-lg">
                              {t("selectedBadge")}
                            </Badge>
                          </div>
                        )}
                        {disabled && (
                          <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                            <Badge variant="secondary" className="text-[10px]">
                              {tProducts("outOfStock")}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium text-stone-900 line-clamp-2 min-h-[2.5rem]">
                          {p.name}
                        </p>
                        <p className="text-sm font-semibold text-amber-800">
                          {Number(p.price).toFixed(0)} MAD
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <aside className="lg:col-span-5 xl:col-span-4 hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur shadow-lg p-5 space-y-4">
                <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-700" />
                  {t("summaryTitle")}
                </h2>
                <p className="text-sm font-medium text-amber-900/90 tabular-nums">
                  {t("selectionCount", { count: lines.length })}
                </p>
                <p className="text-xs text-stone-500">{t("discountAuto")}</p>
                {lines.length === 0 ? (
                  <p className="text-sm text-stone-500">{t("needOne")}</p>
                ) : (
                  <ul className="space-y-3 max-h-[min(50vh,28rem)] overflow-y-auto pr-1">
                    {lines.map((line) => (
                      <li
                        key={line.productId}
                        className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-2"
                      >
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-200">
                          <Image
                            src={line.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {line.name}
                          </p>
                          <p className="text-xs text-stone-600">
                            {line.price.toFixed(0)} MAD × {line.quantity}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-stone-500 hover:text-red-600"
                          onClick={() => removeLine(line.productId)}
                          aria-label={t("remove")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>{t("subtotal")}</span>
                    <span>{totals.subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{t("discount")}</span>
                    <span>−{totals.discountAmount.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-stone-900 pt-1">
                    <span>{t("total")}</span>
                    <span>{totals.total.toFixed(2)} MAD</span>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md"
                  disabled={lines.length === 0}
                  onClick={handleAddToCart}
                >
                  {t("addToCart")}
                </Button>
                <Button asChild variant="ghost" className="w-full text-stone-600">
                  <Link href={`/${locale}/bijoux`}>{t("browseJewelry")}</Link>
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {!loading && eligibleProducts.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-end justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-stone-500">
                {t("summaryTitle")} · {t("selectionCount", { count: lines.length })}
              </p>
              <p className="text-lg font-semibold text-stone-900 truncate">
                {lines.length === 0 ? "—" : `${totals.total.toFixed(2)} MAD`}
              </p>
              <p className="text-[11px] text-emerald-700 line-clamp-2">
                {t("discountAuto")} · −{totals.discountAmount.toFixed(2)} MAD
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 sm:px-5 text-sm"
              disabled={lines.length === 0}
              onClick={handleAddToCart}
            >
              <span className="hidden sm:inline">{t("addToCart")}</span>
              <span className="sm:hidden">{t("addToCartShort")}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
