import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, Loader2, Download } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

export const fetchAllOwnersTool: Toolkit = {
  fetchAllOwners: {
    description:
      "Fetch all property owners for the current organization. Returns the complete list of owners with their contact information. Use this when the user wants to see, analyze, or search through all property owners.",
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
            owners: [],
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
            owners: [],
          };
        }

        // Fetch all owners for the organization
        const { data: owners, error: ownersError } = await supabase
          .from('owners')
          .select('*')
          .eq('organization_id', orgUser.organization_id)
          .order('last_name', { ascending: true });

        if (ownersError) {
          throw new Error(ownersError.message);
        }

        return {
          success: true,
          count: owners?.length || 0,
          owners: owners || [],
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch owners',
          count: 0,
          owners: [],
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
                  Récupération des propriétaires…
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
                  <Users className="h-5 w-5 text-white" />
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

        return (
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 dark:border-emerald-900">
            <div className="flex items-center gap-3 p-4 pb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Propriétaires
                  </p>
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {result.count} propriétaire{result.count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
            {result.owners?.length > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="divide-y divide-emerald-100 dark:divide-emerald-900/50">
                  {result.owners.map((owner: Owner) => (
                    <div key={owner.id} className="py-2 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-foreground">
                        {owner.first_name} {owner.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {owner.email} · {owner.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {owner.address}, {owner.postal_code} {owner.city}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.count === 0 && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  Aucun propriétaire enregistré
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
