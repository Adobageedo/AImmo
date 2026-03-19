"use client"
 
import { makeAssistantToolUI } from "@assistant-ui/react";
import { FileText, Search, Calendar, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
 
// Tool UI component avec makeAssistantToolUI
const LeaseSearchToolUIComponent = makeAssistantToolUI({
  toolName: "search_leases",
  render: ({ args, result, status }) => {
    // Defensive check for args
    if (!args) {
      return (
        <Card className="p-4 border-gray-200 bg-gray-50/50 dark:bg-gray-950/20 dark:border-gray-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Préparation de la recherche...
              </p>
            </div>
          </div>
        </Card>
      );
    }

    // État de chargement
    if (status.type === "running") {
      return (
        <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Recherche en cours...
              </p>
              <p className="text-xs text-muted-foreground">
                Analyse de "{String(args.query)}"
              </p>
            </div>
          </div>
        </Card>
      );
    }
 
    // Erreur
    if (status.type === "incomplete" && status.reason === "error") {
      return (
        <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Erreur lors de la recherche
              </p>
              <p className="text-xs text-muted-foreground">
                Impossible d'exécuter la recherche
              </p>
            </div>
          </div>
        </Card>
      );
    }
 
    // Action requise
    if (status.type === "requires-action") {
      return (
        <Card className="p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Action requise
              </p>
              <p className="text-xs text-muted-foreground">
                Veuillez confirmer la recherche
              </p>
            </div>
          </div>
        </Card>
      );
    }
 
    // Succès - afficher les résultats
    if (status.type === "complete" && result) {
      const statusColors = {
        active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
        expired: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-900",
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
        all: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900"
      };
       // Accéder aux propriétés du result en toute sécurité
      const resultData = result as any;
      const message = resultData?.message || `Recherche de baux avec query="${args.query}", status="${args.status || 'all'}", limit=${args.limit || 10}`;
      const totalFound = resultData?.totalFound || 0;

      return (
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
          <div className="p-4 space-y-4">
            {/* Header avec icône et badge */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <Search className="h-5 w-5 text-white" />
              </div>
 
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-base">
                    Recherche de baux
                  </h3>
                  <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Terminé
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Analyse des critères de recherche
                </p>
              </div>
            </div>
 
            {/* Critères de recherche */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground mt-0.5 min-w-[60px]">Requête:</span>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex-1">
                  "{String(args.query)}"
                </span>
              </div>
 
              <div className="flex items-center gap-3 flex-wrap">
                {args.status && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Statut:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium ${statusColors[String(args.status) as keyof typeof statusColors] || statusColors.all}`}
                    >
                      {String(args.status)}
                    </Badge>
                  </div>
                )}
 
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Limite:</span>
                  <span className="text-xs font-medium">{String(args.limit)} résultats max</span>
                </div>
              </div>
            </div>
 
            {/* Résultat de la requête */}
            <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50 border border-blue-100 dark:border-blue-900/50 backdrop-blur-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono leading-relaxed">
                {message}
              </p>
            </div>
 
            {/* Footer avec résultats */}
            <div className="flex items-center justify-between pt-3 border-t border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date().toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
 
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {totalFound} {totalFound > 1 ? 'baux trouvés' : 'bail trouvé'}
              </Badge>
            </div>
          </div>
        </Card>
      );
    }
 
    // État par défaut
    return null;
  },
});
 
export { LeaseSearchToolUIComponent };
 