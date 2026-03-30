import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Loader2 } from "lucide-react";

export const getCurrentDateTool: Toolkit = {
  getCurrentDate: {
    description: "Get the current date and time.",
    parameters: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        iso: now.toISOString(),
      };
    },
    render: ({ result, status }) => {
      if (status?.type === "running") {
        return (
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Récupération de la date…
                </p>
              </div>
            </div>
          </Card>
        );
      }

      if (status?.type === "complete" && result) {
        const dateStr =
          typeof result === "object" && result !== null
            ? `${(result as any).date ?? ""} — ${(result as any).time ?? ""}`
            : String(result);

        return (
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 dark:border-emerald-900">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date & Heure
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {dateStr}
                </p>
              </div>
            </div>
          </Card>
        );
      }
      return null;
    },
  },
};
