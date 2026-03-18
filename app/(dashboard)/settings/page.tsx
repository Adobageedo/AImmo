"use client";

import { useState } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Bell, Palette, Globe, Shield } from "lucide-react";

export default function SettingsPage() {
  const { currentOrganization } = useOrganization();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    leaseExpiry: true,
    paymentReminders: true,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configurez votre application et vos préférences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Organisation</CardTitle>
            </div>
            <CardDescription>Informations sur votre organisation actuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'organisation</Label>
              <Input
                value={currentOrganization?.name || "Mon Organisation"}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Identifiant</Label>
              <Input
                value={currentOrganization?.id || "N/A"}
                disabled
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Statut:</Label>
              <Badge variant="success">Actif</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Gérez vos préférences de notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications par email
                </p>
              </div>
              <Button
                variant={notifications.email ? "default" : "outline"}
                size="sm"
                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
              >
                {notifications.email ? "Activé" : "Désactivé"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications push
                </p>
              </div>
              <Button
                variant={notifications.push ? "default" : "outline"}
                size="sm"
                onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
              >
                {notifications.push ? "Activé" : "Désactivé"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expiration des baux</Label>
                <p className="text-sm text-muted-foreground">
                  Alertes pour les baux arrivant à échéance
                </p>
              </div>
              <Button
                variant={notifications.leaseExpiry ? "default" : "outline"}
                size="sm"
                onClick={() => setNotifications({ ...notifications, leaseExpiry: !notifications.leaseExpiry })}
              >
                {notifications.leaseExpiry ? "Activé" : "Désactivé"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rappels de paiement</Label>
                <p className="text-sm text-muted-foreground">
                  Rappels pour les paiements en retard
                </p>
              </div>
              <Button
                variant={notifications.paymentReminders ? "default" : "outline"}
                size="sm"
                onClick={() => setNotifications({ ...notifications, paymentReminders: !notifications.paymentReminders })}
              >
                {notifications.paymentReminders ? "Activé" : "Désactivé"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Apparence</CardTitle>
            </div>
            <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Thème</Label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Clair
                </Button>
                <Button variant="outline" className="flex-1">
                  Sombre
                </Button>
                <Button variant="default" className="flex-1">
                  Système
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Langue et Région</CardTitle>
            </div>
            <CardDescription>Configurez votre langue et format de date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Langue</Label>
              <Input value="Français" disabled />
            </div>
            <div className="space-y-2">
              <Label>Format de date</Label>
              <Input value="DD/MM/YYYY" disabled />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Input value="EUR (€)" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Confidentialité et Sécurité</CardTitle>
            </div>
            <CardDescription>Gérez vos paramètres de confidentialité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Télécharger mes données
            </Button>
            <Button variant="destructive" className="w-full">
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
