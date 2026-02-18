# 🎨 Guide de Style UI - INOXYA BIJOUX

**Date:** 2026-02-13  
**Version:** 1.0.0

---

## 📋 Table des Matières

1. [Category Cards](#category-cards)
2. [Palette de Couleurs](#palette-de-couleurs)
3. [Typographie](#typographie)
4. [Espacements](#espacements)

---

## 🃏 Category Cards

### Règles de Design Unifiées

Toutes les cartes de catégories sur `/bijoux` suivent un design système strict et cohérent pour garantir une expérience premium et homogène.

#### Structure

```
┌─────────────────────────────────┐
│  [Crown Icon] (top-right)       │
│                                 │
│  [Background Image]             │
│  + Dark Gradient Overlay        │
│                                 │
│  [Title + Subtitle] (bottom)   │
└─────────────────────────────────┘
```

#### Spécifications Techniques

- **Aspect Ratio:** `aspect-[16/9]` (fixe pour toutes les cartes)
- **Border Radius:** `rounded-2xl` (16px)
- **Shadow:** `shadow-lg` (base) → `shadow-2xl` (hover)
- **Overflow:** `overflow-hidden` (pour le crop d'image)

#### Image de Fond

- **Source:** Toujours une vraie image (jamais de SVG/illustration)
- **Mapping:** 
  - `bagues` → `/images/categories/bagues-category.jpeg`
  - `colliers` → `/images/categories/colliers-category.jpeg`
  - `bracelets` → `/images/categories/bracelets-category.jpeg`
  - `boucles-oreilles` → `/images/categories/boucles-oreilles-category.jpeg`
  - `broches` (Nos packs) → `/images/packs/pack-prestige.jpg`
  - `parures` → `/images/packs/pack-elegancia.jpg`
- **Object Fit:** `object-cover` (crop centré)
- **Hover Effect:** `scale-110` avec transition `duration-700`

#### Overlay Gradient

- **Gradient:** `from-black/90 via-black/50 to-black/20` (base)
- **Hover:** `from-black/95 via-black/60` (plus sombre)
- **Transition:** `duration-500`
- **Objectif:** Assurer la lisibilité du texte avec un contraste fort

#### Typographie

**Titre (h3):**
- **Taille:** `text-2xl md:text-3xl`
- **Poids:** `font-bold`
- **Couleur:** `text-white` (base) → `text-luxury-gold` (hover)
- **Shadow:** `drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`
- **Position:** Bottom-left, padding `p-6`

**Sous-titre (description):**
- **Taille:** `text-sm md:text-base`
- **Couleur:** `text-gray-200`
- **Opacity:** `opacity-95` (base) → `opacity-100` (hover)
- **Shadow:** `drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]`

#### Icône Couronne (Top-Right)

- **Position:** `top-5 right-5` (fixe pour toutes)
- **Taille:** `w-12 h-12`
- **Background:** `bg-black/30 backdrop-blur-sm`
- **Border:** `border border-white/20` → `border-luxury-gold/50` (hover)
- **Hover:** `bg-luxury-gold/20`
- **Icon Color:** `text-white` → `text-luxury-gold` (hover)

#### Effets Hover

1. **Scale & Lift:**
   - `hover:scale-[1.02]` (légère augmentation)
   - `hover:-translate-y-1` (légère élévation)

2. **Border Accent:**
   - `border-transparent` → `border-luxury-gold/40`
   - `ring-0` → `ring-2 ring-luxury-gold/20`

3. **Shimmer Effect:**
   - Gradient animé de gauche à droite
   - `opacity-0` → `opacity-100` au hover
   - Transition `duration-1000`

#### Responsive

- **Mobile:** Texte `text-2xl`, padding réduit si nécessaire
- **Tablet:** Texte `text-3xl`, espacements optimisés
- **Desktop:** Design complet avec tous les effets

---

## 🎨 Palette de Couleurs

### Couleurs Luxury (Thème Principal)

```css
luxury-black: #0A0A0A      /* Fond principal */
luxury-charcoal: #1A1A1A   /* Fond secondaire */
luxury-ivory: #FAF9F6      /* Fond clair */
luxury-gold: #D4AF37       /* Accent doré principal */
luxury-gold-light: #E8D5A3 /* Accent doré clair */
luxury-gold-dark: #B8941F  /* Accent doré foncé */
```

### Usage dans Category Cards

- **Overlay:** Noir avec opacité variable (`black/90` → `black/95`)
- **Texte:** Blanc (`text-white`) avec transition vers `text-luxury-gold` au hover
- **Borders:** `border-luxury-gold/40` au hover
- **Rings:** `ring-luxury-gold/20` au hover

---

## 📝 Typographie

### Hiérarchie

1. **Titre de Carte:** `text-2xl md:text-3xl font-bold`
2. **Description:** `text-sm md:text-base`
3. **Badges:** `text-sm font-semibold`

### Contraste

- **Minimum:** Ratio 4.5:1 pour le texte sur overlay sombre
- **Recommandé:** Ratio 7:1 pour une lisibilité optimale
- **Shadow:** Toujours utiliser `drop-shadow` pour améliorer la lisibilité

---

## 📏 Espacements

### Category Cards

- **Padding interne:** `p-6` (24px)
- **Gap entre cartes:** `gap-6` (24px)
- **Border radius:** `rounded-2xl` (16px)
- **Icon position:** `top-5 right-5` (20px)

### Grille

- **Mobile:** `grid-cols-1` (1 colonne)
- **Tablet:** `md:grid-cols-2` (2 colonnes)
- **Desktop:** `lg:grid-cols-3` (3 colonnes)

---

## ✅ Checklist de Conformité

Avant de créer ou modifier une Category Card, vérifier :

- [ ] Aspect ratio `aspect-[16/9]` utilisé
- [ ] Image réelle (pas de SVG/illustration)
- [ ] Overlay gradient sombre appliqué
- [ ] Texte en bas à gauche avec padding `p-6`
- [ ] Icône couronne en haut à droite (`top-5 right-5`)
- [ ] Border radius `rounded-2xl`
- [ ] Shadow `shadow-lg` → `shadow-2xl` au hover
- [ ] Hover effects : scale, lift, border gold, shimmer
- [ ] Responsive : texte et espacements adaptés
- [ ] Contraste texte suffisant (ratio 4.5:1 minimum)

---

## 📚 Références

- **Composant:** `components/CategoryCard.tsx`
- **Images:** `public/images/categories/` et `public/images/packs/`
- **Thème:** `tailwind.config.ts` (couleurs luxury)

---

**Dernière mise à jour:** 2026-02-13

