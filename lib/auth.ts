"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import {
  getUserByPhone,
  getUserById,
  createUser as createSqliteUser,
  getAllUsers as getSqliteUsers,
} from "@/lib/sqlite"

export async function loginUser(phone: string, password: string) {
  try {
    // Normaliser le téléphone pour la recherche (supprimer espaces, tirets, points)
    // SAUF pour admin_phone qui est un identifiant spécial
    const normalizedPhone = phone === 'admin_phone' 
      ? 'admin_phone' 
      : phone.replace(/[\s\-\.]/g, '').trim()
    
    // Utiliser getUserByPhone qui gère automatiquement better-sqlite3 et sql.js
    const user = getUserByPhone(normalizedPhone)
    
    if (!user) {
      // Logger pour diagnostic (dev uniquement)
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[loginUser] Utilisateur non trouvé:', { phone: normalizedPhone })
      }
      return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
    }

    const isValid = bcrypt.compareSync(password, user.password_hash)
    if (!isValid) {
      // Logger pour diagnostic (dev uniquement)
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[loginUser] Mot de passe incorrect pour:', { phone: normalizedPhone, userId: user.id })
      }
      return { success: false, error: "Utilisateur non trouvé ou mot de passe incorrect" }
    }

    const cookieStore = await cookies()
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === "production",
      sameSite: process.env['NODE_ENV'] === "production" ? "strict" : "lax", // "lax" en dev pour permettre les redirections
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/' // Explicit path pour garantir la portée
    })

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
    const existingUser = getUserByPhone(phone)
    if (existingUser) {
      return { success: false, error: "Ce numéro de téléphone est déjà utilisé" }
    }

    // createSqliteUser attend la clé "password_hash" mais reçoit le mot de passe en clair et le hache en interne (bcrypt)
    const newUser = createSqliteUser({
      phone,
      password_hash: password,
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
    return { success: false, error: "Erreur d'inscription" }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("user_id")
    redirect("/")
  } catch (error) {
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

    // S'assurer que la DB est initialisée avant de chercher l'utilisateur
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
    
    const user = getUserById(userId)
    if (!user) {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('[getCurrentUser] Utilisateur non trouvé avec ID:', userId)
      }
      return null
    }
    
    if (process.env['NODE_ENV'] === 'development') {
      console.log('[getCurrentUser] Utilisateur trouvé:', { id: user.id, phone: user.phone, role: user.role })
    }

    // NOTE: On ne peut PAS modifier les cookies dans getCurrentUser car il est appelé
    // depuis des Server Components. Le renouvellement de cookie doit être fait dans
    // une Server Action ou Route Handler séparée si nécessaire.

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
