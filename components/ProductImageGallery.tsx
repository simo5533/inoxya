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

type Transform = { scale: number; x: number; y: number }

const MIN_SCALE = 1
const MAX_SCALE = 4

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

function ZoomableImage({
  src,
  alt,
  title,
  priority,
  sizes,
  className = "",
  onRequestFullscreen,
}: {
  src: string
  alt: string
  title?: string
  priority?: boolean
  sizes: string
  className?: string
  onRequestFullscreen?: () => void
}) {
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null)
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const lastTap = useRef(0)

  const resetTransform = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [])

  const applyScale = useCallback((nextScale: number) => {
    setTransform((prev) => {
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
      if (scale === 1) return { scale: 1, x: 0, y: 0 }
      return { ...prev, scale }
    })
  }, [])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    applyScale(transform.scale + delta)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = { distance: getTouchDistance(e.touches), scale: transform.scale }
      panStart.current = null
      return
    }
    if (e.touches.length === 1 && transform.scale > 1) {
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: transform.x,
        ty: transform.y,
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      if (distance <= 0) return
      const ratio = distance / pinchStart.current.distance
      applyScale(pinchStart.current.scale * ratio)
      return
    }
    if (e.touches.length === 1 && panStart.current && transform.scale > 1) {
      e.preventDefault()
      const dx = e.touches[0].clientX - panStart.current.x
      const dy = e.touches[0].clientY - panStart.current.y
      setTransform((prev) => ({
        ...prev,
        x: panStart.current!.tx + dx,
        y: panStart.current!.ty + dy,
      }))
    }
  }

  const onTouchEnd = () => {
    pinchStart.current = null
    panStart.current = null
    if (transform.scale <= 1.05) resetTransform()
  }

  const onDoubleClick = () => {
    if (transform.scale > 1) {
      resetTransform()
    } else {
      applyScale(2.2)
    }
  }

  const onClick = () => {
    const now = Date.now()
    if (now - lastTap.current < 320) {
      onDoubleClick()
      lastTap.current = 0
      return
    }
    lastTap.current = now
  }

  const isZoomed = transform.scale > 1

  return (
    <div
      className={`relative h-full w-full overflow-hidden select-none ${className}`}
      style={{ touchAction: isZoomed ? "none" : "pan-x pan-y pinch-zoom" }}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      <div
        className="relative h-full w-full will-change-transform transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: "center center",
        }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          title={title}
          fill
          className="object-contain pointer-events-none"
          priority={priority}
          sizes={sizes}
          draggable={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg"
          }}
        />
      </div>

      {onRequestFullscreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRequestFullscreen()
          }}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-stone-200/80 text-gray-800 hover:bg-white"
          aria-label="Voir en plein écran"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      )}

      {!isZoomed && (
        <p className="absolute bottom-3 right-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[10px] sm:text-xs text-white pointer-events-none">
          Pincez ou double-cliquez pour zoomer
        </p>
      )}
    </div>
  )
}

