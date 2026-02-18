# 🚀 Configuration des Nouvelles Fonctionnalités

Ce document explique comment utiliser les nouvelles fonctionnalités ajoutées au projet.

## 📦 Installation des Dépendances

Après avoir récupéré les changements, installez les nouvelles dépendances :

```bash
npm install
```

## 🧪 Tests Unitaires (Vitest)

### Configuration

Vitest est maintenant configuré pour les tests unitaires. La configuration se trouve dans `vitest.config.ts`.

### Exécuter les tests

```bash
# Lancer tous les tests
npm test

# Mode watch (redémarre automatiquement)
npm run test:watch

# Interface UI pour les tests
npm run test:ui

# Avec coverage
npm run test:coverage
```

### Structure des tests

Les tests sont organisés dans le dossier `tests/` :
- `tests/setup.ts` - Configuration globale des tests
- `tests/lib/` - Tests pour les modules `lib/`

### Exemples de tests

Des exemples de tests sont fournis dans :
- `tests/lib/auth.test.ts` - Tests d'authentification (à compléter)
- `tests/lib/security.test.ts` - Tests de sécurité (à compléter)

## 🎨 Prettier

### Configuration

Prettier est configuré dans `.prettierrc` pour un formatage cohérent du code.

### Utilisation

```bash
# Formater tous les fichiers
npm run format

# Vérifier le formatage (sans modifier)
npm run format:check
```

### Fichiers ignorés

Les fichiers ignorés sont listés dans `.prettierignore`.

## 🔧 EditorConfig

EditorConfig est configuré dans `.editorconfig` pour maintenir un style de code cohérent entre différents éditeurs.

Aucune action requise - votre éditeur devrait détecter automatiquement la configuration.

## 🪝 Git Hooks (Husky)

### Installation

Après `npm install`, initialisez Husky :

```bash
npx husky install
```

### Hooks configurés

- **pre-commit** : Exécute `lint-staged` pour formater et linter les fichiers modifiés
- **pre-push** : Vérifie le lint et le formatage avant le push

### Configuration lint-staged

La configuration se trouve dans `.lintstagedrc` :
- Formate et lint les fichiers `.ts`, `.tsx`, `.js`, `.jsx`
- Formate les fichiers `.json`, `.md`, `.yml`, `.yaml`

## 🔄 CI/CD (GitHub Actions)

### Workflow configuré

Le workflow CI est configuré dans `.github/workflows/ci.yml` et s'exécute automatiquement sur :
- Push vers `main`, `develop`, `master`
- Pull requests vers ces branches

### Jobs CI

1. **lint** : ESLint, TypeScript check, Prettier check
2. **build** : Build de production
3. **test** : Tests unitaires et d'intégration
4. **security** : Audit npm

### Variables d'environnement

Pour le build CI, certaines variables sont nécessaires. Configurez-les dans les secrets GitHub :
- `JWT_SECRET` (optionnel pour le build)

## 🤖 Dependabot

Dependabot est configuré dans `.github/dependabot.yml` pour :
- Mises à jour automatiques des dépendances npm (hebdomadaire)
- Mises à jour des GitHub Actions (hebdomadaire)
- Groupement des mises à jour mineures et patch

### Configuration

- Ignore les mises à jour majeures pour `next`, `react`, `react-dom`, `typescript`
- Limite à 10 PR ouvertes pour npm
- Limite à 5 PR ouvertes pour GitHub Actions

## 📚 Documentation

### CHANGELOG.md

Le fichier `CHANGELOG.md` suit le format [Keep a Changelog](https://keepachangelog.com/).

### CONTRIBUTING.md

Le guide de contribution est disponible dans `CONTRIBUTING.md` avec :
- Standards de code
- Processus de Pull Request
- Guide de commit (Conventional Commits)
- Guide des tests

### Documentation API OpenAPI

La spécification OpenAPI est disponible dans `docs/api/openapi.yaml`.

Pour générer une interface Swagger UI, vous pouvez utiliser :
```bash
npm install -D swagger-ui-react
```

## 📝 LICENSE

Le projet utilise maintenant la licence MIT (voir `LICENSE`).

## ✅ Checklist Post-Installation

- [ ] Exécuter `npm install`
- [ ] Exécuter `npx husky install` pour activer les Git hooks
- [ ] Vérifier que Prettier fonctionne : `npm run format:check`
- [ ] Vérifier que les tests fonctionnent : `npm test`
- [ ] Configurer les secrets GitHub pour CI/CD (si applicable)

## 🐛 Dépannage

### Erreur "husky command not found"

```bash
npx husky install
```

### Erreur "vitest command not found"

```bash
npm install
```

### Erreur de formatage Prettier

```bash
npm run format
```

### Tests ne passent pas

Les tests d'exemple sont des placeholders. Complétez-les avec vos vraies fonctions :
- `tests/lib/auth.test.ts`
- `tests/lib/security.test.ts`

## 📖 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Prettier Documentation](https://prettier.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Note importante** : Ces configurations sont conçues pour ne pas casser le projet existant. Tous les changements sont additifs et optionnels.

