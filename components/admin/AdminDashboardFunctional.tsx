"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Users, 
  ShoppingBag, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react"

export default function AdminDashboardFunctional() {
  const [activeTab, setActiveTab] = useState("products")

  // Données simulées pour les produits
  const mockProducts = [
    {
      id: "1",
      name: "Bague Berbère Or 18K",
      price: 2999,
      category: "Bagues",
      stock: 5,
      is_active: true
    },
    {
      id: "2",
      name: "Collier Filigrane Argent",
      price: 1890,
      category: "Colliers",
      stock: 8,
      is_active: true
    }
  ]

  // Données simulées pour les utilisateurs
  const mockUsers = [
    {
      id: "1",
      name: "Ahmed Alami",
      email: "ahmed@example.com",
      phone: "0612345678",
      role: "user",
      created_at: "2024-01-15"
    },
    {
      id: "2",
      name: "Fatima Zahra",
      email: "fatima@example.com",
      phone: "0698765432",
      role: "user",
      created_at: "2024-01-20"
    }
  ]

  // Données simulées pour les commandes
  const mockOrders = [
    {
      id: "1",
      customer: "Ahmed Alami",
      total: 2999,
      status: "confirmed",
      date: "2024-01-25"
    },
    {
      id: "2",
      customer: "Fatima Zahra",
      total: 1890,
      status: "pending",
      date: "2024-01-26"
    }
  ]

  const handleAddProduct = () => {
    alert("✅ Fonctionnalité d'ajout de produit - En cours de développement")
  }

  const handleEditProduct = (product: { name?: string }) => {
    alert(`✅ Modification du produit: ${product.name || 'Produit'}`)
  }

  const handleDeleteProduct = (product: { name?: string }) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.name || 'ce produit'}" ?`)) {
      alert(`✅ Produit "${product.name || 'Produit'}" supprimé avec succès`)
    }
  }

  const handleViewUser = (user: { name?: string }) => {
    alert(`✅ Détails de l'utilisateur: ${user.name || 'Utilisateur'}`)
  }

  const handleViewOrder = (order: { id?: string | number }) => {
    alert(`✅ Détails de la commande: ${order.id || 'Commande'}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmée</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800">Expédiée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Produits</div>
                <div className="text-2xl font-bold">{mockProducts.length}</div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Utilisateurs</div>
                <div className="text-2xl font-bold">{mockUsers.length}</div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Commandes</div>
                <div className="text-2xl font-bold">{mockOrders.length}</div>
              </div>
              <ShoppingBag className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Chiffre d'affaires</div>
                <div className="text-2xl font-bold">12,450 MAD</div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        {/* Gestion des produits */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gestion des Produits</CardTitle>
                <Button onClick={handleAddProduct} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        {product.category} • {product.price} MAD • Stock: {product.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-600">
                        {user.email} • {user.phone} • Inscrit le {user.created_at}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Commande #{order.id}</h3>
                      <p className="text-sm text-gray-600">
                        {order.customer} • {order.total} MAD • {order.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}