# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### À venir
- Tests unitaires avec Vitest
- Tests E2E avec Playwright
- Documentation OpenAPI complète
- Support i18n
- PWA

## [1.0.0] - 2025-01-27

### Added
- Initial release du projet INOXYA BIJOUX
- 34+ routes API fonctionnelles
- Dashboard admin complet
- Système d'authentification sécurisé (JWT, CSRF)
- Gestion produits, commandes, paiements
- Système de packs/collections
- Panier et favoris utilisateur
- Checkout sécurisé
- Base de données SQLite/PostgreSQL avec adaptateurs
- Sécurité renforcée (rate limiting, validation Zod, headers sécurité)
- SEO optimisé (metadata, structured data, sitemap)
- Design premium (thème noir/ivoire/or)
- Responsive design (mobile, tablette, desktop)
- Error boundaries et gestion d'erreurs globale
- Documentation complète (100+ fichiers)

### Security
- Protection CSRF sur routes sensibles
- Rate limiting (login, checkout)
- Validation stricte avec Zod
- Headers de sécurité (HSTS, CSP, X-Frame-Options, etc.)
- Sessions sécurisées (cookies httpOnly)
- Sanitization des inputs
- Vérification des prix côté serveur

### Technical
- Next.js 15.5.12 (App Router)
- React 19.0.0
- TypeScript 5.9.3
- Tailwind CSS + shadcn/ui
- SQLite (dev) / PostgreSQL (production)
- ESLint strict configuré
- TypeScript strict mode activé

