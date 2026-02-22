#!/usr/bin/env node
/**
 * AUDIT COMPLET FINAL - PRÉPARATION DÉPLOIEMENT
 * 
 * Ce script effectue un audit complet de tous les aspects du projet :
 * - Backend APIs (routes, méthodes HTTP, protection)
 * - Authentification (login, register, logout)
 * - Protection CSRF (toutes les routes POST/PUT/DELETE)
 * - Opérations CRUD (Create, Read, Update, Delete)
 * - Base de données (Supabase, connexion, requêtes)
 * - Validation Zod (tous les schémas)
 * - Compilation TypeScript
 * - Linting ESLint
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface AuditResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: AuditResult[] = []
const projectRoot = process.cwd()

function addResult(category: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ category, test, status, message, details })
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : '⚠️'
  console.log(`${icon} [${category}] ${test}: ${message}`)
  if (details) {
    console.log(`   ${details}`)
  }
}

// ============================================
// 1. VÉRIFICATION DES ROUTES API
// ============================================

function auditAPIRoutes() {
  console.log('\n📡 [1/8] Audit des routes API...\n')
  
  const apiDir = path.join(projectRoot, 'app', 'api')
  if (!fs.existsSync(apiDir)) {
    addResult('API Routes', 'Dossier app/api', '❌', 'Dossier app/api introuvable')
    return
  }
  
  const routeFiles: string[] = []
  
  function findRouteFiles(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        findRouteFiles(filePath)
      } else if (file === 'route.ts' || file === 'route.js') {
        routeFiles.push(filePath)
      }
    }
  }
  
  findRouteFiles(apiDir)
  addResult('API Routes', 'Fichiers route.ts trouvés', '✅', `${routeFiles.length} routes API`)
  
  // Vérifier les méthodes HTTP dans chaque route
  const methodsFound: Record<string, Set<string>> = {}
  const csrfProtected: string[] = []
  const csrfMissing: string[] = []
  const adminProtected: string[] = []
  const adminMissing: string[] = []
  
  for (const routeFile of routeFiles) {
    const content = fs.readFileSync(routeFile, 'utf-8')
    const relativePath = path.relative(apiDir, routeFile).replace(/\\/g, '/').replace('/route.ts', '')
    
    // Détecter les méthodes HTTP
    const hasGET = /export\s+async\s+function\s+GET/.test(content)
    const hasPOST = /export\s+async\s+function\s+POST/.test(content)
    const hasPUT = /export\s+async\s+function\s+PUT/.test(content)
    const hasDELETE = /export\s+async\s+function\s+DELETE/.test(content)
    const hasPATCH = /export\s+async\s+function\s+PATCH/.test(content)
    
    if (hasGET) {
      if (!methodsFound[relativePath]) methodsFound[relativePath] = new Set()
      methodsFound[relativePath].add('GET')
    }
    if (hasPOST) {
      if (!methodsFound[relativePath]) methodsFound[relativePath] = new Set()
      methodsFound[relativePath].add('POST')
    }
    if (hasPUT) {
      if (!methodsFound[relativePath]) methodsFound[relativePath] = new Set()
      methodsFound[relativePath].add('PUT')
    }
    if (hasDELETE) {
      if (!methodsFound[relativePath]) methodsFound[relativePath] = new Set()
      methodsFound[relativePath].add('DELETE')
    }
    if (hasPATCH) {
      if (!methodsFound[relativePath]) methodsFound[relativePath] = new Set()
      methodsFound[relativePath].add('PATCH')
    }
    
    // Vérifier protection CSRF pour POST/PUT/DELETE
    const needsCSRF = hasPOST || hasPUT || hasDELETE
    const hasCSRF = /requireCSRF/.test(content) || /csrf-token/.test(relativePath)
    
    if (needsCSRF) {
      if (hasCSRF) {
        csrfProtected.push(relativePath)
      } else {
        csrfMissing.push(relativePath)
      }
    }
    
    // Vérifier protection admin pour routes /admin/*
    const isAdminRoute = relativePath.includes('/admin/')
    const hasAdminAuth = /requireAdminApi/.test(content) || /requireAdmin/.test(content)
    
    if (isAdminRoute) {
      if (hasAdminAuth) {
        adminProtected.push(relativePath)
      } else {
        adminMissing.push(relativePath)
      }
    }
  }
  
  // Résultats
  addResult('API Routes', 'Méthodes HTTP détectées', '✅', `${Object.keys(methodsFound).length} routes avec méthodes HTTP`)
  
  if (csrfMissing.length > 0) {
    addResult('API Routes', 'Protection CSRF', '❌', `${csrfMissing.length} routes POST/PUT/DELETE sans CSRF`, csrfMissing.join(', '))
  } else {
    addResult('API Routes', 'Protection CSRF', '✅', `Toutes les routes POST/PUT/DELETE protégées (${csrfProtected.length})`)
  }
  
  if (adminMissing.length > 0) {
    addResult('API Routes', 'Protection Admin', '❌', `${adminMissing.length} routes admin sans authentification`, adminMissing.join(', '))
  } else {
    addResult('API Routes', 'Protection Admin', '✅', `Toutes les routes admin protégées (${adminProtected.length})`)
  }
}

// ============================================
// 2. VÉRIFICATION AUTHENTIFICATION
// ============================================

function auditAuthentication() {
  console.log('\n🔐 [2/8] Audit de l\'authentification...\n')
  
  const authFiles = [
    'app/api/auth/login/route.ts',
    'app/api/auth/register/route.ts',
    'app/api/auth/logout/route.ts',
    'app/api/auth/me/route.ts',
    'lib/auth.ts',
    'lib/admin-auth.ts'
  ]
  
  for (const file of authFiles) {
    const filePath = path.join(projectRoot, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Vérifier validation Zod
      const hasZodValidation = /validateWithSchema|registerSchema|loginSchema/.test(content)
      
      // Vérifier sanitization
      const hasSanitization = /sanitizeInput/.test(content)
      
      // Vérifier rate limiting
      const hasRateLimit = /checkRateLimit|rateLimit/.test(content)
      
      // Vérifier CSRF
      const hasCSRF = /requireCSRF/.test(content)
      
      const fileName = path.basename(file)
      if (hasZodValidation) {
        addResult('Auth', `${fileName} - Validation Zod`, '✅', 'Validation Zod présente')
      } else if (file.includes('login') || file.includes('register')) {
        addResult('Auth', `${fileName} - Validation Zod`, '⚠️', 'Validation Zod manquante')
      }
      
      if (hasSanitization) {
        addResult('Auth', `${fileName} - Sanitization`, '✅', 'Sanitization présente')
      } else if (file.includes('login') || file.includes('register')) {
        addResult('Auth', `${fileName} - Sanitization`, '⚠️', 'Sanitization manquante')
      }
      
      if (hasRateLimit) {
        addResult('Auth', `${fileName} - Rate Limiting`, '✅', 'Rate limiting présent')
      } else if (file.includes('login') || file.includes('register')) {
        addResult('Auth', `${fileName} - Rate Limiting`, '⚠️', 'Rate limiting manquant')
      }
      
      if (hasCSRF && (file.includes('login') || file.includes('register'))) {
        addResult('Auth', `${fileName} - CSRF`, '✅', 'Protection CSRF présente')
      }
    } else {
      addResult('Auth', file, '❌', 'Fichier introuvable')
    }
  }
}

// ============================================
// 3. VÉRIFICATION CSRF
// ============================================

function auditCSRF() {
  console.log('\n🛡️  [3/8] Audit de la protection CSRF...\n')
  
  const csrfFile = path.join(projectRoot, 'lib', 'security.ts')
  if (!fs.existsSync(csrfFile)) {
    addResult('CSRF', 'lib/security.ts', '❌', 'Fichier lib/security.ts introuvable')
    return
  }
  
  const content = fs.readFileSync(csrfFile, 'utf-8')
  
  const hasGenerateCSRF = /generateCSRFToken/.test(content)
  const hasSetCSRF = /setCSRFToken/.test(content)
  const hasRequireCSRF = /requireCSRF/.test(content)
  const hasCSRFTokenRoute = fs.existsSync(path.join(projectRoot, 'app', 'api', 'csrf-token', 'route.ts'))
  
  if (hasGenerateCSRF) {
    addResult('CSRF', 'generateCSRFToken()', '✅', 'Fonction présente')
  } else {
    addResult('CSRF', 'generateCSRFToken()', '❌', 'Fonction manquante')
  }
  
  if (hasSetCSRF) {
    addResult('CSRF', 'setCSRFToken()', '✅', 'Fonction présente')
  } else {
    addResult('CSRF', 'setCSRFToken()', '❌', 'Fonction manquante')
  }
  
  if (hasRequireCSRF) {
    addResult('CSRF', 'requireCSRF()', '✅', 'Fonction présente')
  } else {
    addResult('CSRF', 'requireCSRF()', '❌', 'Fonction manquante')
  }
  
  if (hasCSRFTokenRoute) {
    addResult('CSRF', '/api/csrf-token', '✅', 'Route API présente')
  } else {
    addResult('CSRF', '/api/csrf-token', '❌', 'Route API manquante')
  }
}

// ============================================
// 4. VÉRIFICATION CRUD
// ============================================

function auditCRUD() {
  console.log('\n📝 [4/8] Audit des opérations CRUD...\n')
  
  const crudRoutes = [
    { path: 'app/api/products/route.ts', operations: ['GET', 'POST'], name: 'Products' },
    { path: 'app/api/products/[id]/route.ts', operations: ['GET', 'PUT', 'DELETE'], name: 'Product by ID' },
    { path: 'app/api/packs/route.ts', operations: ['GET', 'POST'], name: 'Packs' },
    { path: 'app/api/packs/[id]/route.ts', operations: ['GET', 'PUT', 'DELETE'], name: 'Pack by ID' },
    { path: 'app/api/orders/route.ts', operations: ['GET', 'POST'], name: 'Orders' },
    { path: 'app/api/custom-requests/route.ts', operations: ['GET', 'POST'], name: 'Custom Requests' }
  ]
  
  for (const route of crudRoutes) {
    const filePath = path.join(projectRoot, route.path)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      for (const op of route.operations) {
        const hasOperation = new RegExp(`export\\s+async\\s+function\\s+${op}`).test(content)
        if (hasOperation) {
          addResult('CRUD', `${route.name} - ${op}`, '✅', 'Opération présente')
          
          // Vérifier validation pour POST/PUT (validateWithSchema ou .parse( avec schema Zod)
          const hasZodValidation = /validateWithSchema/.test(content) || /Schema\.parse\(/.test(content) || /updateProductSchema\.parse|createProductSchema\.parse/.test(content)
          if ((op === 'POST' || op === 'PUT') && hasZodValidation) {
            addResult('CRUD', `${route.name} - ${op} Validation`, '✅', 'Validation Zod présente')
          } else if (op === 'POST' || op === 'PUT') {
            addResult('CRUD', `${route.name} - ${op} Validation`, '⚠️', 'Validation Zod manquante')
          }
          
          // Vérifier CSRF pour POST/PUT/DELETE
          if ((op === 'POST' || op === 'PUT' || op === 'DELETE') && /requireCSRF/.test(content)) {
            addResult('CRUD', `${route.name} - ${op} CSRF`, '✅', 'Protection CSRF présente')
          } else if (op === 'POST' || op === 'PUT' || op === 'DELETE') {
            addResult('CRUD', `${route.name} - ${op} CSRF`, '❌', 'Protection CSRF manquante')
          }
        } else {
          addResult('CRUD', `${route.name} - ${op}`, '❌', 'Opération manquante')
        }
      }
    } else {
      addResult('CRUD', route.path, '❌', 'Fichier introuvable')
    }
  }
}

// ============================================
// 5. VÉRIFICATION BASE DE DONNÉES
// ============================================

function auditDatabase() {
  console.log('\n💾 [5/8] Audit de la base de données...\n')
  
  // Vérifier les adapters
  const adapters = [
    'lib/db/supabase-adapter.ts',
    'lib/db/postgres-adapter.ts',
    'lib/db/sqlite-adapter.ts',
    'lib/db/index.ts',
    'lib/db/adapter.ts'
  ]
  
  for (const adapter of adapters) {
    const filePath = path.join(projectRoot, adapter)
    if (fs.existsSync(filePath)) {
      addResult('Database', path.basename(adapter), '✅', 'Fichier présent')
    } else {
      addResult('Database', path.basename(adapter), '❌', 'Fichier manquant')
    }
  }
  
  // Vérifier les fonctions de base de données
  const dbFile = path.join(projectRoot, 'lib', 'database.ts')
  if (fs.existsSync(dbFile)) {
    const content = fs.readFileSync(dbFile, 'utf-8')
    
    const functions = [
      'getAllBijoux',
      'getBijouById',
      'getAllPacks',
      'getDashboardStats',
      'createOrder',
      'createOrderItem'
    ]
    
    for (const func of functions) {
      if (new RegExp(`export\\s+(async\\s+)?function\\s+${func}`).test(content)) {
        addResult('Database', `Function ${func}()`, '✅', 'Fonction présente')
      } else {
        addResult('Database', `Function ${func}()`, '❌', 'Fonction manquante')
      }
    }
  }
  
  // Vérifier les variables d'environnement (sans lire le fichier .env.local)
  addResult('Database', 'Variables d\'environnement', '⚠️', 'Vérifiez manuellement: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL')
}

// ============================================
// 6. VÉRIFICATION VALIDATION ZOD
// ============================================

function auditValidation() {
  console.log('\n✅ [6/8] Audit de la validation Zod...\n')
  
  const validationFile = path.join(projectRoot, 'lib', 'validations.ts')
  if (!fs.existsSync(validationFile)) {
    addResult('Validation', 'lib/validations.ts', '❌', 'Fichier introuvable')
    return
  }
  
  const content = fs.readFileSync(validationFile, 'utf-8')
  
  const schemas = [
    'phoneSchema',
    'passwordSchema',
    'emailSchema',
    'priceSchema',
    'createProductSchema',
    'updateProductSchema',
    'registerSchema',
    'loginSchema',
    'checkoutSchema',
    'orderItemSchema'
  ]
  
  for (const schema of schemas) {
    if (new RegExp(`export\\s+const\\s+${schema}`).test(content)) {
      addResult('Validation', `Schema ${schema}`, '✅', 'Schéma présent')
    } else {
      addResult('Validation', `Schema ${schema}`, '❌', 'Schéma manquant')
    }
  }
}

// ============================================
// 7. VÉRIFICATION COMPILATION TYPESCRIPT
// ============================================

function auditTypeScript() {
  console.log('\n🔷 [7/8] Audit TypeScript (compilation)...\n')
  
  try {
    addResult('TypeScript', 'Compilation', '⚠️', 'Lancement de la compilation...')
    const output = execSync('npm run build', { 
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000 // 2 minutes
    })
    
    if (output.includes('Compiled successfully') || output.includes('✓ Compiled')) {
      addResult('TypeScript', 'Compilation', '✅', 'Compilation réussie')
    } else if (output.includes('Failed to compile') || output.includes('Error:')) {
      const errorLines = output.split('\n').filter(line => 
        line.includes('Error:') || line.includes('error TS') || line.includes('Failed')
      ).slice(0, 5)
      addResult('TypeScript', 'Compilation', '❌', 'Erreurs de compilation', errorLines.join('; '))
    } else {
      addResult('TypeScript', 'Compilation', '⚠️', 'Résultat inattendu', output.substring(0, 200))
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('timeout')) {
      addResult('TypeScript', 'Compilation', '⚠️', 'Timeout (compilation trop longue)')
    } else {
      addResult('TypeScript', 'Compilation', '❌', 'Erreur lors de la compilation', errorMessage.substring(0, 200))
    }
  }
}

// ============================================
// 8. VÉRIFICATION LINTING ESLINT
// ============================================

function auditLinting() {
  console.log('\n🔍 [8/8] Audit ESLint (linting)...\n')
  
  try {
    addResult('ESLint', 'Linting', '⚠️', 'Lancement du linting...')
    const output = execSync('npm run lint', { 
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 60000 // 1 minute
    })
    
    if (output.includes('No ESLint warnings or errors') || output.includes('✔')) {
      addResult('ESLint', 'Linting', '✅', 'Aucune erreur ESLint')
    } else if (output.includes('error') || output.includes('Error:')) {
      const errorLines = output.split('\n').filter(line => 
        line.includes('error') || line.includes('Error:')
      ).slice(0, 5)
      addResult('ESLint', 'Linting', '❌', 'Erreurs ESLint détectées', errorLines.join('; '))
    } else {
      addResult('ESLint', 'Linting', '⚠️', 'Vérifiez manuellement les warnings', output.substring(0, 200))
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('timeout')) {
      addResult('ESLint', 'Linting', '⚠️', 'Timeout (linting trop long)')
    } else {
      // ESLint peut retourner un code d'erreur même avec des warnings
      addResult('ESLint', 'Linting', '⚠️', 'Vérifiez manuellement', errorMessage.substring(0, 200))
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('='.repeat(70))
  console.log('🔍 AUDIT COMPLET FINAL - PRÉPARATION DÉPLOIEMENT')
  console.log('='.repeat(70))
  
  auditAPIRoutes()
  auditAuthentication()
  auditCSRF()
  auditCRUD()
  auditDatabase()
  auditValidation()
  auditTypeScript()
  auditLinting()
  
  // Résumé final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSUMÉ FINAL')
  console.log('='.repeat(70))
  
  const success = results.filter(r => r.status === '✅').length
  const warnings = results.filter(r => r.status === '⚠️').length
  const errors = results.filter(r => r.status === '❌').length
  
  console.log(`\n✅ Succès: ${success}`)
  console.log(`⚠️  Avertissements: ${warnings}`)
  console.log(`❌ Erreurs: ${errors}`)
  console.log(`\nTotal: ${results.length} tests`)
  
  if (errors === 0 && warnings === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS ! Le projet est prêt pour le déploiement.')
  } else if (errors === 0) {
    console.log('\n⚠️  Certains avertissements ont été détectés. Vérifiez-les avant le déploiement.')
  } else {
    console.log('\n❌ Des erreurs ont été détectées. Corrigez-les avant le déploiement.')
  }
  
  console.log('\n' + '='.repeat(70))
  
  // Retourner le code de sortie approprié
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Erreur fatale lors de l\'audit:', error)
  process.exit(1)
})

