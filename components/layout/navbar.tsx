"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText, Building2, Users, User, Settings, LogOut } from "lucide-react";

export const Navbar = () => {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="font-semibold text-lg">
        AImmo
      </Link>
      
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-6">
        <Link 
          href="/dashboard" 
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Dashboard
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 text-sm font-medium hover:text-primary">
              Actifs
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href="/properties" className="flex items-center cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Propriétés
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/owners" className="flex items-center cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Propriétaires
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tenants" className="flex items-center cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Locataires
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/leases" className="flex items-center cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Baux
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Link 
          href="/documents" 
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Documents
        </Link>
        <Link href="/newsletter" className="text-sm font-medium hover:text-primary transition-colors">
          Newsletter
        </Link>
        <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors">
          Chat
        </Link>
      </nav>

      {/* Profile Section */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <User className="mr-2 h-4 w-4" />
            Profil
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
