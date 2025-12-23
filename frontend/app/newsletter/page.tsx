"use client"

import React, { useState } from "react"
import {
    NewsletterPreview,
    NewsletterList,
    NewsletterHistory,
    NewsletterEmptyState,
    SubscriptionToggle,
    CategoryPreferences,
    FrequencySelector,
} from "@/components/newsletter"
import { useNewsletter } from "@/lib/hooks/use-newsletter"
import { Newsletter } from "@/lib/types/newsletter"
import styles from "@/styles/newsletter.module.css"

export default function NewsletterPage() {
    const {
        newsletters,
        latestNewsletter,
        loading,
        loadNewsletter,
    } = useNewsletter({ autoLoad: true, loadLatest: true })

    const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null)

    const handleSelectNewsletter = async (id: string) => {
        const newsletter = await loadNewsletter(id)
        if (newsletter) {
            setSelectedNewsletter(newsletter)
        }
    }

    const handleBack = () => {
        setSelectedNewsletter(null)
    }

    // Show full newsletter preview if one is selected
    if (selectedNewsletter) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <NewsletterPreview
                    newsletter={selectedNewsletter}
                    onBack={handleBack}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className={styles.newsletter}>
                {/* Header */}
                <div className={styles["newsletter__header"]}>
                    <div>
                        <h1 className={styles["newsletter__title"]}>
                            Newsletter
                        </h1>
                        <p className={styles["newsletter__subtitle"]}>
                            Restez informé des dernières actualités immobilières
                        </p>
                    </div>
                </div>

                {/* Subscription Settings */}
                <div className="grid gap-6 mb-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        <SubscriptionToggle />
                        <FrequencySelector />
                    </div>
                    <CategoryPreferences />
                </div>

                {/* Latest Newsletter Preview */}
                {latestNewsletter && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Dernière édition
                        </h2>
                        <div
                            className="cursor-pointer"
                            onClick={() => setSelectedNewsletter(latestNewsletter)}
                        >
                            <NewsletterPreview
                                newsletter={latestNewsletter}
                            />
                        </div>
                    </div>
                )}

                {/* Newsletter List */}
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                ) : newsletters.length > 0 ? (
                    <NewsletterList
                        newsletters={newsletters}
                        onSelect={handleSelectNewsletter}
                    />
                ) : (
                    <NewsletterEmptyState />
                )}

                {/* History */}
                <NewsletterHistory limit={5} />
            </div>
        </div>
    )
}
