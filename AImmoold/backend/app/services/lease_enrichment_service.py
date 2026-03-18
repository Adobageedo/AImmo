"""
Lease Enrichment Service
Service d'enrichissement de baux avec résolution d'entités et traitement des annexes
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from difflib import SequenceMatcher

from app.core.supabase import get_supabase_client
from app.schemas.ocr import ParsedLease

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConflictInfo:
    """Information sur un conflit de données"""
    def __init__(self, field: str, existing_value: Any, new_value: Any, 
                 existing_source: str, new_source: str, confidence: float = 0.5):
        self.field = field
        self.existing_value = existing_value
        self.new_value = new_value
        self.existing_source = existing_source
        self.new_source = new_source
        self.confidence = confidence
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field,
            "existing_value": self.existing_value,
            "new_value": self.new_value,
            "existing_source": self.existing_source,
            "new_source": self.new_source,
            "confidence": self.confidence,
            "recommendation": "new" if self.confidence > 0.7 else "review"
        }

class EnrichmentResult:
    """Résultat de l'enrichissement"""
    def __init__(self):
        self.enriched_data: Dict[str, Any] = {}
        self.conflicts: List[ConflictInfo] = []
        self.resolved_entities: Dict[str, str] = {}  # entity_type -> entity_id
        self.new_fields: List[str] = []
        self.updated_fields: List[str] = []
        self.annex_links: Dict[str, List[str]] = {}  # field -> [annex_ids]
        self.debug_info: Dict[str, Any] = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "enriched_data": self.enriched_data,
            "conflicts": [c.to_dict() for c in self.conflicts],
            "resolved_entities": self.resolved_entities,
            "new_fields": self.new_fields,
            "updated_fields": self.updated_fields,
            "annex_links": self.annex_links,
            "debug_info": self.debug_info
        }

