'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { 
  Search, 
  ChevronDown, 
  Copy, 
  CheckCircle2,
  Truck,
  CreditCard,
  Gem,
  RotateCcw,
  Sparkles,
  Shield,
  ArrowRight,
  HelpCircle,
  Star
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'

const faqData = [
  {
    id: 1,
    question: "Quels matériaux utilisez-vous pour vos bijoux ?",
    answer: "Nos bijoux sont fabriqués en acier inoxydable 316L de qualité premium, garantissant une résistance exceptionnelle à l'oxydation et une durabilité à vie. Tous nos bijoux sont hypoallergéniques et parfaitement adaptés aux peaux sensibles.",
    answerLinks: [
      { text: "collection", href: "/bijoux" }
    ],
    icon: Gem,
    category: "Produits"
  },
  {
    id: 2,
    question: "Vos bijoux sont-ils garantis ?",
    answer: "Oui, tous nos bijoux bénéficient d'une garantie à vie contre l'oxydation et les défauts de fabrication. Nous garantissons également la satisfaction client : si vous n'êtes pas satisfait, nous vous remboursons intégralement sous 30 jours.",
    answerLinks: [],
    icon: Shield,
    category: "Garantie"
  },
  {
    id: 3,
    question: "Comment commander un bijou sur mesure ?",
    answer: "Rendez-vous sur notre page Sur Mesure et remplissez le formulaire détaillé avec vos préférences. Notre équipe d'artisans vous contactera sous 48h pour discuter de votre projet et vous proposer un devis personnalisé.",
    answerLinks: [
      { text: "Sur Mesure", href: "/sur-mesure" }
    ],
    icon: Sparkles,
    category: "Sur mesure"
  },
  {
    id: 4,
    question: "Quels sont les délais de livraison ?",
    answer: "La livraison standard prend 2-5 jours ouvrés au Maroc. Pour les commandes express, nous proposons une livraison en 24h dans les grandes villes. La livraison est gratuite dès 200 MAD d'achat.",
    answerLinks: [],
    icon: Truck,
    category: "Livraison"
  },
  {
    id: 5,
    question: "Acceptez-vous les retours ?",
    answer: "Oui, nous acceptons les retours sous 30 jours après réception. Les bijoux doivent être dans leur état d'origine, non portés et avec leur emballage. Les frais de retour sont à votre charge sauf en cas de défaut.",
    answerLinks: [],
    icon: RotateCcw,
    category: "Retours"
  },
  {
    id: 6,
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons le paiement à la livraison (contre remboursement), les virements bancaires, et les paiements en ligne sécurisés. Tous les paiements sont 100% sécurisés et cryptés.",
    answerLinks: [],
    icon: CreditCard,
    category: "Paiement"
  },
  {
    id: 7,
    question: "Proposez-vous des packs de bijoux ?",
    answer: "Oui, nous proposons des packs exclusifs qui regroupent plusieurs bijoux assortis à prix avantageux. Parfait pour offrir ou pour compléter votre collection.",
    answerLinks: [
      { text: "packs exclusifs", href: "/packs" }
    ],
    icon: Gem,
    category: "Produits"
  },
  {
    id: 8,
    question: "Comment entretenir mes bijoux INOXYA ?",
    answer: "Nos bijoux en acier inoxydable nécessitent peu d'entretien. Un simple nettoyage avec un chiffon doux suffit. Évitez les produits chimiques agressifs. Pour un éclat optimal, utilisez notre kit de nettoyage premium (offert avec chaque commande).",
    answerLinks: [],
    icon: Shield,
    category: "Produits"
  }
]

const categories = ["Tous", "Livraison", "Paiement", "Produits", "Retours", "Sur mesure", "Garantie"]

