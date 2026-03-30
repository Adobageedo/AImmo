"use client";

import * as React from "react";
import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolUIProps {
  id: string;
  children: ReactNode;
  className?: string;
}

const ToolUIRoot = ({ id, children, className }: ToolUIProps) => {
  return <div id={id} className={cn("space-y-4", className)}>{children}</div>;
};

const ToolUISurface = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <Card className={cn("p-0", className)}>{children}</Card>;
};

interface LocalAction {
  id: string;
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
}

interface ToolUILocalActionsProps {
  actions: LocalAction[];
  onAction: (actionId: string) => void;
  className?: string;
}

const ToolUILocalActions = ({ actions, onAction, className }: ToolUILocalActionsProps) => {
  if (actions.length === 0) return null;

  return (
    <div className={cn("flex gap-2", className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || "default"}
          size="sm"
          onClick={() => onAction(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export const ToolUI = {
  Root: ToolUIRoot,
  Surface: ToolUISurface,
  LocalActions: ToolUILocalActions,
};
