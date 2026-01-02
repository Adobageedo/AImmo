"""
Canvas Service - Gestion des artefacts et du canvas
Support des tables, documents, charts et synchronisation
"""

from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime

from app.schemas.chat_sdk import Artifact, ArtifactType, ArtifactCreate, ArtifactUpdate


async def create_artifact(
    artifact_create: ArtifactCreate,
    user_id: str,
    supabase,
) -> Artifact:
    """
    Crée un nouvel artefact
    """
    artifact_id = str(uuid4())
    now = datetime.utcnow()
    
    artifact_data = {
        "id": artifact_id,
        "conversation_id": artifact_create.conversation_id,
        "message_id": artifact_create.message_id,
        "type": artifact_create.type.value,
        "title": artifact_create.title,
        "content": artifact_create.content,
        "metadata": artifact_create.metadata or {},
        "user_id": user_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    
    response = supabase.table("artifacts").insert(artifact_data).execute()
    
    if not response.data:
        raise Exception("Failed to create artifact")
    
    return Artifact(**response.data[0])


async def get_artifact(
    artifact_id: str,
    user_id: str,
    supabase,
) -> Optional[Artifact]:
    """
    Récupère un artefact
    """
    response = supabase.table("artifacts").select("*").eq(
        "id", artifact_id
    ).eq("user_id", user_id).single().execute()
    
    if not response.data:
        return None
    
    return Artifact(**response.data)


async def list_artifacts(
    conversation_id: str,
    user_id: str,
    artifact_type: Optional[ArtifactType] = None,
    supabase = None,
) -> List[Artifact]:
    """
    Liste les artefacts d'une conversation
    """
    query = supabase.table("artifacts").select("*").eq(
        "conversation_id", conversation_id
    ).eq("user_id", user_id)
    
    if artifact_type:
        query = query.eq("type", artifact_type.value)
    
    response = query.order("created_at", desc=True).execute()
    
    return [Artifact(**a) for a in response.data or []]


async def update_artifact(
    artifact_id: str,
    artifact_update: ArtifactUpdate,
    user_id: str,
    supabase,
) -> Optional[Artifact]:
    """
    Met à jour un artefact
    """
    # Vérifier l'appartenance
    existing = await get_artifact(artifact_id, user_id, supabase)
    if not existing:
        return None
    
    update_data = {
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    if artifact_update.title is not None:
        update_data["title"] = artifact_update.title
    
    if artifact_update.content is not None:
        update_data["content"] = artifact_update.content
    
    if artifact_update.metadata is not None:
        update_data["metadata"] = artifact_update.metadata
    
    response = supabase.table("artifacts").update(update_data).eq(
        "id", artifact_id
    ).eq("user_id", user_id).execute()
    
    if not response.data:
        return None
    
    return Artifact(**response.data[0])


async def delete_artifact(
    artifact_id: str,
    user_id: str,
    supabase,
) -> bool:
    """
    Supprime un artefact
    """
    response = supabase.table("artifacts").delete().eq(
        "id", artifact_id
    ).eq("user_id", user_id).execute()
    
    return len(response.data or []) > 0


async def sync_canvas_artifacts(
    conversation_id: str,
    artifacts_data: List[Dict[str, Any]],
    user_id: str,
    supabase,
) -> List[Artifact]:
    """
    Synchronise les artefacts du canvas
    """
    synced_artifacts = []
    
    for artifact_data in artifacts_data:
        artifact_id = artifact_data.get("id")
        
        if artifact_id:
            # Mettre à jour l'artefact existant
            artifact_update = ArtifactUpdate(
                title=artifact_data.get("title"),
                content=artifact_data.get("content"),
                metadata=artifact_data.get("metadata"),
            )
            
            updated = await update_artifact(
                artifact_id=artifact_id,
                artifact_update=artifact_update,
                user_id=user_id,
                supabase=supabase,
            )
            
            if updated:
                synced_artifacts.append(updated)
        else:
            # Créer un nouvel artefact
            artifact_create = ArtifactCreate(
                conversation_id=conversation_id,
                type=ArtifactType(artifact_data.get("type", "document")),
                title=artifact_data.get("title", "Untitled"),
                content=artifact_data.get("content", {}),
                metadata=artifact_data.get("metadata"),
            )
            
            created = await create_artifact(
                artifact_create=artifact_create,
                user_id=user_id,
                supabase=supabase,
            )
            
            synced_artifacts.append(created)
    
    return synced_artifacts


async def generate_table_artifact(
    title: str,
    headers: List[str],
    rows: List[List[Any]],
    summary: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Génère un artefact de type table
    """
    return {
        "type": "table",
        "headers": headers,
        "rows": rows,
        "summary": summary,
        "row_count": len(rows),
        "column_count": len(headers),
    }


async def generate_chart_artifact(
    title: str,
    chart_type: str,
    data: Dict[str, Any],
    options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Génère un artefact de type chart
    """
    return {
        "type": "chart",
        "chart_type": chart_type,  # bar, line, pie, etc.
        "data": data,
        "options": options or {},
    }


async def generate_document_artifact(
    title: str,
    markdown_content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Génère un artefact de type document
    """
    return {
        "type": "document",
        "markdown": markdown_content,
        "metadata": metadata or {},
    }
