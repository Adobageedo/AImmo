import { z } from "zod";

export const MetadataItemSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const SerializableApprovalCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().describe("The action being approved"),
  description: z.string().optional().describe("Additional context about the action"),
  icon: z.string().optional().describe("Lucide icon name (e.g., 'Mail', 'Trash2')"),
  metadata: z.array(MetadataItemSchema).optional().describe("Key-value pairs providing context"),
  variant: z.enum(["default", "destructive"]).optional().describe("Visual style variant"),
  confirmLabel: z.string().optional().describe("Label for the confirm button"),
  cancelLabel: z.string().optional().describe("Label for the cancel button"),
});

export type SerializableApprovalCard = z.infer<typeof SerializableApprovalCardSchema>;

export function safeParseSerializableApprovalCard(data: unknown): SerializableApprovalCard | null {
  const result = SerializableApprovalCardSchema.safeParse(data);
  return result.success ? result.data : null;
}
