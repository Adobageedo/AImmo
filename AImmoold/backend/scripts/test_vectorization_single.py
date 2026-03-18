#!/usr/bin/env python3
"""
Test script for vectorizing a single document.
Usage:
    python scripts/test_vectorization_single.py <document_id>
    python scripts/test_vectorization_single.py <document_id> --force
"""

import sys
import os
from pathlib import Path
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vectorization import vectorization_orchestrator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)


def test_single_document(document_id: str, force: bool = False):
    """Test vectorization of a single document."""
    logger.info("=" * 70)
    logger.info("🧪 TESTING SINGLE DOCUMENT VECTORIZATION")
    logger.info("=" * 70)
    logger.info(f"Document ID: {document_id}")
    logger.info(f"Force re-vectorization: {force}")
    logger.info("=" * 70 + "\n")
    
    try:
        # Get document info
        doc_info = vectorization_orchestrator.get_document_file_path(document_id)
        if not doc_info:
            logger.error(f"❌ Document {document_id} not found")
            return 1
        
        logger.info(f"📄 Document: {doc_info['title']}")
        logger.info(f"   Organization: {doc_info['organization_id']}")
        logger.info(f"   Type: {doc_info.get('document_type', 'general')}")
        logger.info(f"   File: {doc_info['file_path']}\n")
        
        # Vectorize
        logger.info("🚀 Starting vectorization...")
        result = vectorization_orchestrator.vectorize_document(
            document_id=document_id,
            force=force
        )
        
        logger.info("\n" + "=" * 70)
        if result["success"]:
            if result.get("skipped"):
                logger.info("⏭️  DOCUMENT ALREADY VECTORIZED")
                logger.info("=" * 70)
                logger.info("Use --force to re-vectorize")
            else:
                logger.info("✅ VECTORIZATION SUCCESSFUL")
                logger.info("=" * 70)
                logger.info(f"Chunks created: {result.get('num_chunks', 0)}")
                logger.info(f"Collection: {result.get('collection_name', 'N/A')}")
                if result.get('stats'):
                    stats = result['stats']
                    logger.info(f"Processed: {stats['processed']}/{stats['total']} chunks")
                    logger.info(f"Errors: {stats['errors']}")
        else:
            logger.error("❌ VECTORIZATION FAILED")
            logger.error("=" * 70)
            logger.error(f"Error: {result.get('error', 'Unknown error')}")
            return 1
        
        logger.info("\n" + "=" * 70)
        logger.info("📊 NEXT STEPS")
        logger.info("=" * 70)
        logger.info("1. Check document status in database:")
        logger.info(f"   SELECT vectorization_status, num_chunks FROM documents WHERE id='{document_id}';")
        logger.info("\n2. View in Qdrant:")
        logger.info(f"   Collection: {result.get('collection_name', 'N/A')}")
        logger.info("\n3. Test in frontend:")
        logger.info("   Go to /dashboard/documents and check the vectorization badge")
        
        return 0
        
    except Exception as e:
        logger.error("\n" + "=" * 70)
        logger.error("❌ UNEXPECTED ERROR")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test vectorization of a single document",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s abc123-def456-ghi789              # Vectorize document
  %(prog)s abc123-def456-ghi789 --force      # Force re-vectorization
        """
    )
    
    parser.add_argument(
        'document_id',
        type=str,
        help='UUID of the document to vectorize'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force re-vectorization even if already vectorized'
    )
    
    args = parser.parse_args()
    
    return test_single_document(args.document_id, args.force)


if __name__ == "__main__":
    sys.exit(main())
