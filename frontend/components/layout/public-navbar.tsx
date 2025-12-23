import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">AImmo</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Tarifs
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              À propos
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Commencer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
