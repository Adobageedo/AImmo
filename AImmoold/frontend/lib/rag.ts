import { SourceType } from "./types/document"
import {
    Chunk,
    ChunkStatus,
    ChunkingConfig,
    ChunkingMethod,
    ChunkMetadata,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    DocumentIndexStatus,
    IndexStatus,
    RAGStats,
    EmbeddingModel,
} from "./types/rag"
import { createClient } from "./supabase/client"

/**
 * RAG Library - Phase 4 Foundation
 * Fonctions de chunking, vectorisation, indexation et recherche
 */

// ============================================
// CONFIGURATION PAR DÉFAUT
// ============================================

export const DEFAULT_CHUNKING_CONFIGS: Record<SourceType, ChunkingConfig> = {
    [SourceType.DOCUMENTS]: {
        source_type: SourceType.DOCUMENTS,
        chunk_size: 512,
        chunk_overlap: 50,
        chunking_method: ChunkingMethod.RECURSIVE,
        separators: ["\n\n", "\n", ". ", " "],
    },
    [SourceType.LEASES]: {
        source_type: SourceType.LEASES,
        chunk_size: 768,
        chunk_overlap: 100,
        chunking_method: ChunkingMethod.SEMANTIC,
        separators: ["\n\nArticle", "\n\nChapitre", "\n\n", "\n"],
    },
    [SourceType.PROPERTIES]: {
        source_type: SourceType.PROPERTIES,
        chunk_size: 256,
        chunk_overlap: 25,
        chunking_method: ChunkingMethod.PARAGRAPH,
    },
    [SourceType.TENANTS]: {
        source_type: SourceType.TENANTS,
        chunk_size: 256,
        chunk_overlap: 25,
        chunking_method: ChunkingMethod.PARAGRAPH,
    },
    [SourceType.OWNERS]: {
        source_type: SourceType.OWNERS,
        chunk_size: 256,
        chunk_overlap: 25,
        chunking_method: ChunkingMethod.PARAGRAPH,
    },
    [SourceType.KPI]: {
        source_type: SourceType.KPI,
        chunk_size: 128,
        chunk_overlap: 0,
        chunking_method: ChunkingMethod.FIXED_SIZE,
    },
}

// ============================================
// FONCTIONS DE CHUNKING
// ============================================

/**
 * Découpe un texte en chunks selon la configuration
 */
export function chunkText(
    text: string,
    config: ChunkingConfig
): { content: string; startOffset: number; endOffset: number }[] {
    switch (config.chunking_method) {
        case ChunkingMethod.FIXED_SIZE:
            return chunkByFixedSize(text, config.chunk_size, config.chunk_overlap)
        case ChunkingMethod.PARAGRAPH:
            return chunkByParagraph(text, config.chunk_size, config.chunk_overlap)
        case ChunkingMethod.SENTENCE:
            return chunkBySentence(text, config.chunk_size, config.chunk_overlap)
        case ChunkingMethod.SEMANTIC:
            return chunkBySemantic(text, config.chunk_size, config.chunk_overlap, config.separators)
        case ChunkingMethod.RECURSIVE:
        default:
            return chunkRecursive(text, config.chunk_size, config.chunk_overlap, config.separators)
    }
}

/**
 * Chunking par taille fixe (caractères)
 */
function chunkByFixedSize(
    text: string,
    chunkSize: number,
    overlap: number
): { content: string; startOffset: number; endOffset: number }[] {
    const chunks: { content: string; startOffset: number; endOffset: number }[] = []
    const step = chunkSize - overlap

    for (let i = 0; i < text.length; i += step) {
        const end = Math.min(i + chunkSize, text.length)
        chunks.push({
            content: text.slice(i, end).trim(),
            startOffset: i,
            endOffset: end,
        })
        if (end >= text.length) break
    }

    return chunks.filter((c) => c.content.length > 0)
}

/**
 * Chunking par paragraphes
 */
