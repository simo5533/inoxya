# 🚀 GUIDE RAPIDE DE DÉPLOIEMENT - INOXYA BIJOUX

**Version:** 2.0  
**Date:** 2025-01-27

---

## ⚡ DÉMARRAGE RAPIDE

### 1. Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
npm run setup
```

### 2. Tests

```bash
# Tester le CRUD complet
npm run test:crud

# Tester toutes les APIs (nécessite le serveur en cours d'exécution)
npm run dev  # Dans un terminal
npm run test:apis  # Dans un autre terminal

# Tester tout
npm run test:all
```

### 3. Build de Production

```bash
# Tester le build
npm run build

# Démarrer en mode production
npm start
```

---

## 🔐 IDENTIFIANTS ADMIN

```
📱 Téléphone: 0612345678
🔑 Mot de passe: Admin123!
```

**URLs:**
- Local: http://localhost:3000
- Login: http://localhost:3000/login
- Admin: http://localhost:3000/admin

---

## 📋 CHECKLIST RAPIDE

### Avant le Déploiement
- [ ] `npm run test:crud` → ✅ 15/15 tests passés
- [ ] `npm run build` → ✅ Build réussi
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL configurée (production)
- [ ] Domaine configuré

### Après le Déploiement
- [ ] Site accessible
- [ ] HTTPS activé
- [ ] Connexion admin fonctionne
- [ ] CRUD fonctionne
- [ ] Checkout fonctionne

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez:
- **`GUIDE_DEPLOIEMENT_FINAL.md`** - Guide complet de déploiement
- **`CHECKLIST_PRE_DEPLOIEMENT.md`** - Checklist détaillée
- **`RAPPORT_TESTS_FINAUX.md`** - Rapport des tests
- **`AUDIT_COMPLET_PROJET.md`** - Audit complet

---

## 🆘 AIDE RAPIDE

### Problème: Erreur 503 - Base de données
→ Vérifier `DATABASE_URL` dans les variables d'environnement

### Problème: Erreur JWT_SECRET
→ Exécuter `npm run setup` pour générer automatiquement

### Problème: Build échoue
→ Vérifier les erreurs TypeScript/ESLint (ignorées en build mais à corriger)

---

**✅ Projet prêt pour le déploiement !**

