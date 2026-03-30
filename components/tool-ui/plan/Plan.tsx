"use client";

import * as React from "react";
import { type PlanTodo, type Plan } from "./schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Circle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PartyPopper,
} from "lucide-react";

interface PlanComponentProps extends Plan {
  maxVisibleTodos?: number;
  className?: string;
}

const TodoItem = ({ todo, isExpanded, onToggle }: { 
  todo: PlanTodo; 
  isExpanded: boolean; 
  onToggle: () => void;
}) => {
  const getStatusIcon = () => {
    switch (todo.status) {
      case "pending":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (todo.status) {
      case "pending":
        return "text-muted-foreground";
      case "in_progress":
        return "text-blue-500 motion-safe:animate-pulse";
      case "completed":
        return "text-green-500";
      case "cancelled":
        return "text-red-500 line-through";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <span className={cn("flex-1 text-sm", getStatusColor())}>
          {todo.label}
        </span>
        {todo.description && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      {todo.description && isExpanded && (
        <p className="ml-7 text-xs text-muted-foreground">{todo.description}</p>
      )}
    </div>
  );
};

const PlanComponent = ({ 
  id, 
  title, 
  description, 
  todos, 
  maxVisibleTodos = 4, 
  className 
}: PlanComponentProps) => {
  const [expandedTodos, setExpandedTodos] = React.useState<Set<string>>(new Set());
  const [showAllTodos, setShowAllTodos] = React.useState(false);

  const completedCount = todos.filter(t => t.status === "completed").length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;
  const visibleTodos = showAllTodos ? todos : todos.slice(0, maxVisibleTodos);
  const hasHiddenTodos = todos.length > maxVisibleTodos;

  const toggleTodoExpansion = (todoId: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{title}</h3>
          {isComplete && (
            <PartyPopper className="h-5 w-5 text-green-500 motion-safe:animate-bounce" />
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Progress Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progress
          </span>
          <span className="font-medium">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {visibleTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isExpanded={expandedTodos.has(todo.id)}
            onToggle={() => toggleTodoExpansion(todo.id)}
          />
        ))}
      </div>

      {/* Show More/Less */}
      {hasHiddenTodos && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllTodos(!showAllTodos)}
            className="w-full"
          >
            {showAllTodos ? (
              <>
                Show less
                <ChevronUp className="ml-2 h-3 w-3" />
              </>
            ) : (
              <>
                Show {todos.length - maxVisibleTodos} more
                <ChevronDown className="ml-2 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Completion Celebration */}
      {isComplete && (
        <div className="pt-4 border-t">
          <div className="text-center space-y-2">
            <PartyPopper className="h-8 w-8 text-green-500 mx-auto motion-safe:animate-bounce" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Plan completed successfully! 🎉
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

const PlanCompact = ({ id, title, description, todos, className }: PlanComponentProps) => {
  const [expandedTodos, setExpandedTodos] = React.useState<Set<string>>(new Set());

  const toggleTodoExpansion = (todoId: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      <div className="space-y-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isExpanded={expandedTodos.has(todo.id)}
            onToggle={() => toggleTodoExpansion(todo.id)}
          />
        ))}
      </div>
    </Card>
  );
};

// Export Plan with Compact as a property
export const Plan = Object.assign(PlanComponent, {
  Compact: PlanCompact,
});
