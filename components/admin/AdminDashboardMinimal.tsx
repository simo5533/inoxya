"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Crown,
  RefreshCw
} from "lucide-react"

interface AdminDashboardMinimalProps {
  user: {
    id: string
    phone: string
    first_name?: string
    last_name?: string
    role: string
  }
}

export default function AdminDashboardMinimal({ user }: AdminDashboardMinimalProps) {

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-500 text-white">Modérateur</Badge>
      default:
        return <Badge variant="outline">Utilisateur</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête Admin */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Admin</h1>
            <div className="text-gray-600 mt-2">
              Bienvenue, {user.first_name || user.phone} {getRoleBadge(user.role)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bijoux</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <div className="text-xs text-muted-foreground">
              Produits disponibles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="text-xs text-muted-foreground">
              Comptes enregistrés
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <div className="text-xs text-muted-foreground">
              Commandes passées
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(125000)}</div>
            <div className="text-xs text-muted-foreground">
              Chiffre d'affaires
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section de gestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gérez vos bijoux, ajoutez de nouveaux produits et modifiez les existants.
            </p>
            <Button className="w-full" disabled>
              Accès Produits (En cours de développement)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Consultez et gérez les utilisateurs de votre plateforme.
            </p>
            <Button className="w-full" disabled>
              Accès Utilisateurs (En cours de développement)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Suivez et gérez les commandes de vos clients.
            </p>
            <Button className="w-full" disabled>
              Accès Commandes (En cours de développement)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informations système */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Statut de l'application</h4>
              <Badge className="bg-green-500 text-white">En ligne</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Version</h4>
              <span className="text-sm text-gray-600">v1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
