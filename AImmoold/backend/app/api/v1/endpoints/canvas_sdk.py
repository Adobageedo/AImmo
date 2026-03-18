"""
Canvas SDK Endpoints - Gestion des artefacts et synchronisation
Support tables, charts, documents et synchronisation Canvas ↔ Chat
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.core.security import get_current_user_id
from app.core.supabase import get_supabase_client
from app.schemas.chat_sdk import (
    Artifact,
    ArtifactCreate,
    ArtifactUpdate,
    ArtifactType,
    CanvasSyncRequest,
)
from app.services.chat.canvas_service import (
    create_artifact,
    get_artifact,
    list_artifacts,
    update_artifact,
    delete_artifact,
    sync_canvas_artifacts,
)


router = APIRouter()


# ============================================
# ARTIFACTS - CRUD
# ============================================

@router.post("/artifacts", response_model=Artifact, status_code=status.HTTP_201_CREATED)
async def create_artifact_endpoint(
    request: ArtifactCreate,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Crée un nouvel artefact
    
    Types supportés:
    - table: Tableau de données
    - chart: Graphique/visualisation
    - document: Document markdown
    - code: Bloc de code
    
    L'artefact est lié à une conversation et optionnellement à un message
    """
        
    # Vérifier l'appartenance à la conversation
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", request.conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Créer l'artefact
    artifact = await create_artifact(request, user_id, supabase)
    
    return artifact


@router.get("/artifacts/{artifact_id}", response_model=Artifact)
async def get_artifact_endpoint(
    artifact_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Récupère un artefact par son ID
    """
        
    artifact = await get_artifact(artifact_id, user_id, supabase)
    
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found"
        )
    
    return artifact


@router.get("/conversations/{conversation_id}/artifacts", response_model=List[Artifact])
async def list_conversation_artifacts(
    conversation_id: str,
    artifact_type: Optional[ArtifactType] = Query(None, description="Filter by artifact type"),
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Liste les artefacts d'une conversation
    
    - Optionnellement filtré par type
    - Ordre chronologique décroissant
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data or conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    artifacts = await list_artifacts(conversation_id, user_id, artifact_type, supabase)
    
    return artifacts


@router.patch("/artifacts/{artifact_id}", response_model=Artifact)
async def update_artifact_endpoint(
    artifact_id: str,
    request: ArtifactUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Met à jour un artefact
    
    - Permet de modifier le titre, contenu et metadata
    - Met à jour le timestamp updated_at
    """
        
    artifact = await update_artifact(artifact_id, request, user_id, supabase)
    
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found"
        )
    
    return artifact


@router.delete("/artifacts/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artifact_endpoint(
    artifact_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Supprime un artefact
    """
        
    success = await delete_artifact(artifact_id, user_id, supabase)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found"
        )
    
    return None


# ============================================
# CANVAS - SYNCHRONISATION
# ============================================

@router.post("/canvas/sync", response_model=List[Artifact])
async def sync_canvas(
    request: CanvasSyncRequest,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Synchronise les artefacts du Canvas
    
    - Crée les nouveaux artefacts (sans ID)
    - Met à jour les artefacts existants (avec ID)
    - Retourne la liste complète synchronisée
    
    Utilisé pour synchroniser l'état du Canvas avec le backend
    après des modifications côté client
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", request.conversation_id
    ).single().execute()
    
    if not conv_response.data or conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Synchroniser
    synced_artifacts = await sync_canvas_artifacts(
        conversation_id=request.conversation_id,
        artifacts_data=request.artifacts,
        user_id=user_id,
        supabase=supabase,
    )
    
    return synced_artifacts


@router.get("/canvas/{conversation_id}", response_model=List[Artifact])
async def get_canvas_state(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Récupère l'état complet du Canvas pour une conversation
    
    - Retourne tous les artefacts de la conversation
    - Utilisé pour restaurer l'état du Canvas au chargement
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data or conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Récupérer tous les artefacts
    artifacts = await list_artifacts(conversation_id, user_id, None, supabase)
    
    return artifacts
