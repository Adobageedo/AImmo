import { z } from "zod";

export const CitationSchema = z.object({
  id: z.string(),
  href: z.string(),
  title: z.string(),
  snippet: z.string().optional(),
  domain: z.string().optional(),
  favicon: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  type: z
    .enum(["webpage", "document", "article", "api", "code", "other"])
    .optional(),
  variant: z.enum(["default", "inline", "stacked"]).optional(),
});

export type SerializableCitation = z.infer<typeof CitationSchema>;

export function safeParseSerializableCitation(data: unknown): SerializableCitation | null {
  try {
    return CitationSchema.parse(data);
  } catch {
    return null;
  }
}
