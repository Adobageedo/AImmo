"use client"

import React from "react"
import styles from "@/styles/chat.module.css"

/**
 * Chat Canvas - Markdown + Tables Display
 * Phase 5: Chat MVP
 */

interface TableData {
    headers: string[]
    rows: (string | number)[][]
}

interface ChatCanvasProps {
    title?: string
    markdown?: string
    tables?: TableData[]
    onExportExcel?: () => void
    onExportPDF?: () => void
    onCopy?: () => void
    className?: string
}

export function ChatCanvas({
    title = "Canvas",
    markdown,
    tables = [],
    onExportExcel,
    onExportPDF,
    onCopy,
    className = "",
}: ChatCanvasProps) {
    // Simple markdown to HTML conversion
    const renderMarkdown = (md: string): string => {
        return md
            // Headers
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^# (.*$)/gm, "<h1>$1</h1>")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Code
            .replace(/`(.*?)`/g, "<code>$1</code>")
            // Line breaks
            .replace(/\n/g, "<br>")
    }

    return (
        <div className={`${styles["chat__canvas"]} ${className}`}>
            {/* Header */}
            <div className={styles["chat__canvas-header"]}>
                <span className={styles["chat__canvas-title"]}>{title}</span>
                <div className={styles["chat__canvas-actions"]}>
                    {onCopy && (
                        <button
                            type="button"
                            onClick={onCopy}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid var(--chat-border)",
                                background: "transparent",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                            }}
                        >
                            📋 Copier
                        </button>
                    )}
                    {onExportExcel && (
                        <button
                            type="button"
                            onClick={onExportExcel}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid var(--chat-border)",
                                background: "transparent",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                            }}
                        >
                            📊 Excel
                        </button>
                    )}
                    {onExportPDF && (
                        <button
                            type="button"
                            onClick={onExportPDF}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid var(--chat-border)",
                                background: "transparent",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                            }}
                        >
                            📄 PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={styles["chat__canvas-content"]}>
                {/* Markdown Content */}
                {markdown && (
                    <div
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
                        style={{ marginBottom: tables.length > 0 ? "24px" : 0 }}
                    />
                )}

                {/* Tables */}
                {tables.map((table, index) => (
                    <table key={index} className={styles["chat__canvas-table"]}>
                        <thead>
                            <tr>
                                {table.headers.map((header, i) => (
                                    <th key={i}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ))}
            </div>
        </div>
    )
}

/**
 * Citation Panel - Affiche les détails d'une citation
 */

interface CitationPanelProps {
    documentTitle: string
    content: string
    pageNumber?: number
    score: number
    onViewDocument?: () => void
    onClose: () => void
}

export function CitationPanel({
    documentTitle,
    content,
    pageNumber,
    score,
    onViewDocument,
    onClose,
}: CitationPanelProps) {
    return (
        <div
            style={{
                position: "fixed",
                right: 0,
                top: 0,
                bottom: 0,
                width: "400px",
                background: "var(--chat-bg)",
                borderLeft: "1px solid var(--chat-border)",
                boxShadow: "var(--chat-shadow-lg)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--chat-border)",
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                        📄 {documentTitle}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--chat-muted)", marginTop: "4px" }}>
                        {pageNumber && `Page ${pageNumber} • `}
                        Pertinence: {Math.round(score * 100)}%
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        padding: "8px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "1.25rem",
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    padding: "20px",
                    overflow: "auto",
                    fontSize: "0.875rem",
                    lineHeight: 1.7,
                }}
            >
                {content}
            </div>

            {/* Footer */}
            {onViewDocument && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderTop: "1px solid var(--chat-border)",
                    }}
                >
                    <button
                        type="button"
                        onClick={onViewDocument}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--chat-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Voir le document complet →
                    </button>
                </div>
            )}
        </div>
    )
}

export default ChatCanvas
