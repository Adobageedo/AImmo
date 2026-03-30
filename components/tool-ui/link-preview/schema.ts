import { z } from "zod";

export const LinkPreviewSchema = z.object({
  id: z.string(),
  href: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  domain: z.string().optional(),
  favicon: z.string().optional(),
  ratio: z.enum(["auto", "1:1", "4:3", "16:9", "9:16"]).optional(),
  fit: z.enum(["cover", "contain"]).optional(),
  createdAt: z.string().optional(),
});

export type SerializableLinkPreview = z.infer<typeof LinkPreviewSchema>;

export function safeParseSerializableLinkPreview(data: unknown): SerializableLinkPreview | null {
  try {
    return LinkPreviewSchema.parse(data);
  } catch {
    return null;
  }
}
