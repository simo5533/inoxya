"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Crown,
  Shield,
  DollarSign,
  Activity,
  RefreshCw,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import AdminProducts from "./AdminProducts"
import AdminUsers from "./AdminUsers"
import AdminOrders from "./AdminOrders"
import AdminCategories from "./AdminCategories"

interface AdminDashboardProps {
  user: {
    id: string
    phone: string
    first_name?: string
    last_name?: string
    role: string
  }
}

interface RecentOrder {
  id: string
  total_amount: number
  status: string
  created_at: string
  phone?: string
  firstProductName?: string
}

interface TopProduct {
  id: string
  name: string
  quantity: number
  price: number
  image_url?: string
  is_pack?: boolean
}

interface DashboardStats {
  totalBijoux: number
  totalPacks: number
  totalCategories: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  recentOrders: RecentOrder[]
  topProducts: TopProduct[]
  userGrowth: unknown[]
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalBijoux: 0,
    totalPacks: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    userGrowth: []
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (res.ok) setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-500 text-white"><Shield className="w-3 h-3 mr-1" />Modérateur</Badge>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête Admin */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Admin</h1>
            <div className="text-gray-600 mt-2 flex items-center gap-2">
              <span>Bienvenue, {user.first_name || user.phone}</span>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
            </Link>
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
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalBijoux}</div>
            <p className="text-xs text-muted-foreground">
              Produits disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPacks}</div>
            <p className="text-xs text-muted-foreground">
              Collections disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Comptes enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Chiffre d'affaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Catégories actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Commandes passées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : "0 MAD"}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur moyenne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et données récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Commandes récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Commandes Récentes
            </CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">Commande #{String(order.id).slice(-6)}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {order.firstProductName || '—'}
                        </p>
                        {order.phone && (
                          <p className="text-xs text-gray-500">{order.phone}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <Badge 
                          variant={order.status === 'confirmed' || order.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {order.status === 'completed' ? 'Terminée' : order.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Aucune commande récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Produits les plus vendus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Produits Populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={`${product.is_pack ? 'pack' : 'prod'}-${product.id}`} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url.startsWith('http') || product.image_url.startsWith('/') ? product.image_url : `/api/admin/serve-local-image?path=${encodeURIComponent(product.image_url)}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(product.price)} · {product.quantity} vendu{product.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-orange-600">{product.quantity}</p>
                      <p className="text-xs text-gray-500">ventes</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Aucune donnée de vente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <AdminProducts />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <AdminCategories />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </div>
  )
}