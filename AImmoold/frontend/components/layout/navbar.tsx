"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ChevronDown, Menu, X, Settings, LogOut, Building2, Users, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useDisclosure } from "@/lib/hooks"
import { DASHBOARD_NAV } from "@/lib/constants/navigation"
import { APP_NAME } from "@/lib/constants/app"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const { user, organization: currentOrganization, logout } = useAuth()
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useDisclosure()

  const isActive = (item: typeof DASHBOARD_NAV[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname?.startsWith(item.href)
  }

  // Séparer les items de navigation en catégories
  const mainNavItems = DASHBOARD_NAV.filter(item => 
    !['Propriétés', 'Propriétaires', 'Locataires'].includes(item.name)
  )
  
  const propertyManagementItems = DASHBOARD_NAV.filter(item => 
    ['Propriétés', 'Propriétaires', 'Locataires'].includes(item.name)
  )
  
  const isPropertyManagementActive = propertyManagementItems.some(item => isActive(item))

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">{APP_NAME}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {mainNavItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              )
            })}
            
            {/* Dropdown Gestion Immobilière */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isPropertyManagementActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden xl:inline">Gestion</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {propertyManagementItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item)
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center cursor-pointer",
                          active && "bg-indigo-50 text-indigo-700"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {currentOrganization && (
              <div className="hidden lg:block text-sm text-gray-600 truncate max-w-[150px] xl:max-w-[200px]">
                {currentOrganization.name}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    {currentOrganization && (
                      <p className="text-xs text-gray-500">{currentOrganization.name}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg">
          <div className="space-y-1 px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Organisation info on mobile */}
            {currentOrganization && (
              <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b mb-2">
                {currentOrganization.name}
              </div>
            )}
            
            {/* Main nav items */}
            {mainNavItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-base font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={closeMobileMenu}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {/* Property management section */}
            <div className="pt-2 mt-2 border-t">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Gestion Immobilière
              </div>
              {propertyManagementItems.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-base font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
