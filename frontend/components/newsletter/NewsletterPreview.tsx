"use client"

import React, { useMemo } from "react"
import {
    Calendar,
    Clock,
    ChevronRight,
    Mail,
    MailOpen,
    ExternalLink,
    TrendingUp,
    Building2,
    Scale,
    Receipt,
    Lightbulb,
    Sparkles,
    Share2,
    Twitter,
    Linkedin,
    Link2,
    ArrowLeft,
} from "lucide-react"
import { useNewsletter, useNewsletterSubscription } from "@/lib/hooks/use-newsletter"
import {
    Newsletter,
    NewsletterPreview as NewsletterPreviewType,
    NewsletterCategory,
    NewsletterFrequency,
    NewsletterSection,
} from "@/lib/types/newsletter"
import styles from "@/styles/newsletter.module.css"

// ================================
// Category Mappings
// ================================
const categoryLabels: Record<NewsletterCategory, string> = {
    [NewsletterCategory.MARKET_UPDATE]: "Tendances Marché",
    [NewsletterCategory.PORTFOLIO_SUMMARY]: "Résumé Portefeuille",
    [NewsletterCategory.REGULATORY]: "Réglementaire",
    [NewsletterCategory.TAX_UPDATE]: "Fiscalité",
    [NewsletterCategory.TIPS]: "Conseils",
    [NewsletterCategory.PRODUCT_NEWS]: "Nouveautés",
}

const categoryIcons: Record<NewsletterCategory, React.ReactNode> = {
    [NewsletterCategory.MARKET_UPDATE]: <TrendingUp className="w-4 h-4" />,
    [NewsletterCategory.PORTFOLIO_SUMMARY]: <Building2 className="w-4 h-4" />,
    [NewsletterCategory.REGULATORY]: <Scale className="w-4 h-4" />,
    [NewsletterCategory.TAX_UPDATE]: <Receipt className="w-4 h-4" />,
    [NewsletterCategory.TIPS]: <Lightbulb className="w-4 h-4" />,
    [NewsletterCategory.PRODUCT_NEWS]: <Sparkles className="w-4 h-4" />,
}

const frequencyLabels: Record<NewsletterFrequency, string> = {
    [NewsletterFrequency.WEEKLY]: "Hebdomadaire",
    [NewsletterFrequency.BIWEEKLY]: "Bimensuel",
    [NewsletterFrequency.MONTHLY]: "Mensuel",
    [NewsletterFrequency.QUARTERLY]: "Trimestriel",
}

// ================================
// Subscription Toggle Component
// ================================
interface SubscriptionToggleProps {
    className?: string
}

export function SubscriptionToggle({ className = "" }: SubscriptionToggleProps) {
    const { subscription, loading, isSubscribed, subscribe, unsubscribe } = useNewsletterSubscription()

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe()
        } else {
            await subscribe()
        }
    }

    return (
        <div className={`${styles["newsletter-subscription"]} ${className}`}>
            <div className={styles["newsletter-subscription__info"]}>
                <div className={styles["newsletter-subscription__icon"]}>
                    {isSubscribed ? <MailOpen /> : <Mail />}
                </div>
                <div className={styles["newsletter-subscription__text"]}>
                    <div className={styles["newsletter-subscription__label"]}>
                        Newsletter AImmo
                    </div>
                    <div className={`${styles["newsletter-subscription__status"]} ${isSubscribed ? styles["newsletter-subscription__status--active"] : ""}`}>
                        {isSubscribed ? "Abonné" : "Non abonné"}
                    </div>
                </div>
            </div>
            <button
                className={`${styles["newsletter-subscription__toggle"]} ${isSubscribed ? styles["newsletter-subscription__toggle--on"] : styles["newsletter-subscription__toggle--off"]}`}
                onClick={handleToggle}
                disabled={loading}
            >
                <span className={styles["newsletter-subscription__toggle-handle"]} />
            </button>
        </div>
    )
}

// ================================
// Category Preferences Component
// ================================
interface CategoryPreferencesProps {
    className?: string
}

