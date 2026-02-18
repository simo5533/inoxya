"use client"

/**
 * Composants SVG premium pour les images de catégories
 * Chaque composant génère une image luxe adaptée au type de bijou
 */

interface CategoryImageProps {
  className?: string
}

// Image pour les Bagues - Gros plan avec reflets
export function BaguesCategoryImage({ className = "" }: CategoryImageProps) {
  return (
    <svg viewBox="0 0 800 600" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bagues-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0a0a0a", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#1a1a1a", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#0f0f0f", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="bagues-light" cx="50%" cy="30%" r="40%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#ffd700", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Fond */}
      <rect width="800" height="600" fill="url(#bagues-bg)" />
      <rect width="800" height="600" fill="url(#bagues-light)" />
      
      {/* Bague principale - vue de dessus */}
      <g transform="translate(400, 300)">
        {/* Cercle extérieur de la bague */}
        <circle cx="0" cy="0" r="120" fill="none" stroke="url(#ring-gradient)" strokeWidth="8" opacity="0.9" />
        <circle cx="0" cy="0" r="100" fill="none" stroke="url(#ring-gradient)" strokeWidth="6" opacity="0.7" />
        
        {/* Pierre centrale (diamant/émeraude) */}
        <ellipse cx="0" cy="-20" rx="35" ry="45" fill="#ffffff" opacity="0.95" />
        <ellipse cx="0" cy="-20" rx="30" ry="40" fill="#e0f2fe" opacity="0.8" />
        
        {/* Reflets sur la bague */}
        <path d="M -80 -20 Q -40 -40 0 -20 Q 40 -40 80 -20" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="3" 
              opacity="0.4" />
        
        {/* Motifs décoratifs */}
        <circle cx="-60" cy="0" r="8" fill="url(#ring-gradient)" opacity="0.8" />
        <circle cx="60" cy="0" r="8" fill="url(#ring-gradient)" opacity="0.8" />
        <circle cx="0" cy="60" r="8" fill="url(#ring-gradient)" opacity="0.8" />
      </g>
      
      {/* Particules de lumière */}
      <circle cx="200" cy="150" r="3" fill="#ffd700" opacity="0.6" />
      <circle cx="600" cy="450" r="2" fill="#ffd700" opacity="0.5" />
    </svg>
  )
}

// Image pour les Colliers - Élégant et sophistiqué
export function ColliersCategoryImage({ className = "" }: CategoryImageProps) {
  return (
    <svg viewBox="0 0 800 600" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="colliers-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#050505", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#151515", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#0a0a0a", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="colliers-light" cx="50%" cy="20%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="chain-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#c0c0c0", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#c0c0c0", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <rect width="800" height="600" fill="url(#colliers-bg)" />
      <rect width="800" height="600" fill="url(#colliers-light)" />
      
      {/* Chaîne de collier */}
      <g transform="translate(400, 250)">
        {/* Chaîne principale en forme de V */}
        <path d="M -150 0 Q 0 -80 150 0" 
              fill="none" 
              stroke="url(#chain-gradient)" 
              strokeWidth="12" 
              strokeLinecap="round"
              opacity="0.9" />
        
        {/* Maillons de chaîne */}
        {[...Array(15)].map((_, i) => {
          const x = -120 + (i * 16)
          const y = Math.sin(i * 0.3) * 15
          return (
            <ellipse key={i} cx={x} cy={y} rx="8" ry="12" fill="url(#chain-gradient)" opacity="0.9" />
          )
        })}
        
        {/* Pendentif central */}
        <ellipse cx="0" cy="0" rx="45" ry="60" fill="#d4af37" opacity="0.95" />
        <ellipse cx="0" cy="0" rx="35" ry="50" fill="#ffd700" opacity="0.9" />
        
        {/* Motif sur le pendentif */}
        <circle cx="0" cy="-10" r="8" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  )
}

