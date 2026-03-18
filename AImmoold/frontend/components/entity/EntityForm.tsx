/**
 * EntityForm - Generic reusable form component for all entities
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useState, useCallback } from "react"
import { Loader2, Save, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import styles from "@/styles/entity.module.css"

// ============================================
// TYPES
// ============================================

export interface EntityFormField {
    key: string
    label: string
    type: "text" | "email" | "tel" | "number" | "date" | "select" | "textarea" | "checkbox" | "currency"
    placeholder?: string
    required?: boolean
    disabled?: boolean
    hint?: string
    options?: Array<{ label: string; value: string }>
    min?: number
    max?: number
    step?: number
    rows?: number
    prefix?: string
    suffix?: string
    fullWidth?: boolean
    validation?: (value: unknown) => string | null
    dependsOn?: string
    showIf?: (values: Record<string, unknown>) => boolean
}

export interface EntityFormSection {
    id: string
    title: string
    description?: string
    fields: EntityFormField[]
}

export interface EntityFormProps<T extends Record<string, unknown>> {
    // Data
    initialValues?: Partial<T>
    sections: EntityFormSection[]

    // Actions
    onSubmit: (values: T) => Promise<void>
    onCancel?: () => void

    // Labels
    title?: string
    submitLabel?: string
    cancelLabel?: string

    // State
    loading?: boolean
    error?: string | null

    // Styling
    className?: string
}

// ============================================
// COMPONENT
// ============================================

export function EntityForm<T extends Record<string, unknown>>({
    initialValues = {},
    sections,
    onSubmit,
    onCancel,
    title,
    submitLabel = "Enregistrer",
    cancelLabel = "Annuler",
    loading = false,
    error,
    className,
}: EntityFormProps<T>) {
    const [values, setValues] = useState<Record<string, unknown>>(initialValues)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [submitting, setSubmitting] = useState(false)

    // Handle field change
    const handleChange = useCallback((key: string, value: unknown) => {
        setValues(prev => ({ ...prev, [key]: value }))

        // Clear error when user starts typing
        if (errors[key]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[key]
                return next
            })
        }
    }, [errors])

    // Handle blur (mark as touched)
    const handleBlur = useCallback((key: string) => {
        setTouched(prev => ({ ...prev, [key]: true }))
    }, [])

    // Validate a single field
    const validateField = useCallback((field: EntityFormField, value: unknown): string | null => {
        // Required check
        if (field.required && (value === undefined || value === null || value === "")) {
            return `${field.label} est requis`
        }

        // Type-specific validation
        if (value !== undefined && value !== null && value !== "") {
            if (field.type === "email" && typeof value === "string") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(value)) {
                    return "Email invalide"
                }
            }

            if (field.type === "tel" && typeof value === "string") {
                const phoneRegex = /^[\d\s+()-]{10,}$/
                if (!phoneRegex.test(value)) {
                    return "Numéro de téléphone invalide"
                }
            }

            if ((field.type === "number" || field.type === "currency") && typeof value === "number") {
                if (field.min !== undefined && value < field.min) {
                    return `La valeur minimum est ${field.min}`
                }
                if (field.max !== undefined && value > field.max) {
                    return `La valeur maximum est ${field.max}`
                }
            }
        }

        // Custom validation
        if (field.validation) {
            return field.validation(value)
        }

        return null
    }, [])

    // Validate all fields
    const validateAll = useCallback((): boolean => {
        const newErrors: Record<string, string> = {}
        let isValid = true

        sections.forEach(section => {
            section.fields.forEach(field => {
                // Skip hidden fields
                if (field.showIf && !field.showIf(values)) {
                    return
                }

                const error = validateField(field, values[field.key])
                if (error) {
                    newErrors[field.key] = error
                    isValid = false
                }
            })
        })

        setErrors(newErrors)

        // Mark all fields as touched
        const allTouched: Record<string, boolean> = {}
        sections.forEach(section => {
            section.fields.forEach(field => {
                allTouched[field.key] = true
            })
        })
        setTouched(allTouched)

        return isValid
    }, [sections, values, validateField])

    // Handle form submit
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateAll()) {
            return
        }

        setSubmitting(true)
        try {
            await onSubmit(values as T)
        } catch {
            // Error handling is done by parent
        } finally {
            setSubmitting(false)
        }
    }, [values, validateAll, onSubmit])

    // Render field input
    const renderField = (field: EntityFormField) => {
        // Check if field should be shown
        if (field.showIf && !field.showIf(values)) {
            return null
        }

        const value = values[field.key]
        const fieldError = touched[field.key] ? errors[field.key] : null
        const isDisabled = field.disabled || loading || submitting

        const inputClassName = `
      ${styles["entity-form__input"]}
      ${fieldError ? styles["entity-form__input--error"] : ""}
    `

        let input: React.ReactNode

        switch (field.type) {
            case "select":
                input = (
                    <select
                        id={field.key}
                        value={String(value || "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        onBlur={() => handleBlur(field.key)}
                        disabled={isDisabled}
                        className={styles["entity-form__select"]}
                    >
                        <option value="">{field.placeholder || "Sélectionner..."}</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )
                break

            case "textarea":
                input = (
                    <textarea
                        id={field.key}
                        value={String(value || "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        onBlur={() => handleBlur(field.key)}
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        rows={field.rows || 4}
                        className={styles["entity-form__textarea"]}
                    />
                )
                break

            case "checkbox":
                input = (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            id={field.key}
                            checked={Boolean(value)}
                            onChange={(e) => handleChange(field.key, e.target.checked)}
                            disabled={isDisabled}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{field.placeholder}</span>
                    </label>
                )
                break

            case "currency":
                input = (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                        <input
                            type="number"
                            id={field.key}
                            value={value !== undefined ? Number(value) : ""}
                            onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : undefined)}
                            onBlur={() => handleBlur(field.key)}
                            placeholder={field.placeholder || "0,00"}
                            disabled={isDisabled}
                            min={field.min}
                            max={field.max}
                            step={field.step || 0.01}
                            className={`${inputClassName} pl-8`}
                        />
                    </div>
                )
                break

            case "number":
                input = (
                    <div className="relative">
                        {field.prefix && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{field.prefix}</span>
                        )}
                        <input
                            type="number"
                            id={field.key}
                            value={value !== undefined ? Number(value) : ""}
                            onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : undefined)}
                            onBlur={() => handleBlur(field.key)}
                            placeholder={field.placeholder}
                            disabled={isDisabled}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            className={`${inputClassName} ${field.prefix ? "pl-8" : ""} ${field.suffix ? "pr-12" : ""}`}
                        />
                        {field.suffix && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{field.suffix}</span>
                        )}
                    </div>
                )
                break

            default:
                input = (
                    <input
                        type={field.type}
                        id={field.key}
                        value={String(value || "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        onBlur={() => handleBlur(field.key)}
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={inputClassName}
                    />
                )
        }

        return (
            <div
                key={field.key}
                className={`${styles["entity-form__field"]} ${field.fullWidth ? styles["entity-form__field--full"] : ""}`}
            >
                {field.type !== "checkbox" && (
                    <label htmlFor={field.key} className={styles["entity-form__label"]}>
                        {field.label}
                        {field.required && <span className={styles["entity-form__label-required"]}>*</span>}
                    </label>
                )}

                {input}

                {fieldError && (
                    <span className={styles["entity-form__error"]}>
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        {fieldError}
                    </span>
                )}

                {field.hint && !fieldError && (
                    <span className={styles["entity-form__hint"]}>{field.hint}</span>
                )}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={`${styles["entity-form"]} ${className || ""}`}>
            {/* Title */}
            {title && (
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
            )}

            {/* Global Error */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Sections */}
            {sections.map(section => (
                <div key={section.id} className={styles["entity-form__section"]}>
                    <div className={styles["entity-form__section-title"]}>
                        {section.title}
                    </div>
                    {section.description && (
                        <p className="text-sm text-gray-500 -mt-2 mb-4">{section.description}</p>
                    )}
                    <div className={styles["entity-form__grid"]}>
                        {section.fields.map(field => renderField(field))}
                    </div>
                </div>
            ))}

            {/* Actions */}
            <div className={styles["entity-form__actions"]}>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        <X className="h-4 w-4 mr-2" />
                        {cancelLabel}
                    </Button>
                )}
                <Button type="submit" disabled={submitting || loading}>
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            {submitLabel}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}

export default EntityForm
