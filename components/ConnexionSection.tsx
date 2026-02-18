"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Crown, Shield } from "lucide-react"
import Link from "next/link"
import { logoutUser } from "@/lib/auth"

interface ConnexionSectionProps {
  user: {
    id: string
    phone: string
    first_name?: string
    last_name?: string
    role: string
  } | null
}

export default function ConnexionSection({ user }: ConnexionSectionProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white text-xs"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-500 text-white text-xs"><Shield className="w-3 h-3 mr-1" />Mod</Badge>
      default:
        return null
    }
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <User className="w-4 h-4 mr-2" />
            {user.first_name || "Mon Compte"}
            {getRoleBadge(user.role)}
          </Button>
        </Link>
        <form action={logoutUser}>
          <Button variant="ghost" size="icon" type="submit">
            <LogOut className="w-4 h-4" />
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          <User className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Connexion</span>
        </Button>
      </Link>
      <Link href="/inscription">
        <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
          <span className="hidden sm:inline">S'inscrire</span>
          <span className="sm:hidden">+</span>
        </Button>
      </Link>
    </div>
  )
}
