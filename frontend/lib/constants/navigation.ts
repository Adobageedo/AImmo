// Navigation constants - centralize all navigation items

import { Building2, FileText, MessageSquare, Settings, Users, TrendingUp, Calendar, Bell, Mail, LayoutDashboard } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
    name: string
    href: string
    icon: LucideIcon
    exact?: boolean
    badge?: string
}

export interface FooterNavSection {
    title: string
    items: { name: string; href: string }[]
}

// Dashboard navigation
export const DASHBOARD_NAV: NavItem[] = [
    { name: "Tableau de bord", href: "/dashboard", icon: Building2, exact: true },
    { name: "Portfolio", href: "/dashboard/portfolio", icon: LayoutDashboard },
    { name: "Propriétés", href: "/dashboard/properties", icon: Building2 },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "Locataires", href: "/dashboard/tenants", icon: Users },
    { name: "Finances", href: "/dashboard/finances", icon: TrendingUp },
    { name: "Alertes", href: "/alerts", icon: Bell },
    { name: "Newsletter", href: "/newsletter", icon: Mail },
    { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
]

// Public navbar navigation
export const PUBLIC_NAV = [
    { name: "Fonctionnalités", href: "#features" },
    { name: "Tarifs", href: "#pricing" },
    { name: "À propos", href: "#about" },
]

// Footer navigation
export const FOOTER_NAV: FooterNavSection[] = [
    {
        title: "Produit",
        items: [
            { name: "Fonctionnalités", href: "#features" },
            { name: "Tarifs", href: "#pricing" },
            { name: "Sécurité", href: "#security" },
            { name: "Roadmap", href: "#roadmap" },
        ],
    },
    {
        title: "Entreprise",
        items: [
            { name: "À propos", href: "#about" },
            { name: "Blog", href: "/blog" },
            { name: "Carrières", href: "/careers" },
            { name: "Contact", href: "/contact" },
        ],
    },
    {
        title: "Ressources",
        items: [
            { name: "Documentation", href: "/docs" },
            { name: "API", href: "/api" },
            { name: "Support", href: "/support" },
            { name: "Status", href: "/status" },
        ],
    },
    {
        title: "Légal",
        items: [
            { name: "Confidentialité", href: "/privacy" },
            { name: "Conditions", href: "/terms" },
            { name: "Cookies", href: "/cookies" },
            { name: "Mentions légales", href: "/legal" },
        ],
    },
]

// Social links
export const SOCIAL_LINKS = [
    { name: "Twitter", href: "https://twitter.com/aimmo", icon: "Twitter" },
    { name: "LinkedIn", href: "https://linkedin.com/company/aimmo", icon: "Linkedin" },
    { name: "GitHub", href: "https://github.com/aimmo", icon: "Github" },
]