export function CategoryPreferences({ className = "" }: CategoryPreferencesProps) {
    const { subscription, toggleCategory, loading } = useNewsletterSubscription()
    const activeCategories = subscription?.categories || []

    return (
        <div className={`${styles["newsletter-categories"]} ${className}`}>
            <h3 className={styles["newsletter-categories__title"]}>
                Catégories d&apos;intérêt
            </h3>
            <div className={styles["newsletter-categories__grid"]}>
                {Object.values(NewsletterCategory).map(category => (
                    <label
                        key={category}
                        className={`${styles["newsletter-categories__item"]} ${activeCategories.includes(category) ? styles["newsletter-categories__item--active"] : ""}`}
                    >
                        <input
                            type="checkbox"
                            className={styles["newsletter-categories__checkbox"]}
                            checked={activeCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            disabled={loading}
                        />
                        <span className={styles["newsletter-categories__label"]}>
                            {categoryLabels[category]}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    )
}

// ================================
// Frequency Selector Component
// ================================
interface FrequencySelectorProps {
    className?: string
}

export function FrequencySelector({ className = "" }: FrequencySelectorProps) {
    const { subscription, updateFrequency, loading } = useNewsletterSubscription()
    const currentFrequency = subscription?.frequency || NewsletterFrequency.MONTHLY

    return (
        <div className={`${styles["newsletter-frequency"]} ${className}`}>
            <h3 className={styles["newsletter-frequency__title"]}>
                Fréquence de réception
            </h3>
            <div className={styles["newsletter-frequency__options"]}>
                {Object.values(NewsletterFrequency).map(frequency => (
                    <button
                        key={frequency}
                        className={`${styles["newsletter-frequency__option"]} ${currentFrequency === frequency ? styles["newsletter-frequency__option--active"] : ""}`}
                        onClick={() => updateFrequency(frequency)}
                        disabled={loading}
                    >
                        {frequencyLabels[frequency]}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ================================
// Newsletter Card (List Item)
// ================================
interface NewsletterCardProps {
    newsletter: NewsletterPreviewType
    onClick?: (id: string) => void
}

export function NewsletterCard({ newsletter, onClick }: NewsletterCardProps) {
    const categoryClass = `${styles["newsletter-card__category"]} ${styles[`newsletter-card__category--${newsletter.category}`]}`

    const formattedDate = useMemo(() => {
        const date = new Date(newsletter.published_at)
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    }, [newsletter.published_at])

    return (
        <div
            className={styles["newsletter-card"]}
            onClick={() => onClick?.(newsletter.id)}
        >
            <div className={styles["newsletter-card__image"]}>
                {newsletter.featured_image_url ? (
                    <img
                        src={newsletter.featured_image_url}
                        alt={newsletter.title}
                    />
                ) : (
                    <div className={styles["newsletter-card__image-placeholder"]}>
                        <Mail className="w-8 h-8" />
                    </div>
                )}
            </div>

            <div className={styles["newsletter-card__content"]}>
                <span className={categoryClass}>
                    {categoryIcons[newsletter.category]}
                    {categoryLabels[newsletter.category]}
                </span>

                <h3 className={styles["newsletter-card__title"]}>
                    {newsletter.title}
                </h3>

                <p className={styles["newsletter-card__preview"]}>
                    {newsletter.preview_text}
                </p>

                <div className={styles["newsletter-card__meta"]}>
                    <span className={styles["newsletter-card__date"]}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                    </span>
                    <span className={styles["newsletter-card__read-time"]}>
                        <Clock className="w-3.5 h-3.5" />
                        5 min de lecture
                    </span>
                </div>
            </div>

            <ChevronRight className={styles["newsletter-card__arrow"]} />
        </div>
    )
}

// ================================
// Newsletter Section Component
// ================================
interface SectionViewProps {
    section: NewsletterSection
    index: number
}

function SectionView({ section, index }: SectionViewProps) {
    return (
        <div className={styles["newsletter-section"]}>
            <div className={styles["newsletter-section__header"]}>
                <span className={styles["newsletter-section__number"]}>
                    {index + 1}
                </span>
                <h2 className={styles["newsletter-section__title"]}>
                    {section.title}
                </h2>
            </div>

            <div
                className={styles["newsletter-section__content"]}
                dangerouslySetInnerHTML={{ __html: section.content }}
            />

            {section.image_url && (
                <div className={styles["newsletter-section__image"]}>
                    <img src={section.image_url} alt={section.title} />
                </div>
            )}

            {section.link_url && (
                <a
                    href={section.link_url}
                    className={styles["newsletter-section__link"]}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {section.link_text || "En savoir plus"}
                    <ExternalLink />
                </a>
            )}
        </div>
    )
}

// ================================
// Full Newsletter Preview
// ================================
interface NewsletterPreviewProps {
    newsletter: Newsletter
    onBack?: () => void
    className?: string
}

export function NewsletterPreview({
    newsletter,
    onBack,
    className = "",
}: NewsletterPreviewProps) {
    const formattedDate = useMemo(() => {
        if (!newsletter.published_at) return ""
        const date = new Date(newsletter.published_at)
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    }, [newsletter.published_at])

    const handleShare = async (platform: "twitter" | "linkedin" | "copy") => {
        const url = window.location.href
        const text = newsletter.title

        switch (platform) {
            case "twitter":
                window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                    "_blank"
                )
                break
            case "linkedin":
                window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                    "_blank"
                )
                break
            case "copy":
                await navigator.clipboard.writeText(url)
                // Could add toast notification here
                break
        }
    }

    // Sort sections by order
    const sortedSections = useMemo(() => {
        return [...newsletter.sections].sort((a, b) => a.order - b.order)
    }, [newsletter.sections])

    return (
        <div className={`${styles["newsletter-preview"]} ${className}`}>
            {/* Hero Section */}
            <div className={styles["newsletter-preview__hero"]}>
                {newsletter.featured_image_url && (
                    <img
                        src={newsletter.featured_image_url}
                        alt={newsletter.title}
                        className={styles["newsletter-preview__hero-image"]}
                    />
                )}
                <div className={styles["newsletter-preview__hero-content"]}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Retour
                        </button>
                    )}
                    <span className={styles["newsletter-preview__category"]}>
                        {categoryIcons[newsletter.category]}
                        {categoryLabels[newsletter.category]}
                    </span>
                    <h1 className={styles["newsletter-preview__title"]}>
                        {newsletter.title}
                    </h1>
                    <p className={styles["newsletter-preview__date"]}>
                        Publié le {formattedDate}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className={styles["newsletter-preview__body"]}>
                {/* Intro Text */}
                <p className={styles["newsletter-preview__intro"]}>
                    {newsletter.preview_text}
                </p>

                {/* Sections */}
                {sortedSections.map((section, index) => (
                    <SectionView
                        key={section.id}
                        section={section}
                        index={index}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className={styles["newsletter-preview__footer"]}>
                <div className={styles["newsletter-preview__share"]}>
                    <span className={styles["newsletter-preview__share-label"]}>
                        Partager cette édition
                    </span>
                    <div className={styles["newsletter-preview__share-buttons"]}>
                        <button
                            className={styles["newsletter-preview__share-btn"]}
                            onClick={() => handleShare("twitter")}
                            title="Partager sur Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </button>
                        <button
                            className={styles["newsletter-preview__share-btn"]}
                            onClick={() => handleShare("linkedin")}
                            title="Partager sur LinkedIn"
                        >
                            <Linkedin className="w-5 h-5" />
                        </button>
                        <button
                            className={styles["newsletter-preview__share-btn"]}
                            onClick={() => handleShare("copy")}
                            title="Copier le lien"
                        >
                            <Link2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ================================
// Newsletter List Component
// ================================
interface NewsletterListProps {
    newsletters: NewsletterPreviewType[]
    onSelect: (id: string) => void
    className?: string
}

export function NewsletterList({
    newsletters,
    onSelect,
    className = "",
}: NewsletterListProps) {
    return (
        <div className={`${styles["newsletter-list"]} ${className}`}>
            <div className={styles["newsletter-list__header"]}>
                <h2 className={styles["newsletter-list__title"]}>
                    Éditions précédentes
                </h2>
                <span className={styles["newsletter-list__count"]}>
                    {newsletters.length} éditions
                </span>
            </div>

            {newsletters.map(newsletter => (
                <NewsletterCard
                    key={newsletter.id}
                    newsletter={newsletter}
                    onClick={onSelect}
                />
            ))}
        </div>
    )
}

// ================================
// Newsletter History Component
// ================================
interface NewsletterHistoryProps {
    className?: string
    limit?: number
}

export function NewsletterHistory({
    className = "",
    limit = 5,
}: NewsletterHistoryProps) {
    const { newsletters, loading, loadNewsletters } = useNewsletter({ autoLoad: true })

    const displayedNewsletters = newsletters.slice(0, limit)

    if (loading) {
        return (
            <div className={`${styles["newsletter-history"]} ${className}`}>
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (newsletters.length === 0) {
        return null
    }

    return (
        <div className={`${styles["newsletter-history"]} ${className}`}>
            <h3 className={styles["newsletter-history__title"]}>
                Historique
            </h3>
            <div className={styles["newsletter-history__list"]}>
                {displayedNewsletters.map(newsletter => (
                    <div
                        key={newsletter.id}
                        className={styles["newsletter-history__item"]}
                    >
                        <div className={styles["newsletter-history__item-content"]}>
                            <div className={styles["newsletter-history__item-icon"]}>
                                <Mail />
                            </div>
                            <div>
                                <div className={styles["newsletter-history__item-title"]}>
                                    {newsletter.title}
                                </div>
                                <div className={styles["newsletter-history__item-date"]}>
                                    {new Date(newsletter.published_at).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className={styles["newsletter-history__item-arrow"]} />
                    </div>
                ))}
            </div>

            {newsletters.length > limit && (
                <button className={styles["newsletter-history__load-more"]}>
                    Voir toutes les éditions
                </button>
            )}
        </div>
    )
}

// ================================
// Empty State
// ================================
export function NewsletterEmptyState() {
    return (
        <div className={styles["newsletter-empty"]}>
            <div className={styles["newsletter-empty__icon"]}>
                <Mail />
            </div>
            <h3 className={styles["newsletter-empty__title"]}>
                Aucune newsletter disponible
            </h3>
            <p className={styles["newsletter-empty__text"]}>
                Il n&apos;y a pas encore de newsletters publiées. Revenez bientôt !
            </p>
        </div>
    )
}

export default NewsletterPreview
