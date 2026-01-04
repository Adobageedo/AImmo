#!/usr/bin/env python3
"""
Test script for batch vectorization of documents.
Usage:
    python scripts/test_vectorization_batch.py <org_id>                    # All non-vectorized docs
    python scripts/test_vectorization_batch.py <org_id> --force            # All docs (re-vectorize)
    python scripts/test_vectorization_batch.py <org_id> --limit 10         # First 10 docs
    python scripts/test_vectorization_batch.py <org_id> --doc-type lease   # Only lease docs
"""

import sys
import os
from pathlib import Path
import argparse
from typing import List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.supabase import get_supabase
from app.services.vectorization import vectorization_orchestrator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)


def get_documents_to_vectorize(
    organization_id: str,
    force: bool = False,
    limit: int = None,
    document_type: str = None
) -> List[str]:
    """Get list of document IDs to vectorize."""
    supabase = get_supabase()
    
    try:
        # Build query
        query = supabase.table("documents").select("id, title, document_type, vectorization_status").eq(
            "organization_id", organization_id
        )
        
        # Filter by document type
        if document_type:
            query = query.eq("document_type", document_type)
        
        # Filter by vectorization status
        if not force:
            query = query.neq("vectorization_status", "vectorized")
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        
        if not result.data:
            logger.warning("No documents found matching criteria")
            return []
        
        logger.info(f"Found {len(result.data)} documents to vectorize:")
        for doc in result.data:
            status = doc.get('vectorization_status', 'not_planned')
            logger.info(f"  - {doc['title'][:50]} ({doc['document_type']}) [{status}]")
        
        return [doc['id'] for doc in result.data]
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        return []


def test_batch_vectorization(
    organization_id: str,
    force: bool = False,
    limit: int = None,
    document_type: str = None
):
    """Test batch vectorization."""
    logger.info("=" * 70)
    logger.info("🧪 TESTING BATCH DOCUMENT VECTORIZATION")
    logger.info("=" * 70)
    logger.info(f"Organization ID: {organization_id}")
    logger.info(f"Force re-vectorization: {force}")
    logger.info(f"Limit: {limit if limit else 'No limit'}")
    logger.info(f"Document type filter: {document_type if document_type else 'All types'}")
    logger.info("=" * 70 + "\n")
    
    try:
        # Get documents to vectorize
        logger.info("📋 Fetching documents...")
        document_ids = get_documents_to_vectorize(
            organization_id,
            force=force,
            limit=limit,
            document_type=document_type
        )
        
        if not document_ids:
            logger.warning("\n⚠️  No documents to vectorize")
            return 0
        
        logger.info(f"\n🚀 Starting batch vectorization of {len(document_ids)} documents...")
        logger.info("This may take several minutes...\n")
        
        # Vectorize batch
        results = vectorization_orchestrator.vectorize_documents_batch(
            document_ids=document_ids,
            force=force
        )
        
        # Display results
        logger.info("\n" + "=" * 70)
        logger.info("📊 BATCH VECTORIZATION RESULTS")
        logger.info("=" * 70)
        logger.info(f"Total documents: {results['total']}")
        logger.info(f"✅ Successful: {results['success']}")
        logger.info(f"❌ Failed: {results['failed']}")
        logger.info(f"⏭️  Skipped: {results['skipped']}")
        
        success_rate = (results['success'] / results['total'] * 100) if results['total'] > 0 else 0
        logger.info(f"\nSuccess rate: {success_rate:.1f}%")
        
        # Show failed documents
        if results['failed'] > 0:
            logger.info("\n" + "=" * 70)
            logger.info("❌ FAILED DOCUMENTS")
            logger.info("=" * 70)
            for doc_result in results['documents']:
                if not doc_result['success'] and not doc_result.get('skipped'):
                    logger.error(f"Document {doc_result['document_id']}: {doc_result.get('error', 'Unknown error')}")
        
        # Get updated stats
        logger.info("\n" + "=" * 70)
        logger.info("📈 ORGANIZATION STATISTICS")
        logger.info("=" * 70)
        stats = vectorization_orchestrator.get_vectorization_stats(organization_id)
        
        if 'document_counts' in stats:
            counts = stats['document_counts']
            logger.info("Document status breakdown:")
            for status, count in counts.items():
                logger.info(f"  {status}: {count}")
        
        if 'qdrant' in stats:
            qdrant_stats = stats['qdrant']
            logger.info(f"\nQdrant collections: {qdrant_stats.get('total_collections', 0)}")
            logger.info(f"Total vectors: {qdrant_stats.get('total_vectors', 0)}")
        
        logger.info("\n" + "=" * 70)
        logger.info("🎉 BATCH PROCESSING COMPLETE")
        logger.info("=" * 70)
        
        return 0 if results['failed'] == 0 else 1
        
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
        description="Test batch vectorization of documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s org-uuid-123                          # Vectorize all non-vectorized docs
  %(prog)s org-uuid-123 --force                  # Re-vectorize all docs
  %(prog)s org-uuid-123 --limit 10               # Vectorize first 10 docs
  %(prog)s org-uuid-123 --doc-type lease         # Only lease documents
  %(prog)s org-uuid-123 --doc-type lease --limit 5  # First 5 lease docs
        """
    )
    
    parser.add_argument(
        'organization_id',
        type=str,
        help='UUID of the organization'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force re-vectorization of all documents (including already vectorized)'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        help='Maximum number of documents to process'
    )
    
    parser.add_argument(
        '--doc-type',
        type=str,
        choices=['bail', 'facture', 'avis_echeance', 'diagnostic', 'rapport_financier', 'autre'],
        help='Filter by document type'
    )
    
    args = parser.parse_args()
    
    return test_batch_vectorization(
        args.organization_id,
        force=args.force,
        limit=args.limit,
        document_type=args.doc_type
    )


if __name__ == "__main__":
    sys.exit(main())
