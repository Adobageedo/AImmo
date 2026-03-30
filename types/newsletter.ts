import type { BaseEntity } from "./common";

export type NewsletterCategory = 
  | "residential"
  | "commercial"
  | "taxation"
  | "regulation"
  | "market_trends";

export type NewsletterFrequency = "daily" | "weekly" | "monthly";

export interface Newsletter extends Omit<BaseEntity, 'organization_id'> {
  title: string;
  category: NewsletterCategory;
  frequency: NewsletterFrequency;
  description: string;
  active: boolean;
  slug?: string;
  theme?: string;
  is_active?: boolean;
  organization_id?: string;
}

export interface NewsletterWithSubscription extends Newsletter {
  is_user_subscribed?: boolean;
  subscription_id?: string;
  edition_count?: number;
  subscriber_count?: number;
  last_published_at?: string;
}

export interface NewsletterSubscription {
  id: string;
  user_id: string;
  newsletter_id: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  active: boolean;
}

export interface NewsletterEdition extends BaseEntity {
  newsletter_id: string;
  title: string;
  content: string;
  published_at?: string;
  sent_at?: string;
  recipient_count?: number;
  open_rate?: number;
  click_rate?: number;
}

export interface SubscribeNewsletterRequest {
  newsletter_id: string;
}

export interface UnsubscribeNewsletterRequest {
  newsletter_id: string;
}
