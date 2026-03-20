"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import * as icons from "lucide-react";

export type MetadataItem = {
  key: string;
  value: string;
};

export type ApprovalCardProps = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  metadata?: MetadataItem[];
  variant?: "default" | "destructive";
  confirmLabel?: string;
  cancelLabel?: string;
  choice?: "approved" | "denied";
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

export function ApprovalCard({
  id,
  title,
  description,
  icon,
  metadata,
  variant = "default",
  confirmLabel = "Approve",
  cancelLabel = "Deny",
  choice,
  onConfirm,
  onCancel,
}: ApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (isProcessing || !onConfirm) return;
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (isProcessing || !onCancel) return;
    setIsProcessing(true);
    try {
      await onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  // Get icon component
  const IconComponent = icon
    ? (icons as any)[icon] || (icons as any)[icon.replace(/-./g, (x) => x[1].toUpperCase())]
    : AlertTriangle;

  // Receipt state (read-only)
  if (choice) {
    const isApproved = choice === "approved";
    return (
      <Card
        role="status"
        className={cn(
          "p-4 animate-in fade-in duration-300",
          isApproved
            ? "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900"
            : "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900"
        )}
      >
        <div className="flex items-center gap-3">
          {isApproved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isApproved ? confirmLabel : cancelLabel}d: {title}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Interactive state
  return (
    <Card
      role="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      className={cn(
        "overflow-hidden",
        variant === "destructive"
          ? "border-red-200 dark:border-red-900"
          : "border-orange-200 dark:border-orange-900"
      )}
    >
      <div className="flex items-start gap-4 p-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg",
            variant === "destructive"
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20"
              : "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20"
          )}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            id={`${id}-title`}
            className="text-base font-semibold text-foreground mb-1"
          >
            {title}
          </h3>
          {description && (
            <p
              id={`${id}-description`}
              className="text-sm text-muted-foreground mb-3"
            >
              {description}
            </p>
          )}
          {metadata && metadata.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {metadata.map((item, index) => (
                <div
                  key={index}
                  className="flex items-baseline gap-2 text-xs"
                >
                  <span className="font-medium text-muted-foreground min-w-[80px]">
                    {item.key}:
                  </span>
                  <span className="text-foreground truncate">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              variant={variant === "destructive" ? "destructive" : "default"}
              size="sm"
              className="flex-1"
            >
              {confirmLabel}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
