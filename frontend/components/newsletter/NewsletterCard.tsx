"use client"

import { Newsletter } from "@/lib/types/newsletter"
import { NEWSLETTER_THEMES, NEWSLETTER_FREQUENCIES } from "@/lib/constants/newsletter"
import { Mail, Clock, CheckCircle2 } from "lucide-react"
import { NewsletterSubscribeButton } from "./NewsletterSubscribeButton"
import { NewsletterStatusBadge } from "./NewsletterStatusBadge"

interface NewsletterCardProps {
    newsletter: Newsletter
    onSubscribe: (id: string) => Promise<boolean>
    onUnsubscribe: (id: string) => Promise<boolean>
    subscribing?: boolean
}

export function NewsletterCard({ 
    newsletter, 
    onSubscribe, 
    onUnsubscribe,
    subscribing = false 
}: NewsletterCardProps) {
    const handleToggle = async () => {
        if (newsletter.is_user_subscribed) {
            return onUnsubscribe(newsletter.id)
        } else {
            return onSubscribe(newsletter.id)
        }
    }

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Mail className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{newsletter.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                                {NEWSLETTER_THEMES[newsletter.theme as keyof typeof NEWSLETTER_THEMES] || newsletter.theme}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                                {NEWSLETTER_FREQUENCIES[newsletter.frequency as keyof typeof NEWSLETTER_FREQUENCIES] || newsletter.frequency}
                            </span>
                        </div>
                    </div>
                </div>
                <NewsletterStatusBadge isSubscribed={newsletter.is_user_subscribed || false} />
            </div>

            {newsletter.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {newsletter.description}
                </p>
            )}

            <NewsletterSubscribeButton
                isSubscribed={newsletter.is_user_subscribed || false}
                onToggle={handleToggle}
                loading={subscribing}
            />
        </div>
    )
}
