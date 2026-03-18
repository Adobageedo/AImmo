from typing import Optional, List, BinaryIO
from uuid import UUID, uuid4
import os
from datetime import datetime
from fastapi import UploadFile, HTTPException, status

from app.core.supabase import get_supabase
from app.core.constants import (
    ALLOWED_FILE_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    DEFAULT_ORG_QUOTA_BYTES,
    SUPABASE_STORAGE_BUCKET,
    FileType,
)
from app.schemas.document import OrganizationQuota


class DocumentService:
    def __init__(self):
        self.supabase = get_supabase()
    
    def get_organization_quota(self, organization_id: UUID) -> OrganizationQuota:
        result = self.supabase.table("documents").select("file_size").eq(
            "organization_id", str(organization_id)
        ).execute()
        
        used_bytes = sum(doc.get("file_size", 0) for doc in result.data)
        quota_bytes = DEFAULT_ORG_QUOTA_BYTES
        
        return OrganizationQuota(
            organization_id=organization_id,
            used_bytes=used_bytes,
            quota_bytes=quota_bytes,
            used_mb=round(used_bytes / (1024 * 1024), 2),
            quota_mb=round(quota_bytes / (1024 * 1024), 2),
            usage_percentage=round((used_bytes / quota_bytes) * 100, 2) if quota_bytes > 0 else 0,
        )
    
    def validate_file(self, file: UploadFile, organization_id: UUID) -> FileType:
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in ALLOWED_FILE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Type de fichier non autorisé. Extensions acceptées: {', '.join(ALLOWED_FILE_EXTENSIONS.keys())}"
            )
        
        if file.size and file.size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Fichier trop volumineux. Taille maximale: {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB"
            )
        
        quota = self.get_organization_quota(organization_id)
        if file.size and quota.used_bytes + file.size > quota.quota_bytes:
            raise HTTPException(
                status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
                detail=f"Quota dépassé. Utilisé: {quota.used_mb}MB / {quota.quota_mb}MB"
            )
        
        return ALLOWED_FILE_EXTENSIONS[file_ext]
    
    def generate_storage_path(
        self,
        organization_id: UUID,
        folder_path: str,
        filename: str
    ) -> str:
        clean_folder = folder_path.strip("/")
        unique_filename = f"{uuid4()}_{filename}"
        
        if clean_folder:
            return f"{organization_id}/{clean_folder}/{unique_filename}"
        return f"{organization_id}/{unique_filename}"
    
    async def upload_to_storage(
        self,
        file: UploadFile,
        storage_path: str
    ) -> str:
        try:
            file_bytes = await file.read()
            
            result = self.supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
            
            return storage_path
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de l'upload: {str(e)}"
            )
    
    def delete_from_storage(self, storage_path: str) -> bool:
        try:
            self.supabase.storage.from_(SUPABASE_STORAGE_BUCKET).remove([storage_path])
            return True
        except Exception as e:
            return False
    
    def get_public_url(self, storage_path: str) -> Optional[str]:
        try:
            result = self.supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
            return result
        except Exception:
            return None
    
    def create_document_metadata(
        self,
        title: str,
        file_path: str,
        file_type: FileType,
        file_size: int,
        organization_id: UUID,
        user_id: UUID,
        document_type: str,
        folder_path: str,
        description: Optional[str] = None,
        property_id: Optional[UUID] = None,
        lease_id: Optional[UUID] = None,
        tags: List[str] = []
    ) -> dict:
        data = {
            "title": title,
            "description": description,
            "file_path": file_path,
            "file_type": file_type.value,
            "file_size": file_size,
            "document_type": document_type,
            "folder_path": folder_path,
            "organization_id": str(organization_id),
            "uploaded_by": str(user_id),
            "property_id": str(property_id) if property_id else None,
            "lease_id": str(lease_id) if lease_id else None,
            "tags": tags,
        }
        
        result = self.supabase.table("documents").insert(data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la création des métadonnées"
            )
        
        return result.data[0]
    
    def list_documents(
        self,
        organization_id: UUID,
        folder_path: Optional[str] = None,
        document_type: Optional[str] = None,
        property_id: Optional[UUID] = None,
        lease_id: Optional[UUID] = None
    ) -> List[dict]:
        query = self.supabase.table("documents").select("*").eq(
            "organization_id", str(organization_id)
        )
        
        if folder_path is not None:
            query = query.eq("folder_path", folder_path)
        
        if document_type:
            query = query.eq("document_type", document_type)
        
        if property_id:
            query = query.eq("property_id", str(property_id))
        
        if lease_id:
            query = query.eq("lease_id", str(lease_id))
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    
    def get_document(self, document_id: UUID, organization_id: UUID) -> dict:
        result = self.supabase.table("documents").select("*").eq(
            "id", str(document_id)
        ).eq(
            "organization_id", str(organization_id)
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document non trouvé"
            )
        
        return result.data[0]
    
    def update_document(
        self,
        document_id: UUID,
        organization_id: UUID,
        update_data: dict
    ) -> dict:
        result = self.supabase.table("documents").update(update_data).eq(
            "id", str(document_id)
        ).eq(
            "organization_id", str(organization_id)
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document non trouvé"
            )
        
        return result.data[0]
    
    def delete_document(
        self,
        document_id: UUID,
        organization_id: UUID
    ) -> bool:
        doc = self.get_document(document_id, organization_id)
        
        self.delete_from_storage(doc["file_path"])
        
        result = self.supabase.table("documents").delete().eq(
            "id", str(document_id)
        ).eq(
            "organization_id", str(organization_id)
        ).execute()
        
        return bool(result.data)


document_service = DocumentService()
