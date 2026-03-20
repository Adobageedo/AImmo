"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GetCurrentDateToolUI = makeAssistantToolUI({
  toolName: "getCurrentDate",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Fetching current date...
              </p>
            </div>
          </div>
        </Card>
      );
    }

    if (status.type === "incomplete") {
      return (
        <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Failed to get current date
            </p>
          </div>
        </Card>
      );
    }

    if (status.type === "complete" && result) {
      return (
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-900">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Date & Time
                </p>
                <Badge
                  variant="outline"
                  className="text-xs border-green-200 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {String(result)}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return null;
  },
});

export { GetCurrentDateToolUI };
