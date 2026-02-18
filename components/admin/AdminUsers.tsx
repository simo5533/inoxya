"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Crown, Shield, User, Search, RefreshCw } from "lucide-react"

interface User {
  id: string
  phone: string
  first_name?: string
  last_name?: string
  role: string
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const usersData = await res.json()
      if (res.ok) setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-500 text-white"><Shield className="w-3 h-3 mr-1" />Modérateur</Badge>
      default:
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Utilisateur</Badge>
    }
  }

  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // Récupérer le token CSRF au chargement
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération du token CSRF:', err)
        }
      }
    }
    fetchCsrfToken()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?`)) {
      try {
        if (!csrfToken) {
          alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
          // Essayer de récupérer le token
          try {
            const response = await fetch('/api/csrf-token')
            if (response.ok) {
              const data = await response.json()
              setCsrfToken(data.csrfToken)
              // Réessayer après avoir obtenu le token
              setTimeout(() => handleRoleChange(userId, newRole), 500)
            }
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Erreur récupération token CSRF:', err)
            }
          }
          return
        }

        const res = await fetch(`/api/admin/users/${userId}/role`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ role: newRole })
        })
        const data = await res.json()
        
        if (res.ok && data.success) {
          // Mise à jour locale
          setUsers(users.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
          ))
          alert("Rôle mis à jour avec succès!")
        } else {
          alert("Erreur lors de la mise à jour du rôle")
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur lors du changement de rôle:", error)
        }
        alert("Erreur lors de la mise à jour du rôle")
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.phone.includes(searchTerm) || 
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return <div className="text-center py-8">Chargement des utilisateurs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateurs</SelectItem>
            <SelectItem value="moderator">Modérateurs</SelectItem>
            <SelectItem value="user">Utilisateurs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : "Utilisateur"
                          }
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {user.phone}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={user.role} 
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="moderator">Modérateur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      )}
    </div>
  )
}
