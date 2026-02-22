"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { getDatabaseAdapter } from "@/lib/db"
import { IS_PRODUCTION, IS_DEVELOPMENT } from "@/lib/env"
import {
  getUserByPhone as getSqliteUserByPhone,
  getUserById as getSqliteUserById,
  createUser as createSqliteUser,
  getAllUsers as getSqliteUsers,
} from "@/lib/sqlite"

export async function loginUser(phone: string, password: string) {
  try {
    // Normaliser le téléphone pour la recherche (supprimer espaces, tirets, points)
    // SAUF pour admin_phone qui est un identifiant spécial
    const normalizedPhone = phone === 'admin_phone' 
      ? 'admin_phone' 
      : phone.trim().replace(/[\s\-\.]/g, '')
    
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const user = await adapter.getUserByPhone(normalizedPhone)
      
      if (user && user.password_hash) {
        const isValid = bcrypt.compareSync(password, user.password_hash)
        if (isValid) {
          return {
            success: true,
            user: {
              id: user.id,
              phone: user.phone,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role as "user" | "moderator" | "admin",
            },
          }
        } else {
          if (IS_DEVELOPMENT) {
            console.log('[loginUser] Mot de passe incorrect pour:', { phone: normalizedPhone, userId: user.id })
          }
          return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
        }
      } else if (!user) {
        if (IS_DEVELOPMENT) {
          console.log('[loginUser] Utilisateur non trouvé:', { phone: normalizedPhone })
        }
        return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
      }
    } catch (adapterError) {
      if (IS_PRODUCTION) {
        return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
      }
      if (IS_DEVELOPMENT) {
        console.log('[loginUser] Erreur adapter, fallback SQLite:', adapterError)
      }
    }
    
    // FALLBACK: Utiliser SQLite uniquement en développement (pas de fichier .db sur Vercel)
    if (IS_PRODUCTION) {
      return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
    }
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
      if (isConnected) {
        isConnected = forceConnection()
      }
    }
    
    if (!isConnected) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[loginUser] ❌ Impossible de se connecter à la base de données')
      }
      return { success: false, error: "Erreur de connexion à la base de données" }
    }
    
    const user = getSqliteUserByPhone(normalizedPhone)
    
    if (!user) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[loginUser] Utilisateur non trouvé:', { phone: normalizedPhone })
      }
      return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
    }

    const isValid = bcrypt.compareSync(password, user.password_hash)
    if (!isValid) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[loginUser] Mot de passe incorrect pour:', { phone: normalizedPhone, userId: user.id })
      }
      return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role as "user" | "moderator" | "admin",
      },
    }
  } catch (error) {
    console.error("Erreur de connexion:", error)
    return { success: false, error: "Erreur de connexion" }
  }
}

