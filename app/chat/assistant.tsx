"use client";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { LeaseSearchToolUIComponent } from "@/components/assistant-ui/tools/LeaseSearchToolUIComponent";
import { MyRuntimeProvider as ChatRuntimeProvider } from "@/components/chat/ChatRuntimeProvider";

export const Assistant = () => {
  return (
    <ChatRuntimeProvider>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Navbar />
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      
      {/* Tool UI Components - Register les tools UI avec makeAssistantToolUI */}
      <LeaseSearchToolUIComponent />
    </ChatRuntimeProvider>
  );
};
