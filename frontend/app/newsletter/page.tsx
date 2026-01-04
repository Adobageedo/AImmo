"use client"

import { useNewsletter } from "@/lib/hooks/use-newsletter"
import { Newsletter, NewsletterEdition } from "@/lib/types/newsletter"
import { NEWSLETTER_THEMES, NEWSLETTER_FREQUENCIES } from "@/lib/constants/newsletter"
import { Mail, Clock, CheckCircle2, Bell, Calendar, ArrowLeft, Newspaper } from "lucide-react"
import { useState, useCallback } from "react"

export default function NewsletterPage() {
    const {
        newsletters,
        currentNewsletter,
        lastEdition,
        editions,
        loading,
        subscribing,
        loadNewsletter,
        loadLastEdition,
        loadEditions,
        subscribe,
        unsubscribe,
    } = useNewsletter({ autoLoad: true })

    const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null)

    const handleSelectNewsletter = useCallback(async (id: string) => {
        setSelectedNewsletterId(id)
        await loadNewsletter(id)
        await loadLastEdition(id)
        await loadEditions(id)
    }, [loadNewsletter, loadLastEdition, loadEditions])

    const handleBack = useCallback(() => {
        setSelectedNewsletterId(null)
    }, [])

    const handleToggleSubscription = useCallback(async (id: string, isSubscribed: boolean) => {
        if (isSubscribed) {
            await unsubscribe(id)
        } else {
            await subscribe(id)
        }
    }, [subscribe, unsubscribe])

    // Detail view
    if (selectedNewsletterId && currentNewsletter) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Retour aux newsletters</span>
                    </button>

                    <div className="mb-8">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Newspaper className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{currentNewsletter.title}</h1>
                        </div>
                        {currentNewsletter.description && (
                            <p className="text-gray-600 mt-2">{currentNewsletter.description}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Last Edition */}
                            {lastEdition ? (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">Dernière édition</h2>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {lastEdition.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Publié le {new Date(lastEdition.published_at).toLocaleDateString("fr-FR")}
                                    </p>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: lastEdition.content }}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Newspaper className="h-5 w-5 text-gray-400" />
                                        <h2 className="text-lg font-semibold text-gray-900">Dernière édition</h2>
                                    </div>
                                    <p className="text-gray-500 text-center py-8">
                                        Aucune édition disponible pour cette newsletter.
                                    </p>
                                </div>
                            )}

                            {/* Editions History */}
                            {editions.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Éditions précédentes</h2>
                                    <div className="space-y-3">
                                        {editions.map((edition) => (
                                            <div
                                                key={edition.id}
                                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <h4 className="font-medium text-gray-900">{edition.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {new Date(edition.published_at).toLocaleDateString("fr-FR")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Thème</p>
                                        <p className="text-gray-900">
                                            {NEWSLETTER_THEMES[currentNewsletter.theme as keyof typeof NEWSLETTER_THEMES] || currentNewsletter.theme}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Fréquence</p>
                                        <p className="text-gray-900">
                                            {NEWSLETTER_FREQUENCIES[currentNewsletter.frequency as keyof typeof NEWSLETTER_FREQUENCIES] || currentNewsletter.frequency}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleSubscription(currentNewsletter.id, currentNewsletter.is_user_subscribed || false)}
                                    disabled={subscribing}
                                    className={`
                                        mt-6 w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
                                        ${
                                            currentNewsletter.is_user_subscribed
                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow"
                                        }
                                        ${subscribing ? "opacity-50 cursor-not-allowed" : ""}
                                    `}
                                >
                                    {subscribing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                            <span>Chargement...</span>
                                        </>
                                    ) : currentNewsletter.is_user_subscribed ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Se désabonner</span>
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-4 w-4" />
                                            <span>S'abonner</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // List view
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Newspaper className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
                    </div>
                    <p className="text-gray-600">Restez informé des dernières actualités immobilières</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="p-2 bg-gray-200 rounded-lg w-10 h-10" />
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-3 bg-gray-200 rounded w-full" />
                                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                                </div>
                                <div className="h-10 bg-gray-200 rounded-lg w-full" />
                            </div>
                        ))}
                    </div>
                ) : newsletters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Mail className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Aucune newsletter disponible
                        </h3>
                        <p className="text-gray-500 text-center max-w-sm">
                            Il n'y a pas de newsletters disponibles pour le moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsletters.map((newsletter) => (
                            <div
                                key={newsletter.id}
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => handleSelectNewsletter(newsletter.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                            <Mail className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{newsletter.title}</h3>
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
                                    <div
                                        className={`
                                            inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                            ${
                                                newsletter.is_user_subscribed
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                            }
                                        `}
                                    >
                                        {newsletter.is_user_subscribed ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>Abonné</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Non abonné</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {newsletter.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {newsletter.description}
                                    </p>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleSubscription(newsletter.id, newsletter.is_user_subscribed || false)
                                    }}
                                    disabled={subscribing}
                                    className={`
                                        px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center space-x-2 w-full justify-center
                                        ${
                                            newsletter.is_user_subscribed
                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow"
                                        }
                                        ${subscribing ? "opacity-50 cursor-not-allowed" : ""}
                                    `}
                                >
                                    {subscribing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                            <span>Chargement...</span>
                                        </>
                                    ) : newsletter.is_user_subscribed ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Abonné</span>
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-4 w-4" />
                                            <span>S'abonner</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
