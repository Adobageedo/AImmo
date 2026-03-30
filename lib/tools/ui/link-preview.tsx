import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { LinkPreview } from "@/components/tool-ui/link-preview/LinkPreview";
import { safeParseSerializableLinkPreview } from "@/components/tool-ui/link-preview/schema";

export const linkPreviewTool: Toolkit = {
  showLinkPreview: {
    description:
      "Display a rich link preview card with title, description, image, and favicon. Use this when sharing a URL to give the user a visual preview of the destination.",
    parameters: z.object({
      href: z.string().describe("The URL to preview"),
      title: z.string().optional().describe("Page title"),
      description: z.string().optional().describe("Page description"),
      image: z.string().optional().describe("Open Graph image URL"),
    }),
    execute: async ({ href, title, description, image }: {
      href: string;
      title?: string;
      description?: string;
      image?: string;
    }) => {
      let domain: string | undefined;
      let favicon: string | undefined;
      try {
        const url = new URL(href);
        domain = url.hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {
        // ignore
      }

      return {
        id: `link-preview-${Date.now()}`,
        href,
        title: title ?? domain ?? href,
        description,
        image,
        domain,
        favicon,
        ratio: "16:9",
        fit: "cover",
      };
    },
    render: ({ result, status }) => {
      if (!result) return null;
      const parsed = safeParseSerializableLinkPreview(result);
      if (!parsed) return null;
      return <LinkPreview {...parsed} />;
    },
  },
};
