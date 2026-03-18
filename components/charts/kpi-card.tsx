import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
}: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0;

  const variantClasses = {
    default: "border-border",
    success: "border-green-500/20 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20",
    danger: "border-red-500/20 bg-red-50/50 dark:bg-red-950/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-6",
        variantClasses[variant]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-3xl font-bold">{value}</h3>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      {changeLabel && (
        <p className="mt-1 text-xs text-muted-foreground">{changeLabel}</p>
      )}
    </div>
  );
}
