import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Loader2, Download } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface LeaseTextResult {
  lease_id: string;
  document_id: string;
  file_name: string;
  raw_text: string;
  text_length: number;
  extraction_status: string;
}

export const fetchAllLeaseTextsTool: Toolkit = {
  fetchAllLeaseTexts: {
    description:
      "Fetch all leases documents for the current user. Returns the complete extracted text from each lease document stored in db. Use this when the user wants to analyze, search, or review all lease content.",
    parameters: z.object({}),
    execute: async () => {
      try {
        // Get user session from Supabase auth
        const supabase = createClient();

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          return {
            success: false,
            error: 'User not authenticated',
            count: 0,
            texts: [],
          };
        }

        // Call API without organization_id - it will get it from the session
        const response = await fetch('/api/lease-documents/texts', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✅ [DEBUG] fetchAllLeaseTexts result:", result);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch lease texts',
          count: 0,
          texts: [],
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
                  Récupération des baux…
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
                  <FileText className="h-5 w-5 text-white" />
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
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Baux récupérés
                  </p>
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {result.count} document{result.count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
            {result.texts?.length > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="mb-2 text-xs text-muted-foreground">
                  Total: {result.total_characters?.toLocaleString()} caractères
                </div>
                <div className="divide-y divide-emerald-100 dark:divide-emerald-900/50">
                  {result.texts.map((text: LeaseTextResult, i: number) => (
                    <div key={text.document_id ?? i} className="py-2 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {text.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bail: {text.lease_id} · {text.text_length.toLocaleString()} caractères · {text.extraction_status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.count === 0 && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  {result.message || "Aucun texte brut disponible"}
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
