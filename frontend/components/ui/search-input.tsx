"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"
import { Input } from "./input"
import { Button } from "./button"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    onClear?: () => void
    loading?: boolean
}

export function SearchInput({
    value,
    onChange,
    placeholder = "Rechercher...",
    className,
    onClear,
    loading = false,
}: SearchInputProps) {
    const handleClear = () => {
        onChange("")
        onClear?.()
    }

    return (
        <div className={cn("relative", className)}>
            <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
                loading && "animate-pulse"
            )} />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
