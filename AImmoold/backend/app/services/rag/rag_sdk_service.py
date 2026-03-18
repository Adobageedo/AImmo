"""
RAG SDK Service - Service de recherche documentaire multi-sources
Gestion de la recherche RAG avec RLS et multi-sources
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny

from app.schemas.chat_sdk import SourceType, RAGSearchResult
from app.core.config import settings
from app.services.rag.adapter import adapter_factory


# Clients
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
qdrant_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)


async def search_rag_sources(
    query: str,
    organization_id: str,
    source_types: Optional[List[SourceType]] = None,
    document_ids: Optional[List[str]] = None,
    lease_ids: Optional[List[str]] = None,
    property_ids: Optional[List[str]] = None,
    limit: int = 10,
    supabase=None,
) -> List[RAGSearchResult]:
    """
    Recherche multi-sources avec RLS (Row-Level Security)
    Utilise les adaptateurs pour chaque type de source
    """
    active_source_types = source_types or [SourceType.DOCUMENTS]
    
    filters = {
        "document_ids": document_ids,
        "lease_ids": lease_ids,
        "property_ids": property_ids,
    }
    
    all_results = []
    
    for source_type in active_source_types:
        try:
            adapter = adapter_factory.get_adapter(source_type)
            
            data_items = await adapter.fetch_data(
                organization_id=organization_id,
                query=query,
                filters=filters,
                limit=limit,
                supabase=supabase
            )
            
            for item in data_items:
                formatted_content = adapter.format_for_llm(item)
                
                item_id = item.get('id', f"{source_type.value}-{len(all_results)}")
                title = item.get('name') or item.get('title') or f"{source_type.value.title()} {item_id}"
                
                rag_result = RAGSearchResult(
                    chunk_id=f"chunk-{source_type.value}-{item_id}",
                    document_id=str(item_id),
                    document_title=title,
                    content=formatted_content,
                    source_type=source_type,
                    metadata=item
                )
                
                all_results.append(rag_result)
                
        except Exception as e:
            print(f"Error fetching from {source_type.value}: {e}")
            continue
    
    return all_results[:limit]

async def index_document_chunks(
    document_id: str,
    organization_id: str,
    source_type: SourceType,
    source_id: str,
    document_title: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Indexe un document en chunks dans Qdrant
    """
    # 1. Découper en chunks
    chunks = chunk_text(content, chunk_size=1000, overlap=200)
    
    # 2. Vectoriser tous les chunks
    chunk_embeddings = []
    for chunk in chunks:
        embedding = await vectorize_query(chunk)
        chunk_embeddings.append(embedding)
    
    # 3. Préparer les points Qdrant
    points = []
    for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
        point_id = f"{document_id}_{i}"
        
        payload = {
            "document_id": document_id,
            "organization_id": organization_id,
            "source_type": source_type.value,
            "source_id": source_id,
            "document_title": document_title,
            "content": chunk,
            "chunk_index": i,
            "is_excluded": False,
            **(metadata or {}),
        }
        
        points.append({
            "id": point_id,
            "vector": embedding,
            "payload": payload,
        })
    
    # 4. Insérer dans Qdrant
    qdrant_client.upsert(
        collection_name=settings.QDRANT_COLLECTION,
        points=points,
    )
    
    return len(points)


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> List[str]:
    """
    Découpe un texte en chunks avec overlap
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Trouver la fin de phrase la plus proche
        if end < len(text):
            # Chercher le dernier point, point d'exclamation ou interrogation
            last_sentence_end = max(
                text.rfind(".", start, end),
                text.rfind("!", start, end),
                text.rfind("?", start, end),
            )
            
            if last_sentence_end > start:
                end = last_sentence_end + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Avancer avec overlap
        start = end - overlap
    
    return chunks


async def delete_document_chunks(
    document_id: str,
) -> int:
    """
    Supprime tous les chunks d'un document
    """
    # Rechercher tous les points du document
    search_result = qdrant_client.scroll(
        collection_name=settings.QDRANT_COLLECTION,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        ),
        limit=1000,
    )
    
    point_ids = [point.id for point in search_result[0]]
    
    if point_ids:
        qdrant_client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=point_ids,
        )
    
    return len(point_ids)


async def set_document_exclusion(
    document_id: str,
    excluded: bool,
) -> int:
    """
    Exclut ou inclut un document du RAG
    """
    # Mettre à jour tous les chunks du document
    search_result = qdrant_client.scroll(
        collection_name=settings.QDRANT_COLLECTION,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        ),
        limit=1000,
    )
    
    point_ids = [point.id for point in search_result[0]]
    
    if point_ids:
        for point_id in point_ids:
            qdrant_client.set_payload(
                collection_name=settings.QDRANT_COLLECTION,
                payload={"is_excluded": excluded},
                points=[point_id],
            )
    
    return len(point_ids)


async def get_rag_stats(
    organization_id: str,
) -> Dict[str, Any]:
    """
    Récupère les statistiques RAG d'une organisation
    """
    # Compter les chunks par type de source
    stats = {
        "total_chunks": 0,
        "by_source_type": {},
        "excluded_chunks": 0,
    }
    
    # Rechercher tous les chunks de l'organisation
    search_result = qdrant_client.scroll(
        collection_name=settings.QDRANT_COLLECTION,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="organization_id",
                    match=MatchValue(value=organization_id),
                )
            ]
        ),
        limit=10000,
        with_payload=True,
    )
    
    for point in search_result[0]:
        stats["total_chunks"] += 1
        
        source_type = point.payload.get("source_type", "unknown")
        stats["by_source_type"][source_type] = stats["by_source_type"].get(source_type, 0) + 1
        
        if point.payload.get("is_excluded", False):
            stats["excluded_chunks"] += 1
    
    return stats
