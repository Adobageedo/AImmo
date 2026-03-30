"use client";

import type { Toolkit } from "@assistant-ui/react";
import { getCurrentDateTool } from "./get-current-date";
import { communicationTools } from "./ui/communication";
import { planTool } from "./ui/plan";
import { citationTool } from "./ui/citation";
import { linkPreviewTool } from "./ui/link-preview";
import { fetchAllLeaseTextsTool } from "./immo/fetch-all-lease-texts";
import { fetchAllOwnersTool } from "./immo/fetch-all-owners";
import { fetchAllTenantsTool } from "./immo/fetch-all-tenants";
import { fetchAllPropertiesTool } from "./immo/fetch-all-properties";
import { fetchJurisprudenceArticlesTool } from "./immo/fetch-jurisprudence-articles";

/**
 * Main toolkit combining all tools from separate files.
 * Each tool is defined in its own file for better organization.
 * All tools use mock data and require no parameters for simplicity.
 */
export const appToolkit: Toolkit = {
  ...getCurrentDateTool,
  ...communicationTools,
  ...planTool,
  ...citationTool,
  ...linkPreviewTool,
  ...fetchAllLeaseTextsTool,
  ...fetchAllOwnersTool,
  ...fetchAllTenantsTool,
  ...fetchAllPropertiesTool,
  ...fetchJurisprudenceArticlesTool,
};
