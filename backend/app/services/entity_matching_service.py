"""
Entity Matching Service
Service pour faire correspondre les entités extraites par IA avec les entités existantes
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models.property import Property
from app.models.tenant import Tenant
from app.models.landlord import Landlord
from app.models.lease import Lease
from app.core.security import get_current_user

# Configuration du logging avancée
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/entity_matching.log')
    ]
)
logger = logging.getLogger(__name__)

# Créer un logger spécifique pour le debug
debug_logger = logging.getLogger('entity_matching.debug')
debug_logger.setLevel(logging.DEBUG)

class EntityMatchResult:
    """Résultat du matching d'une entité"""
    def __init__(self, entity_id: str, name: str, confidence: float, entity_type: str):
        self.entity_id = entity_id
        self.name = name
        self.confidence = confidence
        self.entity_type = entity_type
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.entity_id,
            "name": self.name,
            "confidence": self.confidence,
            "entity_type": self.entity_type
        }

class EntityMatchingService:
    """Service pour faire correspondre les entités extraites avec les entités existantes"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def match_property(self, extracted_data: Dict[str, Any]) -> Optional[EntityMatchResult]:
        """
        Faire correspondre une propriété extraite avec les propriétés existantes
        """
        logger.info(f"🔍 [DEBUG] Starting property matching with data: {extracted_data}")
        
        try:
            # Extraire les informations de la propriété
            address = extracted_data.get("property_address", "").strip()
            zip_code = extracted_data.get("property_zip", "").strip()
            city = extracted_data.get("property_city", "").strip()
            
            logger.info(f"🔍 [DEBUG] Extracted property info - Address: '{address}', ZIP: '{zip_code}', City: '{city}'")
            
            if not address:
                logger.warning("⚠️ [DEBUG] No address found for property matching")
                return None
            
            # Rechercher des propriétés correspondantes
            query = self.db.query(Property)
            
            # Recherche par adresse exacte ou partielle
            conditions = []
            if address:
                conditions.append(Property.address.ilike(f"%{address}%"))
            if zip_code:
                conditions.append(Property.postal_code.ilike(f"%{zip_code}%"))
            if city:
                conditions.append(Property.city.ilike(f"%{city}%"))
            
            if conditions:
                query = query.filter(or_(*conditions))
            
            properties = query.all()
            logger.info(f"🔍 [DEBUG] Found {len(properties)} potential property matches")
            
            # Calculer le score de confiance pour chaque propriété
            best_match = None
            best_score = 0.0
            
            for prop in properties:
                score = 0.0
                total_checks = 0
                
                # Vérifier l'adresse
                if address and prop.address:
                    total_checks += 1
                    if address.lower() in prop.address.lower() or prop.address.lower() in address.lower():
                        score += 0.6
                        logger.info(f"🔍 [DEBUG] Address match: '{address}' vs '{prop.address}' - Score: +0.6")
                
                # Vérifier le code postal
                if zip_code and prop.postal_code:
                    total_checks += 1
                    if zip_code == prop.postal_code:
                        score += 0.3
                        logger.info(f"🔍 [DEBUG] ZIP match: '{zip_code}' vs '{prop.postal_code}' - Score: +0.3")
                    elif zip_code in prop.postal_code or prop.postal_code in zip_code:
                        score += 0.15
                        logger.info(f"🔍 [DEBUG] Partial ZIP match: '{zip_code}' vs '{prop.postal_code}' - Score: +0.15")
                
                # Vérifier la ville
                if city and prop.city:
                    total_checks += 1
                    if city.lower() == prop.city.lower():
                        score += 0.1
                        logger.info(f"🔍 [DEBUG] City match: '{city}' vs '{prop.city}' - Score: +0.1")
                    elif city.lower() in prop.city.lower() or prop.city.lower() in city.lower():
                        score += 0.05
                        logger.info(f"🔍 [DEBUG] Partial city match: '{city}' vs '{prop.city}' - Score: +0.05")
                
                # Normaliser le score
                if total_checks > 0:
                    normalized_score = score / total_checks
                    logger.info(f"🔍 [DEBUG] Property {prop.id} - Normalized score: {normalized_score:.3f}")
                    
                    if normalized_score > best_score:
                        best_score = normalized_score
                        best_match = EntityMatchResult(
                            entity_id=str(prop.id),
                            name=prop.address or f"Property {prop.id}",
                            confidence=normalized_score,
                            entity_type="property"
                        )
                        logger.info(f"🔍 [DEBUG] New best property match: {best_match.to_dict()}")
            
            if best_match and best_score > 0.5:  # Seuil de confiance minimum
                logger.info(f"✅ [DEBUG] Property match found: {best_match.to_dict()}")
                return best_match
            else:
                logger.info(f"❌ [DEBUG] No suitable property match found (best score: {best_score:.3f})")
                return None
                
        except Exception as e:
            logger.error(f"❌ [DEBUG] Error in property matching: {str(e)}")
            return None
    
    def match_landlord(self, extracted_data: Dict[str, Any]) -> Optional[EntityMatchResult]:
        """
        Faire correspondre un propriétaire extrait avec les propriétaires existants
        """
        logger.info(f"🔍 [DEBUG] Starting landlord matching with data: {extracted_data}")
        
        try:
            # Extraire les informations du propriétaire
            name = extracted_data.get("name", "").strip()
            email = extracted_data.get("email", "").strip()
            phone = extracted_data.get("phone", "").strip()
            address = extracted_data.get("address", "").strip()
            
            logger.info(f"🔍 [DEBUG] Extracted landlord info - Name: '{name}', Email: '{email}', Phone: '{phone}', Address: '{address}'")
            
            if not name:
                logger.warning("⚠️ [DEBUG] No name found for landlord matching")
                return None
            
            # Rechercher des propriétaires correspondants
            query = self.db.query(Landlord)
            
            # Recherche par nom (priorité haute)
            conditions = [Landlord.name.ilike(f"%{name}%")]
            
            # Ajouter les autres critères si disponibles
            if email:
                conditions.append(Landlord.email.ilike(f"%{email}%"))
            if phone:
                conditions.append(Landlord.phone.ilike(f"%{phone}%"))
            if address:
                conditions.append(Landlord.address.ilike(f"%{address}%"))
            
            query = query.filter(or_(*conditions))
            landlords = query.all()
            
            logger.info(f"🔍 [DEBUG] Found {len(landlords)} potential landlord matches")
            
            # Calculer le score de confiance
            best_match = None
            best_score = 0.0
            
            for landlord in landlords:
                score = 0.0
                total_checks = 0
                
                # Vérifier le nom (critère le plus important)
                if name:
                    total_checks += 1
                    name_lower = name.lower()
                    landlord_name_lower = landlord.name.lower()
                    
                    if name_lower == landlord_name_lower:
                        score += 0.7
                        logger.info(f"🔍 [DEBUG] Exact name match: '{name}' vs '{landlord.name}' - Score: +0.7")
                    elif name_lower in landlord_name_lower or landlord_name_lower in name_lower:
                        score += 0.4
                        logger.info(f"🔍 [DEBUG] Partial name match: '{name}' vs '{landlord.name}' - Score: +0.4")
                
                # Vérifier l'email
                if email and landlord.email:
                    total_checks += 1
                    if email.lower() == landlord.email.lower():
                        score += 0.2
                        logger.info(f"🔍 [DEBUG] Exact email match: '{email}' vs '{landlord.email}' - Score: +0.2")
                
                # Vérifier le téléphone
                if phone and landlord.phone:
                    total_checks += 1
                    if phone.replace(" ", "") == landlord.phone.replace(" ", ""):
                        score += 0.1
                        logger.info(f"🔍 [DEBUG] Exact phone match: '{phone}' vs '{landlord.phone}' - Score: +0.1")
                
                # Normaliser le score
                if total_checks > 0:
                    normalized_score = score / total_checks
                    logger.info(f"🔍 [DEBUG] Landlord {landlord.id} - Normalized score: {normalized_score:.3f}")
                    
                    if normalized_score > best_score:
                        best_score = normalized_score
                        best_match = EntityMatchResult(
                            entity_id=str(landlord.id),
                            name=landlord.name,
                            confidence=normalized_score,
                            entity_type="landlord"
                        )
                        logger.info(f"🔍 [DEBUG] New best landlord match: {best_match.to_dict()}")
            
            if best_match and best_score > 0.6:  # Seuil plus élevé pour les personnes
                logger.info(f"✅ [DEBUG] Landlord match found: {best_match.to_dict()}")
                return best_match
            else:
                logger.info(f"❌ [DEBUG] No suitable landlord match found (best score: {best_score:.3f})")
                return None
                
        except Exception as e:
            logger.error(f"❌ [DEBUG] Error in landlord matching: {str(e)}")
            return None
    
    def match_tenant(self, extracted_data: Dict[str, Any]) -> Optional[EntityMatchResult]:
        """
        Faire correspondre un locataire extrait avec les locataires existants
        """
        logger.info(f"🔍 [DEBUG] Starting tenant matching with data: {extracted_data}")
        
        try:
            # Extraire les informations du locataire
            name = extracted_data.get("name", "").strip()
            email = extracted_data.get("email", "").strip()
            phone = extracted_data.get("phone", "").strip()
            address = extracted_data.get("address", "").strip()
            
            logger.info(f"🔍 [DEBUG] Extracted tenant info - Name: '{name}', Email: '{email}', Phone: '{phone}', Address: '{address}'")
            
            if not name:
                logger.warning("⚠️ [DEBUG] No name found for tenant matching")
                return None
            
            # Rechercher des locataires correspondants
            query = self.db.query(Tenant)
            
            # Recherche par nom (priorité haute)
            conditions = [Tenant.name.ilike(f"%{name}%")]
            
            # Ajouter les autres critères si disponibles
            if email:
                conditions.append(Tenant.email.ilike(f"%{email}%"))
            if phone:
                conditions.append(Tenant.phone.ilike(f"%{phone}%"))
            if address:
                conditions.append(Tenant.address.ilike(f"%{address}%"))
            
            query = query.filter(or_(*conditions))
            tenants = query.all()
            
            logger.info(f"🔍 [DEBUG] Found {len(tenants)} potential tenant matches")
            
            # Calculer le score de confiance
            best_match = None
            best_score = 0.0
            
            for tenant in tenants:
                score = 0.0
                total_checks = 0
                
                # Vérifier le nom (critère le plus important)
                if name:
                    total_checks += 1
                    name_lower = name.lower()
                    tenant_name_lower = tenant.name.lower()
                    
                    if name_lower == tenant_name_lower:
                        score += 0.7
                        logger.info(f"🔍 [DEBUG] Exact name match: '{name}' vs '{tenant.name}' - Score: +0.7")
                    elif name_lower in tenant_name_lower or tenant_name_lower in name_lower:
                        score += 0.4
                        logger.info(f"🔍 [DEBUG] Partial name match: '{name}' vs '{tenant.name}' - Score: +0.4")
                
                # Vérifier l'email
                if email and tenant.email:
                    total_checks += 1
                    if email.lower() == tenant.email.lower():
                        score += 0.2
                        logger.info(f"🔍 [DEBUG] Exact email match: '{email}' vs '{tenant.email}' - Score: +0.2")
                
                # Vérifier le téléphone
                if phone and tenant.phone:
                    total_checks += 1
                    if phone.replace(" ", "") == tenant.phone.replace(" ", ""):
                        score += 0.1
                        logger.info(f"🔍 [DEBUG] Exact phone match: '{phone}' vs '{tenant.phone}' - Score: +0.1")
                
                # Normaliser le score
                if total_checks > 0:
                    normalized_score = score / total_checks
                    logger.info(f"🔍 [DEBUG] Tenant {tenant.id} - Normalized score: {normalized_score:.3f}")
                    
                    if normalized_score > best_score:
                        best_score = normalized_score
                        best_match = EntityMatchResult(
                            entity_id=str(tenant.id),
                            name=tenant.name,
                            confidence=normalized_score,
                            entity_type="tenant"
                        )
                        logger.info(f"🔍 [DEBUG] New best tenant match: {best_match.to_dict()}")
            
            if best_match and best_score > 0.6:  # Seuil plus élevé pour les personnes
                logger.info(f"✅ [DEBUG] Tenant match found: {best_match.to_dict()}")
                return best_match
            else:
                logger.info(f"❌ [DEBUG] No suitable tenant match found (best score: {best_score:.3f})")
                return None
                
        except Exception as e:
            logger.error(f"❌ [DEBUG] Error in tenant matching: {str(e)}")
            return None
    
    def match_all_entities(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Faire correspondre toutes les entités extraites avec les entités existantes
        """
        logger.info(f"🚀 [DEBUG] Starting comprehensive entity matching")
        logger.info(f"🚀 [DEBUG] Full extracted data: {extracted_data}")
        
        results = {
            "matched_entities": {},
            "formData": {},
            "debug_info": {
                "extracted_data": extracted_data,
                "matching_attempts": []
            }
        }
        
        # Matching de la propriété
        if "property_address" in extracted_data:
            property_match = self.match_property(extracted_data)
            if property_match:
                results["matched_entities"]["property"] = property_match.to_dict()
                results["debug_info"]["matching_attempts"].append({
                    "entity_type": "property",
                    "success": True,
                    "result": property_match.to_dict()
                })
            else:
                results["debug_info"]["matching_attempts"].append({
                    "entity_type": "property",
                    "success": False,
                    "reason": "No match found or confidence too low"
                })
        
        # Matching des parties (propriétaire et locataire)
        if "parties" in extracted_data:
            for party in extracted_data["parties"]:
                party_type = party.get("type")
                logger.info(f"🔍 [DEBUG] Processing party: {party_type} - {party}")
                
                if party_type == "landlord":
                    landlord_match = self.match_landlord(party)
                    if landlord_match:
                        results["matched_entities"]["landlord"] = landlord_match.to_dict()
                        results["debug_info"]["matching_attempts"].append({
                            "entity_type": "landlord",
                            "success": True,
                            "result": landlord_match.to_dict()
                        })
                    else:
                        results["debug_info"]["matching_attempts"].append({
                            "entity_type": "landlord",
                            "success": False,
                            "reason": "No match found or confidence too low"
                        })
                
                elif party_type == "tenant":
                    tenant_match = self.match_tenant(party)
                    if tenant_match:
                        results["matched_entities"]["tenant"] = tenant_match.to_dict()
                        results["debug_info"]["matching_attempts"].append({
                            "entity_type": "tenant",
                            "success": True,
                            "result": tenant_match.to_dict()
                        })
                    else:
                        results["debug_info"]["matching_attempts"].append({
                            "entity_type": "tenant",
                            "success": False,
                            "reason": "No match found or confidence too low"
                        })
        
        # Préparer les données du formulaire (pré-remplies avec les données extraites)
        results["formData"] = {
            "property": {
                "address": extracted_data.get("property_address", ""),
                "zip": extracted_data.get("property_zip", ""),
                "city": extracted_data.get("property_city", ""),
                "type": extracted_data.get("property_type", ""),
                "surface_area": extracted_data.get("surface_area"),
                "construction_year": extracted_data.get("construction_year"),
                "energy_class": extracted_data.get("energy_class"),
                "ges_class": extracted_data.get("ges_class")
            },
            "lease": {
                "start_date": extracted_data.get("start_date"),
                "end_date": extracted_data.get("end_date"),
                "monthly_rent": extracted_data.get("monthly_rent"),
                "charges": extracted_data.get("charges"),
                "deposit": extracted_data.get("deposit")
            }
        }
        
        # Ajouter les parties au formData
        if "parties" in extracted_data:
            for party in extracted_data["parties"]:
                party_type = party.get("type")
                if party_type == "landlord":
                    results["formData"]["landlord"] = party
                elif party_type == "tenant":
                    results["formData"]["tenant"] = party
        
        logger.info(f"✅ [DEBUG] Entity matching completed")
        logger.info(f"✅ [DEBUG] Matched entities: {results['matched_entities']}")
        logger.info(f"✅ [DEBUG] Form data prepared: {results['formData']}")
        logger.info(f"✅ [DEBUG] Debug info: {results['debug_info']}")
        
        return results

# Fonction utilitaire pour obtenir le service
def get_entity_matching_service(db: Session) -> EntityMatchingService:
    """Obtenir une instance du service de matching d'entités"""
    return EntityMatchingService(db)
