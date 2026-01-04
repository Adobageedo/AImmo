"use client"

import Link from "next/link"
import { Building2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PUBLIC_NAV } from "@/lib/constants/navigation"
import { APP_NAME } from "@/lib/constants/app"
import { useDisclosure } from "@/lib/hooks"

export function PublicNavbar() {
  const { isOpen, toggle, close } = useDisclosure()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={toggle}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-1 px-4 py-4">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={close}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              <Link href="/auth/login" onClick={close}>
                <Button variant="outline" className="w-full">
                  Se connecter
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={close}>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
