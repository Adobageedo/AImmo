import type { BaseEntity } from "./common";

export type NewsletterCategory = 
  | "residential"
  | "commercial"
  | "taxation"
  | "regulation"
  | "market_trends";

export type NewsletterFrequency = "daily" | "weekly" | "monthly";

export interface Newsletter extends BaseEntity {
  title: string;
  category: NewsletterCategory;
  frequency: NewsletterFrequency;
  description: string;
  active: boolean;
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
