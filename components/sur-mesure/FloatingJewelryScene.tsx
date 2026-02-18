"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

interface JewelryElement {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  delay: number
  duration: number
  image: string
  zIndex: number
}

// Images de bijoux réels du projet
const jewelryImages = [
  "/images/bijoux/bagues/bague-solitaire-premium/main.jpg",
  "/images/bijoux/bagues/bague-alliance-diamantee/main.jpg",
  "/images/bijoux/bagues/bague-berbere-or-18k/main.jpg",
  "/images/bijoux/colliers/collier-filigrane-argent/main.jpg",
  "/images/bijoux/bracelets/bracelet-khomsa-protection/main.jpg",
  "/images/categories/bagues-category.jpeg",
  "/images/categories/colliers-category.jpeg",
  "/images/categories/bracelets-category.jpeg",
  "/images/categories/boucles-oreilles-category.jpeg",
]

export default function FloatingJewelryScene() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Moins d'éléments sur mobile pour performance
  const elementCount = isMobile ? 4 : 8

  const elements: JewelryElement[] = Array.from({ length: elementCount }, (_, i) => ({
    id: i,
    x: (i * 137.5) % 100,
    y: (i * 73) % 100,
    size: isMobile ? 80 : 120 + (i % 3) * 40,
    rotation: i * 45,
    delay: i * 0.4,
    duration: 12 + (i % 4) * 3,
    image: jewelryImages[i % jewelryImages.length] || jewelryImages[0] || '/placeholder.svg',
    zIndex: i % 3
  }))

  if (reducedMotion) {
    return null
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Gradient overlay pour profondeur */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A0F]/95 via-[#0B1220]/90 to-[#070A0F]/95"></div>
      
      {/* Spotlight animé */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(201, 162, 39, 0.15), transparent 60%)",
            "radial-gradient(circle at 80% 70%, rgba(214, 179, 106, 0.15), transparent 60%)",
            "radial-gradient(circle at 50% 50%, rgba(201, 162, 39, 0.12), transparent 60%)",
            "radial-gradient(circle at 20% 30%, rgba(201, 162, 39, 0.15), transparent 60%)",
          ]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Particules dorées subtiles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-[#C9A227] rounded-full opacity-30"
          style={{
            left: `${(i * 47) % 100}%`,
            top: `${(i * 73) % 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + (i % 3),
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Bijoux flottants avec vraies images */}
      {elements.map((element) => {
        const parallaxY = useTransform(scrollYProgress, [0, 1], [0, element.size * 0.4])
        const parallaxX = useTransform(scrollYProgress, [0, 1], [0, element.size * 0.2])
        const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.1, 1])

        return (
          <motion.div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              x: parallaxX,
              y: parallaxY,
              scale: scale,
              zIndex: element.zIndex,
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [element.rotation, element.rotation + 360],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Container avec glow effect */}
            <div className="relative w-full h-full group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/20 via-[#D6B36A]/10 to-transparent rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Image du bijou */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[#D6B36A]/30 shadow-2xl backdrop-blur-sm">
                <Image
                  src={element.image}
                  alt={`Bijou flottant ${element.id + 1}`}
                  fill
                  className="object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                  sizes={`${element.size}px`}
                  quality={85}
                />
                
                {/* Overlay avec gradient doré */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/10 via-transparent to-[#D6B36A]/20 mix-blend-overlay"></div>
                
                {/* Highlight specular */}
                <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-white/40 via-white/20 to-transparent blur-sm opacity-60"></div>
              </div>
              
              {/* Reflet animé */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1), transparent 50%)",
                    "radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1), transparent 50%)",
                    "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1), transparent 50%)",
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