function chunkByParagraph(
    text: string,
    maxChunkSize: number,
    overlap: number
): { content: string; startOffset: number; endOffset: number }[] {
    const paragraphs = text.split(/\n\n+/)
    const chunks: { content: string; startOffset: number; endOffset: number }[] = []

    let currentChunk = ""
    let startOffset = 0
    let currentOffset = 0

    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim()
        if (!trimmedParagraph) {
            currentOffset += paragraph.length + 2 // +2 for \n\n
            continue
        }

        if ((currentChunk + "\n\n" + trimmedParagraph).length > maxChunkSize && currentChunk) {
            chunks.push({
                content: currentChunk.trim(),
                startOffset,
                endOffset: currentOffset,
            })
            // Overlap: keep last part of previous chunk
            const overlapText = currentChunk.slice(-overlap)
            currentChunk = overlapText + "\n\n" + trimmedParagraph
            startOffset = currentOffset - overlap
        } else {
            currentChunk = currentChunk ? currentChunk + "\n\n" + trimmedParagraph : trimmedParagraph
        }
        currentOffset += paragraph.length + 2
    }

    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            startOffset,
            endOffset: text.length,
        })
    }

    return chunks
}

/**
 * Chunking par phrases
 */
function chunkBySentence(
    text: string,
    maxChunkSize: number,
    overlap: number
): { content: string; startOffset: number; endOffset: number }[] {
    // Regex pour détecter fin de phrase (., !, ?) suivi d'espace ou fin
    const sentenceRegex = /[^.!?]*[.!?]+\s*/g
    const sentences: { text: string; start: number; end: number }[] = []

    let match
    while ((match = sentenceRegex.exec(text)) !== null) {
        sentences.push({
            text: match[0],
            start: match.index,
            end: match.index + match[0].length,
        })
    }

    // Handle remaining text without punctuation
    const lastEnd = sentences.length > 0 ? sentences[sentences.length - 1].end : 0
    if (lastEnd < text.length) {
        const remaining = text.slice(lastEnd)
        if (remaining.trim()) {
            sentences.push({
                text: remaining,
                start: lastEnd,
                end: text.length,
            })
        }
    }

    const chunks: { content: string; startOffset: number; endOffset: number }[] = []
    let currentChunk = ""
    let startOffset = 0

    for (const sentence of sentences) {
        if ((currentChunk + sentence.text).length > maxChunkSize && currentChunk) {
            chunks.push({
                content: currentChunk.trim(),
                startOffset,
                endOffset: sentence.start,
            })
            // Overlap
            const overlapText = currentChunk.slice(-overlap)
            currentChunk = overlapText + sentence.text
            startOffset = sentence.start - overlap
        } else {
            if (!currentChunk) startOffset = sentence.start
            currentChunk += sentence.text
        }
    }

    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            startOffset,
            endOffset: text.length,
        })
    }

    return chunks
}

/**
 * Chunking sémantique (détecte les titres/sections)
 */
