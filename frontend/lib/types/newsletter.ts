// Newsletter Types for AImmo - Phase 8

/**
 * Newsletter frequency options
 */
export enum NewsletterFrequency {
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
}

/**
 * Newsletter category/topic
 */
export enum NewsletterCategory {
    MARKET_UPDATE = "market_update",      // Tendances marché
    PORTFOLIO_SUMMARY = "portfolio_summary", // Résumé portefeuille
    REGULATORY = "regulatory",            // Évolutions réglementaires
    TAX_UPDATE = "tax_update",            // Actualités fiscales
    TIPS = "tips",                        // Conseils gestion
    PRODUCT_NEWS = "product_news",        // Nouveautés produit
}

/**
 * Newsletter status
 */
export enum NewsletterStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    SENT = "sent",
    ARCHIVED = "archived",
}

/**
 * Newsletter content section
 */
export interface NewsletterSection {
    id: string
    title: string
    content: string
    image_url?: string
    link_url?: string
    link_text?: string
    order: number
}

/**
 * Newsletter edition
 */
export interface Newsletter {
    id: string
    title: string
    subject: string
    preview_text: string
    status: NewsletterStatus
    category: NewsletterCategory
    frequency: NewsletterFrequency
    sections: NewsletterSection[]
    featured_image_url?: string
    published_at?: string
    scheduled_at?: string
    created_at: string
    updated_at: string
    stats?: NewsletterStats
}

/**
 * Newsletter statistics
 */
export interface NewsletterStats {
    sent_count: number
    delivered_count: number
    opened_count: number
    clicked_count: number
    open_rate: number       // percentage
    click_rate: number      // percentage
    unsubscribed_count: number
}

/**
 * User subscription preferences
 */
export interface NewsletterSubscription {
    id: string
    user_id: string
    organization_id: string
    email: string
    is_subscribed: boolean
    categories: NewsletterCategory[]
    frequency: NewsletterFrequency
    created_at: string
    updated_at: string
    unsubscribed_at?: string
    unsubscribe_reason?: string
}

/**
 * Subscription update request
 */
export interface SubscriptionUpdateRequest {
    is_subscribed?: boolean
    categories?: NewsletterCategory[]
    frequency?: NewsletterFrequency
    unsubscribe_reason?: string
}

/**
 * Newsletter preview for list display
 */
export interface NewsletterPreview {
    id: string
    title: string
    subject: string
    preview_text: string
    category: NewsletterCategory
    published_at: string
    featured_image_url?: string
}

/**
 * Newsletter list filters
 */
export interface NewsletterFilters {
    categories?: NewsletterCategory[]
    statuses?: NewsletterStatus[]
    from_date?: string
    to_date?: string
    search?: string
}

/**
 * Newsletter subscriber stats
 */
export interface SubscriberStats {
    total_subscribers: number
    active_subscribers: number
    by_category: Record<NewsletterCategory, number>
    by_frequency: Record<NewsletterFrequency, number>
    recent_unsubscribes: number
    growth_rate: number  // percentage vs previous period
}
