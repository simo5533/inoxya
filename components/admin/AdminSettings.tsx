"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Phone,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Store
} from "lucide-react"
import { logger } from "@/lib/logger"

interface AdminSettingsProps {
  user: {
    id: string
    phone: string
    first_name?: string
    last_name?: string
    role: string
  }
}

interface SettingsData {
  // Général
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  address: string
  
  // Notifications
  emailNotifications: boolean
  orderNotifications: boolean
  paymentNotifications: boolean
  
  // Sécurité
  sessionTimeout: number
  requireStrongPassword: boolean
  twoFactorAuth: boolean
  
  // Stock
  lowStockThreshold: number
  autoRestock: boolean
  
  // Paiement
  paymentMethods: string[]
  minOrderAmount: number
  freeShippingThreshold: number
}

export default function AdminSettings({ user: _user }: AdminSettingsProps) {
  const [settings, setSettings] = useState<SettingsData>({
    siteName: "INOXYA ELEGANCE",
    siteDescription: "Bijoux traditionnels marocains en acier inoxydable",
    contactEmail: "inoxya@gmail.ma",
    contactPhone: "07 17 58 19 40",
    address: "Rabat, Bab Melah — Solde Reda, étage en bas",
    emailNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    sessionTimeout: 30,
    requireStrongPassword: true,
    twoFactorAuth: false,
    lowStockThreshold: 10,
    autoRestock: false,
    paymentMethods: ["cash", "card"],
    minOrderAmount: 0,
    freeShippingThreshold: 200
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    // Charger les paramètres depuis l'API
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/settings", {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des paramètres:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveStatus("idle")

      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" })
      if (!csrfRes.ok) {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
        return
      }
      const { csrfToken } = await csrfRes.json()

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken ?? ""
        },
        credentials: "include",
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        setSaveStatus("success")
        logger.info("Paramètres sauvegardés avec succès")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
        const errData = await res.json().catch(() => ({}))
        const message = errData?.error ?? `Erreur ${res.status}`
        logger.error("Erreur lors de la sauvegarde des paramètres", message)
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      setSaveStatus("error")
      logger.error("Erreur lors de la sauvegarde:", error instanceof Error ? error.message : String(error))
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Paramètres Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les paramètres généraux, notifications, sécurité et préférences du site
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadSettings}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statut de sauvegarde */}
        {saveStatus === "success" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Paramètres sauvegardés avec succès</span>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">Erreur lors de la sauvegarde. Veuillez réessayer.</span>
          </div>
        )}
      </div>

      {/* Onglets de paramètres */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Store className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Database className="w-4 h-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="payment">
            <Lock className="w-4 h-4 mr-2" />
            Paiement
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du Site</CardTitle>
              <CardDescription>
                Configurez les informations générales de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du Site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => updateSetting("siteName", e.target.value)}
                  placeholder="INOXYA ELEGANCE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Description</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting("siteDescription", e.target.value)}
                  placeholder="Description du site"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations de Contact</CardTitle>
              <CardDescription>
                Coordonnées affichées sur le site et dans les communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateSetting("contactEmail", e.target.value)}
                  placeholder="inoxya@gmail.ma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => updateSetting("contactPhone", e.target.value)}
                  placeholder="07 17 58 19 40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => updateSetting("address", e.target.value)}
                  placeholder="Rabat, Bab Melah — Solde Reda, étage en bas"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notifications</CardTitle>
              <CardDescription>
                Configurez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Notifications par Email</Label>
                  <p className="text-sm text-gray-500">
                    Recevoir des notifications par email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="orderNotifications">Notifications de Commandes</Label>
                  <p className="text-sm text-gray-500">
                    Être alerté lors de nouvelles commandes
                  </p>
                </div>
                <Switch
                  id="orderNotifications"
                  checked={settings.orderNotifications}
                  onCheckedChange={(checked) => updateSetting("orderNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="paymentNotifications">Notifications de Paiements</Label>
                  <p className="text-sm text-gray-500">
                    Être alerté lors de nouveaux paiements
                  </p>
                </div>
                <Switch
                  id="paymentNotifications"
                  checked={settings.paymentNotifications}
                  onCheckedChange={(checked) => updateSetting("paymentNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>
                Configurez les paramètres de sécurité et d'authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Délai d'Expiration de Session (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value) || 30)}
                />
                <p className="text-sm text-gray-500">
                  Durée avant déconnexion automatique (5-1440 minutes)
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireStrongPassword">Mots de Passe Forts Requis</Label>
                  <p className="text-sm text-gray-500">
                    Exiger des mots de passe complexes pour les utilisateurs
                  </p>
                </div>
                <Switch
                  id="requireStrongPassword"
                  checked={settings.requireStrongPassword}
                  onCheckedChange={(checked) => updateSetting("requireStrongPassword", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">Authentification à Deux Facteurs</Label>
                  <p className="text-sm text-gray-500">
                    Activer l'authentification à deux facteurs pour les admins
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Stock */}
        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion du Stock</CardTitle>
              <CardDescription>
                Configurez les alertes et la gestion automatique du stock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Seuil d'Alerte Stock Faible</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={settings.lowStockThreshold}
                  onChange={(e) => updateSetting("lowStockThreshold", parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">
                  Nombre d'unités en stock déclenchant une alerte
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRestock">Réapprovisionnement Automatique</Label>
                  <p className="text-sm text-gray-500">
                    Activer les commandes automatiques de réapprovisionnement
                  </p>
                </div>
                <Switch
                  id="autoRestock"
                  checked={settings.autoRestock}
                  onCheckedChange={(checked) => updateSetting("autoRestock", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paiement */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Paiement</CardTitle>
              <CardDescription>
                Configurez les options de paiement et les seuils de commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Montant Minimum de Commande (MAD)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.minOrderAmount}
                  onChange={(e) => updateSetting("minOrderAmount", parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">
                  Montant minimum requis pour passer une commande
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Seuil Livraison Gratuite (MAD)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => updateSetting("freeShippingThreshold", parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">
                  Montant de commande pour bénéficier de la livraison gratuite
                </p>
              </div>
              <div className="space-y-2">
                <Label>Méthodes de Paiement Disponibles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["cash", "card", "bank_transfer", "mobile_payment"].map((method) => (
                    <Badge
                      key={method}
                      variant={settings.paymentMethods.includes(method) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const methods = settings.paymentMethods.includes(method)
                          ? settings.paymentMethods.filter(m => m !== method)
                          : [...settings.paymentMethods, method]
                        updateSetting("paymentMethods", methods)
                      }}
                    >
                      {method === "cash" && "Espèces"}
                      {method === "card" && "Carte"}
                      {method === "bank_transfer" && "Virement"}
                      {method === "mobile_payment" && "Mobile"}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