function chunkBySemantic(
    text: string,
    maxChunkSize: number,
    overlap: number,
    separators?: string[]
): { content: string; startOffset: number; endOffset: number }[] {
    // Patterns pour détecter les titres/sections
    const sectionPatterns = [
        /^#{1,6}\s+.+$/gm, // Markdown headers
        /^Article\s+\d+/gim, // Articles juridiques
        /^Chapitre\s+\d+/gim, // Chapitres
        /^Section\s+\d+/gim, // Sections
        /^[A-Z][A-Z\s]{2,}$/gm, // All caps headers
    ]

    // Trouver tous les points de séparation
    const splitPoints: number[] = [0]

    for (const pattern of sectionPatterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
            if (!splitPoints.includes(match.index)) {
                splitPoints.push(match.index)
            }
        }
    }

    // Ajouter les séparateurs personnalisés
    if (separators) {
        for (const sep of separators) {
            let idx = text.indexOf(sep)
            while (idx !== -1) {
                if (!splitPoints.includes(idx)) {
                    splitPoints.push(idx)
                }
                idx = text.indexOf(sep, idx + 1)
            }
        }
    }

    splitPoints.sort((a, b) => a - b)
    splitPoints.push(text.length)

    // Créer les chunks à partir des points de séparation
    const chunks: { content: string; startOffset: number; endOffset: number }[] = []
    let currentChunk = ""
    let startOffset = 0

    for (let i = 0; i < splitPoints.length - 1; i++) {
        const section = text.slice(splitPoints[i], splitPoints[i + 1])

        if ((currentChunk + section).length > maxChunkSize && currentChunk) {
            chunks.push({
                content: currentChunk.trim(),
                startOffset,
                endOffset: splitPoints[i],
            })
            const overlapText = currentChunk.slice(-overlap)
            currentChunk = overlapText + section
            startOffset = splitPoints[i] - overlap
        } else {
            if (!currentChunk) startOffset = splitPoints[i]
            currentChunk += section
        }
    }

    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            startOffset,
            endOffset: text.length,
        })
    }

    return chunks
}

/**
 * Chunking récursif (essaie différents séparateurs)
 */
function chunkRecursive(
    text: string,
    maxChunkSize: number,
    overlap: number,
    separators?: string[]
): { content: string; startOffset: number; endOffset: number }[] {
    const defaultSeparators = separators || ["\n\n", "\n", ". ", ", ", " "]

    function splitRecursive(
        txt: string,
        seps: string[],
        offset: number
    ): { content: string; startOffset: number; endOffset: number }[] {
        if (txt.length <= maxChunkSize) {
            return [{ content: txt.trim(), startOffset: offset, endOffset: offset + txt.length }]
        }

        if (seps.length === 0) {
            // Fallback to fixed size
            return chunkByFixedSize(txt, maxChunkSize, overlap).map((c) => ({
                ...c,
                startOffset: c.startOffset + offset,
                endOffset: c.endOffset + offset,
            }))
        }

        const sep = seps[0]
        const parts = txt.split(sep)
        const chunks: { content: string; startOffset: number; endOffset: number }[] = []
        let currentChunk = ""
        let currentOffset = offset

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const testChunk = currentChunk ? currentChunk + sep + part : part

            if (testChunk.length > maxChunkSize) {
                if (currentChunk) {
                    // This chunk is ready
                    if (currentChunk.length <= maxChunkSize) {
                        chunks.push({
                            content: currentChunk.trim(),
                            startOffset: currentOffset,
                            endOffset: currentOffset + currentChunk.length,
                        })
                    } else {
                        // Need to split further
                        chunks.push(...splitRecursive(currentChunk, seps.slice(1), currentOffset))
                    }
                    currentOffset += currentChunk.length + sep.length
                }
                currentChunk = part
            } else {
                currentChunk = testChunk
            }
        }

        if (currentChunk.trim()) {
            if (currentChunk.length <= maxChunkSize) {
                chunks.push({
                    content: currentChunk.trim(),
                    startOffset: currentOffset,
                    endOffset: offset + txt.length,
                })
            } else {
                chunks.push(...splitRecursive(currentChunk, seps.slice(1), currentOffset))
            }
        }

        return chunks
    }

    return splitRecursive(text, defaultSeparators, 0).filter((c) => c.content.length > 0)
}

// ============================================
// EXTRACTION DE TAGS SÉMANTIQUES
// ============================================

/**
 * Extrait des tags sémantiques automatiques d'un texte
 */
