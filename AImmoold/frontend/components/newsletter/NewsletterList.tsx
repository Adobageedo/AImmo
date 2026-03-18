"use client"

import { Newsletter } from "@/lib/types/newsletter"
import { NewsletterCard } from "./NewsletterCard"
import { NewsletterEmptyState } from "./NewsletterEmptyState"
import { NewsletterSkeleton } from "./NewsletterSkeleton"

interface NewsletterListProps {
    newsletters: Newsletter[]
    loading?: boolean
    onSubscribe: (id: string) => Promise<boolean>
    onUnsubscribe: (id: string) => Promise<boolean>
    subscribing?: boolean
}

export function NewsletterList({
    newsletters,
    loading = false,
    onSubscribe,
    onUnsubscribe,
    subscribing = false,
}: NewsletterListProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <NewsletterSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (newsletters.length === 0) {
        return <NewsletterEmptyState />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsletters.map((newsletter) => (
                <NewsletterCard
                    key={newsletter.id}
                    newsletter={newsletter}
                    onSubscribe={onSubscribe}
                    onUnsubscribe={onUnsubscribe}
                    subscribing={subscribing}
                />
            ))}
        </div>
    )
}
