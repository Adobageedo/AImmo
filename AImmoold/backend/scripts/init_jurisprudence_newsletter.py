#!/usr/bin/env python3
"""
Initialize the Jurisprudence Newsletter in Supabase.
This script creates the newsletter entry if it doesn't exist.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.supabase import get_supabase
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_jurisprudence_newsletter():
    """Initialize the Jurisprudence Newsletter in Supabase."""
    supabase = get_supabase()
    
    # Check if newsletter already exists
    try:
        result = supabase.table("newsletters").select("*").eq(
            "slug", "jurisprudence-immobiliere"
        ).execute()
        
        if result.data:
            logger.info(f"✅ Jurisprudence newsletter already exists: {result.data[0]['id']}")
            logger.info(f"   Title: {result.data[0]['title']}")
            logger.info(f"   Active: {result.data[0]['is_active']}")
            return result.data[0]['id']
    except Exception as e:
        logger.error(f"❌ Error checking existing newsletter: {e}")
        return None
    
    # Create newsletter
    newsletter_data = {
        "slug": "jurisprudence-immobiliere",
        "title": "Jurisprudence Immobilière",
        "description": "Newsletter hebdomadaire automatique des dernières décisions de jurisprudence en matière immobilière, analysées et résumées par IA.",
        "theme": "actualites",
        "frequency": "weekly",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    try:
        result = supabase.table("newsletters").insert(newsletter_data).execute()
        
        if result.data:
            newsletter_id = result.data[0]['id']
            logger.info(f"✅ Jurisprudence newsletter created successfully!")
            logger.info(f"   ID: {newsletter_id}")
            logger.info(f"   Title: {result.data[0]['title']}")
            logger.info(f"   Slug: {result.data[0]['slug']}")
            logger.info(f"   Frequency: {result.data[0]['frequency']}")
            return newsletter_id
        else:
            logger.error("❌ Failed to create newsletter (no data returned)")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error creating newsletter: {e}")
        return None


def main():
    """Main entry point."""
    logger.info("=" * 70)
    logger.info("INITIALIZING JURISPRUDENCE NEWSLETTER")
    logger.info("=" * 70)
    
    newsletter_id = init_jurisprudence_newsletter()
    
    if newsletter_id:
        logger.info("\n" + "=" * 70)
        logger.info("✅ INITIALIZATION COMPLETE")
        logger.info("=" * 70)
        logger.info(f"\nNewsletter ID: {newsletter_id}")
        logger.info("\nYou can now generate newsletters using:")
        logger.info("  python scripts/test_jurisprudence_newsletter.py")
        logger.info("\nOr via API:")
        logger.info("  POST /api/v1/jurisprudence/generate")
        return 0
    else:
        logger.error("\n" + "=" * 70)
        logger.error("❌ INITIALIZATION FAILED")
        logger.error("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
