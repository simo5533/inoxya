"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface JewelryShape {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  delay: number
  duration: number
}

export default function FloatingJewelryBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Formes abstraites de bijoux (positions fixes pour éviter CLS)
  const shapes: JewelryShape[] = [
    { id: 1, x: 10, y: 20, size: 80, rotation: 0, delay: 0, duration: 8 },
    { id: 2, x: 85, y: 15, size: 60, rotation: 45, delay: 2, duration: 10 },
    { id: 3, x: 20, y: 70, size: 100, rotation: 90, delay: 1, duration: 12 },
    { id: 4, x: 75, y: 80, size: 70, rotation: 135, delay: 3, duration: 9 },
    { id: 5, x: 50, y: 50, size: 50, rotation: 180, delay: 1.5, duration: 11 },
  ]

  if (reducedMotion) {
    return null // Pas d'animation si l'utilisateur préfère
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
          }}
          initial={{ opacity: 0.1 }}
          animate={{
            y: [0, -20, 0],
            rotate: [shape.rotation, shape.rotation + 360],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Forme abstraite de bijou en CSS pur */}
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.3), rgba(255, 140, 0, 0.2), transparent 70%)`,
              borderRadius: "50%",
              filter: "blur(20px)",
              mixBlendMode: "multiply",
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

