"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  showSidebar?: boolean;
}

export function ChatLayout({ children, sidebar, showSidebar = true }: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {showSidebar && sidebar && (
        <aside className="w-64 border-r bg-background flex-shrink-0">
          {sidebar}
        </aside>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