export function extractSemanticTags(text: string, sourceType: SourceType): string[] {
    const tags: Set<string> = new Set()

    // Tags basés sur le type de source
    tags.add(sourceType)

    // Patterns pour l'immobilier
    const patterns: Record<string, RegExp> = {
        loyer: /loyer|mensualit[ée]|paiement\s+mensuel/gi,
        charges: /charges|provisions?\s+pour\s+charges/gi,
        depot_garantie: /d[ée]p[ôo]t\s+de\s+garantie|caution/gi,
        bail: /bail|contrat\s+de\s+location/gi,
        expiration: /expir|[ée]ch[ée]ance|fin\s+de\s+bail/gi,
        travaux: /travaux|r[ée]novation|r[ée]paration/gi,
        preavis: /pr[ée]avis|cong[ée]/gi,
        indexation: /indexation|r[ée]vision|IRL/gi,
        proprietaire: /propri[ée]taire|bailleur/gi,
        locataire: /locataire|preneur/gi,
        adresse: /adresse|situ[ée]\s+[àa]/gi,
        surface: /surface|m[²2]|m[eè]tres?\s+carr[ée]s/gi,
        diagnostic: /diagnostic|DPE|amiante|plomb/gi,
        assurance: /assurance|garantie|couverture/gi,
        juridique: /tribunal|juridiction|litige/gi,
        financier: /facture|paiement|virement|montant/gi,
    }

    for (const [tag, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            tags.add(tag)
        }
    }

    // Détecter les montants
    if (/\d+[\s,.]?\d*\s*[€$]|\d+\s*euros?/gi.test(text)) {
        tags.add("montant")
    }

    // Détecter les dates
    if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g.test(text)) {
        tags.add("date")
    }

    return Array.from(tags)
}

// ============================================
// GÉNÉRATION DE HASH
// ============================================

/**
 * Génère un hash pour le contenu (pour déduplication)
 */
export async function generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// ============================================
// CRÉATION DE CHUNKS
// ============================================

/**
 * Crée des chunks à partir d'un document
 */
export async function createChunksFromDocument(
    documentId: string,
    content: string,
    metadata: Partial<ChunkMetadata>,
    organizationId: string,
    sourceType: SourceType = SourceType.DOCUMENTS,
    config?: ChunkingConfig
): Promise<Omit<Chunk, "id" | "created_at" | "updated_at">[]> {
    const chunkConfig = config || DEFAULT_CHUNKING_CONFIGS[sourceType]
    const textChunks = chunkText(content, chunkConfig)

    const chunks: Omit<Chunk, "id" | "created_at" | "updated_at">[] = []

    for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i]
        const contentHash = await generateContentHash(chunk.content)
        const semanticTags = extractSemanticTags(chunk.content, sourceType)

        chunks.push({
            document_id: documentId,
            organization_id: organizationId,
            content: chunk.content,
            content_hash: contentHash,
            chunk_index: i,
            total_chunks: textChunks.length,
            start_offset: chunk.startOffset,
            end_offset: chunk.endOffset,
            source_type: sourceType,
            source_id: documentId,
            semantic_tags: semanticTags,
            status: ChunkStatus.PENDING,
            is_excluded: false,
            metadata: {
                source_title: metadata.source_title || "",
                document_type: metadata.document_type,
                page_number: metadata.page_number,
                section_heading: metadata.section_heading,
                language: metadata.language || "fr",
                quality_score: calculateQualityScore(chunk.content),
                context: metadata.context,
            },
        })
    }

    return chunks
}

/**
 * Calcule un score de qualité pour un chunk
 */
function calculateQualityScore(content: string): number {
    let score = 100

    // Pénalités
    if (content.length < 50) score -= 20 // Trop court
    if (content.length > 2000) score -= 10 // Trop long
    if (/[^\x00-\x7F]/.test(content) === false && content.length > 100) score += 5 // ASCII clean
    if (/\s{3,}/.test(content)) score -= 15 // Trop d'espaces
    if (/(.)\1{4,}/.test(content)) score -= 20 // Caractères répétés
    if (content.split(/\s+/).length < 5) score -= 15 // Peu de mots
    if (/[a-zA-Z]/.test(content) === false) score -= 30 // Pas de lettres

    // Bonus
    if (/[.!?]$/.test(content.trim())) score += 5 // Termine par ponctuation
    if (content.split(/[.!?]/).length > 2) score += 5 // Plusieurs phrases

    return Math.max(0, Math.min(100, score))
}

