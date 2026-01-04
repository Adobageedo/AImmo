"use client"

export function NewsletterSkeleton() {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-gray-200 rounded-lg w-10 h-10" />
                    <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-full" />
        </div>
    )
}
