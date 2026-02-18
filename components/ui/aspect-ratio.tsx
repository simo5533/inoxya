"use client"

// Composant optionnel - dépendance @radix-ui/react-aspect-ratio non installée
// Pour l'utiliser, installer: npm install @radix-ui/react-aspect-ratio
let AspectRatio: any
try {
  const AspectRatioPrimitive = require("@radix-ui/react-aspect-ratio")
  AspectRatio = AspectRatioPrimitive.Root
} catch {
  AspectRatio = ({ children, ...props }: any) => <div {...props}>{children}</div>
}

export { AspectRatio }
