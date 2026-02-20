# 🔧 CORRIGER L'ERREUR MIDDLEWARE 500
## Solution pour "MIDDLEWARE_INVOCATION_FAILED"

**Erreur:** `500: INTERNAL SERVER ERROR`  
**Code:** `MIDDLEWARE_INVOCATION_FAILED`  
**Cause:** Le middleware Next.js échoue lors de l'exécution

---

## ✅ SOLUTION RAPIDE

### Étape 1: Vérifier les Variables d'Environnement

1. **Dans Vercel Dashboard**, allez sur votre projet
2. **Settings** → **Environment Variables**
3. **Vérifiez que ces variables existent:**
   - ✅ `NEXT_PUBLIC_SITE_URL` = `https://inoxya-bijoux.vercel.app`
   - ✅ `NODE_ENV` = `production`

### Étape 2: Vérifier le Middleware

Le problème vient probablement du middleware `next-intl`. Vérifions la configuration.

---

## 🔍 DIAGNOSTIC DÉTAILLÉ

### Problème 1: Middleware next-intl

**Erreur courante:** Le middleware `next-intl` peut échouer si:
- Les locales ne sont pas configurées correctement
- Le fichier `i18n/request.ts` a une erreur
- Les variables d'environnement manquent

### Problème 2: Runtime Edge vs Node.js

**Erreur courante:** Le middleware s'exécute sur Edge Runtime, mais certaines dépendances nécessitent Node.js.

---

## ✅ SOLUTIONS

### Solution 1: Vérifier la Configuration i18n

1. **Vérifiez que `i18n/routing.ts` existe:**
   ```typescript
   export const locales = ['fr', 'ar'] as const
   export const defaultLocale = 'fr' as const
   ```

2. **Vérifiez que `i18n/request.ts` existe et est correct**

### Solution 2: Simplifier le Middleware (Temporaire)

Si le problème persiste, simplifiez temporairement le middleware:

**Fichier:** `middleware.ts`

```typescript
// Middleware simplifié pour diagnostiquer
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Exclure les routes API et statiques
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    return NextResponse.next()
  }

  // Redirection simple pour tester
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next|admin).*)'
  ]
}
```

### Solution 3: Vérifier les Dépendances

Le middleware ne peut pas utiliser certaines dépendances Node.js. Vérifiez que vous n'importez pas:
- `fs` (file system)
- `path` (sans configuration spéciale)
- `better-sqlite3` (base de données)
- Autres modules Node.js uniquement

---

## 🚀 CORRECTION ÉTAPE PAR ÉTAPE

### Option A: Corriger le Middleware Actuel (Recommandé)

1. **Vérifiez `middleware.ts` localement:**
   ```bash
   npm run build
   ```

2. **Si le build échoue, corrigez les erreurs**

3. **Poussez les corrections:**
   ```bash
   git add middleware.ts
   git commit -m "fix: correct middleware configuration"
   git push
   ```

4. **Vercel redéploiera automatiquement**

### Option B: Utiliser un Middleware Minimal (Temporaire)

1. **Créez un middleware minimal:**
   ```typescript
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export function middleware(request: NextRequest) {
     return NextResponse.next()
   }

   export const config = {
     matcher: [
       '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'
     ]
   }
   ```

2. **Testez localement:**
   ```bash
   npm run build
   npm run start
   ```

3. **Si ça marche, poussez:**
   ```bash
   git add middleware.ts
   git commit -m "fix: simplify middleware to fix 500 error"
   git push
   ```

---

## 🔍 VÉRIFICATIONS

### Checklist

- [ ] **Variables d'environnement configurées** (Settings → Environment Variables)
- [ ] **Middleware.ts existe et est valide**
- [ ] **i18n/request.ts existe et est valide**
- [ ] **Build local fonctionne** (`npm run build`)
- [ ] **Pas d'imports Node.js dans le middleware**

---

## 🆘 SI LE PROBLÈME PERSISTE

### Option 1: Désactiver Temporairement le Middleware

1. **Renommez `middleware.ts` en `middleware.ts.backup`**
2. **Créez un middleware minimal:**
   ```typescript
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export function middleware(request: NextRequest) {
     return NextResponse.next()
   }

   export const config = {
     matcher: []
   }
   ```

3. **Testez et déployez**

### Option 2: Vérifier les Logs Runtime

1. **Dans Vercel Dashboard**, allez sur **"Logs"**
2. **Regardez les "Runtime Logs"** (pas Build Logs)
3. **Cherchez les erreurs spécifiques**

---

## 📋 RÉSUMÉ

### Erreur: `MIDDLEWARE_INVOCATION_FAILED`

**Causes possibles:**
1. ❌ Configuration next-intl incorrecte
2. ❌ Variables d'environnement manquantes
3. ❌ Imports Node.js dans le middleware
4. ❌ Erreur dans `i18n/request.ts`

**Solutions:**
1. ✅ Vérifier les variables d'environnement
2. ✅ Vérifier la configuration i18n
3. ✅ Simplifier le middleware temporairement
4. ✅ Vérifier les logs runtime

---

## 🎯 ACTION IMMÉDIATE

1. **Vérifiez les variables d'environnement** dans Vercel
2. **Testez le build localement:** `npm run build`
3. **Si le build échoue, corrigez les erreurs**
4. **Poussez les corrections sur GitHub**
5. **Vercel redéploiera automatiquement**

---

**Date:** 2025-01-27  
**Version:** 1.0.0  
**Statut:** ✅ **GUIDE COMPLET**

