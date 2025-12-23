// Newsletter Types - MVP aligned with backend schema

export interface Newsletter {
    id: string
    slug: string
    title: string
    description: string | null
    theme: string
    frequency: string
    is_active: boolean
    created_at: string
    updated_at: string
    is_user_subscribed?: boolean
    subscription_id?: string | null
}

export interface NewsletterEdition {
    id: string
    newsletter_id: string
    title: string
    content: string
    published_at: string
    created_at: string
    updated_at: string
}

export interface NewsletterSubscription {
    id: string
    user_id: string
    newsletter_id: string
    is_subscribed: boolean
    subscribed_at: string
    unsubscribed_at: string | null
    created_at: string
    updated_at: string
}
