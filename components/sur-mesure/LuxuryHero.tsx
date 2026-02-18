"use client"

import { motion } from "framer-motion"
import { Crown, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function LuxuryHero() {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F3] via-[#F5E6D3] to-[#1a1a1a]">
        {/* Grain texture subtil */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjkiIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]"></div>
        
        {/* Aurora effect - radial gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37] opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF8C00] opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37] opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Vignette subtile */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/10"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 shadow-lg backdrop-blur-sm px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Atelier Sur Mesure
            </Badge>
          </motion.div>
          
          {/* Titre premium avec dégradé or */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="text-gray-900">Bijoux </span>
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#FF8C00] to-[#D4AF37] bg-clip-text text-transparent animate-gradient">
              Sur Mesure
            </span>
          </motion.h1>
          
          {/* Sous-titre impactant */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-10 max-w-2xl mx-auto font-light"
          >
            Créez le bijou de vos rêves. Nos maîtres artisans transforment votre vision en pièce unique d'exception.
          </motion.p>
          
          {/* Bullets premium avec micro-animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center justify-center gap-8 text-sm md:text-base text-gray-600 flex-wrap"
          >
            {[
              { icon: "💎", text: "Pièce unique", delay: 0.4 },
              { icon: "🎨", text: "Design personnalisé", delay: 0.5 },
              { icon: "⭐", text: "Artisanat expert", delay: 0.6 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: item.delay }}
                whileHover={{ scale: 1.1, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-sm border border-[#D4AF37]/20 hover:bg-white/60 transition-all cursor-default"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

