"""
RAG Service - Phase 4 Foundation
Chunking, vectorisation, indexation et recherche avec Qdrant + OpenAI
"""

import hashlib
import re
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
)

from app.core.config import settings
from app.schemas.rag import (
    SourceType,
    ChunkStatus,
    ChunkingMethod,
    ChunkingConfig,
    ChunkMetadata,
    Chunk,
    ChunkCreate,
    IndexDocumentRequest,
    IndexDocumentResponse,
    IndexStatus,
    RAGSearchRequest,
    RAGSearchResult,
    RAGSearchResponse,
    RAGStats,
    EmbeddingModel,
)


# ============================================
# Clients
# ============================================

def get_openai_client() -> OpenAI:
    """Obtenir le client OpenAI"""
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def get_qdrant_client() -> QdrantClient:
    """Obtenir le client Qdrant"""
    if settings.QDRANT_API_KEY:
        return QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
    return QdrantClient(url=settings.QDRANT_URL)


# Collection name
COLLECTION_NAME = "aimmo_chunks"
EMBEDDING_DIMENSION = 1536  # OpenAI text-embedding-3-small


# ============================================
# Configuration par défaut
# ============================================

DEFAULT_CHUNKING_CONFIGS: Dict[SourceType, ChunkingConfig] = {
    SourceType.DOCUMENT: ChunkingConfig(
        source_type=SourceType.DOCUMENT,
        chunk_size=512,
        chunk_overlap=50,
        chunking_method=ChunkingMethod.RECURSIVE,
        separators=["\n\n", "\n", ". ", " "],
    ),
    SourceType.LEASE: ChunkingConfig(
        source_type=SourceType.LEASE,
        chunk_size=768,
        chunk_overlap=100,
        chunking_method=ChunkingMethod.SEMANTIC,
        separators=["\n\nArticle", "\n\nChapitre", "\n\n", "\n"],
    ),
    SourceType.PROPERTY: ChunkingConfig(
        source_type=SourceType.PROPERTY,
        chunk_size=256,
        chunk_overlap=25,
        chunking_method=ChunkingMethod.PARAGRAPH,
    ),
    SourceType.TENANT: ChunkingConfig(
        source_type=SourceType.TENANT,
        chunk_size=256,
        chunk_overlap=25,
        chunking_method=ChunkingMethod.PARAGRAPH,
    ),
    SourceType.KPI: ChunkingConfig(
        source_type=SourceType.KPI,
        chunk_size=128,
        chunk_overlap=0,
        chunking_method=ChunkingMethod.FIXED_SIZE,
    ),
    SourceType.CONVERSATION: ChunkingConfig(
        source_type=SourceType.CONVERSATION,
        chunk_size=1024,
        chunk_overlap=200,
        chunking_method=ChunkingMethod.SENTENCE,
    ),
}


# ============================================
# Initialisation Qdrant
# ============================================

async def ensure_collection_exists():
    """S'assurer que la collection Qdrant existe"""
    client = get_qdrant_client()
    
    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]
    
    if COLLECTION_NAME not in collection_names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )
        print(f"Collection '{COLLECTION_NAME}' créée")


# ============================================
# Fonctions de Chunking
# ============================================

def chunk_text(
    text: str,
    config: ChunkingConfig
) -> List[Dict[str, Any]]:
    """
    Découpe un texte en chunks selon la configuration
    """
    method = config.chunking_method
    
    if method == ChunkingMethod.FIXED_SIZE:
        return _chunk_by_fixed_size(text, config.chunk_size, config.chunk_overlap)
    elif method == ChunkingMethod.PARAGRAPH:
        return _chunk_by_paragraph(text, config.chunk_size, config.chunk_overlap)
    elif method == ChunkingMethod.SENTENCE:
        return _chunk_by_sentence(text, config.chunk_size, config.chunk_overlap)
    elif method == ChunkingMethod.SEMANTIC:
        return _chunk_by_semantic(text, config.chunk_size, config.chunk_overlap, config.separators)
    else:  # RECURSIVE
        return _chunk_recursive(text, config.chunk_size, config.chunk_overlap, config.separators)


