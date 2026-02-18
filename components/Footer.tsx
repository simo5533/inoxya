"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Instagram, Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp } from "lucide-react"
import { TikTokIcon } from "@/components/ui/tiktok-icon"
import { socialLinks, contactInfo } from "@/lib/social-links"
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  return (
    <footer className="relative text-white overflow-hidden">
      {/* Luxury dark gradient background with gold glow vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #070A12 0%, #0B1020 100%)',
        }}
      />
      
      {/* Subtle gold glow vignette */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(200, 162, 74, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Very subtle noise texture (CSS only) */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Top border gradient (hairline) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8A24A] to-transparent opacity-60" />

      <div className="container mx-auto px-4 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 max-w-7xl mx-auto">
          
          {/* Column 1: Brand Block */}
          <div className="space-y-4">
            <div className="mb-6">
              <Image 
                src="/logo-inoxya.svg" 
                alt="INOXYA - Embellie ton âme" 
                width={140} 
                height={56}
                className="h-auto brightness-0 invert contrast-125"
                priority
                style={{
                  filter: 'brightness(0) invert(1) contrast(1.2)',
                }}
              />
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-4 max-w-xs">
              {t('tagline')}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 bg-[#0F1625] border border-[#C8A24A]/20 rounded-md text-gray-300">
                {t('badges.stainlessSteel')}
              </span>
              <span className="px-3 py-1.5 bg-[#0F1625] border border-[#C8A24A]/20 rounded-md text-gray-300">
                {t('badges.durable')}
              </span>
              <span className="px-3 py-1.5 bg-[#0F1625] border border-[#C8A24A]/20 rounded-md text-gray-300">
                {t('badges.hypoallergenic')}
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#C8A24A] mb-6">
              {t('navigation.title')}
            </h2>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`/${locale}/packs`} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 inline-block hover:-translate-y-0.5 relative group text-sm leading-relaxed"
                >
                  {t('navigation.packs')}
                  <span className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-0 h-[1px] bg-[#C8A24A] transition-all duration-250 group-hover:w-full`} />
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/bijoux`} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 inline-block hover:-translate-y-0.5 relative group text-sm leading-relaxed"
                >
                  {t('navigation.allJewelry')}
                  <span className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-0 h-[1px] bg-[#C8A24A] transition-all duration-250 group-hover:w-full`} />
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/sur-mesure`} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 inline-block hover:-translate-y-0.5 relative group text-sm leading-relaxed"
                >
                  {t('navigation.custom')}
                  <span className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-0 h-[1px] bg-[#C8A24A] transition-all duration-250 group-hover:w-full`} />
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/favoris`} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 inline-block hover:-translate-y-0.5 relative group text-sm leading-relaxed"
                >
                  {t('navigation.favorites')}
                  <span className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-0 h-[1px] bg-[#C8A24A] transition-all duration-250 group-hover:w-full`} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Service Client */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#C8A24A] mb-6">
              Service Client
            </h2>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`/${locale}/faq`}
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 inline-block hover:-translate-y-0.5 relative group text-sm leading-relaxed"
                >
                  FAQ
                  <span className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-0 h-[1px] bg-[#C8A24A] transition-all duration-250 group-hover:w-full`} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#C8A24A] mb-6">
              Contact
            </h2>
            <div className="space-y-4 text-sm">
              {/* Phone */}
              <div className={`flex items-center gap-3 group ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-[#0F1625] flex items-center justify-center border border-[#C8A24A]/30 group-hover:border-[#C8A24A]/60 group-hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] transition-all duration-250 group-hover:scale-110">
                  <Phone className="w-4 h-4 text-[#C8A24A]" />
                </div>
                <Link 
                  href={socialLinks.phone.url} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent rounded font-mono"
                  aria-label={`Appeler ${contactInfo.phone}`}
                  dir="ltr"
                  style={{ unicodeBidi: 'bidi-override' }}
                >
                  {contactInfo.phone}
                </Link>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-[#0F1625] flex items-center justify-center border border-[#C8A24A]/30 group-hover:border-[#C8A24A]/60 group-hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] transition-all duration-250 group-hover:scale-110">
                  <MessageCircle className="w-4 h-4 text-[#C8A24A]" />
                </div>
                <Link 
                  href={socialLinks.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                  aria-label="Contacter sur WhatsApp"
                >
                  WhatsApp
                </Link>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-[#0F1625] flex items-center justify-center border border-[#C8A24A]/30 group-hover:border-[#C8A24A]/60 group-hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] transition-all duration-250 group-hover:scale-110">
                  <Mail className="w-4 h-4 text-[#C8A24A]" />
                </div>
                <Link 
                  href={socialLinks.email.url} 
                  className="text-gray-200 hover:text-[#C8A24A] transition-all duration-250 hover:-translate-y-0.5 break-all focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                  aria-label={`Envoyer un email à ${contactInfo.email}`}
                >
                  {contactInfo.email}
                </Link>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-full bg-[#0F1625] flex items-center justify-center border border-[#C8A24A]/30 group-hover:border-[#C8A24A]/60 group-hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] transition-all duration-250 group-hover:scale-110 mt-0.5 flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#C8A24A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 leading-relaxed mb-2">
                    {contactInfo.address}
                  </p>
                  <Link
                    href={socialLinks.maps.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[#C8A24A]/90 hover:text-[#C8A24A] text-xs inline-flex items-center gap-1.5 transition-all duration-250 hover:gap-2 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent rounded ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                    aria-label={t('contact.openMaps')}
                  >
                    <MapPin className={`w-3 h-3 ${locale === 'ar' ? 'ml-1.5' : ''}`} />
                    {t('contact.openMaps')}
                  </Link>
                </div>
              </div>

              {/* Map - Desktop only (lg+) */}
              <div className="hidden lg:block mt-6">
                <div className="rounded-2xl overflow-hidden border border-[#C8A24A]/25 shadow-2xl bg-[#0F1625] ring-1 ring-[#C8A24A]/10">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3143.165856861751!2d-6.83573210321045!3d34.02378810000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda76b896731f603%3A0x60ff894f88efc74f!2sLes%20soldes%20Reda!5e1!3m2!1sfr!2sus!4v1771291215519!5m2!1sfr!2sus"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Carte de localisation - ${contactInfo.address}`}
                    aria-label={`Carte Google Maps - ${contactInfo.address}`}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Map - Mobile accordion */}
              <div className="lg:hidden mt-6">
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0F1625] border border-[#C8A24A]/25 hover:border-[#C8A24A]/50 transition-all duration-250 text-left group focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-expanded={isMapExpanded}
                  aria-label={isMapExpanded ? t('contact.hideMap') : t('contact.showMap')}
                >
                  <span className="text-sm text-gray-200 group-hover:text-[#C8A24A] transition-colors">
                    {t('contact.showMap')}
                  </span>
                  {isMapExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#C8A24A]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#C8A24A] transition-colors" />
                  )}
                </button>
                {isMapExpanded && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-[#C8A24A]/25 shadow-xl bg-[#0F1625] ring-1 ring-[#C8A24A]/10">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3143.165856861751!2d-6.83573210321045!3d34.02378810000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda76b896731f603%3A0x60ff894f88efc74f!2sLes%20soldes%20Reda!5e1!3m2!1sfr!2sus!4v1771291215519!5m2!1sfr!2sus"
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Carte de localisation - ${contactInfo.address}`}
                      aria-label={`Carte Google Maps - ${contactInfo.address}`}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Social Icons Row */}
        <div className="mt-12 pt-8 border-t border-[#0F1625]">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href={socialLinks.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0F1625] border border-[#C8A24A]/30 hover:border-[#C8A24A]/60 hover:bg-[#C8A24A]/10 hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] flex items-center justify-center transition-all duration-250 transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent"
              title={socialLinks.instagram.title}
              aria-label={socialLinks.instagram.title}
            >
              <Instagram className="w-5 h-5 text-gray-200 hover:text-[#C8A24A] transition-colors" />
            </Link>
            <Link
              href={socialLinks.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0F1625] border border-[#C8A24A]/30 hover:border-[#C8A24A]/60 hover:bg-[#C8A24A]/10 hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] flex items-center justify-center transition-all duration-250 transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent"
              title={socialLinks.tiktok.title}
              aria-label={socialLinks.tiktok.title}
            >
              <TikTokIcon className="w-5 h-5 text-gray-200 hover:text-[#C8A24A] transition-colors" />
            </Link>
            <Link
              href={socialLinks.email.url}
              className="w-12 h-12 rounded-full bg-[#0F1625] border border-[#C8A24A]/30 hover:border-[#C8A24A]/60 hover:bg-[#C8A24A]/10 hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] flex items-center justify-center transition-all duration-250 transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent"
              title={socialLinks.email.title}
              aria-label={socialLinks.email.title}
            >
              <Mail className="w-5 h-5 text-gray-200 hover:text-[#C8A24A] transition-colors" />
            </Link>
            <Link
              href={socialLinks.phone.url}
              className="w-12 h-12 rounded-full bg-[#0F1625] border border-[#C8A24A]/30 hover:border-[#C8A24A]/60 hover:bg-[#C8A24A]/10 hover:shadow-[0_0_12px_rgba(200,162,74,0.3)] flex items-center justify-center transition-all duration-250 transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#C8A24A]/50 focus:ring-offset-2 focus:ring-offset-transparent"
              title={socialLinks.phone.title}
              aria-label={socialLinks.phone.title}
            >
              <Phone className="w-5 h-5 text-gray-200 hover:text-[#C8A24A] transition-colors" />
            </Link>
            <Link
              href={socialLinks.whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0F1625] border border-[#C8A24A]/30 hover:border-green-500/60 hover:bg-green-500/10 hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center justify-center transition-all duration-250 transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-transparent"
              title={socialLinks.whatsapp.title}
              aria-label={socialLinks.whatsapp.title}
            >
              <MessageCircle className="w-5 h-5 text-gray-200 hover:text-green-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#0F1625]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-300">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} INOXYA BIJOUX. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="hidden md:inline text-[#C8A24A]/40">•</span>
              <span className="text-[#C8A24A]/70">Qualité</span>
              <span className="hidden md:inline text-[#C8A24A]/40">•</span>
              <span className="text-[#C8A24A]/70">Service</span>
              <span className="hidden md:inline text-[#C8A24A]/40">•</span>
              <span className="text-[#C8A24A]/70">Satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