// Composant bijou 3D flottant élégant
function FloatingJewel3D({ index }: { index: number }) {
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  // Tous les Hooks doivent être appelés de manière inconditionnelle
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 10 })
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 10 })

  const opacity = useTransform(springRotateX, [-10, 10], [0.3, 0.6])
  
  // Transformations pour le style (doivent être appelées inconditionnellement)
  const rotateXTransform = useTransform(springRotateX, (v) => `${v}deg`)
  const rotateYTransform = useTransform(springRotateY, (v) => `${v}deg`)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !mounted || !ref.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) / 20
      const deltaY = (e.clientY - centerY) / 20
      
      rotateX.set(deltaY)
      rotateY.set(-deltaX)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mounted, rotateX, rotateY])

  const jewelTypes = [Gem, Star, Sparkles] as const
  const JewelIcon = jewelTypes[index % 3]
  const size = 60 + (index % 3) * 15
  const delay = index * 0.2

  if (!mounted || !JewelIcon) return null

  return (
    <motion.div
      ref={ref}
      className="absolute pointer-events-none z-0"
      style={{
        x: springX,
        y: springY,
        width: `${size}px`,
        height: `${size}px`,
        left: `${20 + (index % 4) * 25}%`,
        top: `${15 + Math.floor(index / 4) * 30}%`,
        opacity,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.4, 0.3, 0.4],
        scale: [0, 1.1, 1, 1.05],
        rotateZ: [0, 360],
      }}
      transition={{
        opacity: { duration: 2, delay, repeat: Infinity, repeatDelay: 2 },
        scale: { duration: 3, delay, repeat: Infinity },
        rotateZ: { duration: 20 + index * 2, repeat: Infinity, ease: "linear" },
      }}
    >
      <motion.div
        style={{
          rotateX: rotateXTransform,
          rotateY: rotateYTransform,
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <div className="relative w-full h-full">
          {/* Glow externe subtil */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%)`,
              filter: 'blur(20px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3 + index * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Cercle de lumière interne */}
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-br from-luxury-gold/20 via-luxury-gold/10 to-transparent"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 15 + index * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              boxShadow: '0 0 20px rgba(212,175,55,0.3), inset 0 0 10px rgba(255,255,255,0.1)',
            }}
          />
          
          {/* Icône bijou avec rotation 3D */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              duration: 25 + index * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <JewelIcon className="w-8 h-8 text-luxury-gold drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.6))' }} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FAQClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mediaQuery.matches)
      
      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handleChange)

      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', handleMouseMove)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
    return undefined
  }, [])

  const filteredFAQs = useMemo(() => {
    return faqData.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const handleCopyLink = async (id: number) => {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/faq#faq-${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const renderAnswerWithLinks = (answer: string, links: Array<{ text: string; href: string }>): React.ReactNode => {
    if (links.length === 0) {
      return <p>{answer}</p>
    }
    
    const parts: React.ReactNode[] = []
    let processedText = answer
    let lastIndex = 0
    
    const sortedLinks = [...links].sort((a, b) => {
      const indexA = processedText.toLowerCase().indexOf(a.text.toLowerCase())
      const indexB = processedText.toLowerCase().indexOf(b.text.toLowerCase())
      return indexA - indexB
    })
    
    sortedLinks.forEach((link, linkIdx) => {
      const searchText = link.text
      const index = processedText.toLowerCase().indexOf(searchText.toLowerCase(), lastIndex)
      
      if (index !== -1 && index >= lastIndex) {
        if (index > lastIndex) {
          parts.push(processedText.substring(lastIndex, index))
        }
        
        parts.push(
          <Link
            key={`link-${linkIdx}`}
            href={link.href}
            className="text-luxury-gold hover:underline font-medium"
          >
            {processedText.substring(index, index + searchText.length)}
          </Link>
        )
        
        lastIndex = index + searchText.length
      }
    })
    
    if (lastIndex < processedText.length) {
      parts.push(processedText.substring(lastIndex))
    }
    
    if (parts.length === 0) {
      return <p>{answer}</p>
    }
    
    return <p>{parts}</p>
  }

  return (
    <div className="min-h-screen bg-luxury-black relative overflow-hidden">
      {/* Effet de lumière suivant la souris */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(212,175,55,0.08), transparent 50%)`,
        }}
        animate={{
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Bijoux 3D flottants en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <FloatingJewel3D 
            key={i} 
            index={i}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden z-10">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-charcoal via-luxury-black to-luxury-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />
        
        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            {/* Gemme centrale 3D */}
            <motion.div
              className="inline-block mb-8"
              animate={reducedMotion ? {} : {
                rotateY: [0, 360],
                rotateX: [0, 15, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotateY: {
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                },
                rotateX: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="relative w-32 h-32 mx-auto">
                {/* Glow externe pulsant */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-luxury-gold/30 via-luxury-gold/20 to-transparent"
                  animate={reducedMotion ? {} : {
                    boxShadow: [
                      '0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(212,175,55,0.2)',
                      '0 0 60px rgba(212,175,55,0.6), 0 0 120px rgba(212,175,55,0.3)',
                      '0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(212,175,55,0.2)',
                    ],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Cercle interne brillant */}
                <motion.div
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-luxury-gold/40 to-luxury-gold/20"
                  animate={reducedMotion ? {} : {
                    opacity: [0.6, 1, 0.6],
                    rotate: [0, 360],
                  }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                  }}
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2), 0 0 20px rgba(212,175,55,0.4)',
                  }}
                />
                
                {/* Gemme centrale */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={reducedMotion ? {} : {
                    rotateZ: [0, 360],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Gem className="w-16 h-16 text-luxury-gold drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.8))' }} />
                </motion.div>
              </div>
            </motion.div>

            <Badge className="mb-6 bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 px-4 py-2 text-sm font-semibold">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support & Assistance
            </Badge>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
            >
              FAQ
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-luxury-ivory/80 max-w-2xl mx-auto leading-relaxed"
            >
              Retours 30 jours • Livraison gratuite dès 200 MAD • Acier inoxydable 316L
            </motion.p>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-luxury-ivory/50" />
              <Input
                type="text"
                placeholder="Rechercher dans la FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-luxury-charcoal border border-luxury-gold/20 text-luxury-ivory placeholder:text-luxury-ivory/50 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all duration-200"
              />
            </div>
          </motion.div>

          {/* Category Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto mb-12"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-luxury-gold text-luxury-black shadow-lg shadow-luxury-gold/30'
                    : 'bg-luxury-charcoal text-luxury-ivory/80 border border-luxury-gold/20 hover:border-luxury-gold/40 hover:text-luxury-gold'
                }`}
                whileHover={reducedMotion ? {} : { scale: 1.05, y: -2 }}
                whileTap={reducedMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="relative py-12 pb-20 z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                <AnimatePresence mode="wait">
                  {filteredFAQs.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ 
                          duration: reducedMotion ? 0 : 0.3,
                          delay: reducedMotion ? 0 : index * 0.05 
                        }}
                        id={`faq-${item.id}`}
                      >
                        <AccordionItem
                          value={`item-${item.id}`}
                          className="border border-luxury-gold/20 rounded-2xl overflow-hidden bg-luxury-charcoal/50 backdrop-blur-sm hover:border-luxury-gold/40 transition-all duration-200 hover:shadow-lg hover:shadow-luxury-gold/10 group/item"
                        >
                          <div className="flex items-center gap-2 px-6 py-5">
                            <AccordionTrigger className="flex-1 hover:no-underline group">
                              <div className="flex items-center gap-4 flex-1 text-left">
                                <motion.div 
                                  className="w-12 h-12 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center flex-shrink-0 group-hover:bg-luxury-gold/20 transition-colors duration-200"
                                  whileHover={reducedMotion ? {} : { 
                                    rotateY: 15,
                                    rotateX: -5,
                                    scale: 1.1
                                  }}
                                  transition={{ duration: 0.2 }}
                                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                                >
                                  <Icon className="w-6 h-6 text-luxury-gold" />
                                </motion.div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-luxury-gold transition-colors duration-200">
                                    {item.question}
                                  </h3>
                                  <Badge variant="outline" className="text-xs border-luxury-gold/30 text-luxury-ivory/70">
                                    {item.category}
                                  </Badge>
                                </div>
                                <ChevronDown className="w-5 h-5 text-luxury-ivory/50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
                              </div>
                            </AccordionTrigger>
                            <motion.div 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyLink(item.id)
                              }}
                              className="p-2 rounded-lg hover:bg-luxury-gold/10 transition-colors duration-200 cursor-pointer"
                              title="Copier le lien"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleCopyLink(item.id)
                                }
                              }}
                              whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                              whileTap={reducedMotion ? {} : { scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                            >
                              {copiedId === item.id ? (
                                <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
                              ) : (
                                <Copy className="w-4 h-4 text-luxury-ivory/50 hover:text-luxury-gold transition-colors" />
                              )}
                            </motion.div>
                          </div>
                          <AccordionContent className="px-6 pb-5">
                            <motion.div
                              initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                              animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }}
                              exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pt-2 text-luxury-ivory/80 leading-relaxed"
                            >
                              {renderAnswerWithLinks(item.answer, item.answerLinks)}
                            </motion.div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </Accordion>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">Aucun résultat trouvé</h3>
                <p className="text-luxury-ivory/70 mb-6">
                  Essayez de modifier votre recherche ou de sélectionner une autre catégorie.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('Tous')
                  }}
                  variant="outline"
                  className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                >
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-luxury-black border-2 border-luxury-gold rounded-2xl overflow-hidden relative">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-luxury-charcoal/50 to-luxury-black/50" />
              
              <CardContent className="p-12 md:p-16 text-center relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-white mb-4"
                >
                  Besoin d'aide ?
                </motion.h2>
                <p className="text-lg text-luxury-ivory/80 mb-8 max-w-2xl mx-auto">
                  Notre équipe est là pour vous accompagner dans le choix de vos bijoux et répondre à toutes vos questions.
                </p>

                {/* Trust line */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-luxury-ivory/70 mb-10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
                    <span>Réponse rapide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
                    <span>Assistance WhatsApp/Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
                    <span>Retours 30 jours</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div
                    whileHover={reducedMotion ? {} : { scale: 1.05, y: -2 }}
                    whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-semibold px-8 py-6 text-lg transition-all duration-200 hover:shadow-lg hover:shadow-luxury-gold/30"
                    >
                      <Link href="/sur-mesure">
                        Contactez-nous
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={reducedMotion ? {} : { scale: 1.05, y: -2 }}
                    whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold/10 bg-transparent px-8 py-6 text-lg font-semibold transition-all duration-200"
                    >
                      <Link href="/bijoux">
                        Voir la collection
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
