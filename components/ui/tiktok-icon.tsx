import React from 'react'

interface TikTokIconProps {
  className?: string
  size?: number
}

export const TikTokIcon: React.FC<TikTokIconProps> = ({ 
  className = "w-5 h-5", 
  size = 20 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Effet de glitch avec les couleurs TikTok */}
      <defs>
        <filter id="glitch" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset in="SourceGraphic" dx="1" dy="1" result="offset1">
            <animate attributeName="dx" values="0;1;0" dur="2s" repeatCount="indefinite"/>
          </feOffset>
          <feOffset in="SourceGraphic" dx="-1" dy="-1" result="offset2">
            <animate attributeName="dx" values="0;-1;0" dur="2s" repeatCount="indefinite"/>
          </feOffset>
          <feBlend in="offset1" in2="offset2" mode="screen"/>
        </filter>
      </defs>
      
      {/* Icône TikTok avec effet de glitch */}
      <g filter="url(#glitch)">
        {/* Version cyan */}
        <path 
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
          fill="#00F2EA"
          opacity="0.8"
        />
        {/* Version magenta */}
        <path 
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
          fill="#FF0050"
          opacity="0.8"
          transform="translate(0.5, -0.5)"
        />
        {/* Version blanche principale */}
        <path 
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export default TikTokIcon
