import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { checkRateLimit, recordFailedAttempt, resetRateLimit, sanitizeInput, requireCSRF } from '@/lib/security'
import { loginSchema, validateWithSchema } from '@/lib/validations'
import { testConnection } from '@/lib/sqlite'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { cookies } from 'next/headers'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    // Rate limiting par IP et par phone
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    // Vérifier rate limit par IP
    const ipRateCheck = await checkRateLimit(`login_ip_${clientIP}`)
    if (!ipRateCheck.allowed) {
      logger.warn(`[SECURITY] Rate limit IP triggered: ${clientIP}`)
      return NextResponse.json(
        { success: false, error: `Trop de tentatives. Réessayez dans ${ipRateCheck.retryAfter} secondes.` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    const { phone, password } = validation.data

    // Normaliser le téléphone: supprimer espaces, tirets, points pour la recherche DB
    // SAUF pour admin_phone qui est un identifiant spécial
    // La validation Zod a déjà vérifié le format, maintenant on normalise pour la recherche
    const normalizedPhone = phone === 'admin_phone' 
      ? 'admin_phone' 
      : phone.replace(/[\s\-\.]/g, '').trim()
    const sanitizedPhone = sanitizeInput(normalizedPhone)

    // Vérifier rate limit par phone (protège contre attaques ciblées)
    const phoneRateCheck = await checkRateLimit(`login_phone_${sanitizedPhone}`)
    if (!phoneRateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Compte temporairement bloqué. Réessayez dans ${phoneRateCheck.retryAfter} secondes.` },
        { status: 429 }
      )
    }

    // Appeler la fonction de connexion
    let result = await loginUser(sanitizedPhone, password)
    
    // IMPORTANT: Si loginUser réussit, créer le cookie directement dans l'API route
    // car les cookies créés dans les Server Actions peuvent ne pas être propagés correctement
    if (result.success && result.user) {
      const cookieStore = await cookies()
      cookieStore.set("user_id", result.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // "lax" pour permettre la redirection après login (strict bloque la redirection)
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: '/' // Explicit path pour garantir la portée
      })
      logger.info('[API Login] ✅ Cookie créé pour utilisateur', { 
        userId: result.user.id,
        phone: sanitizedPhone,
        role: result.user.role 
      })
    }
    
    // Si échec et better-sqlite3 n'est pas disponible, essayer avec sql.js directement dans l'API route
    if (!result.success && !testConnection()) {
      logger.info('[API Login] better-sqlite3 non disponible, tentative avec sql.js fallback', { phone: sanitizedPhone })
      try {
        const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
        
        if (!fs.existsSync(dbPath)) {
          logger.warn('[API Login] Base de données non trouvée', { path: dbPath })
        } else {
          logger.info('[API Login] Base de données trouvée, chargement de sql.js...', { path: dbPath })
          
          // Charger sql.js de manière dynamique
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let sqlJsModule: any
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            sqlJsModule = require('sql.js')
            logger.info('[API Login] sql.js chargé avec succès')
          } catch (requireError) {
            const errorMsg = requireError instanceof Error ? requireError.message : String(requireError)
            logger.warn('[API Login] Impossible de charger sql.js', { error: errorMsg })
            throw requireError
          }
          
          // Initialiser sql.js - essayer plusieurs formats
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let SQL: any = null
          try {
            logger.info('[API Login] Initialisation de sql.js...')
            
            // Format 1: fonction directe
            if (typeof sqlJsModule === 'function') {
              logger.info('[API Login] Format sql.js: fonction directe')
              SQL = await sqlJsModule()
            }
            // Format 2: default export
            else if (sqlJsModule.default && typeof sqlJsModule.default === 'function') {
              logger.info('[API Login] Format sql.js: default export')
              SQL = await sqlJsModule.default()
            }
            // Format 3: déjà initialisé
            else if (sqlJsModule.Database) {
              logger.info('[API Login] Format sql.js: déjà initialisé')
              SQL = sqlJsModule
            }
            // Format 4: initSqlJs
            else if (sqlJsModule.initSqlJs && typeof sqlJsModule.initSqlJs === 'function') {
              logger.info('[API Login] Format sql.js: initSqlJs')
              SQL = await sqlJsModule.initSqlJs()
            }
            else {
              logger.error('[API Login] Format sql.js non reconnu', { 
                moduleKeys: Object.keys(sqlJsModule),
                moduleType: typeof sqlJsModule
              })
              throw new Error('Format sql.js non reconnu')
            }
            
            if (!SQL || !SQL.Database) {
              throw new Error('SQL.Database non disponible après initialisation')
            }
            
            logger.info('[API Login] sql.js initialisé avec succès, chargement de la base...')
            
            const fileBuffer = fs.readFileSync(dbPath)
            const db = new SQL.Database(fileBuffer)
            logger.info('[API Login] Base de données chargée en mémoire')
            
            // Chercher l'utilisateur avec une requête préparée (plus sûr)
            // Essayer plusieurs formats de téléphone (avec/sans +212, avec/sans espaces)
            logger.info('[API Login] Recherche de l\'utilisateur...', { phone: sanitizedPhone })
            
            // Essayer d'abord avec le téléphone tel quel
            let stmt = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
            stmt.bind([sanitizedPhone])
            
            let userFound = false
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let userRow: any = null
            
            if (stmt.step()) {
              userRow = stmt.getAsObject()
              userFound = true
            } else {
              // Si pas trouvé, essayer avec d'autres formats
              // Format 1: Ajouter +212 si commence par 0
              if (sanitizedPhone.startsWith('0')) {
                const phoneWithPrefix = '+212' + sanitizedPhone.substring(1)
                stmt.free()
                stmt = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
                stmt.bind([phoneWithPrefix])
                if (stmt.step()) {
                  userRow = stmt.getAsObject()
                  userFound = true
                }
              }
              // Format 2: Enlever +212 si présent
              if (!userFound && sanitizedPhone.startsWith('+212')) {
                const phoneWithoutPrefix = '0' + sanitizedPhone.substring(4)
                stmt.free()
                stmt = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
                stmt.bind([phoneWithoutPrefix])
                if (stmt.step()) {
                  userRow = stmt.getAsObject()
                  userFound = true
                }
              }
            }
            
            if (!userFound || !userRow) {
              logger.warn('[API Login] ❌ Utilisateur non trouvé dans la base', { phone: sanitizedPhone })
              stmt.free()
              db.close()
              // Continuer avec result.success = false (déjà défini plus haut)
            } else {
              // Construire l'objet utilisateur
              const userObj = {
                id: String(userRow.id),
                phone: userRow.phone,
                password_hash: userRow.password_hash,
                first_name: userRow.first_name || undefined,
                last_name: userRow.last_name || undefined,
                role: userRow.role
              }
              
              logger.info('[API Login] Utilisateur trouvé dans la base', { 
                phone: sanitizedPhone, 
                userId: userObj.id,
                role: userObj.role,
                phoneInDb: userObj.phone
              })
              
              // Vérifier le mot de passe
              logger.info('[API Login] Vérification du mot de passe...')
              const isValid = bcrypt.compareSync(password, userObj.password_hash)
              logger.info('[API Login] Résultat de la vérification du mot de passe', { isValid })
              
              if (isValid) {
                // Créer le cookie de session
                const cookieStore = await cookies()
                cookieStore.set("user_id", userObj.id, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax", // "lax" pour permettre la redirection après login (strict bloque la redirection)
                  maxAge: 60 * 60 * 24 * 7, // 7 jours
                  path: '/' // Explicit path pour garantir la portée
                })
                
                // Créer la réponse de succès
                result = {
                  success: true,
                  user: {
                    id: userObj.id,
                    phone: userObj.phone,
                    first_name: userObj.first_name,
                    last_name: userObj.last_name,
                    role: userObj.role as "user" | "moderator" | "admin"
                  }
                }
                
                logger.info('[API Login] ✅ Connexion réussie via sql.js fallback', { 
                  phone: sanitizedPhone, 
                  userId: userObj.id,
                  role: userObj.role 
                })
              } else {
                logger.warn('[API Login] ❌ Mot de passe incorrect', { phone: sanitizedPhone })
                result = {
                  success: false,
                  error: 'Utilisateur non trouvé ou mot de passe incorrect'
                }
              }
              
              stmt.free()
            }
            
            db.close()
            logger.info('[API Login] Base de données fermée')
          } catch (initError) {
            const errorMsg = initError instanceof Error ? initError.message : String(initError)
            // Logger toutes les erreurs pour diagnostic
            logger.error('[API Login] Erreur lors de l\'initialisation ou de l\'utilisation de sql.js', { 
              error: errorMsg,
              stack: initError instanceof Error ? initError.stack : undefined
            })
            throw initError
          }
        }
      } catch (sqlJsError) {
        // Logger toutes les erreurs pour diagnostic
        const errorMsg = sqlJsError instanceof Error ? sqlJsError.message : String(sqlJsError)
        logger.error('[API Login] Erreur avec sql.js fallback direct', { 
          error: errorMsg,
          stack: sqlJsError instanceof Error ? sqlJsError.stack : undefined
        })
      }
    }
    
    const statusCode = result.success ? 200 : 401

    if (result.success) {
      // Réinitialiser les compteurs après succès
      await resetRateLimit(`login_ip_${clientIP}`)
      await resetRateLimit(`login_phone_${sanitizedPhone}`)
      
      // Logger pour diagnostic
      logger.info('[API Login] ✅ Connexion réussie', {
        userId: result.user?.id,
        phone: sanitizedPhone,
        role: result.user?.role
      })
    } else {
      // Enregistrer l'échec pour les deux identifiants
      await recordFailedAttempt(`login_ip_${clientIP}`)
      await recordFailedAttempt(`login_phone_${sanitizedPhone}`)
      
      // Logger pour diagnostic
      logger.warn('[API Login] ❌ Échec de connexion', {
        phone: sanitizedPhone,
        error: result.error
      })
    }

    logger.api('POST', '/api/auth/login', statusCode)
    
    // IMPORTANT: Retourner JSON avec les informations de redirection
    // Le cookie a déjà été créé avec cookieStore.set() plus haut, il sera inclus dans la réponse JSON
    // Le client redirigera après avoir reçu la réponse avec le cookie
    const response = NextResponse.json(
      {
        ...result,
        // Ajouter les informations de redirection si login réussi
        redirect: result.success && result.user ? (result.user.role === 'admin' ? '/admin' : '/fr') : undefined
      },
      { status: statusCode }
    )
    
    // S'assurer que les cookies sont bien envoyés
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    
    // Le cookie créé avec cookieStore.set() plus haut sera automatiquement inclus dans cette réponse
    return response
  } catch (error) {
    logger.error('Erreur lors de la connexion', { context: 'API_AUTH_LOGIN', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

