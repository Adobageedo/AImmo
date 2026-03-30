import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Scale, Loader2, Download, Calendar } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface JurisprudenceArticle {
  id: string;
  legifrance_id: string;
  title: string;
  decision_date: string | null;
  is_real_estate: boolean;
  summary: string | null;
  jurisdiction: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchJurisprudenceArticlesTool: Toolkit = {
  fetchJurisprudenceArticles: {
    description:
      "Fetch all real estate jurisprudence articles from the database. Returns court decisions related to real estate law with their summaries and details. Use this when the user wants to research legal precedents, analyze case law, or get information about recent real estate court decisions.",
    parameters: z.object({
      limit: z.number().optional().describe("Maximum number of articles to return (default: 50)"),
      onlyRealEstate: z.boolean().optional().describe("Filter to only real estate related articles (default: true)"),
    }),
    execute: async ({ limit = 50, onlyRealEstate = true }) => {
      try {
        const supabase = createClient();

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          return {
            success: false,
            error: 'User not authenticated',
            count: 0,
            articles: [],
          };
        }

        // Build query
        let query = supabase
          .from('jurisprudence_articles')
          .select('*')
          .order('decision_date', { ascending: false, nullsFirst: false })
          .limit(limit);

        // Filter by real estate if requested
        if (onlyRealEstate) {
          query = query.eq('is_real_estate', true);
        }

        const { data: articles, error: articlesError } = await query;

        if (articlesError) {
          throw new Error(articlesError.message);
        }

        return {
          success: true,
          count: articles?.length || 0,
          articles: articles || [],
          real_estate_count: articles?.filter(a => a.is_real_estate).length || 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch jurisprudence articles',
          count: 0,
          articles: [],
        };
      }
    },
    render: ({ result, status, args }) => {
      if (status?.type === "running") {
        return (
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Récupération de la jurisprudence…
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
                  <Scale className="h-5 w-5 text-white" />
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

        const parseSummary = (summaryStr: string | null) => {
          if (!summaryStr) return null;
          try {
            return JSON.parse(summaryStr);
          } catch {
            return null;
          }
        };

        return (
          <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 dark:border-purple-900">
            <div className="flex items-center gap-3 p-4 pb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Jurisprudence Immobilière
                  </p>
                  <Badge variant="outline" className="text-xs border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {result.count} décision{result.count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>
            {result.articles?.length > 0 && (
              <div className="px-4 pb-3 pt-1">
                {args?.onlyRealEstate === false && (
                  <div className="mb-2 text-xs text-muted-foreground">
                    Dont {result.real_estate_count} décision{result.real_estate_count !== 1 ? "s" : ""} immobilière{result.real_estate_count !== 1 ? "s" : ""}
                  </div>
                )}
                <div className="divide-y divide-purple-100 dark:divide-purple-900/50">
                  {result.articles.map((article: JurisprudenceArticle) => {
                    const summary = parseSummary(article.summary);
                    return (
                      <div key={article.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {article.title || 'Sans titre'}
                            </p>
                            {article.decision_date && (
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {new Date(article.decision_date).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                            {article.jurisdiction && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {article.jurisdiction}
                              </p>
                            )}
                            {summary && (
                              <div className="mt-2 space-y-1">
                                {summary.key_point && (
                                  <p className="text-xs text-foreground">
                                    <span className="font-medium">Point clé:</span> {summary.key_point}
                                  </p>
                                )}
                                {summary.decision && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Décision:</span> {summary.decision}
                                  </p>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              ID Légifrance: {article.legifrance_id}
                            </p>
                          </div>
                          {article.is_real_estate && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                              Immobilier
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {result.count === 0 && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  Aucune décision de jurisprudence trouvée
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
