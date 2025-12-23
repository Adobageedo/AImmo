"use client"

import React from "react"
import { Chunk, RAGSearchResult } from "@/lib/types/rag"
import { SourceBadge } from "./RAGToggle"
import styles from "@/styles/rag.module.css"

/**
 * RAG Chunk Card - Affiche un chunk avec son score et métadonnées
 */

interface RAGChunkCardProps {
    result: RAGSearchResult
    onExclude?: (chunkId: string) => void
    onViewDocument?: (documentId: string) => void
    showActions?: boolean
    className?: string
}

export function RAGChunkCard({
    result,
    onExclude,
    onViewDocument,
    showActions = true,
    className = "",
}: RAGChunkCardProps) {
    const { chunk, score, highlights } = result

    // Déterminer la classe de score
    const getScoreClass = (s: number): string => {
        if (s >= 0.8) return styles["rag-chunk__score--high"]
        if (s >= 0.6) return styles["rag-chunk__score--medium"]
        return styles["rag-chunk__score--low"]
    }

    // Formatter le score en pourcentage
    const formatScore = (s: number): string => {
        return `${Math.round(s * 100)}%`
    }

    // Renderer le contenu avec highlights
    const renderContent = (): React.ReactNode => {
        if (!highlights || highlights.length === 0) {
            return <p className={styles["rag-chunk__content"]}>{chunk.content}</p>
        }

        // Afficher le premier highlight
        return (
            <p className={styles["rag-chunk__content"]}>
                <span className={styles["rag-chunk__highlight"]}>{highlights[0]}</span>
                {highlights.length > 1 && <span>... (+{highlights.length - 1})</span>}
            </p>
        )
    }

    return (
        <div className={`${styles["rag-chunk"]} ${className}`}>
            <div className={styles["rag-chunk__header"]}>
                <h4 className={styles["rag-chunk__title"]}>
                    <SourceBadge sourceType={chunk.source_type} />
                    <span>{chunk.metadata.source_title || "Sans titre"}</span>
                </h4>
                <div className={`${styles["rag-chunk__score"]} ${getScoreClass(score)}`}>
                    <span>⚡</span>
                    <span>{formatScore(score)}</span>
                </div>
            </div>

            {renderContent()}

            <div className={styles["rag-chunk__footer"]}>
                <div className={styles["rag-chunk__meta"]}>
                    {chunk.metadata.page_number && (
                        <span>Page {chunk.metadata.page_number}</span>
                    )}
                    <span>
                        Chunk {chunk.chunk_index + 1}/{chunk.total_chunks}
                    </span>
                </div>

                {chunk.semantic_tags.length > 0 && (
                    <div className={styles["rag-chunk__tags"]}>
                        {chunk.semantic_tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={styles["rag-chunk__tag"]}>
                                {tag}
                            </span>
                        ))}
                        {chunk.semantic_tags.length > 3 && (
                            <span className={styles["rag-chunk__tag"]}>
                                +{chunk.semantic_tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {showActions && (
                    <div className={styles["rag-chunk__actions"]}>
                        {onViewDocument && (
                            <button
                                type="button"
                                className={styles["rag-chunk__action"]}
                                onClick={() => onViewDocument(chunk.document_id)}
                                title="Voir le document"
                            >
                                📄
                            </button>
                        )}
                        {onExclude && (
                            <button
                                type="button"
                                className={styles["rag-chunk__action"]}
                                onClick={() => onExclude(chunk.id)}
                                title="Exclure du RAG"
                            >
                                🚫
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * RAG Results - Liste des résultats de recherche
 */

interface RAGResultsProps {
    results: RAGSearchResult[]
    totalSearched?: number
    processingTime?: number
    isLoading?: boolean
    onExcludeChunk?: (chunkId: string) => void
    onViewDocument?: (documentId: string) => void
    emptyMessage?: string
    className?: string
}

export function RAGResults({
    results,
    totalSearched = 0,
    processingTime = 0,
    isLoading = false,
    onExcludeChunk,
    onViewDocument,
    emptyMessage = "Aucun résultat trouvé",
    className = "",
}: RAGResultsProps) {
    if (isLoading) {
        return (
            <div className={styles["rag-loading"]}>
                <div className={styles["rag-loading__spinner"]} />
                <span className={styles["rag-loading__text"]}>Recherche en cours...</span>
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className={styles["rag-results__empty"]}>
                <div className={styles["rag-results__empty-icon"]}>🔍</div>
                <p className={styles["rag-results__empty-text"]}>{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className={`${styles["rag-results"]} ${className}`}>
            <div className={styles["rag-results__header"]}>
                <span className={styles["rag-results__count"]}>
                    <strong>{results.length}</strong> résultats sur {totalSearched} chunks
                </span>
                <span className={styles["rag-results__time"]}>{processingTime}ms</span>
            </div>

            {results.map((result) => (
                <RAGChunkCard
                    key={result.chunk.id}
                    result={result}
                    onExclude={onExcludeChunk}
                    onViewDocument={onViewDocument}
                />
            ))}
        </div>
    )
}

/**
 * RAG Chunk Skeleton - Placeholder pendant le chargement
 */

export function RAGChunkSkeleton() {
    return (
        <div className={styles["rag-chunk"]}>
            <div className={styles["rag-chunk__header"]}>
                <div className={`${styles["rag-skeleton"]} ${styles["rag-skeleton--title"]}`} />
            </div>
            <div className={`${styles["rag-skeleton"]} ${styles["rag-skeleton--text"]}`} />
            <div
                className={`${styles["rag-skeleton"]} ${styles["rag-skeleton--text"]}`}
                style={{ width: "60%", marginTop: "8px" }}
            />
        </div>
    )
}

export default RAGChunkCard
