"use client"

import Image from "next/image"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, X, Minus, Plus } from "lucide-react"
import { getSafeImageSrc } from "@/lib/image-path"

interface ProductImageGalleryProps {
  mainImage: string
  images: string[]
  productName: string
  imageAlts?: string[]
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export default function ProductImageGallery({
  mainImage,
  images,
  productName,
  imageAlts = [],
}: ProductImageGalleryProps) {
  const mainImageUrl = useMemo(() => getSafeImageSrc(mainImage || ""), [mainImage])
  const extraUrls = useMemo(() => {
    if (!images?.length) return []
    return images
      .filter((img) => typeof img === "string" && (img.startsWith("/") || img.startsWith("http")))
      .map((img) => getSafeImageSrc(img))
      .filter(Boolean)
  }, [images])

  const allImages = useMemo(() => {
    const merged = [mainImageUrl, ...extraUrls].filter(Boolean)
    return merged.filter((img, i) => merged.indexOf(img) === i)
  }, [mainImageUrl, extraUrls])

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const lightboxImgRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)
  const scrollingRef = useRef(false)

  const scrollTo = useCallback((index: number, smooth = true) => {
    const track = trackRef.current
    if (!track) return
    const i = clamp(index, 0, allImages.length - 1)
    scrollingRef.current = true
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" })
    setActiveIndex(i)
    window.setTimeout(() => {
      scrollingRef.current = false
    }, 350)
  }, [allImages.length])

  useEffect(() => {
    setActiveIndex(0)
    if (trackRef.current) trackRef.current.scrollLeft = 0
  }, [mainImageUrl, extraUrls])

  useEffect(() => {
    const el = thumbRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [activeIndex])

  useEffect(() => {
    if (!lightboxOpen) return
    setZoom(1)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") scrollTo(activeIndex - 1)
      if (e.key === "ArrowRight") scrollTo(activeIndex + 1)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [lightboxOpen, activeIndex, scrollTo])

  const onTrackScroll = () => {
    if (scrollingRef.current) return
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    scrollTo(index, false)
    setZoom(1)
    setLightboxOpen(true)
  }

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom }
    }
  }

  const onLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchRef.current.dist
      setZoom(clamp(pinchRef.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM))
    }
  }

  const onLightboxTouchEnd = () => {
    pinchRef.current = null
  }

  const hasMultiple = allImages.length > 1
  const current = allImages[activeIndex] || "/placeholder.svg"
  const altFor = (i: number) =>
    imageAlts[i] || `${productName} — bijou acier inoxydable INOXYA${i > 0 ? ` vue ${i + 1}` : ""}`

  return (
    <>
      <div className="w-full min-w-0 space-y-3">
        {/* Bandeau actions */}
        <div className="flex items-center justify-between gap-2 text-xs text-gray-600 px-0.5">
          <span>
            {hasMultiple
              ? `Photo ${activeIndex + 1} / ${allImages.length} — glissez pour naviguer`
              : "Touchez Agrandir pour zoomer"}
          </span>
          <button
            type="button"
            onClick={() => openLightbox(activeIndex)}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 shrink-0"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Agrandir
          </button>
        </div>

        {/* Carrousel — scroll natif, sans overlay touch bloquant */}
        <div className="relative rounded-xl shadow-lg bg-neutral-100/50 overflow-hidden">
          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="product-gallery-track flex w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth"
          >
            {allImages.map((src, index) => (
              <button
                key={`slide-${src}-${index}`}
                type="button"
                onClick={() => openLightbox(index)}
                className="relative flex-[0_0_100%] w-full shrink-0 snap-center aspect-square sm:aspect-[4/5] min-h-[280px] sm:min-h-[400px] cursor-zoom-in bg-neutral-50"
                aria-label={`Voir ${productName} en grand — photo ${index + 1}`}
              >
                <Image
                  src={src || "/placeholder.svg"}
                  alt={altFor(index)}
                  fill
                  className="object-contain p-2 pointer-events-none"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  draggable={false}
                />
              </button>
            ))}
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => scrollTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 disabled:opacity-30"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(activeIndex + 1)}
                disabled={activeIndex >= allImages.length - 1}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 disabled:opacity-30"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Miniatures scrollables */}
        {hasMultiple && (
          <div
            ref={thumbRef}
            className="product-gallery-track flex gap-2 overflow-x-auto pb-1"
          >
            {allImages.map((src, index) => (
              <button
                key={`thumb-${src}-${index}`}
                type="button"
                onClick={() => scrollTo(index)}
                className={`relative shrink-0 w-[72px] sm:w-20 aspect-square rounded-lg overflow-hidden border-2 ${
                  index === activeIndex ? "border-amber-600 ring-2 ring-amber-500/30" : "border-stone-200"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="80px" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Plein écran + zoom */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom produit"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white shrink-0 bg-black/80">
            <span className="text-sm truncate pr-2">
              {productName} ({activeIndex + 1}/{allImages.length})
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoom((z) => clamp(z - 0.5, MIN_ZOOM, MAX_ZOOM))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label="Réduire"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => clamp(z + 0.5, MIN_ZOOM, MAX_ZOOM))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label="Agrandir"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ml-1"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            {hasMultiple && activeIndex > 0 && (
              <button
                type="button"
                onClick={() => scrollTo(activeIndex - 1)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {hasMultiple && activeIndex < allImages.length - 1 && (
              <button
                type="button"
                onClick={() => scrollTo(activeIndex + 1)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <div
              ref={lightboxImgRef}
              className="absolute inset-0 overflow-auto overscroll-contain"
              onTouchStart={onLightboxTouchStart}
              onTouchMove={onLightboxTouchMove}
              onTouchEnd={onLightboxTouchEnd}
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y pinch-zoom" }}
            >
              <div
                className="flex min-h-full min-w-full items-center justify-center p-4"
                style={{ minWidth: zoom > 1 ? `${zoom * 100}%` : "100%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current}
                  alt={altFor(activeIndex)}
                  className="max-w-none h-auto select-none"
                  style={{
                    width: `${100 * zoom}%`,
                    maxWidth: "none",
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <p className="shrink-0 py-3 text-center text-xs text-white/60">
            Pincez avec 2 doigts · Utilisez +/− · Faites défiler l&apos;image zoomée
          </p>
        </div>
      )}
    </>
  )
}
