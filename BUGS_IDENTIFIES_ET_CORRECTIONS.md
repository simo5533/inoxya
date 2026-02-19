# 🐛 BUGS IDENTIFIÉS ET CORRECTIONS - INOXYA BIJOUX

**Date:** 2025-01-27  
**Statut:** Analyse complète des bugs

---

## 🔴 BUGS CRITIQUES

### 1. ReferenceError: `db` non défini dans plusieurs routes API

**Fichiers affectés:**
- `app/api/payments/route.ts` (ligne 59)
- `app/api/cart/route.ts` (GET)
- `app/api/favorites/route.ts` (POST avec pack_id)
- `app/api/admin/packs/[id]/route.ts` (PUT, DELETE)

**Problème:**
```typescript
// ❌ ERREUR
const payments = await db.getPaymentsByOrderId(order_id)

// ✅ CORRECTION
import { getPaymentsByOrderId } from '@/lib/database'
const payments = await getPaymentsByOrderId(order_id)
```

**Impact:** Erreur 500 sur ces routes

**Priorité:** 🔴 CRITIQUE

---

### 2. Méthodes manquantes dans database adapters

**Problème:**
- `createOrder`, `createOrderItem`, `createPayment`, `createNotification` sont appelées mais non implémentées dans les adapters Postgres/SQLite

**Fichiers:**
- `lib/db/postgres-adapter.ts`
- `lib/db/sqlite-adapter.ts`

**Impact:** Erreurs à l'exécution si utilisation de ces méthodes

**Priorité:** 🔴 CRITIQUE

---

### 3. Tests unitaires incomplets (stubs)

**Fichiers:**
- `tests/lib/auth.test.ts`
- `tests/lib/security.test.ts`

**Problème:**
```typescript
// ❌ STUB
it('devrait retourner une erreur si le téléphone est vide', async () => {
  // TODO: Implémenter le test
  expect(true).toBe(true)
})
```

**Impact:** Pas de tests réels, coverage < 5%

**Priorité:** 🟡 IMPORTANT

---

## 🟡 BUGS IMPORTANTS

### 4. Timeouts DB masquent les problèmes

**Fichier:** `lib/database.ts`

**Problème:**
```typescript
// Timeout de 3 secondes - masque les vrais problèmes
const timeoutPromise = new Promise<Product[]>((resolve) => {
  setTimeout(() => {
    logger.warn('[getBijouxVedettes] Timeout (3s), retour tableau vide')
    resolve([])
  }, 3000)
})
```

**Impact:** Les erreurs DB sont silencieusement ignorées

**Priorité:** 🟡 IMPORTANT

---

### 5. Pas d'indexes sur tables DB

**Problème:**
- Pas d'indexes sur colonnes fréquemment queryées
- Performance dégradée sur grandes tables

**Tables affectées:**
- `products` (category_id, is_featured)
- `orders` (user_id, status)
- `cart_items` (user_id, bijou_id)

**Priorité:** 🟡 IMPORTANT

---

### 6. Pas de connection pooling (Postgres)

**Fichier:** `lib/db/postgres-adapter.ts`

**Problème:**
```typescript
// Pool créé mais pas de configuration optimale
this.pool = new Pool({
  connectionString: databaseUrl,
  // Pas de max, min, idleTimeout configurés
})
```

**Impact:** Performance et scalabilité limitées

**Priorité:** 🟡 IMPORTANT

---

## 🟢 BUGS MINEURS

### 7. Console.log en production

**Fichiers:** Multiple (20+ occurrences)

**Problème:**
```typescript
console.log('Debug info') // Devrait être logger ou supprimé
```

**Impact:** Logs verbeux en production

**Priorité:** 🟢 MINEUR

---

### 8. useErrorHandler hook incomplet

**Fichier:** `components/ErrorBoundary.tsx`

**Problème:**
```typescript
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    // Fonction retournée mais pas utilisable comme hook
  }
}
```

**Impact:** Hook non fonctionnel

**Priorité:** 🟢 MINEUR

---

### 9. Pas de validation de catégorie en base

**Fichier:** `app/api/admin/products/route.ts`

**Problème:**
- Catégories inventées peuvent être créées
- Pas de vérification existence dans table `categories`

**Impact:** Données incohérentes possibles

**Priorité:** 🟢 MINEUR

---

## ✅ CORRECTIONS APPLIQUÉES

### Corrections Automatiques Possibles:

1. **Remplacer `db.` par imports directs** dans routes API
2. **Implémenter méthodes manquantes** dans adapters
3. **Ajouter indexes DB** via script SQL
4. **Configurer connection pooling** Postgres
5. **Remplacer console.log** par logger

---

## 📋 PLAN DE CORRECTION

### Phase 1: Critiques (Immédiat)
- [ ] Corriger ReferenceError `db` dans routes API
- [ ] Implémenter méthodes manquantes dans adapters
- [ ] Ajouter indexes DB

### Phase 2: Importantes (Semaine 1)
- [ ] Retirer timeouts DB masquants
- [ ] Configurer connection pooling
- [ ] Implémenter tests unitaires

### Phase 3: Mineures (Semaine 2)
- [ ] Nettoyer console.log
- [ ] Corriger useErrorHandler
- [ ] Ajouter validation catégories

---

**Note:** Certaines corrections nécessitent des modifications de code importantes. Voir rapport d'audit complet pour détails.

