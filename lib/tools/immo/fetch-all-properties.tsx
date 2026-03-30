import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Loader2, Download } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  type: 'residential' | 'commercial' | 'industrial' | 'mixed';
  surface: number;
  rooms: number | null;
  bathrooms: number | null;
  estimated_value: number;
  status: 'available' | 'rented' | 'maintenance' | 'sold';
  description: string | null;
}

export const fetchAllPropertiesTool: Toolkit = {
  fetchAllProperties: {
    description:
      "Fetch all properties for the current organization. Returns the complete list of properties with their details, status, and location. Use this when the user wants to see, analyze, or search through all properties in the portfolio.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const supabase = createClient();

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          return {
            success: false,
            error: 'User not authenticated',
            count: 0,
            properties: [],
          };
        }

        // Get user's organization
        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .single();

        if (orgError || !orgUser) {
          return {
            success: false,
            error: 'Organization not found',
            count: 0,
            properties: [],
          };
        }

        // Fetch all properties for the organization
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('organization_id', orgUser.organization_id)
          .order('name', { ascending: true });

        if (propertiesError) {
          throw new Error(propertiesError.message);
        }

        return {
          success: true,
          count: properties?.length || 0,
          properties: properties || [],
          total_value: properties?.reduce((sum, p) => sum + (p.estimated_value || 0), 0) || 0,
          total_surface: properties?.reduce((sum, p) => sum + (p.surface || 0), 0) || 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch properties',
          count: 0,
          properties: [],
        };
      }
    },
    render: ({ result, status }) => {
      if (status?.type === "running") {
        return (
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Récupération des propriétés…
                </p>
              </div>
            </div>
          </Card>
        );
      }

      if (status?.type === "complete" && result) {
        if (!result.success) {
          return (
            <Card className="p-4 border-red-200 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 dark:border-red-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Erreur
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {result.error || 'Une erreur est survenue'}
                  </p>
                </div>
              </div>
            </Card>
          );
        }

        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'available':
              return 'bg-green-100 text-green-700 border-green-200';
            case 'rented':
              return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'maintenance':
              return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'sold':
              return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
              return 'bg-gray-100 text-gray-700 border-gray-200';
          }
        };

        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'available':
              return 'Disponible';
            case 'rented':
              return 'Loué';
            case 'maintenance':
              return 'Maintenance';
            case 'sold':
              return 'Vendu';
            default:
              return status;
          }
        };

        const getTypeLabel = (type: string) => {
          switch (type) {
            case 'residential':
              return 'Résidentiel';
            case 'commercial':
              return 'Commercial';
            case 'industrial':
              return 'Industriel';
            case 'mixed':
              return 'Mixte';
            default:
              return type;
          }
        };

        return (
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 dark:border-emerald-900">
            <div className="flex items-center gap-3 p-4 pb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Propriétés
                  </p>
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {result.count} bien{result.count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
            {result.properties?.length > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Valeur totale: {result.total_value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                  <div>Surface totale: {result.total_surface?.toLocaleString()} m²</div>
                </div>
                <div className="divide-y divide-emerald-100 dark:divide-emerald-900/50">
                  {result.properties.map((property: Property) => (
                    <div key={property.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {property.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {property.address}, {property.postal_code} {property.city}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {getTypeLabel(property.type)} · {property.surface} m²
                              {property.rooms ? ` · ${property.rooms} pièce${property.rooms > 1 ? 's' : ''}` : ''}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground mt-1">
                            {property.estimated_value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getStatusBadge(property.status)}`}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.count === 0 && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  Aucune propriété enregistrée
                </p>
              </div>
            )}
          </Card>
        );
      }
      return null;
    },
  },
};
