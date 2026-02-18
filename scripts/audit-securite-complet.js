/**
 * AUDIT DE SÉCURITÉ ET CORRECTION GLOBALE - INOXYA BIJOUX
 * Détection et correction de toutes les erreurs et failles de sécurité
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 AUDIT DE SÉCURITÉ COMPLET - INOXYA BIJOUX\n')
console.log('='.repeat(70))

const issues = {
  securite: [],
  frontend: [],
  backend: [],
  database: [],
  liaison: [],
  critiques: []
}

// Patterns de sécurité à détecter
const securityPatterns = {
  xss: [
    /innerHTML\s*=/gi,
    /dangerouslySetInnerHTML/gi,
    /document\.write/gi,
    /eval\s*\(/gi,
    /\.html\s*\(/gi
  ],
  sqlInjection: [
    /\$\{.*\}\s*\+.*SELECT/gi,
    /query\s*\(\s*['"`].*\+.*['"`]/gi,
    /execute\s*\(\s*['"`].*\+.*['"`]/gi
  ],
  secrets: [
    /password.*=.*['"][^'"]+['"]/gi,
    /api[_-]?key.*=.*['"][^'"]+['"]/gi,
    /secret.*=.*['"][^'"]+['"]/gi,
    /token.*=.*['"][^'"]+['"]/gi
  ],
  auth: [
    /if\s*\(\s*!.*auth/gi,
    /if\s*\(\s*!.*user/gi,
    /if\s*\(\s*!.*role/gi
  ],
  validation: [
    /\.body\.\w+\s*[!=]/gi,
    /req\.body\s*[!=]/gi
  ]
}

function scanFile(filePath, category) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    const relativePath = path.relative(process.cwd(), filePath)
    
    // Détection XSS
    securityPatterns.xss.forEach((pattern, idx) => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const lineNum = content.substring(0, content.indexOf(match)).split('\n').length
          issues.securite.push({
            type: 'XSS',
            file: relativePath,
            line: lineNum,
            severity: 'HIGH',
            issue: `Risque XSS détecté: ${match.trim()}`,
            fix: 'Utiliser textContent ou sanitizer'
          })
        })
      }
    })
    
    // Détection SQL Injection
    securityPatterns.sqlInjection.forEach((pattern, idx) => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const lineNum = content.substring(0, content.indexOf(match)).split('\n').length
          issues.securite.push({
            type: 'SQL_INJECTION',
            file: relativePath,
            line: lineNum,
            severity: 'CRITICAL',
            issue: `Risque SQL Injection: ${match.trim()}`,
            fix: 'Utiliser des requêtes paramétrées'
          })
        })
      }
    })
    
    // Détection secrets exposés
    securityPatterns.secrets.forEach((pattern, idx) => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const lineNum = content.substring(0, content.indexOf(match)).split('\n').length
          if (!match.includes('process.env') && !match.includes('import')) {
            issues.securite.push({
              type: 'SECRET_EXPOSED',
              file: relativePath,
              line: lineNum,
              severity: 'CRITICAL',
              issue: `Secret potentiellement exposé: ${match.trim().substring(0, 50)}`,
              fix: 'Utiliser variables d\'environnement'
            })
          }
        })
      }
    })
    
    // Détection routes non protégées
    if (filePath.includes('/api/') && !filePath.includes('test')) {
      const hasAuthCheck = content.includes('getCurrentUser') || 
                          content.includes('requireAuth') ||
                          content.includes('checkRole') ||
                          content.includes('admin') && content.includes('role')
      
      if (!hasAuthCheck && (content.includes('POST') || content.includes('PUT') || content.includes('DELETE'))) {
        issues.backend.push({
          type: 'UNPROTECTED_ROUTE',
          file: relativePath,
          severity: 'HIGH',
          issue: 'Route API sans vérification d\'authentification',
          fix: 'Ajouter vérification d\'authentification et de rôle'
        })
      }
    }
    
    // Détection validation manquante
    if (filePath.includes('/api/')) {
      const hasBodyValidation = content.includes('zod') || 
                               content.includes('validate') ||
                               content.includes('required') ||
                               content.includes('schema')
      
      if (!hasBodyValidation && (content.includes('req.body') || content.includes('request.json()'))) {
        issues.backend.push({
          type: 'MISSING_VALIDATION',
          file: relativePath,
          severity: 'MEDIUM',
          issue: 'Validation des données manquante',
          fix: 'Ajouter validation avec Zod ou validation manuelle'
        })
      }
    }
    
    // Détection gestion d'erreurs manquante
    if (filePath.includes('/api/')) {
      const hasTryCatch = content.includes('try') && content.includes('catch')
      const hasAsync = content.includes('async')
      
      if (hasAsync && !hasTryCatch) {
        issues.backend.push({
          type: 'MISSING_ERROR_HANDLING',
          file: relativePath,
          severity: 'MEDIUM',
          issue: 'Gestion d\'erreurs manquante dans fonction async',
          fix: 'Ajouter try/catch pour gérer les erreurs'
        })
      }
    }
    
    // Détection console.log en production
    if (content.includes('console.log') && !filePath.includes('scripts/')) {
      const consoleLogs = content.match(/console\.(log|error|warn)/g)
      if (consoleLogs) {
        issues.frontend.push({
          type: 'CONSOLE_LOG',
          file: relativePath,
          severity: 'LOW',
          issue: `${consoleLogs.length} console.log détecté(s)`,
          fix: 'Remplacer par logger ou supprimer'
        })
      }
    }
    
  } catch (error) {
    issues.critiques.push({
      type: 'FILE_READ_ERROR',
      file: filePath,
      severity: 'HIGH',
      issue: `Impossible de lire le fichier: ${error.message}`
    })
  }
}

function scanDirectory(dir, category) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDirectory(fullPath, category)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          scanFile(fullPath, category)
        }
      }
    }
  } catch (error) {
    issues.critiques.push({
      type: 'DIR_SCAN_ERROR',
      dir: dir,
      severity: 'MEDIUM',
      issue: `Erreur scan répertoire: ${error.message}`
    })
  }
}

// Scanner les répertoires critiques
console.log('\n📁 Scan des fichiers...\n')

console.log('🔍 Scan app/...')
scanDirectory(path.join(process.cwd(), 'app'), 'frontend')

console.log('🔍 Scan components/...')
scanDirectory(path.join(process.cwd(), 'components'), 'frontend')

console.log('🔍 Scan lib/...')
scanDirectory(path.join(process.cwd(), 'lib'), 'backend')

console.log('🔍 Scan app/api/...')
scanDirectory(path.join(process.cwd(), 'app', 'api'), 'backend')

// Génération du rapport
console.log('\n📊 RÉSULTATS DE L\'AUDIT\n')
console.log('='.repeat(70))

const totalIssues = 
  issues.securite.length + 
  issues.frontend.length + 
  issues.backend.length + 
  issues.database.length + 
  issues.liaison.length + 
  issues.critiques.length

console.log(`\n🔴 Total d'issues détectées: ${totalIssues}\n`)

if (issues.securite.length > 0) {
  console.log(`\n🔒 SÉCURITÉ (${issues.securite.length} issues):`)
  const critical = issues.securite.filter(i => i.severity === 'CRITICAL')
  const high = issues.securite.filter(i => i.severity === 'HIGH')
  console.log(`  - CRITIQUE: ${critical.length}`)
  console.log(`  - HAUTE: ${high.length}`)
  critical.slice(0, 5).forEach(issue => {
    console.log(`    ❌ ${issue.type} - ${issue.file}:${issue.line || ''} - ${issue.issue}`)
  })
}

if (issues.backend.length > 0) {
  console.log(`\n⚙️  BACKEND (${issues.backend.length} issues):`)
  issues.backend.slice(0, 10).forEach(issue => {
    console.log(`  ⚠️  ${issue.type} - ${issue.file} - ${issue.issue}`)
  })
}

if (issues.frontend.length > 0) {
  console.log(`\n🎨 FRONTEND (${issues.frontend.length} issues):`)
  issues.frontend.slice(0, 10).forEach(issue => {
    console.log(`  ⚠️  ${issue.type} - ${issue.file} - ${issue.issue}`)
  })
}

// Sauvegarder le rapport
const report = {
  date: new Date().toISOString(),
  totalIssues,
  issues,
  summary: {
    securite: issues.securite.length,
    frontend: issues.frontend.length,
    backend: issues.backend.length,
    database: issues.database.length,
    liaison: issues.liaison.length,
    critiques: issues.critiques.length
  }
}

const reportPath = path.join(process.cwd(), 'RAPPORT_AUDIT_SECURITE.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(`\n✅ Rapport sauvegardé: ${reportPath}`)
console.log('\n' + '='.repeat(70))
console.log('✅ Audit terminé!\n')