// Image pour les Bracelets - Élégant et moderne
export function BraceletsCategoryImage({ className = "" }: CategoryImageProps) {
  return (
    <svg viewBox="0 0 800 600" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bracelets-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0f0f0f", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#1f1f1f", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#151515", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="bracelets-light" cx="50%" cy="40%" r="45%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.18 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="bracelet-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#ffd700", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <rect width="800" height="600" fill="url(#bracelets-bg)" />
      <rect width="800" height="600" fill="url(#bracelets-light)" />
      
      {/* Bracelet en forme de cercle */}
      <g transform="translate(400, 300)">
        {/* Cercle extérieur */}
        <circle cx="0" cy="0" r="140" fill="none" stroke="url(#bracelet-gradient)" strokeWidth="16" opacity="0.9" />
        <circle cx="0" cy="0" r="120" fill="none" stroke="url(#bracelet-gradient)" strokeWidth="12" opacity="0.7" />
        
        {/* Motifs décoratifs */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * Math.PI / 180
          const x = Math.cos(angle) * 130
          const y = Math.sin(angle) * 130
          return (
            <circle key={i} cx={x} cy={y} r="6" fill="url(#bracelet-gradient)" opacity="0.8" />
          )
        })}
        
        {/* Reflets */}
        <path d="M -100 -50 Q 0 -80 100 -50" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="4" 
              opacity="0.3" />
      </g>
    </svg>
  )
}

// Image pour les Boucles d'oreilles - Délicat et raffiné
export function BouclesCategoryImage({ className = "" }: CategoryImageProps) {
  return (
    <svg viewBox="0 0 800 600" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="boucles-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0d0d0d", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#1d1d1d", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#121212", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="boucles-light" cx="50%" cy="30%" r="40%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="earring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#ffd700", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <rect width="800" height="600" fill="url(#boucles-bg)" />
      <rect width="800" height="600" fill="url(#boucles-light)" />
      
      {/* Paire de boucles d'oreilles */}
      <g transform="translate(400, 200)">
        {/* Boucle gauche */}
        <g transform="translate(-120, 0)">
          {/* Crochet */}
          <path d="M 0 0 Q -10 -15 0 -30" 
                fill="none" 
                stroke="url(#earring-gradient)" 
                strokeWidth="6" 
                strokeLinecap="round"
                opacity="0.9" />
          
          {/* Pendentif */}
          <ellipse cx="0" cy="40" rx="25" ry="35" fill="url(#earring-gradient)" opacity="0.95" />
          <ellipse cx="0" cy="40" rx="20" ry="30" fill="#ffd700" opacity="0.9" />
          <circle cx="0" cy="30" r="6" fill="#ffffff" opacity="0.8" />
        </g>
        
        {/* Boucle droite */}
        <g transform="translate(120, 0)">
          {/* Crochet */}
          <path d="M 0 0 Q 10 -15 0 -30" 
                fill="none" 
                stroke="url(#earring-gradient)" 
                strokeWidth="6" 
                strokeLinecap="round"
                opacity="0.9" />
          
          {/* Pendentif */}
          <ellipse cx="0" cy="40" rx="25" ry="35" fill="url(#earring-gradient)" opacity="0.95" />
          <ellipse cx="0" cy="40" rx="20" ry="30" fill="#ffd700" opacity="0.9" />
          <circle cx="0" cy="30" r="6" fill="#ffffff" opacity="0.8" />
        </g>
      </g>
    </svg>
  )
}


// Image pour Nos packs - Élégant et décoratif
export function BrochesCategoryImage({ className = "" }: CategoryImageProps) {
  return (
    <svg viewBox="0 0 800 600" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="broches-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#151515", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#252525", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#1a1a1a", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="broches-light" cx="50%" cy="40%" r="45%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.18 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="broche-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#ffd700", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <rect width="800" height="600" fill="url(#broches-bg)" />
      <rect width="800" height="600" fill="url(#broches-light)" />
      
      {/* Broche fleur */}
      <g transform="translate(400, 300)">
        {/* Pétales */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * Math.PI / 180
          const x = Math.cos(angle) * 60
          const y = Math.sin(angle) * 60
          return (
            <ellipse 
              key={i} 
              cx={x} 
              cy={y} 
              rx="25" 
              ry="40" 
              fill="url(#broche-gradient)" 
              opacity="0.9"
              transform={`rotate(${i * 45} ${x} ${y})`}
            />
          )
        })}
        
        {/* Centre de la fleur */}
        <circle cx="0" cy="0" r="25" fill="#ffd700" opacity="0.95" />
        <circle cx="0" cy="0" r="15" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  )
}

// Fonction helper pour obtenir l'image selon le slug de catégorie
export function getCategoryImageComponent(slug: string) {
  const components: Record<string, React.ComponentType<CategoryImageProps>> = {
    'bagues': BaguesCategoryImage,
    'colliers': ColliersCategoryImage,
    'bracelets': BraceletsCategoryImage,
    'boucles-oreilles': BouclesCategoryImage,
    'broches': BrochesCategoryImage,
  }
  
  return components[slug] || BaguesCategoryImage
}