def _chunk_by_fixed_size(
    text: str,
    chunk_size: int,
    overlap: int
) -> List[Dict[str, Any]]:
    """Chunking par taille fixe"""
    chunks = []
    step = chunk_size - overlap
    
    for i in range(0, len(text), step):
        end = min(i + chunk_size, len(text))
        content = text[i:end].strip()
        if content:
            chunks.append({
                "content": content,
                "start_offset": i,
                "end_offset": end,
            })
        if end >= len(text):
            break
    
    return chunks


def _chunk_by_paragraph(
    text: str,
    max_chunk_size: int,
    overlap: int
) -> List[Dict[str, Any]]:
    """Chunking par paragraphes"""
    paragraphs = text.split("\n\n")
    chunks = []
    
    current_chunk = ""
    start_offset = 0
    current_offset = 0
    
    for paragraph in paragraphs:
        trimmed = paragraph.strip()
        if not trimmed:
            current_offset += len(paragraph) + 2
            continue
        
        if (len(current_chunk) + len(trimmed) + 2) > max_chunk_size and current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "start_offset": start_offset,
                "end_offset": current_offset,
            })
            # Overlap
            overlap_text = current_chunk[-overlap:] if overlap else ""
            current_chunk = overlap_text + "\n\n" + trimmed
            start_offset = current_offset - len(overlap_text)
        else:
            current_chunk = f"{current_chunk}\n\n{trimmed}" if current_chunk else trimmed
        
        current_offset += len(paragraph) + 2
    
    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "start_offset": start_offset,
            "end_offset": len(text),
        })
    
    return chunks


def _chunk_by_sentence(
    text: str,
    max_chunk_size: int,
    overlap: int
) -> List[Dict[str, Any]]:
    """Chunking par phrases"""
    # Regex pour détecter fin de phrase
    sentence_pattern = re.compile(r'[^.!?]*[.!?]+\s*')
    sentences = []
    
    for match in sentence_pattern.finditer(text):
        sentences.append({
            "text": match.group(),
            "start": match.start(),
            "end": match.end(),
        })
    
    # Handle remaining text
    if sentences:
        last_end = sentences[-1]["end"]
        if last_end < len(text):
            remaining = text[last_end:]
            if remaining.strip():
                sentences.append({
                    "text": remaining,
                    "start": last_end,
                    "end": len(text),
                })
    
    chunks = []
    current_chunk = ""
    start_offset = 0
    
    for sentence in sentences:
        if (len(current_chunk) + len(sentence["text"])) > max_chunk_size and current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "start_offset": start_offset,
                "end_offset": sentence["start"],
            })
            overlap_text = current_chunk[-overlap:] if overlap else ""
            current_chunk = overlap_text + sentence["text"]
            start_offset = sentence["start"] - len(overlap_text)
        else:
            if not current_chunk:
                start_offset = sentence["start"]
            current_chunk += sentence["text"]
    
    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "start_offset": start_offset,
            "end_offset": len(text),
        })
    
    return chunks


