import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Plan } from "@/components/tool-ui/plan";
import { safeParseSerializablePlan } from "@/components/tool-ui/plan/schema";

export const planTool: Toolkit = {
  showPlan: {
    description: `Display or update a visual progress plan. Call this tool MULTIPLE TIMES during your response to show live progress:
1. First call: all steps with the first one "in_progress", rest "pending"
2. After completing each step: call again with that step "completed" and next one "in_progress"
3. Final call: all steps "completed"
Always use the SAME title across calls so the user sees the plan updating.`,
    parameters: z.object({
      title: z.string().describe("Plan title (keep the same across updates)"),
      description: z.string().optional().describe("Short description of the plan"),
      steps: z.array(
        z.object({
          label: z.string().describe("Step name"),
          status: z
            .enum(["pending", "in_progress", "completed", "cancelled"])
            .describe("Current status of this step"),
          description: z.string().optional().describe("Optional details about this step"),
        })
      ).describe("All steps with their current status"),
    }),
    execute: async ({ title, description, steps }: {
      title: string;
      description?: string;
      steps: Array<{ label: string; status: string; description?: string }>;
    }) => {
      return {
        id: `plan-${title.replace(/\s+/g, "-").toLowerCase()}`,
        title,
        description,
        todos: steps.map((step: { label: string; status: string; description?: string }, index: number) => ({
          id: `step-${index + 1}`,
          label: step.label,
          status: step.status,
          description: step.description,
        })),
      };
    },
    render: ({ result, status }) => {
      if (!result) return null;
      const parsed = safeParseSerializablePlan(result);
      if (!parsed) return null;
      return <Plan {...parsed} />;
    },
  },
};