// ============================================
// VECTORISATION (Placeholder - à implémenter avec OpenAI/autre)
// ============================================

/**
 * Vectorise un texte (placeholder - à connecter avec API)
 */
export async function vectorizeText(
    text: string,
    model: EmbeddingModel = EmbeddingModel.OPENAI_3_SMALL
): Promise<number[]> {
    // TODO: Implémenter avec OpenAI API ou autre provider
    // Pour l'instant, retourne un vecteur placeholder
    console.warn("vectorizeText: Using placeholder implementation")

    // Simulation d'un embedding (à remplacer par appel API réel)
    const hash = await generateContentHash(text)
    const embedding: number[] = []
    for (let i = 0; i < 1536; i++) {
        // 1536 dimensions pour OpenAI
        embedding.push(
            Math.sin(parseInt(hash.slice(i % 64, (i % 64) + 2), 16) + i) * 0.5,
        )
    }
    return embedding
}

/**
 * Vectorise plusieurs textes en batch
 */
export async function vectorizeBatch(
    texts: string[],
    model: EmbeddingModel = EmbeddingModel.OPENAI_3_SMALL
): Promise<number[][]> {
    // TODO: Implémenter avec OpenAI API batch
    const embeddings = await Promise.all(texts.map((t) => vectorizeText(t, model)))
    return embeddings
}

// ============================================
// INDEXATION
// ============================================

/**
 * Indexe les chunks d'un document dans la base de données
 */