def _chunk_by_semantic(
    text: str,
    max_chunk_size: int,
    overlap: int,
    separators: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Chunking sémantique (détecte les titres/sections)"""
    # Patterns pour détecter les titres
    section_patterns = [
        r'^#{1,6}\s+.+$',  # Markdown headers
        r'^Article\s+\d+',  # Articles juridiques
        r'^Chapitre\s+\d+',  # Chapitres
        r'^Section\s+\d+',  # Sections
    ]
    
    split_points = [0]
    
    for pattern in section_patterns:
        for match in re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE):
            if match.start() not in split_points:
                split_points.append(match.start())
    
    # Ajouter les séparateurs personnalisés
    if separators:
        for sep in separators:
            idx = text.find(sep)
            while idx != -1:
                if idx not in split_points:
                    split_points.append(idx)
                idx = text.find(sep, idx + 1)
    
    split_points.sort()
    split_points.append(len(text))
    
    # Créer les chunks
    chunks = []
    current_chunk = ""
    start_offset = 0
    
    for i in range(len(split_points) - 1):
        section = text[split_points[i]:split_points[i + 1]]
        
        if (len(current_chunk) + len(section)) > max_chunk_size and current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "start_offset": start_offset,
                "end_offset": split_points[i],
            })
            overlap_text = current_chunk[-overlap:] if overlap else ""
            current_chunk = overlap_text + section
            start_offset = split_points[i] - len(overlap_text)
        else:
            if not current_chunk:
                start_offset = split_points[i]
            current_chunk += section
    
    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "start_offset": start_offset,
            "end_offset": len(text),
        })
    
    return chunks


def _chunk_recursive(
    text: str,
    max_chunk_size: int,
    overlap: int,
    separators: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Chunking récursif"""
    default_separators = separators or ["\n\n", "\n", ". ", ", ", " "]
    
    def split_recursive(txt: str, seps: List[str], offset: int) -> List[Dict[str, Any]]:
        if len(txt) <= max_chunk_size:
            return [{"content": txt.strip(), "start_offset": offset, "end_offset": offset + len(txt)}]
        
        if not seps:
            return _chunk_by_fixed_size(txt, max_chunk_size, overlap)
        
        sep = seps[0]
        parts = txt.split(sep)
        chunks = []
        current_chunk = ""
        current_offset = offset
        
        for i, part in enumerate(parts):
            test_chunk = f"{current_chunk}{sep}{part}" if current_chunk else part
            
            if len(test_chunk) > max_chunk_size:
                if current_chunk:
                    if len(current_chunk) <= max_chunk_size:
                        chunks.append({
                            "content": current_chunk.strip(),
                            "start_offset": current_offset,
                            "end_offset": current_offset + len(current_chunk),
                        })
                    else:
                        chunks.extend(split_recursive(current_chunk, seps[1:], current_offset))
                    current_offset += len(current_chunk) + len(sep)
                current_chunk = part
            else:
                current_chunk = test_chunk
        
        if current_chunk.strip():
            if len(current_chunk) <= max_chunk_size:
                chunks.append({
                    "content": current_chunk.strip(),
                    "start_offset": current_offset,
                    "end_offset": offset + len(txt),
                })
            else:
                chunks.extend(split_recursive(current_chunk, seps[1:], current_offset))
        
        return chunks
    
    return [c for c in split_recursive(text, default_separators, 0) if c["content"]]


# ============================================
# Extraction de Tags Sémantiques
# ============================================

def extract_semantic_tags(text: str, source_type: SourceType) -> List[str]:
    """Extrait des tags sémantiques automatiques"""
    tags = {source_type.value}
    
    # Patterns pour l'immobilier
    patterns = {
        "loyer": r"loyer|mensualit[ée]|paiement\s+mensuel",
        "charges": r"charges|provisions?\s+pour\s+charges",
        "depot_garantie": r"d[ée]p[ôo]t\s+de\s+garantie|caution",
        "bail": r"bail|contrat\s+de\s+location",
        "expiration": r"expir|[ée]ch[ée]ance|fin\s+de\s+bail",
        "travaux": r"travaux|r[ée]novation|r[ée]paration",
        "preavis": r"pr[ée]avis|cong[ée]",
        "indexation": r"indexation|r[ée]vision|IRL",
        "proprietaire": r"propri[ée]taire|bailleur",
        "locataire": r"locataire|preneur",
        "surface": r"surface|m[²2]|m[eè]tres?\s+carr[ée]s",
        "diagnostic": r"diagnostic|DPE|amiante|plomb",
        "assurance": r"assurance|garantie|couverture",
        "financier": r"facture|paiement|virement|montant",
    }
    
    for tag, pattern in patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            tags.add(tag)
    
    # Détecter les montants
    if re.search(r"\d+[\s,.]?\d*\s*[€$]|\d+\s*euros?", text, re.IGNORECASE):
        tags.add("montant")
    
    # Détecter les dates
    if re.search(r"\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}", text):
        tags.add("date")
    
    return list(tags)


# ============================================
# Génération de Hash
# ============================================

def generate_content_hash(content: str) -> str:
    """Génère un hash SHA-256 pour le contenu"""
    return hashlib.sha256(content.encode()).hexdigest()


# ============================================
# Vectorisation
# ============================================

async def vectorize_text(
    text: str,
    model: str = "text-embedding-3-small"
) -> List[float]:
    """Vectorise un texte avec OpenAI"""
    client = get_openai_client()
    
    response = client.embeddings.create(
        input=text,
        model=model,
    )
    
    return response.data[0].embedding


async def vectorize_batch(
    texts: List[str],
    model: str = "text-embedding-3-small"
) -> List[List[float]]:
    """Vectorise plusieurs textes en batch"""
    client = get_openai_client()
    
    # OpenAI accepte jusqu'à 2048 textes par batch
    embeddings = []
    batch_size = 100
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = client.embeddings.create(
            input=batch,
            model=model,
        )
        embeddings.extend([d.embedding for d in response.data])
    
    return embeddings


# ============================================
# Indexation
# ============================================

async def index_document(
    request: IndexDocumentRequest,
    supabase_client: Any,
) -> IndexDocumentResponse:
    """Indexe un document dans Qdrant"""
    start_time = time.time()
    
    try:
        await ensure_collection_exists()
        
        # Récupérer la config de chunking
        config = request.chunking_config or DEFAULT_CHUNKING_CONFIGS.get(
            request.source_type,
            DEFAULT_CHUNKING_CONFIGS[SourceType.DOCUMENT]
        )
        
        # Découper en chunks
        text_chunks = chunk_text(request.content, config)
        
        if not text_chunks:
            return IndexDocumentResponse(
                document_id=request.document_id,
                status=IndexStatus.FAILED,
                chunks_count=0,
                chunks_indexed=0,
                error_message="No chunks generated from content",
            )
        
        # Préparer les chunks avec métadonnées
        chunks_data = []
        for i, chunk_data in enumerate(text_chunks):
            content_hash = generate_content_hash(chunk_data["content"])
            semantic_tags = extract_semantic_tags(chunk_data["content"], request.source_type)
            
            metadata = request.metadata or ChunkMetadata()
            
            chunks_data.append({
                "id": str(uuid4()),
                "document_id": str(request.document_id),
                "organization_id": None,  # Will be set from document
                "content": chunk_data["content"],
                "content_hash": content_hash,
                "chunk_index": i,
                "total_chunks": len(text_chunks),
                "start_offset": chunk_data["start_offset"],
                "end_offset": chunk_data["end_offset"],
                "source_type": request.source_type.value,
                "source_id": str(request.document_id),
                "semantic_tags": semantic_tags,
                "metadata": metadata.model_dump(),
            })
        
        # Vectoriser tous les chunks
        contents = [c["content"] for c in chunks_data]
        embeddings = await vectorize_batch(contents)
        
        # Ajouter les embeddings
        for i, chunk in enumerate(chunks_data):
            chunk["embedding"] = embeddings[i]
        
        # Récupérer l'organization_id du document depuis Supabase
        doc_response = supabase_client.table("documents").select("organization_id").eq(
            "id", str(request.document_id)
        ).single().execute()
        
        if doc_response.data:
            org_id = doc_response.data["organization_id"]
            for chunk in chunks_data:
                chunk["organization_id"] = org_id
        
        # Insérer dans Qdrant
        qdrant_client = get_qdrant_client()
        
        points = [
            PointStruct(
                id=chunk["id"],
                vector=chunk["embedding"],
                payload={
                    "document_id": chunk["document_id"],
                    "organization_id": chunk["organization_id"],
                    "content": chunk["content"],
                    "content_hash": chunk["content_hash"],
                    "chunk_index": chunk["chunk_index"],
                    "total_chunks": chunk["total_chunks"],
                    "source_type": chunk["source_type"],
                    "source_id": chunk["source_id"],
                    "semantic_tags": chunk["semantic_tags"],
                    "metadata": chunk["metadata"],
                    "is_excluded": False,
                    "created_at": datetime.utcnow().isoformat(),
                },
            )
            for chunk in chunks_data
        ]
        
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )
        
        return IndexDocumentResponse(
            document_id=request.document_id,
            status=IndexStatus.INDEXED,
            chunks_count=len(chunks_data),
            chunks_indexed=len(chunks_data),
            last_indexed_at=datetime.utcnow(),
        )
        
    except Exception as e:
        return IndexDocumentResponse(
            document_id=request.document_id,
            status=IndexStatus.FAILED,
            chunks_count=0,
            chunks_indexed=0,
            error_message=str(e),
        )


