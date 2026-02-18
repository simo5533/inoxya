"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfettiProps {
  trigger: boolean
  duration?: number
}

export function Confetti({ trigger, duration = 3000 }: ConfettiProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [trigger, duration])

  const colors = ["#D4AF37", "#FF8C00", "#FFD700", "#FFA500", "#FF6347", "#FF1493"]

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => {
            const color = colors[Math.floor(Math.random() * colors.length)]
            const left = Math.random() * 100
            const delay = Math.random() * 0.5
            const duration = 2 + Math.random() * 2

            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${left}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
                initial={{
                  y: -100,
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  x: (Math.random() - 0.5) * 200,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: 0,
                }}
                transition={{
                  duration,
                  delay,
                  ease: "easeOut",
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}

