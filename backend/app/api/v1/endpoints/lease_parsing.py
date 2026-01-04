"""
Lease Parsing API with Entity Matching
Endpoint pour parser les baux avec matching d'entités existantes
"""

import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.lease_parser_service import lease_parser_service
from app.core.security import get_current_user
from app.models.user import User

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/lease-parsing", tags=["lease-parsing"])

class LeaseParsingRequest(BaseModel):
    """Request model for lease parsing"""
    text: str
    include_entity_matching: bool = True
    annex_documents: List[str] = []  # IDs of annex documents

class LeaseParsingResponse(BaseModel):
    """Response model for lease parsing results"""
    success: bool
    data: Dict[str, Any]
    message: str
    debug_info: Dict[str, Any] = {}

@router.post("/parse", response_model=LeaseParsingResponse)
async def parse_lease_with_matching(
    request: LeaseParsingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parse un bail avec LLM et fait correspondre les entités existantes
    """
    logger.info(f"🚀 [API] Starting lease parsing request for user {current_user.id}")
    logger.info(f"🔍 [API] Request data - text length: {len(request.text)}, include_matching: {request.include_entity_matching}, annexes: {len(request.annex_documents)}")
    
    try:
        if request.include_entity_matching:
            # Parsing avec matching d'entités
            logger.info("🔍 [API] Using entity matching mode")
            
            # Ajouter les informations des annexes au texte si disponibles
            enhanced_text = request.text
            if request.annex_documents:
                logger.info(f"🔍 [API] Processing {len(request.annex_documents)} annex documents")
                enhanced_text += f"\n\n--- ANNEXES ---\n"
                for i, annex_id in enumerate(request.annex_documents):
                    enhanced_text += f"\nAnnexe {i+1} (ID: {annex_id}): Document additionnel pour le bail\n"
            
            logger.info(f"🔍 [API] Enhanced text length: {len(enhanced_text)}")
            
            # Parser avec matching
            result = await lease_parser_service.parse_lease_with_entity_matching(enhanced_text, db)
            
            logger.info(f"✅ [API] Parsing completed successfully")
            logger.info(f"✅ [API] Matched entities: {result['matched_entities']}")
            logger.info(f"✅ [API] Form data keys: {list(result['form_data'].keys())}")
            
            return LeaseParsingResponse(
                success=True,
                data=result,
                message="Lease parsed successfully with entity matching",
                debug_info=result.get("debug_info", {})
            )
        else:
            # Parsing simple sans matching
            logger.info("🔍 [API] Using simple parsing mode")
            parsed_lease = await lease_parser_service.parse_lease(request.text)
            
            return LeaseParsingResponse(
                success=True,
                data={"parsed_lease": parsed_lease},
                message="Lease parsed successfully"
            )
            
    except Exception as e:
        logger.error(f"❌ [API] Error in lease parsing: {str(e)}")
        logger.error(f"❌ [API] Exception details: {type(e).__name__}: {e}")
        
        return LeaseParsingResponse(
            success=False,
            data={},
            message=f"Error parsing lease: {str(e)}",
            debug_info={"error_type": type(e).__name__, "error_message": str(e)}
        )

@router.get("/debug/entities")
async def debug_entities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de debug pour lister les entités existantes
    """
    logger.info(f"🔍 [DEBUG] Fetching existing entities for user {current_user.id}")
    
    try:
        from app.models.property import Property
        from app.models.tenant import Tenant
        from app.models.landlord import Landlord
        
        # Récupérer toutes les entités
        properties = db.query(Property).all()
        tenants = db.query(Tenant).all()
        landlords = db.query(Landlord).all()
        
        debug_info = {
            "properties": [
                {
                    "id": str(p.id),
                    "address": p.address,
                    "postal_code": p.postal_code,
                    "city": p.city,
                    "type": p.property_type
                }
                for p in properties
            ],
            "tenants": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "email": t.email,
                    "phone": t.phone,
                    "address": t.address
                }
                for t in tenants
            ],
            "landlords": [
                {
                    "id": str(l.id),
                    "name": l.name,
                    "email": l.email,
                    "phone": l.phone,
                    "address": l.address
                }
                for l in landlords
            ],
            "counts": {
                "properties": len(properties),
                "tenants": len(tenants),
                "landlords": len(landlords)
            }
        }
        
        logger.info(f"✅ [DEBUG] Found {len(properties)} properties, {len(tenants)} tenants, {len(landlords)} landlords")
        
        return {
            "success": True,
            "data": debug_info,
            "message": "Debug entities retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ [DEBUG] Error fetching entities: {str(e)}")
        return {
            "success": False,
            "data": {},
            "message": f"Error fetching entities: {str(e)}",
            "error": str(e)
        }

@router.post("/test-matching")
async def test_entity_matching(
    test_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de test pour le matching d'entités
    """
    logger.info(f"🧪 [TEST] Testing entity matching with data: {test_data}")
    
    try:
        from app.services.entity_matching_service import get_entity_matching_service
        
        entity_service = get_entity_matching_service(db)
        results = entity_service.match_all_entities(test_data)
        
        logger.info(f"✅ [TEST] Matching test completed")
        logger.info(f"✅ [TEST] Results: {results}")
        
        return {
            "success": True,
            "data": results,
            "message": "Entity matching test completed successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ [TEST] Error in matching test: {str(e)}")
        return {
            "success": False,
            "data": {},
            "message": f"Error in matching test: {str(e)}",
            "error": str(e)
        }