async def set_document_exclusion(
    document_id: UUID,
    excluded: bool,
) -> int:
    """Exclut ou inclut un document du RAG"""
    qdrant_client = get_qdrant_client()
    
    # Récupérer tous les chunks du document
    results = qdrant_client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=str(document_id)),
                ),
            ],
        ),
        limit=1000,
    )
    
    points = results[0]
    
    # Mettre à jour le statut d'exclusion
    for point in points:
        qdrant_client.set_payload(
            collection_name=COLLECTION_NAME,
            payload={"is_excluded": excluded},
            points=[point.id],
        )
    
    return len(points)


# ============================================
# Recherche
# ============================================

async def search_chunks(
    request: RAGSearchRequest,
) -> RAGSearchResponse:
    """Recherche des chunks pertinents"""
    start_time = time.time()
    
    try:
        await ensure_collection_exists()
        
        # Vectoriser la requête
        query_embedding = await vectorize_text(request.query)
        
        # Construire les filtres
        must_conditions = [
            FieldCondition(
                key="organization_id",
                match=MatchValue(value=str(request.organization_id)),
            ),
            FieldCondition(
                key="is_excluded",
                match=MatchValue(value=False),
            ),
        ]
        
        # Filtre par source
        if request.source_types:
            must_conditions.append(
                FieldCondition(
                    key="source_type",
                    match=MatchAny(any=[st.value for st in request.source_types]),
                )
            )
        
        # Filtre par document
        if request.document_ids:
            must_conditions.append(
                FieldCondition(
                    key="document_id",
                    match=MatchAny(any=[str(d) for d in request.document_ids]),
                )
            )
        
        # Recherche dans Qdrant
        qdrant_client = get_qdrant_client()
        
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter=Filter(must=must_conditions),
            limit=request.limit,
            score_threshold=request.min_score,
        )
        
        # Formater les résultats
        results = []
        sources_included = set()
        
        for hit in search_results:
            payload = hit.payload
            source_type = SourceType(payload["source_type"])
            sources_included.add(source_type)
            
            # Extraire les highlights
            highlights = _extract_highlights(payload["content"], request.query)
            
            results.append(RAGSearchResult(
                chunk_id=UUID(hit.id),
                document_id=UUID(payload["document_id"]),
                content=payload["content"],
                score=hit.score,
                source_type=source_type,
                metadata=ChunkMetadata(**payload["metadata"]),
                semantic_tags=payload["semantic_tags"],
                highlights=highlights,
            ))
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return RAGSearchResponse(
            results=results,
            total_chunks_searched=len(search_results),
            processing_time_ms=processing_time,
            sources_included=list(sources_included),
        )
        
    except Exception as e:
        print(f"Search error: {e}")
        return RAGSearchResponse(
            results=[],
            total_chunks_searched=0,
            processing_time_ms=0,
            sources_included=[],
        )


