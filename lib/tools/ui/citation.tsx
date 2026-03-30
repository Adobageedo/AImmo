import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Citation } from "@/components/tool-ui/citation/Citation";
import { safeParseSerializableCitation } from "@/components/tool-ui/citation/schema";

export const citationTool: Toolkit = {
  showCitation: {
    description:
      "Display a citation or source reference card. Use this when referencing external sources, documents, articles, or APIs to let the user verify claims.",
    parameters: z.object({
      href: z.string().describe("The source URL"),
      title: z.string().describe("The title of the source"),
      snippet: z.string().optional().describe("A relevant excerpt or quote from the source"),
      author: z.string().optional().describe("Author or organization name"),
      type: z
        .enum(["webpage", "document", "article", "api", "code", "other"])
        .optional()
        .describe("The type of source"),
    }),
    execute: async ({ href, title, snippet, author, type }: {
      href: string;
      title: string;
      snippet?: string;
      author?: string;
      type?: string;
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
        id: `citation-${Date.now()}`,
        href,
        title,
        snippet,
        domain,
        favicon,
        author,
        type: type ?? "webpage",
      };
    },
    render: ({ result, status }) => {
      if (!result) return null;
      const parsed = safeParseSerializableCitation(result);
      if (!parsed) return null;
      return <Citation {...parsed} />;
    },
  },
};
