import type { Toolkit } from "@assistant-ui/react";

// Frontend toolkit for tools that execute in the browser
// Note: With custom streaming adapter, frontend tools don't work well
// Use backend tools in /app/api/chat/route.ts instead
export const appToolkit: Toolkit = {};
