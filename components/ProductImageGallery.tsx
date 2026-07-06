"use client"

import Image from "next/image"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getSafeImageSrc } from "@/lib/image-path"

interface ProductImageGalleryProps {
  mainImage: string
  images: string[]
  productName: string
  imageAlts?: string[]
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
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const thumbScrollRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef(false)

  useEffect(() => {
    setActiveIndex(0)
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = 0
    }
  }, [mainImageUrl, imagesUrls])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = mainScrollRef.current
    if (!container) return
    isProgrammaticScroll.current = true
    const clamped = Math.max(0, Math.min(index, allImages.length - 1))
    container.scrollTo({ left: clamped * container.clientWidth, behavior })
    setActiveIndex(clamped)
    window.setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 400)
  }, [allImages.length])

  const handleMainScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return
    const container = mainScrollRef.current
    if (!container || container.clientWidth === 0) return
    const index = Math.round(container.scrollLeft / container.clientWidth)
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

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      {/* Carrousel principal — swipe / scroll horizontal */}
      <div className="relative w-full min-w-0 max-w-full">
        <div
          ref={mainScrollRef}
          onScroll={handleMainScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide touch-pan-x rounded-xl shadow-lg bg-neutral-100/40"
          aria-label={`Galerie photos — ${productName}`}
        >
          {allImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative flex-shrink-0 w-full snap-center aspect-square sm:aspect-[4/5] min-h-0 sm:min-h-[400px]"
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={imageAlts[index] || (index === 0 ? mainAlt : `${productName} — vue ${index + 1}`)}
                title={index === 0 ? mainTitle : `${productName} — vue ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                draggable={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
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
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-stone-200/80 text-gray-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-white transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex >= allImages.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-stone-200/80 text-gray-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-white transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex ? "w-5 bg-amber-600" : "w-2 bg-white/80 hover:bg-white"
                  }`}
                  aria-label={`Photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures — défilement horizontal */}
      {hasMultiple && (
        <div
          ref={thumbScrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide pb-1 -mx-1 px-1 touch-pan-x"
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
                    ? "border-amber-600 ring-2 ring-amber-500/30 shadow-md"
                    : "border-stone-200/90 hover:border-amber-400/80"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={imageAlts[index] || `${productName} — miniature ${index + 1}`}
                  fill
                  className={`object-cover transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`}
                  sizes="80px"
                  draggable={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
