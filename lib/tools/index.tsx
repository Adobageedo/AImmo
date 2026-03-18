"use client";

import type { Toolkit } from "@assistant-ui/react";
import { leaseTools } from "./lease-tools";

/**
 * Central AImmo Toolkit
 * 
 * This aggregates all tools from different modules into a single toolkit.
 * Following the recommended pattern from @assistant-ui/react documentation.
 * 
 * To add new tools:
 * 1. Create a new tool module in lib/tools/[module-name]-tools.tsx
 * 2. Import it here
 * 3. Spread it into the appToolkit object
 */
export const appToolkit: Toolkit = {
  ...leaseTools,
};

/**
 * Export individual toolkits for granular control
 */
export { leaseTools };
