"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, PenTool, Truck } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const steps = [
  {
    icon: Lightbulb,
    title: "Inspiration",
    description: "Partagez votre vision et vos idées. Notre équipe de designers vous accompagne pour définir chaque détail de votre bijou unique.",
    color: "from-[#D4AF37] to-[#FF8C00]",
  },
  {
    icon: PenTool,
    title: "Conception",
    description: "Nos maîtres artisans créent un design exclusif et vous présentent des esquisses détaillées avant la réalisation.",
    color: "from-[#FF8C00] to-[#D4AF37]",
  },
  {
    icon: Truck,
    title: "Livraison",
    description: "Votre bijou sur mesure est créé avec soin et livré dans un écrin premium, accompagné d'un certificat d'authenticité.",
    color: "from-[#D4AF37] via-[#FF8C00] to-[#D4AF37]",
  },
]

export default function ProcessSteps() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
    <section className="py-20 bg-gradient-to-b from-white via-[#FAF8F3] to-white" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Comment ça marche
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Un processus simple et raffiné pour créer votre bijou unique
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="h-full bg-white/60 backdrop-blur-sm border border-[#D4AF37]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    {/* Icône avec dégradé */}
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-700 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Numéro d'étape */}
                    <div className="mt-6 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 text-[#D4AF37] font-bold text-lg">
                      {index + 1}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

