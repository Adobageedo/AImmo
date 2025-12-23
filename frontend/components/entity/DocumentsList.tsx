import React from "react"
import { useRouter } from "next/navigation"
import type { EntityDocument } from "@/lib/hooks/use-entity-documents"

export interface DocumentsListProps {
    documents: EntityDocument[]
    onDocumentClick?: (doc: EntityDocument) => void
}

export function DocumentsList({ documents, onDocumentClick }: DocumentsListProps) {
    const router = useRouter()

    const handleClick = (doc: EntityDocument) => {
        if (onDocumentClick) {
            onDocumentClick(doc)
        } else {
            router.push(`/dashboard/documents?highlight=${doc.id}`)
        }
    }

    return documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.document_type,
        date: doc.created_at,
        onClick: () => handleClick(doc),
    }))
}
