"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FormFieldProps {
    id: string
    label: string
    type?: string
    placeholder?: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    minLength?: number
    hint?: string
    error?: string
    disabled?: boolean
    className?: string
}

export function FormField({
    id,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    minLength,
    hint,
    error,
    disabled = false,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-gray-700"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                minLength={minLength}
                disabled={disabled}
                className={cn(
                    "h-11 px-4 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
            />
            {hint && !error && (
                <p className="text-xs text-gray-500">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}
