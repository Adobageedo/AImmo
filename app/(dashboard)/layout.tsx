"use client";

import { AuthProvider } from "@/context/AuthContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Navbar/>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </OrganizationProvider>
    </AuthProvider>
  );
}
