#!/usr/bin/env python3
"""
Test script for generating a jurisprudence newsletter.
Usage:
    python scripts/test_jurisprudence_newsletter.py                  # Last 7 days
    python scripts/test_jurisprudence_newsletter.py --days 14        # Last 14 days
    python scripts/test_jurisprudence_newsletter.py --start 2024-01-01 --end 2024-01-31  # Custom range
"""

import sys
import os
from pathlib import Path
import argparse
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.supabase import get_supabase
from app.services.jurisprudence_newsletter_service import jurisprudence_newsletter_service
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)


def get_newsletter_id():
    """Get the Jurisprudence newsletter ID."""
    supabase = get_supabase()
    
    try:
        result = supabase.table("newsletters").select("id, title").eq(
            "slug", "jurisprudence-immobiliere"
        ).execute()
        
        if not result.data:
            logger.error("❌ Jurisprudence newsletter not found!")
            logger.error("   Please run: python scripts/init_jurisprudence_newsletter.py")
            return None
        
        newsletter = result.data[0]
        logger.info(f"✅ Found newsletter: {newsletter['title']} ({newsletter['id']})")
        return newsletter['id']
        
    except Exception as e:
        logger.error(f"❌ Error fetching newsletter: {e}")
        return None


def test_generate(start_date: str, end_date: str):
    """Test newsletter generation."""
    logger.info("\n" + "=" * 70)
    logger.info("🧪 TESTING JURISPRUDENCE NEWSLETTER GENERATION")
    logger.info("=" * 70)
    logger.info(f"Period: {start_date} → {end_date}")
    logger.info("=" * 70 + "\n")
    
    # Get newsletter ID
    newsletter_id = get_newsletter_id()
    if not newsletter_id:
        return 1
    
    # Generate newsletter
    try:
        logger.info("🚀 Starting newsletter generation...")
        logger.info("   This may take several minutes...\n")
        
        edition_id = jurisprudence_newsletter_service.generate_newsletter(
            start_date,
            end_date,
            newsletter_id
        )
        
        if edition_id:
            logger.info("\n" + "=" * 70)
            logger.info("✅ NEWSLETTER GENERATED SUCCESSFULLY!")
            logger.info("=" * 70)
            logger.info(f"Edition ID: {edition_id}")
            logger.info("\nYou can view it:")
            logger.info(f"  - In Supabase: newsletter_editions table")
            logger.info(f"  - Via API: GET /api/v1/newsletters/jurisprudence-immobiliere/last-edition")
            logger.info(f"  - In frontend: /dashboard/newsletter → Select 'Jurisprudence Immobilière'")
            return 0
        else:
            logger.warning("\n" + "=" * 70)
            logger.warning("⚠️  NO NEWSLETTER CREATED")
            logger.warning("=" * 70)
            logger.warning("Reason: No new real estate articles found for this period")
            logger.warning("\nTry:")
            logger.warning("  - Increasing the lookback period (--days 30)")
            logger.warning("  - Using a different date range (--start --end)")
            return 0
            
    except Exception as e:
        logger.error("\n" + "=" * 70)
        logger.error("❌ ERROR DURING GENERATION")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test jurisprudence newsletter generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Last 7 days
  %(prog)s --days 14                          # Last 14 days
  %(prog)s --days 30                          # Last 30 days
  %(prog)s --start 2024-01-01 --end 2024-01-31  # Custom range
        """
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=7,
        help='Number of days to look back (default: 7)'
    )
    
    parser.add_argument(
        '--start',
        type=str,
        help='Start date (YYYY-MM-DD)'
    )
    
    parser.add_argument(
        '--end',
        type=str,
        help='End date (YYYY-MM-DD)'
    )
    
    args = parser.parse_args()
    
    # Calculate date range
    if args.start and args.end:
        start_date = args.start
        end_date = args.end
    else:
        end = datetime.now()
        start = end - timedelta(days=args.days)
        start_date = start.strftime('%Y-%m-%d')
        end_date = end.strftime('%Y-%m-%d')
    
    return test_generate(start_date, end_date)


if __name__ == "__main__":
    sys.exit(main())
