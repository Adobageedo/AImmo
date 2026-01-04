#!/usr/bin/env python3
"""
Script de test pour le système d'enrichissement de baux
"""

import asyncio
import sys
import os

# Ajouter le chemin du projet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.lease_parser_service import lease_parser_service
from app.services.lease_enrichment_service import get_lease_enrichment_service
from app.services.annex_processing_service import annex_processing_service
from app.services.entity_matching_service import get_entity_matching_service

async def test_parsing():
    """Test le parsing de base"""
    print("🚀 Testing basic lease parsing...")
    
    sample_lease_text = """
    CONTRAT DE BAIL
    
    BAILLEUR: Jean Dupont
    Adresse: 15 Rue de la République, 75001 Paris
    
    LOCATAIRE: Marie Martin
    Email: marie.martin@email.com
    
    BIEN: Appartement 3 pièces, 45m²
    Adresse: 123 Rue de la Paix, 75001 Paris
    
    DURÉE: 1 an
    DATE DE DÉBUT: 1 janvier 2024
    DATE DE FIN: 31 décembre 2024
    
    LOYER: 1200€ par mois
    CHARGES: 150€ par mois
    DÉPÔT DE GARANTIE: 2400€
    """
    
    try:
        parsed_lease = await lease_parser_service.parse_lease(sample_lease_text)
        print(f"✅ Parsing successful - Confidence: {parsed_lease.confidence:.3f}")
        print(f"📋 Property: {parsed_lease.property_address}")
        print(f"👤 Parties: {len(parsed_lease.parties)} found")
        print(f"💰 Rent: {parsed_lease.monthly_rent}€")
        return parsed_lease
    except Exception as e:
        print(f"❌ Parsing failed: {e}")
        return None

async def test_entity_matching():
    """Test le matching d'entités"""
    print("\n🔍 Testing entity matching...")
    
    try:
        entity_service = get_entity_matching_service()
        
        # Test property matching
        property_data = {
            "address": "123 Rue de la Paix",
            "zip": "75001",
            "city": "Paris"
        }
        
        property_match = entity_service.match_property(property_data)
        if property_match:
            print(f"✅ Property matched: {property_match.name} (confidence: {property_match.confidence:.3f})")
        else:
            print("⚠️ No property match found")
        
        # Test landlord matching
        landlord_data = {
            "name": "Jean Dupont",
            "email": "jean.dupont@email.com"
        }
        
        landlord_match = entity_service.match_landlord(landlord_data)
        if landlord_match:
            print(f"✅ Landlord matched: {landlord_match.name} (confidence: {landlord_match.confidence:.3f})")
        else:
            print("⚠️ No landlord match found")
            
    except Exception as e:
        print(f"❌ Entity matching failed: {e}")

async def test_annex_processing():
    """Test le traitement des annexes"""
    print("\n📄 Testing annex processing...")
    
    try:
        # Test inventory annex
        inventory_text = """
        ÉTAT DES LIEUX D'ENTRÉE
        
        Date: 1 janvier 2024
        Type: Entrée
        
        Pièces:
        - Salon: Bon état
        - Chambre 1: Bon état
        - Cuisine: État moyen
        
        Compteurs:
        Électricité: 12345 kWh
        Eau: 456 m³
        
        Clés: 3 clés remises
        """
        
        annex_info = await annex_processing_service.process_annex(
            annex_id="test_inventory",
            text=inventory_text,
            filename="etat_des_lieux.pdf"
        )
        
        print(f"✅ Annex processed: {annex_info.annex_type}")
        print(f"📊 Confidence: {annex_info.confidence:.3f}")
        print(f"📋 Extracted fields: {len(annex_info.extracted_data)}")
        
    except Exception as e:
        print(f"❌ Annex processing failed: {e}")

async def test_enrichment():
    """Test l'enrichissement complet"""
    print("\n🎯 Testing full enrichment...")
    
    try:
        parsed_lease = await test_parsing()
        if not parsed_lease:
            return
        
        enrichment_service = get_lease_enrichment_service()
        
        result = enrichment_service.enrich_lease(
            lease_text="Sample lease text",
            existing_lease_json=None,
            parsed_lease=parsed_lease,
            annexes=[]
        )
        
        print(f"✅ Enrichment completed")
        print(f"🔍 Resolved entities: {result.resolved_entities}")
        print(f"📝 New fields: {result.new_fields}")
        print(f"🔧 Updated fields: {result.updated_fields}")
        print(f"📊 Debug info: {result.debug_info}")
        
    except Exception as e:
        print(f"❌ Enrichment failed: {e}")

async def main():
    """Fonction principale de test"""
    print("🧪 Starting Lease Enrichment System Tests")
    print("=" * 50)
    
    await test_parsing()
    await test_entity_matching()
    await test_annex_processing()
    await test_enrichment()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
