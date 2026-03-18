"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  const initials = user.email?.substring(0, 2).toUpperCase() || "U";
  const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Vos informations de compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user.user_metadata?.full_name || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={user.user_metadata?.full_name || ""}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Membre depuis</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={createdDate}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(false)}>
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Gérez votre mot de passe et la sécurité de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value="••••••••"
                disabled
              />
            </div>

            <Button variant="outline" className="w-full">
              Changer le mot de passe
            </Button>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Authentification à deux facteurs</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
              <Button variant="outline" className="w-full">
                Activer 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
