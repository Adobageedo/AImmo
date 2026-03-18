"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { SessionIndicator } from "@/components/ui/SessionIndicator"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const isConversationsPage = pathname.startsWith("/dashboard/conversations")

  return (
    <div className="flex flex-col">
      <SessionIndicator />
      {isConversationsPage ? (
        // Pour la page conversations : header + chat sur 100% de la fenêtre, footer en dessous
        <>
          <Navbar />
          <main className="flex-1 h-[calc(100vh-64px)] bg-gray-50">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
          <Footer />
        </>
      ) : (
        // Pour les autres pages : layout normal avec footer
        <>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 bg-gray-50">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </>
      )}
    </div>
  )
}
