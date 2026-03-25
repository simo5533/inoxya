"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Key, Eye, AlertTriangle, CheckCircle } from "lucide-react"

export default function SecurityInfo() {
  const securityFeatures = [
    {
      title: "Hachage des Mots de Passe",
      description: "bcrypt avec 12 rounds de salage",
      status: "active",
      icon: Lock
    },
    {
      title: "Sessions JWT",
      description: "Tokens signés avec expiration automatique",
      status: "active",
      icon: Key
    },
    {
      title: "Cookies Sécurisés",
      description: "httpOnly, secure, sameSite strict",
      status: "active",
      icon: Shield
    },
    {
      title: "Validation des Données",
      description: "Validation des téléphones et mots de passe",
      status: "active",
      icon: CheckCircle
    },
    {
      title: "Logging de Sécurité",
      description: "Suivi des tentatives de connexion",
      status: "active",
      icon: Eye
    }
  ]

  const securityAlerts = [
    {
      type: "warning",
      message: "Assurez-vous que la clé secrète de signature JWT est configurée en production",
      icon: AlertTriangle
    },
    {
      type: "info",
      message: "Les mots de passe doivent respecter les règles de complexité",
      icon: Shield
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            État de la Sécurité
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des mesures de sécurité implémentées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Actif
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Alertes de Sécurité
          </CardTitle>
          <CardDescription>
            Points d'attention pour la sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityAlerts.map((alert, index) => {
              const Icon = alert.icon
              return (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className={`text-sm ${
                    alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {alert.message}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comptes de Test Sécurisés</CardTitle>
          <CardDescription>
            Comptes disponibles pour les tests avec mots de passe sécurisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Administrateur</h4>
                  <div className="text-sm text-gray-600">Téléphone: admin_phone</div>
                </div>
                <Badge variant="destructive">Admin</Badge>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Modérateur</h4>
                  <div className="text-sm text-gray-600">Téléphone: 0698765432</div>
                </div>
                <Badge variant="secondary">Modérateur</Badge>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Utilisateur</h4>
                  <p className="text-sm text-gray-600">Téléphone: 0612345678</p>
                </div>
                <Badge variant="outline">Utilisateur</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Mots de passe de test :</strong><br />
              • Admin123! (pour admin_phone)<br />
              • User123! (pour 0698765432)<br />
              • Moderator123! (pour 0612345678)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
