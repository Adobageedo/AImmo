import { z } from "zod";

export const PlanTodoSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  description: z.string().optional(),
});

export const PlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  todos: z.array(PlanTodoSchema).min(1),
  maxVisibleTodos: z.number().optional(),
});

export type PlanTodo = z.infer<typeof PlanTodoSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export function safeParseSerializablePlan(data: unknown): Plan | null {
  try {
    return PlanSchema.parse(data);
  } catch {
    return null;
  }
}