def _extract_highlights(content: str, query: str) -> List[str]:
    """Extrait les highlights correspondant à la requête"""
    highlights = []
    query_words = [w for w in query.lower().split() if len(w) > 2]
    
    sentences = re.split(r'[.!?]+', content)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        lower_sentence = sentence.lower()
        match_count = sum(1 for w in query_words if w in lower_sentence)
        
        if match_count > 0:
            highlights.append(sentence)
    
    return highlights[:3]


# ============================================
# Statistiques
# ============================================

async def get_rag_stats(organization_id: UUID) -> RAGStats:
    """Récupère les statistiques RAG"""
    try:
        await ensure_collection_exists()
        qdrant_client = get_qdrant_client()
        
        # Compter les chunks par source
        chunks_by_source = {}
        total_chunks = 0
        documents_indexed = set()
        excluded_count = 0
        
        for source_type in SourceType:
            results = qdrant_client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="organization_id",
                            match=MatchValue(value=str(organization_id)),
                        ),
                        FieldCondition(
                            key="source_type",
                            match=MatchValue(value=source_type.value),
                        ),
                    ],
                ),
                limit=10000,
            )
            
            points = results[0]
            chunks_by_source[source_type] = len(points)
            total_chunks += len(points)
            
            for point in points:
                documents_indexed.add(point.payload.get("document_id"))
                if point.payload.get("is_excluded"):
                    excluded_count += 1
        
        return RAGStats(
            organization_id=organization_id,
            total_chunks=total_chunks,
            chunks_by_source=chunks_by_source,
            documents_indexed=len(documents_indexed),
            documents_excluded=excluded_count,
            last_index_update=datetime.utcnow(),
            storage_used_bytes=0,
        )
        
    except Exception as e:
        print(f"Stats error: {e}")
        return RAGStats(
            organization_id=organization_id,
            total_chunks=0,
            chunks_by_source={st: 0 for st in SourceType},
            documents_indexed=0,
            documents_excluded=0,
        )
