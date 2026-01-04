"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Pause } from "lucide-react";

type VectorizationStatus = 
  | "not_planned" 
  | "planned" 
  | "in_progress" 
  | "vectorized" 
  | "error" 
  | "waiting";

interface VectorizationStatusBadgeProps {
  status: VectorizationStatus;
  numChunks?: number;
  error?: string;
  showChunks?: boolean;
}

const statusConfig: Record<VectorizationStatus, {
  label: string;
  variant: "default" | "secondary" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  not_planned: {
    label: "Non planifié",
    variant: "outline",
    icon: Clock,
    color: "text-gray-500",
    bgColor: "bg-gray-100"
  },
  planned: {
    label: "Planifié",
    variant: "secondary",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-100"
  },
  in_progress: {
    label: "En cours",
    variant: "default",
    icon: Loader2,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  },
  vectorized: {
    label: "Vectorisé",
    variant: "default",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  error: {
    label: "Erreur",
    variant: "outline",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  waiting: {
    label: "En attente",
    variant: "secondary",
    icon: Pause,
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  }
};

export function VectorizationStatusBadge({
  status,
  numChunks,
  error,
  showChunks = true
}: VectorizationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_planned;
  const Icon = config.icon;
  const isAnimated = status === "in_progress";

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
        <Icon 
          className={`h-3.5 w-3.5 ${config.color} ${isAnimated ? 'animate-spin' : ''}`} 
        />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>
      
      {showChunks && status === "vectorized" && numChunks && numChunks > 0 && (
        <span className="text-xs text-muted-foreground">
          {numChunks} chunks
        </span>
      )}
      
      {status === "error" && error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span className="max-w-[200px] truncate" title={error}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
