"""
Lease Parsing API with Entity Matching
Endpoint pour parser les baux avec matching d'entités existantes
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.services.lease_parser_service import lease_parser_service
from app.services.lease_enrichment_service import get_lease_enrichment_service
from app.services.annex_processing_service import annex_processing_service
from app.core.security import get_current_user
from app.core.supabase import get_supabase_client
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

class EnrichedLeaseParsingRequest(BaseModel):
    """Request model for enriched lease parsing with annexes"""
    lease_text: str
    existing_lease_id: Optional[str] = None
    annexes: List[Dict[str, Any]] = []  # List of annex documents with text and metadata

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
            
            # Parser simple sans matching (le matching est fait dans lease_enrichment_service)
            parsed_lease = await lease_parser_service.parse_lease(enhanced_text)
            
            # Créer un résultat de base compatible
            result = {
                "parsed_lease": parsed_lease,
                "matched_entities": {},
                "form_data": {
                    "property": {
                        "address": parsed_lease.property_address,
                        "zip": parsed_lease.property_zip,
                        "city": parsed_lease.property_city
                    },
                    "lease": {
                        "start_date": parsed_lease.start_date.isoformat() if parsed_lease.start_date else None,
                        "end_date": parsed_lease.end_date.isoformat() if parsed_lease.end_date else None,
                        "monthly_rent": parsed_lease.monthly_rent,
                        "charges": parsed_lease.charges,
                        "deposit": parsed_lease.deposit
                    }
                },
                "debug_info": {"parsing_confidence": parsed_lease.confidence}
            }
            
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
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de debug pour lister les entités existantes
    """
    logger.info(f"🔍 [DEBUG] Fetching existing entities for user {current_user.id}")
    
    try:
        supabase = get_supabase_client()
        
        # Récupérer toutes les entités via Supabase
        properties_response = supabase.table('properties').select('*').execute()
        tenants_response = supabase.table('tenants').select('*').execute()
        landlords_response = supabase.table('landlords').select('*').execute()
        
        properties = properties_response.data if properties_response.data else []
        tenants = tenants_response.data if tenants_response.data else []
        landlords = landlords_response.data if landlords_response.data else []
        
        debug_info = {
            "properties": [
                {
                    "id": str(p.get('id')),
                    "address": p.get('address'),
                    "postal_code": p.get('postal_code'),
                    "city": p.get('city'),
                    "type": p.get('property_type')
                }
                for p in properties
            ],
            "tenants": [
                {
                    "id": str(t.get('id')),
                    "name": t.get('name'),
                    "email": t.get('email'),
                    "phone": t.get('phone'),
                    "address": t.get('address')
                }
                for t in tenants
            ],
            "landlords": [
                {
                    "id": str(l.get('id')),
                    "name": l.get('name'),
                    "email": l.get('email'),
                    "phone": l.get('phone'),
                    "address": l.get('address')
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
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de test pour le matching d'entités
    """
    logger.info(f"🧪 [TEST] Testing entity matching with data: {test_data}")
    
    try:
        from app.services.entity_matching_service import get_entity_matching_service
        
        entity_service = get_entity_matching_service()
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

@router.post("/parse-enriched")
async def parse_lease_with_enrichment(
    request: EnrichedLeaseParsingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Parse un bail avec enrichissement complet:
    - Résolution d'entités existantes
    - Traitement des annexes
    - Détection de conflits
    - Merge intelligent avec données existantes
    """
    logger.info(f"🚀 [API-ENRICHED] Starting enriched lease parsing for user {current_user.id}")
    logger.info(f"🔍 [API-ENRICHED] Request data - text length: {len(request.lease_text)}, existing_lease: {request.existing_lease_id}, annexes: {len(request.annexes)}")
    
    try:
        # Étape 1: Récupérer le bail existant si spécifié
        existing_lease_json = None
        if request.existing_lease_id:
            logger.info(f"🔍 [API-ENRICHED] Fetching existing lease: {request.existing_lease_id}")
            try:
                supabase = get_supabase_client()
                response = supabase.table('leases').select('*').eq('id', request.existing_lease_id).execute()
                existing_lease_data = response.data[0] if response.data else None
                
                if existing_lease_data:
                    # Convertir le bail existant en JSON
                    existing_lease_json = {
                        "property_address": existing_lease_data.get('property_address'),
                        "start_date": existing_lease_data.get('start_date'),
                        "end_date": existing_lease_data.get('end_date'),
                        "monthly_rent": existing_lease_data.get('monthly_rent'),
                        "charges": existing_lease_data.get('charges'),
                        "deposit": existing_lease_data.get('deposit'),
                    }
                    logger.info(f"✅ [API-ENRICHED] Existing lease loaded: {existing_lease_json}")
                else:
                    logger.warning(f"⚠️ [API-ENRICHED] Lease {request.existing_lease_id} not found")
            except Exception as e:
                logger.error(f"❌ [API-ENRICHED] Error fetching lease: {e}")
                existing_lease_json = None
        
        # Étape 2: Parser le bail principal
        logger.info(f"🔍 [API-ENRICHED] Step 1: Parsing main lease document")
        parsed_lease = await lease_parser_service.parse_lease(request.lease_text)
        logger.info(f"✅ [API-ENRICHED] Main lease parsed - Confidence: {parsed_lease.confidence:.3f}")
        
        # Étape 3: Traiter les annexes
        processed_annexes = []
        if request.annexes:
            logger.info(f"🔍 [API-ENRICHED] Step 2: Processing {len(request.annexes)} annexes")
            processed_annexes_info = await annex_processing_service.process_multiple_annexes(request.annexes)
            processed_annexes = [
                {
                    "id": annex.annex_id,
                    "type": annex.annex_type,
                    "extracted_data": annex.extracted_data
                }
                for annex in processed_annexes_info
            ]
            logger.info(f"✅ [API-ENRICHED] Processed {len(processed_annexes)} annexes")
        
        # Étape 4: Enrichir le bail
        logger.info(f"🔍 [API-ENRICHED] Step 3: Enriching lease data")
        enrichment_service = get_lease_enrichment_service()
        enrichment_result = enrichment_service.enrich_lease(
            lease_text=request.lease_text,
            existing_lease_json=existing_lease_json,
            parsed_lease=parsed_lease,
            annexes=processed_annexes
        )
        
        logger.info(f"✅ [API-ENRICHED] Enrichment completed")
        logger.info(f"✅ [API-ENRICHED] Resolved entities: {enrichment_result.resolved_entities}")
        logger.info(f"✅ [API-ENRICHED] Conflicts found: {len(enrichment_result.conflicts)}")
        logger.info(f"✅ [API-ENRICHED] New fields: {len(enrichment_result.new_fields)}")
        logger.info(f"✅ [API-ENRICHED] Updated fields: {len(enrichment_result.updated_fields)}")
        
        # Construire la réponse complète
        response = {
            "success": True,
            "message": "Lease parsed and enriched successfully",
            "data": {
                "enriched_lease": enrichment_result.enriched_data,
                "resolved_entities": enrichment_result.resolved_entities,
                "conflicts": [c.to_dict() for c in enrichment_result.conflicts],
                "new_fields": enrichment_result.new_fields,
                "updated_fields": enrichment_result.updated_fields,
                "annex_links": enrichment_result.annex_links,
                "processed_annexes": processed_annexes,
                "parsing_confidence": parsed_lease.confidence
            },
            "debug_info": enrichment_result.debug_info
        }
        
        logger.info(f"✅ [API-ENRICHED] Response prepared successfully")
        return response
        
    except Exception as e:
        logger.error(f"❌ [API-ENRICHED] Error in enriched parsing: {str(e)}")
        logger.error(f"❌ [API-ENRICHED] Exception details: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"❌ [API-ENRICHED] Traceback: {traceback.format_exc()}")
        
        return {
            "success": False,
            "message": f"Error in enriched parsing: {str(e)}",
            "data": {},
            "debug_info": {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()
            }
        }
