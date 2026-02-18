# Guide de Contribution - INOXYA BIJOUX

Merci de votre intérêt pour contribuer à INOXYA BIJOUX ! Ce document fournit les directives pour contribuer au projet.

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Standards de code](#standards-de-code)
4. [Processus de Pull Request](#processus-de-pull-request)
5. [Guide de commit](#guide-de-commit)
6. [Tests](#tests)
7. [Documentation](#documentation)

---

## 🤝 Code de conduite

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Focalisez-vous sur ce qui est le mieux pour le projet
- Montrez de l'empathie envers les autres contributeurs

---

## 🚀 Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](../../issues)
2. Créez une nouvelle issue avec :
   - Un titre clair et descriptif
   - Une description détaillée du problème
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs. le comportement actuel
   - Votre environnement (OS, navigateur, version Node.js)

### Proposer une fonctionnalité

1. Vérifiez que la fonctionnalité n'a pas déjà été proposée
2. Créez une issue avec :
   - Une description claire de la fonctionnalité
   - Le cas d'usage et la valeur ajoutée
   - Des exemples d'utilisation si possible

### Contribuer du code

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (voir [Guide de commit](#guide-de-commit))
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📝 Standards de code

### TypeScript

- Utilisez TypeScript strict mode
- Évitez `any` autant que possible
- Utilisez des types explicites pour les fonctions publiques
- Documentez les types complexes avec JSDoc

### React/Next.js

- Utilisez des composants fonctionnels avec hooks
- Préférez `'use client'` uniquement quand nécessaire
- Utilisez `'use server'` pour les Server Actions
- Optimisez les images avec `next/image`

### Formatage

- Utilisez Prettier (configuré dans `.prettierrc`)
- Exécutez `npm run format` avant de committer
- Respectez l'indentation de 2 espaces

### Nommage

- **Composants:** PascalCase (`ProductCard.tsx`)
- **Fichiers:** kebab-case pour pages (`product-detail.tsx`), PascalCase pour composants
- **Variables:** camelCase (`userName`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`UserData`)

### Structure des fichiers

```
app/
  [route]/
    page.tsx        # Page principale
    loading.tsx     # État de chargement
    error.tsx       # Gestion d'erreur
    layout.tsx      # Layout spécifique

components/
  ComponentName.tsx # Composant réutilisable
  ui/              # Composants UI de base

lib/
  utility.ts        # Utilitaires
  types.ts         # Types TypeScript
```

---

## 🔄 Processus de Pull Request

### Avant de soumettre

- [ ] Code formaté avec Prettier
- [ ] Tests passent (`npm test`)
- [ ] Lint passe (`npm run lint`)
- [ ] Build réussit (`npm run build`)
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de warnings TypeScript
- [ ] Tests ajoutés pour nouvelles fonctionnalités

### Template de Pull Request

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests manuels effectués
- [ ] Tous les tests passent

## Checklist
- [ ] Code formaté
- [ ] Lint passé
- [ ] Build réussi
- [ ] Documentation mise à jour
```

### Review process

1. Au moins une approbation requise
2. Tous les checks CI doivent passer
3. Pas de conflits avec la branche principale
4. Code review constructif

---

## 📝 Guide de commit

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring du code
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance
- `perf`: Amélioration de performance
- `ci`: Changements CI/CD
- `build`: Changements système de build

### Exemples

```bash
feat(auth): ajouter authentification par téléphone

fix(api): corriger validation des prix au checkout

docs(readme): mettre à jour instructions d'installation

refactor(database): simplifier requêtes SQLite

test(security): ajouter tests rate limiting
```

### Règles

- Utilisez l'impératif ("ajouter" pas "ajouté")
- Première ligne max 72 caractères
- Référencez les issues: `Closes #123`

---

## 🧪 Tests

### Tests unitaires

- Utilisez Vitest pour les tests unitaires
- Placez les tests à côté du code: `lib/auth.ts` → `lib/auth.test.ts`
- Couvrez les fonctions critiques (auth, security, database)

### Tests d'intégration

- Utilisez les scripts existants dans `scripts/`
- Testez les routes API avec `scripts/test-all-apis.js`

### Tests E2E

- Utilisez Playwright pour les tests E2E
- Testez les parcours utilisateur critiques

### Exécuter les tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests d'intégration
npm run test:all

# Tests E2E
npm run test:e2e
```

---

## 📚 Documentation

### Code

- Documentez les fonctions publiques avec JSDoc
- Expliquez les logiques complexes
- Ajoutez des commentaires pour les "pourquoi", pas les "quoi"

### Markdown

- Mettez à jour la documentation si vous changez une fonctionnalité
- Utilisez des exemples de code clairs
- Vérifiez l'orthographe et la grammaire

### API

- Documentez les nouvelles routes API dans `app/api/README.md`
- Mettez à jour la spécification OpenAPI si applicable

---

## 🛠️ Configuration locale

### Prérequis

- Node.js 18+
- npm ou yarn
- Git

### Setup

```bash
# Cloner le repository
git clone <repository-url>
cd inoxya-bijoux

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env.local
# Éditer .env.local avec vos valeurs

# Lancer en développement
npm run dev
```

### Scripts utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run lint         # Linter
npm run format       # Formater avec Prettier
npm test             # Tests unitaires
npm run test:all     # Tous les tests
```

---

## ❓ Questions ?

- Ouvrez une issue pour poser une question
- Consultez la documentation dans `docs/`
- Vérifiez les issues existantes

---

**Merci de contribuer à INOXYA BIJOUX ! 🎉**

