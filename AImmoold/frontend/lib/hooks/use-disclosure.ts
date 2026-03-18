"use client"

import { useState, useCallback } from "react"

interface UseDisclosureOptions {
    defaultOpen?: boolean
    onOpen?: () => void
    onClose?: () => void
}

/**
 * Custom hook for managing disclosure state (modals, dialogs, dropdowns)
 */
export function useDisclosure(options: UseDisclosureOptions = {}) {
    const { defaultOpen = false, onOpen, onClose } = options
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const open = useCallback(() => {
        setIsOpen(true)
        onOpen?.()
    }, [onOpen])

    const close = useCallback(() => {
        setIsOpen(false)
        onClose?.()
    }, [onClose])

    const toggle = useCallback(() => {
        setIsOpen(prev => {
            const next = !prev
            if (next) {
                onOpen?.()
            } else {
                onClose?.()
            }
            return next
        })
    }, [onOpen, onClose])

    return {
        isOpen,
        open,
        close,
        toggle,
        setIsOpen,
    }
}