export default function ProductImageGallery({
  mainImage,
  images,
  productName,
  imageAlts = [],
}: ProductImageGalleryProps) {
  const mainImageUrl = useMemo(() => getSafeImageSrc(mainImage || ""), [mainImage])
  const imagesUrls = useMemo(() => {
    if (!images || !Array.isArray(images)) return []
    return images
      .filter((img) => typeof img === "string" && (img.startsWith("/") || img.startsWith("http")))
      .map((img) => getSafeImageSrc(img))
      .filter(Boolean)
  }, [images])

  const allImages = useMemo(() => {
    const merged = [mainImageUrl, ...imagesUrls].filter(Boolean)
    return merged.filter((img, index) => merged.indexOf(img) === index)
  }, [mainImageUrl, imagesUrls])

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxScale, setLightboxScale] = useState(1)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const thumbScrollRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef(false)

  useEffect(() => {
    setActiveIndex(0)
    if (mainScrollRef.current) mainScrollRef.current.scrollLeft = 0
  }, [mainImageUrl, imagesUrls])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(0, i - 1))
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(allImages.length - 1, i + 1))
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [lightboxOpen, allImages.length])

  useEffect(() => {
    if (lightboxOpen) setLightboxScale(1)
  }, [activeIndex, lightboxOpen])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = mainScrollRef.current
    if (!container) return
    isProgrammaticScroll.current = true
    const clamped = Math.max(0, Math.min(index, allImages.length - 1))
    container.scrollTo({ left: clamped * container.offsetWidth, behavior })
    setActiveIndex(clamped)
    window.setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 450)
  }, [allImages.length])

  const handleMainScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return
    const container = mainScrollRef.current
    if (!container || container.offsetWidth === 0) return
    const index = Math.round(container.scrollLeft / container.offsetWidth)
    setActiveIndex(Math.max(0, Math.min(index, allImages.length - 1)))
  }, [allImages.length])

  useEffect(() => {
    const thumb = thumbScrollRef.current?.children[activeIndex] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [activeIndex])

  const goPrev = () => scrollToIndex(activeIndex - 1)
  const goNext = () => scrollToIndex(activeIndex + 1)

  const mainAlt = imageAlts[0] || `${productName} — bijou acier inoxydable 316L INOXYA Maroc`
  const mainTitle = `${productName} — INOXYA BIJOUX`
  const hasMultiple = allImages.length > 1
  const currentSrc = allImages[activeIndex] || "/placeholder.svg"

  return (
    <>
      <div className="w-full min-w-0 max-w-full space-y-3">
        <div className="relative w-full min-w-0 max-w-full">
          <div
            ref={mainScrollRef}
            onScroll={handleMainScroll}
            className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide rounded-xl shadow-lg bg-neutral-100/40"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
            aria-label={`Galerie photos — ${productName}`}
          >
            {allImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative flex-[0_0_100%] min-w-full snap-center aspect-square sm:aspect-[4/5] min-h-[280px] sm:min-h-[400px]"
              >
                <ZoomableImage
                  src={image}
                  alt={imageAlts[index] || (index === 0 ? mainAlt : `${productName} — vue ${index + 1}`)}
                  title={index === 0 ? mainTitle : `${productName} — vue ${index + 1}`}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onRequestFullscreen={() => {
                    setActiveIndex(index)
                    setLightboxOpen(true)
                    setLightboxScale(1)
                  }}
                />
              </div>
            ))}
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md border border-stone-200/80 text-gray-800 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex >= allImages.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md border border-stone-200/80 text-gray-800 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => scrollToIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex ? "w-5 bg-amber-600" : "w-2 bg-white/90"
                    }`}
                    aria-label={`Photo ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {hasMultiple && (
          <div
            ref={thumbScrollRef}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide pb-1 px-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {allImages.map((image, index) => {
              const isSelected = index === activeIndex
              return (
                <button
                  key={`thumb-${image}-${index}`}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`relative flex-shrink-0 snap-center aspect-square w-[72px] sm:w-20 rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
                    isSelected
                      ? "border-amber-600 ring-2 ring-amber-500/30"
                      : "border-stone-200/90 hover:border-amber-400/80"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={imageAlts[index] || `${productName} — miniature ${index + 1}`}
                    fill
                    className={`object-cover ${isSelected ? "opacity-100" : "opacity-75"}`}
                    sizes="80px"
                    draggable={false}
                  />
                </button>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 sm:hidden">
          Glissez horizontalement pour voir les autres photos
        </p>
      </div>

      {/* Lightbox plein écran avec zoom */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom produit"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
            <span className="text-sm truncate">
              {productName} — {activeIndex + 1}/{allImages.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxScale((s) => clamp(s - 0.35, MIN_SCALE, MAX_SCALE))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Zoom arrière"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxScale((s) => clamp(s + 0.35, MIN_SCALE, MAX_SCALE))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Zoom avant"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 overflow-hidden">
            {hasMultiple && activeIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = activeIndex - 1
                  setActiveIndex(next)
                  scrollToIndex(next)
                }}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {hasMultiple && activeIndex < allImages.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = activeIndex + 1
                  setActiveIndex(next)
                  scrollToIndex(next)
                }}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <div
              className="absolute inset-0 overflow-auto p-4 flex items-start justify-center"
              style={{ WebkitOverflowScrolling: "touch" }}
              onWheel={(e) => {
                e.preventDefault()
                setLightboxScale((s) => clamp(s + (e.deltaY > 0 ? -0.2 : 0.2), MIN_SCALE, MAX_SCALE))
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSrc}
                alt={imageAlts[activeIndex] || mainAlt}
                className="h-auto transition-[width] duration-150 ease-out"
                style={{
                  width: lightboxScale <= 1 ? "100%" : `${100 * lightboxScale}%`,
                  maxWidth: "none",
                }}
                draggable={false}
              />
            </div>
          </div>

          <p className="shrink-0 pb-4 pt-2 text-center text-xs text-white/70">
            Pincez, faites défiler ou utilisez +/- pour zoomer · Double-cliquez sur l&apos;image produit
          </p>
        </div>
      )}
    </>
  )
}
