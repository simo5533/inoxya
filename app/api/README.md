# 🚀 API Routes INOXYA BIJOUX

## 📋 Vue d'ensemble

Ce dossier contient toutes les routes API nécessaires pour le fonctionnement complet de l'application INOXYA BIJOUX.

## 🔗 Routes Disponibles

### **❤️ Favoris**
- `GET /api/favorites` - Récupérer les favoris de l'utilisateur
- `POST /api/favorites` - Ajouter/retirer des favoris

### **📦 Commandes**
- `GET /api/orders` - Récupérer toutes les commandes (admin)
- `POST /api/orders` - Créer une nouvelle commande
- `PATCH /api/orders/[id]/status` - Mettre à jour le statut d'une commande
- `GET /api/orders/export` - Exporter les commandes (CSV/PDF)
- `GET /api/orders/[id]/export` - Exporter une commande spécifique

### **🎨 Demandes sur Mesure**
- `GET /api/custom-requests` - Récupérer les demandes sur mesure (admin)
- `POST /api/custom-requests` - Créer une demande sur mesure

### **💳 Paiements**
- `GET /api/payments` - Récupérer tous les paiements (admin)
- `POST /api/payments` - Créer un nouveau paiement
- `PATCH /api/payments/[id]/status` - Mettre à jour le statut d'un paiement

### **🧾 Factures**
- `POST /api/invoices/generate` - Générer une facture
- `POST /api/invoices/generate-pdf` - Générer une facture PDF
- `POST /api/invoices/send-email` - Envoyer une facture par email

## 🔐 Authentification

### **Routes Publiques**
- `POST /api/orders` - Création de commandes
- `POST /api/custom-requests` - Demandes sur mesure
- `POST /api/favorites` - Gestion des favoris (avec session)

### **Routes Admin**
Toutes les autres routes nécessitent une authentification admin.

## 📝 Exemples d'Utilisation

### **Créer une Commande**
```javascript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bijou_id: 'bijou-123',
    customer_name: 'Ahmed Benali',
    customer_address: '123 Rue Mohammed V, Casablanca',
    customer_phone: '0612345678',
    quantity: 1,
    total_amount: 299.99
  })
})
```

### **Ajouter aux Favoris**
```javascript
const response = await fetch('/api/favorites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bijou_id: 'bijou-123',
    action: 'add'
  })
})
```

### **Mettre à Jour le Statut d'une Commande**
```javascript
const response = await fetch('/api/orders/order-123/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'shipped'
  })
})
```

## 🧪 Tests

Pour tester les routes API :

```bash
# Démarrer le serveur de développement
npm run dev

# Tester les routes (dans un autre terminal)
node scripts/test-api-routes.js
```

## 🔧 Configuration

### **Variables d'Environnement Requises**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### **Base de Données**
Assurez-vous que les tables suivantes existent dans Supabase :
- `users`, `categories`, `bijoux`, `packs`
- `orders`, `order_items`, `favorites`
- `payments`, `custom_requests`
- `notifications`, `promo_codes`

## 📊 Codes de Statut

- `200` - Succès
- `201` - Créé avec succès
- `400` - Données invalides
- `401` - Non authentifié
- `403` - Accès non autorisé
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## 🚨 Gestion d'Erreurs

Toutes les routes retournent des réponses JSON standardisées :

```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... }
}
```

En cas d'erreur :
```json
{
  "error": "Message d'erreur descriptif"
}
```

## 🔄 Fallbacks

Les routes utilisent le système de fallback vers les données locales si Supabase n'est pas disponible, garantissant le fonctionnement même sans base de données.

## 📈 Performance

- Toutes les routes sont optimisées pour Next.js 15
- Utilisation de `"use server"` pour les fonctions serveur
- Gestion d'erreurs robuste avec try/catch
- Validation des données d'entrée