export async function indexDocument(
    documentId: string,
    content: string,
    metadata: Partial<ChunkMetadata>,
    organizationId: string,
    sourceType: SourceType = SourceType.DOCUMENTS
): Promise<DocumentIndexStatus> {
    const supabase = createClient()

    try {
        // Créer les chunks
        const chunks = await createChunksFromDocument(
            documentId,
            content,
            metadata,
            organizationId,
            sourceType
        )

        // Vectoriser les chunks
        const embeddings = await vectorizeBatch(chunks.map((c) => c.content))

        // Ajouter les embeddings aux chunks
        const chunksWithEmbeddings = chunks.map((chunk, i) => ({
            ...chunk,
            embedding: embeddings[i],
            embedding_model: EmbeddingModel.OPENAI_3_SMALL,
            status: ChunkStatus.INDEXED,
        }))

        // Supprimer les anciens chunks de ce document
        await supabase.from("chunks").delete().eq("document_id", documentId)

        // Insérer les nouveaux chunks
        const { error } = await supabase.from("chunks").insert(chunksWithEmbeddings)

        if (error) throw error

        return {
            document_id: documentId,
            status: IndexStatus.INDEXED,
            chunks_count: chunks.length,
            chunks_indexed: chunks.length,
            last_indexed_at: new Date().toISOString(),
        }
    } catch (error) {
        console.error("Error indexing document:", error)
        return {
            document_id: documentId,
            status: IndexStatus.FAILED,
            chunks_count: 0,
            chunks_indexed: 0,
            error_message: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Met à jour le statut d'exclusion d'un document
 */
export async function setDocumentExclusion(
    documentId: string,
    excluded: boolean
): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from("chunks")
        .update({
            is_excluded: excluded,
            status: excluded ? ChunkStatus.EXCLUDED : ChunkStatus.INDEXED,
        })
        .eq("document_id", documentId)

    if (error) throw error
}

// ============================================
// RECHERCHE
// ============================================

/**
 * Recherche des chunks pertinents
 */
export async function searchChunks(
    request: RAGSearchRequest
): Promise<RAGSearchResponse> {
    const startTime = Date.now()
    const supabase = createClient()

    try {
        // Vectoriser la requête
        const queryEmbedding = await vectorizeText(request.query)

        // Construire la requête
        let query = supabase
            .from("chunks")
            .select("*")
            .eq("organization_id", request.organization_id)
            .eq("is_excluded", false)
            .eq("status", ChunkStatus.INDEXED)

        // Filtres par source
        if (request.source_types && request.source_types.length > 0) {
            query = query.in("source_type", request.source_types)
        }

        // Filtres par document
        if (request.document_ids && request.document_ids.length > 0) {
            query = query.in("document_id", request.document_ids)
        }

        // Filtres par bail
        if (request.lease_ids && request.lease_ids.length > 0) {
            query = query.in("lease_id", request.lease_ids)
        }

        // Filtres par propriété
        if (request.property_ids && request.property_ids.length > 0) {
            query = query.in("property_id", request.property_ids)
        }

        // Filtres par tags
        if (request.tags && request.tags.length > 0) {
            query = query.overlaps("semantic_tags", request.tags)
        }

        const { data: chunks, error } = await query

        if (error) throw error

        // Calculer les scores de similarité (cosine similarity)
        const results: RAGSearchResult[] = (chunks || [])
            .map((chunk: Chunk) => {
                const score = chunk.embedding
                    ? cosineSimilarity(queryEmbedding, chunk.embedding)
                    : 0
                return {
                    chunk,
                    score,
                    highlights: extractHighlights(chunk.content, request.query),
                }
            })
            .filter((r) => r.score >= (request.min_score || 0.5))
            .sort((a, b) => b.score - a.score)
            .slice(0, request.limit || 10)

        // Identifier les sources utilisées
        const sourcesIncluded = [...new Set(results.map((r) => r.chunk.source_type))]

        return {
            results,
            total_chunks_searched: chunks?.length || 0,
            query_embedding: queryEmbedding,
            processing_time_ms: Date.now() - startTime,
            sources_included: sourcesIncluded,
        }
    } catch (error) {
        console.error("Error searching chunks:", error)
        return {
            results: [],
            total_chunks_searched: 0,
            processing_time_ms: Date.now() - startTime,
            sources_included: [],
        }
    }
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * Extrait les highlights du contenu correspondant à la requête
 */
function extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = []
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)

    // Diviser en phrases
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase()
        const matchCount = queryWords.filter((w) => lowerSentence.includes(w)).length

        if (matchCount > 0) {
            highlights.push(sentence.trim())
        }
    }

    return highlights.slice(0, 3) // Max 3 highlights
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupère les statistiques RAG pour une organisation
 */
export async function getRAGStats(organizationId: string): Promise<RAGStats | null> {
    const supabase = createClient()

    try {
        // Compter les chunks par source
        const { data: chunks, error } = await supabase
            .from("chunks")
            .select("source_type, is_excluded")
            .eq("organization_id", organizationId)

        if (error) throw error

        const chunksBySource: Record<SourceType, number> = {
            [SourceType.DOCUMENTS]: 0,
            [SourceType.LEASES]: 0,
            [SourceType.PROPERTIES]: 0,
            [SourceType.TENANTS]: 0,
            [SourceType.OWNERS]: 0,
            [SourceType.KPI]: 0,
        }

        let excludedCount = 0

        for (const chunk of chunks || []) {
            if (chunk.source_type in chunksBySource) {
                chunksBySource[chunk.source_type as SourceType]++
            }
            if (chunk.is_excluded) excludedCount++
        }

        // Compter les documents uniques
        const { data: uniqueDocs } = await supabase
            .from("chunks")
            .select("document_id")
            .eq("organization_id", organizationId)

        const uniqueDocIds = new Set((uniqueDocs || []).map((d) => d.document_id))

        return {
            organization_id: organizationId,
            total_chunks: chunks?.length || 0,
            chunks_by_source: chunksBySource,
            documents_indexed: uniqueDocIds.size,
            documents_excluded: excludedCount,
            last_index_update: new Date().toISOString(),
            storage_used_bytes: 0, // TODO: calculer
        }
    } catch (error) {
        console.error("Error getting RAG stats:", error)
        return null
    }
}
