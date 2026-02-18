# Phase B - Commandes Windows pour corriger l'installation

## Commandes à exécuter (dans l'ordre)

### 1. Arrêter tous les processus Node.js
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
```

### 2. Nettoyer les locks et fichiers temporaires
```powershell
# Supprimer .next si présent
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }

# Vérifier les locks
Get-ChildItem -Path "node_modules" -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
```

### 3. Installer les dépendances manquantes pour le build
```powershell
# Dépendances optionnelles mais nécessaires pour le build
npm install --save-optional @sentry/nextjs nodemailer

# Dépendances UI manquantes (optionnelles)
npm install --save-optional react-day-picker embla-carousel-react recharts vaul input-otp @radix-ui/react-aspect-ratio @radix-ui/react-context-menu @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-toggle-group react-resizable-panels

# Dépendances pour scripts (devDependencies)
npm install --save-dev pg dotenv @types/pg
```

### 4. Vérifier l'installation
```powershell
npm list @sentry/nextjs nodemailer --depth=0
```

### 5. Alternative si EBUSY persiste
```powershell
# Fermer tous les éditeurs/IDE
# Puis réessayer:
npm install --force
```