class LeaseEnrichmentService:
    """Service pour enrichir les baux avec résolution d'entités"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def calculate_similarity(self, str1: str, str2: str) -> float:
        """Calcule la similarité entre deux chaînes"""
        if not str1 or not str2:
            return 0.0
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def resolve_property_entity(self, extracted_property: Dict[str, Any]) -> Optional[str]:
        """
        Résout l'entité propriété en cherchant une correspondance
        """
        logger.info(f"🔍 [ENRICHMENT] Resolving property entity")
        logger.info(f"🔍 [ENRICHMENT] Extracted property: {extracted_property}")
        
        address = extracted_property.get("address", "")
        zip_code = extracted_property.get("zip", "")
        city = extracted_property.get("city", "")
        
        # Récupérer les propriétés depuis Supabase
        try:
            response = self.supabase.table('properties').select('*').execute()
            existing_properties = response.data if response.data else []
            logger.info(f"🔍 [ENRICHMENT] Checking against {len(existing_properties)} existing properties")
        except Exception as e:
            logger.error(f"❌ [ENRICHMENT] Error fetching properties: {e}")
            existing_properties = []
        
        best_match = None
        best_score = 0.0
        
        for prop in existing_properties:
            score = 0.0
            checks = 0
            
            # Vérifier l'adresse
            if address and prop.get('address'):
                checks += 1
                addr_similarity = self.calculate_similarity(address, prop.get('address', ''))
                score += addr_similarity * 0.6
                logger.info(f"🔍 [ENRICHMENT] Address similarity with {prop.get('id')}: {addr_similarity:.3f}")
            
            # Vérifier le code postal
            if zip_code and prop.get('postal_code'):
                checks += 1
                if zip_code == prop.get('postal_code'):
                    score += 0.3
                    logger.info(f"🔍 [ENRICHMENT] ZIP exact match with {prop.get('id')}")
            
            # Vérifier la ville
            if city and prop.get('city'):
                checks += 1
                city_similarity = self.calculate_similarity(city, prop.get('city', ''))
                score += city_similarity * 0.1
                logger.info(f"🔍 [ENRICHMENT] City similarity with {prop.get('id')}: {city_similarity:.3f}")
            
            if checks > 0:
                normalized_score = score / checks
                logger.info(f"🔍 [ENRICHMENT] Property {prop.get('id')} total score: {normalized_score:.3f}")
                
                if normalized_score > best_score:
                    best_score = normalized_score
                    best_match = str(prop.get('id'))
        
        if best_match and best_score > 0.7:
            logger.info(f"✅ [ENRICHMENT] Property entity resolved: {best_match} (score: {best_score:.3f})")
            return best_match
        
        logger.info(f"❌ [ENRICHMENT] No property entity match found (best score: {best_score:.3f})")
        return None
    
    def resolve_party_entity(self, extracted_party: Dict[str, Any], 
                            party_type: str) -> Optional[str]:
        """
        Résout l'entité partie (landlord/tenant)
        """
        logger.info(f"🔍 [ENRICHMENT] Resolving {party_type} entity")
        logger.info(f"🔍 [ENRICHMENT] Extracted party: {extracted_party}")
        
        name = extracted_party.get("name", "")
        email = extracted_party.get("email", "")
        
        if not name:
            logger.warning(f"⚠️ [ENRICHMENT] No name provided for {party_type}")
            return None
        
        # Récupérer les entités existantes via Supabase
        try:
            table_name = party_type + 's'  # landlord -> landlords, tenant -> tenants
            response = self.supabase.table(table_name).select('*').execute()
            entities = response.data if response.data else []
            logger.info(f"🔍 [ENRICHMENT] Checking against {len(entities)} existing {party_type}s")
        except Exception as e:
            logger.error(f"❌ [ENRICHMENT] Error fetching {party_type}s: {e}")
            entities = []
        
        best_match = None
        best_score = 0.0
        
        for entity in entities:
            score = 0.0
            checks = 0
            
            # Vérifier le nom
            if name and entity.get('name'):
                checks += 1
                name_similarity = self.calculate_similarity(name, entity.get('name', ''))
                score += name_similarity * 0.7
                logger.info(f"🔍 [ENRICHMENT] Name similarity with {entity.get('id')}: {name_similarity:.3f}")
            
            # Vérifier l'email
            if email and entity.get('email'):
                checks += 1
                if email.lower() == entity.get('email', '').lower():
                    score += 0.3
                    logger.info(f"🔍 [ENRICHMENT] Email exact match with {entity.get('id')}")
            
            if checks > 0:
                normalized_score = score / checks
                logger.info(f"🔍 [ENRICHMENT] {party_type.capitalize()} {entity.get('id')} total score: {normalized_score:.3f}")
                
                if normalized_score > best_score:
                    best_score = normalized_score
                    best_match = str(entity.get('id'))
        
        if best_match and best_score > 0.75:
            logger.info(f"✅ [ENRICHMENT] {party_type.capitalize()} entity resolved: {best_match} (score: {best_score:.3f})")
            return best_match
        
        logger.info(f"❌ [ENRICHMENT] No {party_type} entity match found (best score: {best_score:.3f})")
        return None
    
    def detect_conflicts(self, existing_data: Dict[str, Any], new_data: Dict[str, Any],
                        source_existing: str, source_new: str) -> List[ConflictInfo]:
        """
        Détecte les conflits entre données existantes et nouvelles
        """
        logger.info(f"🔍 [ENRICHMENT] Detecting conflicts between {source_existing} and {source_new}")
        conflicts = []
        
        for key, new_value in new_data.items():
            if key in existing_data:
                existing_value = existing_data[key]
                
                # Ignorer si les valeurs sont identiques
                if existing_value == new_value:
                    continue
                
                # Ignorer si l'une des valeurs est None ou vide
                if not existing_value or not new_value:
                    continue
                
                # Calculer la confiance basée sur la source
                confidence = 0.8 if "annex" in source_new.lower() else 0.6
                
                # Ajuster la confiance basée sur la similarité pour les chaînes
                if isinstance(existing_value, str) and isinstance(new_value, str):
                    similarity = self.calculate_similarity(existing_value, new_value)
                    if similarity > 0.9:
                        continue  # Trop similaire, pas un vrai conflit
                    confidence *= (1 - similarity)
                
                conflict = ConflictInfo(
                    field=key,
                    existing_value=existing_value,
                    new_value=new_value,
                    existing_source=source_existing,
                    new_source=source_new,
                    confidence=confidence
                )
                
                conflicts.append(conflict)
                logger.warning(f"⚠️ [ENRICHMENT] Conflict detected on field '{key}': {existing_value} vs {new_value}")
        
        logger.info(f"🔍 [ENRICHMENT] Found {len(conflicts)} conflicts")
        return conflicts
    
    def merge_data(self, existing_data: Dict[str, Any], new_data: Dict[str, Any],
                   prefer_new: bool = False) -> Tuple[Dict[str, Any], List[str], List[str]]:
        """
        Fusionne les données existantes avec les nouvelles
        Retourne: (merged_data, new_fields, updated_fields)
        """
        logger.info(f"🔍 [ENRICHMENT] Merging data (prefer_new: {prefer_new})")
        
        merged = existing_data.copy()
        new_fields = []
        updated_fields = []
        
        for key, new_value in new_data.items():
            # Nouveau champ
            if key not in existing_data or not existing_data[key]:
                merged[key] = new_value
                new_fields.append(key)
                logger.info(f"➕ [ENRICHMENT] New field added: {key} = {new_value}")
            
            # Champ existant
            elif prefer_new and new_value:
                if merged[key] != new_value:
                    merged[key] = new_value
                    updated_fields.append(key)
                    logger.info(f"🔄 [ENRICHMENT] Field updated: {key} = {new_value} (was: {existing_data[key]})")
        
        logger.info(f"✅ [ENRICHMENT] Merge complete: {len(new_fields)} new, {len(updated_fields)} updated")
        return merged, new_fields, updated_fields
    
    def enrich_lease(self, 
                     lease_text: str,
                     existing_lease_json: Optional[Dict[str, Any]],
                     parsed_lease: ParsedLease,
                     annexes: Optional[List[Dict[str, Any]]] = None) -> EnrichmentResult:
        """
        Enrichit un bail avec résolution d'entités et traitement des annexes
        """
        logger.info(f"🚀 [ENRICHMENT] Starting lease enrichment")
        logger.info(f"🔍 [ENRICHMENT] Existing lease data: {bool(existing_lease_json)}")
        logger.info(f"🔍 [ENRICHMENT] Number of annexes: {len(annexes) if annexes else 0}")
        
        result = EnrichmentResult()
        
        # Étape 1: Résolution des entités
        logger.info(f"🔍 [ENRICHMENT] Step 1: Entity resolution")
        
        # Résoudre la propriété
        property_data = {
            "address": parsed_lease.property_address,
            "zip": parsed_lease.property_zip,
            "city": parsed_lease.property_city,
            "type": parsed_lease.property_type
        }
        property_id = self.resolve_property_entity(property_data)
        if property_id:
            result.resolved_entities["property"] = property_id
        
        # Résoudre les parties
        for party in parsed_lease.parties:
            party_data = {
                "name": party.name,
                "email": party.email,
                "address": party.address
            }
            party_id = self.resolve_party_entity(party_data, party.type)
            if party_id:
                result.resolved_entities[party.type] = party_id
        
        logger.info(f"✅ [ENRICHMENT] Entities resolved: {result.resolved_entities}")
        
        # Étape 2: Préparer les nouvelles données
        logger.info(f"🔍 [ENRICHMENT] Step 2: Preparing new data from parsed lease")
        
        new_lease_data = {
            "property_address": parsed_lease.property_address,
            "property_zip": parsed_lease.property_zip,
            "property_city": parsed_lease.property_city,
            "property_type": parsed_lease.property_type,
            "surface_area": parsed_lease.surface_area,
            "construction_year": parsed_lease.construction_year,
            "energy_class": parsed_lease.energy_class,
            "ges_class": parsed_lease.ges_class,
            "start_date": parsed_lease.start_date.isoformat() if parsed_lease.start_date else None,
            "end_date": parsed_lease.end_date.isoformat() if parsed_lease.end_date else None,
            "monthly_rent": parsed_lease.monthly_rent,
            "charges": parsed_lease.charges,
            "deposit": parsed_lease.deposit,
            "key_clauses": parsed_lease.key_clauses,
            "parties": [
                {
                    "type": p.type,
                    "name": p.name,
                    "email": p.email,
                    "address": p.address
                }
                for p in parsed_lease.parties
            ]
        }
        
        # Étape 3: Traiter les annexes
        if annexes:
            logger.info(f"🔍 [ENRICHMENT] Step 3: Processing {len(annexes)} annexes")
            for i, annex in enumerate(annexes):
                annex_id = annex.get("id", f"annex_{i}")
                annex_type = annex.get("type", "unknown")
                annex_data = annex.get("extracted_data", {})
                
                logger.info(f"🔍 [ENRICHMENT] Processing annex {annex_id} (type: {annex_type})")
                
                # Enrichir avec les données de l'annexe
                for key, value in annex_data.items():
                    if value and key not in new_lease_data:
                        new_lease_data[key] = value
                        if key not in result.annex_links:
                            result.annex_links[key] = []
                        result.annex_links[key].append(annex_id)
                        logger.info(f"➕ [ENRICHMENT] Field '{key}' enriched from annex {annex_id}")
        
        # Étape 4: Détecter les conflits si bail existant
        if existing_lease_json:
            logger.info(f"🔍 [ENRICHMENT] Step 4: Detecting conflicts with existing lease")
            conflicts = self.detect_conflicts(
                existing_lease_json,
                new_lease_data,
                "existing_database",
                "new_parsing"
            )
            result.conflicts = conflicts
        
        # Étape 5: Fusionner les données
        logger.info(f"🔍 [ENRICHMENT] Step 5: Merging data")
        
        if existing_lease_json:
            # Fusionner avec les données existantes
            merged_data, new_fields, updated_fields = self.merge_data(
                existing_lease_json,
                new_lease_data,
                prefer_new=False  # Ne pas écraser automatiquement
            )
            result.enriched_data = merged_data
            result.new_fields = new_fields
            result.updated_fields = updated_fields
        else:
            # Nouveau bail
            result.enriched_data = new_lease_data
            result.new_fields = list(new_lease_data.keys())
        
        # Étape 6: Ajouter les informations de debug
        result.debug_info = {
            "has_existing_lease": bool(existing_lease_json),
            "annexes_processed": len(annexes) if annexes else 0,
            "entities_resolved": len(result.resolved_entities),
            "conflicts_found": len(result.conflicts),
            "new_fields_count": len(result.new_fields),
            "updated_fields_count": len(result.updated_fields),
            "parsing_confidence": parsed_lease.confidence
        }
        
        logger.info(f"✅ [ENRICHMENT] Enrichment complete")
        logger.info(f"✅ [ENRICHMENT] Summary: {result.debug_info}")
        
        return result

def get_lease_enrichment_service() -> LeaseEnrichmentService:
    """Obtenir une instance du service d'enrichissement"""
    return LeaseEnrichmentService()
