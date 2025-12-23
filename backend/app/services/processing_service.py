from uuid import UUID
from typing import Optional
from datetime import datetime

from app.core.supabase import get_supabase
from app.services.ocr_service import ocr_service
from app.services.lease_parser_service import lease_parser_service
from app.services.document_service import document_service
from app.schemas.ocr import (
    DocumentProcessing,
    ProcessingRequest,
    OCRResult,
    ParsedLease,
    ValidationRequest,
    EntityCreationResult,
)
from app.core.constants import ProcessingStatus, OCRProvider


class ProcessingService:
    def __init__(self):
        self.supabase = get_supabase()
    
    async def process_document(
        self,
        document_id: UUID,
        organization_id: UUID,
        user_id: UUID,
        ocr_provider: OCRProvider = OCRProvider.HYBRID,
        force_reprocess: bool = False
    ) -> DocumentProcessing:
        """Lance le traitement OCR + Parsing d'un document"""
        
        # Vérifier si déjà traité
        if not force_reprocess:
            existing = self.supabase.table("document_processing").select("*").eq(
                "document_id", str(document_id)
            ).execute()
            
            if existing.data and existing.data[0].get("status") == ProcessingStatus.COMPLETED.value:
                return DocumentProcessing(**existing.data[0])
        
        # Récupérer le document
        doc = document_service.get_document(document_id, organization_id)
        
        # Créer ou mettre à jour l'entrée de traitement
        processing_data = {
            "document_id": str(document_id),
            "status": ProcessingStatus.PROCESSING.value,
        }
        
        existing = self.supabase.table("document_processing").select("id").eq(
            "document_id", str(document_id)
        ).execute()
        
        if existing.data:
            processing_id = existing.data[0]["id"]
            self.supabase.table("document_processing").update(processing_data).eq(
                "id", processing_id
            ).execute()
        else:
            result = self.supabase.table("document_processing").insert(processing_data).execute()
            processing_id = result.data[0]["id"]
        
        try:
            # Télécharger le fichier depuis Supabase Storage
            file_bytes = self.supabase.storage.from_("documents").download(doc["file_path"])
            
            # OCR
            ocr_result = await ocr_service.process_document(
                file_bytes,
                doc["title"],
                provider=ocr_provider
            )
            
            # Parsing (seulement si c'est un bail)
            parsed_lease = None
            if doc.get("document_type") == "bail":
                parsed_lease = await lease_parser_service.parse_lease(ocr_result.text)
            
            # Sauvegarder les résultats
            update_data = {
                "status": ProcessingStatus.COMPLETED.value,
                "ocr_result": ocr_result.model_dump(),
                "parsed_lease": parsed_lease.model_dump() if parsed_lease else None,
                "error_message": None,
            }
            
            result = self.supabase.table("document_processing").update(update_data).eq(
                "id", processing_id
            ).execute()
            
            return DocumentProcessing(**result.data[0])
            
        except Exception as e:
            # En cas d'erreur
            error_data = {
                "status": ProcessingStatus.FAILED.value,
                "error_message": str(e),
            }
            
            self.supabase.table("document_processing").update(error_data).eq(
                "id", processing_id
            ).execute()
            
            raise
    
    def get_processing(self, processing_id: UUID) -> Optional[DocumentProcessing]:
        """Récupère un traitement par ID"""
        result = self.supabase.table("document_processing").select("*").eq(
            "id", str(processing_id)
        ).execute()
        
        if not result.data:
            return None
        
        return DocumentProcessing(**result.data[0])
    
    def get_processing_by_document(self, document_id: UUID) -> Optional[DocumentProcessing]:
        """Récupère le traitement d'un document"""
        result = self.supabase.table("document_processing").select("*").eq(
            "document_id", str(document_id)
        ).execute()
        
        if not result.data:
            return None
        
        return DocumentProcessing(**result.data[0])
    
    def _get_or_create_owner(self, organization_id: UUID, party_data: any) -> Optional[UUID]:
        """Récupère ou crée un propriétaire (Owner)"""
        if not party_data or not party_data.name:
            return None

        # Chercher existence
        existing = self.supabase.table("owners").select("id").eq(
            "organization_id", str(organization_id)
        ).eq("name", party_data.name).execute()

        if existing.data:
            return UUID(existing.data[0]["id"])

        # Créer nouveau
        owner_data = {
            "organization_id": str(organization_id),
            "name": party_data.name,
            "email": party_data.email,
            "phone": party_data.phone,
            # "company_name": party_data.company_name, # Assuming ParsedLease party has this field
            # Check ExtractedParty definition in parsed lease schema (ParsedLease -> parties)
        }
        
        # Safe access to extra attributes if they exist
        if hasattr(party_data, 'company_name'):
             owner_data["company_name"] = party_data.company_name
        if hasattr(party_data, 'address'):
             owner_data["address"] = party_data.address

        result = self.supabase.table("owners").insert(owner_data).execute()
        if result.data:
            return UUID(result.data[0]["id"])
        
        return None

    async def validate_and_create_entities(
        self,
        processing_id: UUID,
        organization_id: UUID,
        user_id: UUID,
        validated_data: ParsedLease,
        create_entities: bool = True
    ) -> EntityCreationResult:
        """Valide les données et crée les entités (propriété, locataire, bail)"""
        
        # Mettre à jour le traitement comme validé
        self.supabase.table("document_processing").update({
            "status": ProcessingStatus.VALIDATED.value,
            "parsed_lease": validated_data.model_dump(),
            "validated_at": datetime.now().isoformat(),
            "validated_by": str(user_id),
        }).eq("id", str(processing_id)).execute()
        
        if not create_entities:
            return EntityCreationResult()
        
        result = EntityCreationResult()
        
        try:
            # Gestion du propriétaire (Owner)
            landlord_party = next((p for p in validated_data.parties if p.type == "landlord"), None)
            owner_id = None
            
            if landlord_party and landlord_party.name:
                owner_id = self._get_or_create_owner(organization_id, landlord_party)

            # Créer la propriété
            if validated_data.property_address:
                property_data = {
                    "name": validated_data.property_address.split(",")[0],
                    "address": validated_data.property_address,
                    "city": "À compléter",
                    "postal_code": "00000",
                    "country": "France",
                    "property_type": validated_data.property_type or "appartement",
                    "surface_area": validated_data.surface_area,
                    "organization_id": str(organization_id),
                    "owner_name": landlord_party.name if landlord_party else None,
                    "owner_id": str(owner_id) if owner_id else None,
                }
                
                prop_result = self.supabase.table("properties").insert(property_data).execute()
                if prop_result.data:
                    result.property_id = UUID(prop_result.data[0]["id"])
            
            # Créer le locataire
            tenant_party = next((p for p in validated_data.parties if p.type == "tenant"), None)
            if tenant_party:
                tenant_data = {
                    "name": tenant_party.name,
                    "tenant_type": "particulier",
                    "email": tenant_party.email,
                    "phone": tenant_party.phone,
                    "organization_id": str(organization_id),
                }
                
                tenant_result = self.supabase.table("tenants").insert(tenant_data).execute()
                if tenant_result.data:
                    result.tenant_id = UUID(tenant_result.data[0]["id"])
            
            # Créer le bail
            if result.property_id and result.tenant_id:
                lease_data = {
                    "property_id": str(result.property_id),
                    "tenant_id": str(result.tenant_id),
                    "organization_id": str(organization_id),
                    "start_date": validated_data.start_date.isoformat() if validated_data.start_date else None,
                    "end_date": validated_data.end_date.isoformat() if validated_data.end_date else None,
                    "monthly_rent": validated_data.monthly_rent,
                    "charges": validated_data.charges,
                    "deposit": validated_data.deposit,
                    "indexation_rate": validated_data.indexation_rate,
                }
                
                lease_result = self.supabase.table("leases").insert(lease_data).execute()
                if lease_result.data:
                    result.lease_id = UUID(lease_result.data[0]["id"])
        
        except Exception as e:
            result.errors.append(str(e))
        
        return result


processing_service = ProcessingService()