export async function registerUser(phone: string, password: string, firstName: string, lastName: string, role: string = "user") {
  try {
    // Normaliser le téléphone (supprimer espaces, tirets, points)
    // SAUF pour admin_phone qui est un identifiant spécial
    const normalizedPhone = phone === 'admin_phone' 
      ? 'admin_phone' 
      : phone.trim().replace(/[\s\-\.]/g, '')
    
    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10)
    
    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const existingUser = await adapter.getUserByPhone(normalizedPhone)
      if (existingUser) {
        return { success: false, error: "Ce numéro de téléphone est déjà utilisé" }
      }
      
      // Créer l'utilisateur via l'adapter
      const newUser = await adapter.createUser({
        phone: normalizedPhone,
        password_hash,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        role,
      })

      if (!newUser) {
        return { success: false, error: "Erreur lors de la création du compte" }
      }

      const cookieStore = await cookies()
      cookieStore.set("user_id", newUser.id, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: '/' // Explicit path pour garantir la portée
      })

      return {
        success: true,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role as "user" | "moderator" | "admin",
        },
      }
    } catch (adapterError) {
      // Si l'adapter a lancé une erreur métier (ex. numéro déjà utilisé), la renvoyer
      if (adapterError instanceof Error) {
        const msg = adapterError.message
        if (msg.includes('déjà utilisé') || msg.includes('création du compte') || msg.includes('Erreur')) {
          return { success: false, error: msg }
        }
      }
      // Sinon fallback vers SQLite (ex. adapter non disponible)
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[registerUser] Erreur adapter, fallback SQLite:', adapterError)
      }
    }

    // FALLBACK: Utiliser SQLite directement si l'adapter n'est pas disponible
    const existingUser = getSqliteUserByPhone(normalizedPhone)
    if (existingUser) {
      return { success: false, error: "Ce numéro de téléphone est déjà utilisé" }
    }

    // Hasher le mot de passe pour SQLite aussi
    const password_hash_sqlite = await bcrypt.hash(password, 10)
    
    // createSqliteUser attend la clé "password_hash" avec le hash déjà fait
    const newUser = createSqliteUser({
      phone: normalizedPhone,
      password_hash: password_hash_sqlite,
      first_name: firstName,
      last_name: lastName,
      role,
    })

    if (!newUser) {
      return { success: false, error: "Erreur lors de la création du compte" }
    }

    const cookieStore = await cookies()
    cookieStore.set("user_id", newUser.id, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/' // Explicit path pour garantir la portée
    })

    return {
      success: true,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role as "user" | "moderator" | "admin",
      },
    }
  } catch (error) {
    console.error("Erreur d'inscription:", error)
    const message = error instanceof Error ? error.message : "Erreur d'inscription"
    return { success: false, error: message }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("user_id")
    redirect("/")
  } catch (error) {
    // Next.js redirect() lance une erreur spéciale NEXT_REDIRECT - ne pas la logger comme erreur
    const err = error as { digest?: string }
    if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error
    }
    console.error("Erreur de déconnexion:", error)
    redirect("/")
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[getCurrentUser] Aucun cookie user_id trouvé')
      }
      return null
    }

    if (process.env['NODE_ENV'] === 'development') {
      console.log('[getCurrentUser] Cookie user_id trouvé:', userId)
    }

    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      const user = await adapter.getUserById(userId)
      
      if (user) {
        if (process.env['NODE_ENV'] === 'development') {
          console.log('[getCurrentUser] Utilisateur trouvé via adapter:', { id: user.id, phone: user.phone, role: user.role })
        }
        return {
          id: user.id,
          phone: user.phone,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role as "user" | "moderator" | "admin",
        }
      }
    } catch (adapterError) {
      // Fallback vers SQLite si l'adapter échoue
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[getCurrentUser] Erreur adapter, fallback SQLite:', adapterError)
      }
    }

    // FALLBACK: Utiliser SQLite directement
    const { forceConnection, initSqlJsAsync } = await import('./sqlite')
    let isConnected = forceConnection()
    if (!isConnected) {
      isConnected = await initSqlJsAsync()
    }
    
    if (!isConnected) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[getCurrentUser] Impossible de se connecter à la DB')
      }
      return null
    }
    
    const user = getSqliteUserById(userId)
    if (!user) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[getCurrentUser] Utilisateur non trouvé avec ID:', userId)
      }
      return null
    }
    
    if (process.env['NODE_ENV'] === 'development') {
      console.log('[getCurrentUser] Utilisateur trouvé:', { id: user.id, phone: user.phone, role: user.role })
    }

    return {
      id: user.id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role as "user" | "moderator" | "admin",
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }
}

export async function updateUserRole(userId: string, newRole: "user" | "moderator" | "admin") {
  try {
    const { execute } = await import("@/lib/sqlite")
    const result = execute("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newRole, userId]) as { changes: number }
    return result.changes > 0 ? { success: true } : { success: false, error: "Utilisateur non trouvé" }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle:", error)
    return { success: false, error: "Erreur lors de la mise à jour du rôle" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const { execute } = await import("@/lib/sqlite")
    const result = execute("DELETE FROM users WHERE id = ?", [userId]) as { changes: number }
    return result.changes > 0 ? { success: true } : { success: false, error: "Utilisateur non trouvé" }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return { success: false, error: "Erreur lors de la suppression de l'utilisateur" }
  }
}

export async function getAllUsers() {
  try {
    const users = getSqliteUsers()
    return users.map((u) => ({
      id: u.id,
      phone: u.phone,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    }))
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return []
  }
}
