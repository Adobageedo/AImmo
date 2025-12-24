# 🧪 Vectorization Testing Guide

## Quick Start

### 1. Test Single Document

```bash
cd backend

# Get a document ID from your database
python scripts/test_vectorization_single.py <document_id>

# Force re-vectorization
python scripts/test_vectorization_single.py <document_id> --force
```

**Example output:**
```
======================================================================
🧪 TESTING SINGLE DOCUMENT VECTORIZATION
======================================================================
Document ID: abc123-def456-ghi789
Force re-vectorization: False
======================================================================

📄 Document: Bail Commercial 2024.pdf
   Organization: org-uuid-123
   Type: lease
   File: /path/to/file.pdf

🚀 Starting vectorization...
Chunking document: Bail Commercial 2024.pdf
Generated 45 chunks
Adding chunks to Qdrant collection: org_org-uuid-123_lease
Batch 1/5: 10 docs, 12,450 chars (avg 1245 chars/doc)
...

======================================================================
✅ VECTORIZATION SUCCESSFUL
======================================================================
Chunks created: 45
Collection: org_org-uuid-123_lease
Processed: 45/45 chunks
Errors: 0
```

### 2. Test Batch Processing

```bash
# Vectorize all non-vectorized documents in an organization
python scripts/test_vectorization_batch.py <organization_id>

# Limit to 10 documents
python scripts/test_vectorization_batch.py <organization_id> --limit 10

# Only lease documents
python scripts/test_vectorization_batch.py <organization_id> --doc-type lease

# Force re-vectorize all documents
python scripts/test_vectorization_batch.py <organization_id> --force
```

**Example output:**
```
======================================================================
🧪 TESTING BATCH DOCUMENT VECTORIZATION
======================================================================
Organization ID: org-uuid-123
Force re-vectorization: False
Limit: 10
Document type filter: lease
======================================================================

📋 Fetching documents...
Found 10 documents to vectorize:
  - Bail Commercial 2024.pdf (lease) [not_planned]
  - Contrat Location Appartement.pdf (lease) [not_planned]
  ...

🚀 Starting batch vectorization of 10 documents...

======================================================================
📊 BATCH VECTORIZATION RESULTS
======================================================================
Total documents: 10
✅ Successful: 9
❌ Failed: 1
⏭️  Skipped: 0

Success rate: 90.0%

======================================================================
📈 ORGANIZATION STATISTICS
======================================================================
Document status breakdown:
  not_planned: 5
  vectorized: 104
  error: 1

Qdrant collections: 4
Total vectors: 2,345
```

## Frontend UI Testing

### Check Vectorization Badges

1. Navigate to `/dashboard/documents`
2. Upload a document or select existing one
3. Observe the vectorization status badge:

**Badge States:**
- 🔘 **Non planifié** (gray) - Not scheduled
- 🔵 **Planifié** (blue) - Queued
- 🟡 **En cours** (yellow, spinning) - Processing
- 🟢 **Vectorisé** (green) + chunk count - Complete
- 🔴 **Erreur** (red) + error message - Failed
- 🟠 **En attente** (orange) - Waiting

### Trigger Vectorization from UI

**Option 1: Via API (for testing)**
```javascript
// In browser console
const token = localStorage.getItem('auth_token');
const documentId = 'your-doc-id';

fetch('/api/v1/vectorization/vectorize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document_id: documentId,
    force: false
  })
}).then(r => r.json()).then(console.log);
```

**Option 2: Add Vectorize Button (future enhancement)**
```tsx
// In document-list.tsx dropdown menu
<DropdownMenuItem onClick={() => handleVectorize(doc.id)}>
  <Zap className="mr-2 h-4 w-4" />
  Vectoriser
</DropdownMenuItem>
```

## Verify Results

### 1. Check Database

```sql
-- View document status
SELECT 
  id, 
  title, 
  vectorization_status, 
  num_chunks,
  qdrant_collection_name,
  vectorization_error
FROM documents 
WHERE organization_id = 'org-uuid-123'
ORDER BY updated_at DESC
LIMIT 10;

-- Count by status
SELECT 
  vectorization_status, 
  COUNT(*) 
FROM documents 
WHERE organization_id = 'org-uuid-123'
GROUP BY vectorization_status;

-- View vectorization jobs
SELECT 
  j.id,
  d.title,
  j.status,
  j.num_chunks_processed,
  j.started_at,
  j.completed_at,
  j.error_message
FROM vectorization_jobs j
JOIN documents d ON j.document_id = d.id
WHERE j.organization_id = 'org-uuid-123'
ORDER BY j.created_at DESC
LIMIT 10;
```

### 2. Check Qdrant Collections

```bash
# List all collections
curl http://localhost:6333/collections

# Get collection info
curl http://localhost:6333/collections/org_org-uuid-123_lease

# Count vectors
curl http://localhost:6333/collections/org_org-uuid-123_lease | jq '.result.points_count'
```

### 3. Test Vector Search (future)

```python
from app.services.vectorization import qdrant_service, embedding_service

# Generate query embedding
query = "clause de résiliation anticipée"
query_vector = embedding_service.get_embedding(query)

# Search in collection
collection_name = "org_org-uuid-123_lease"
results = qdrant_service.client.search(
    collection_name=collection_name,
    query_vector=query_vector,
    limit=5
)

for result in results:
    print(f"Score: {result.score}")
    print(f"Document: {result.payload.get('title')}")
    print(f"Content: {result.payload.get('page_content')[:200]}...")
    print()
```

## Common Issues & Solutions

### Issue: "Document not found"

**Solution:**
```bash
# Check if document exists
psql -c "SELECT id, title FROM documents WHERE id='your-doc-id';"
```

### Issue: "OPENAI_API_KEY not configured"

**Solution:**
```bash
# Add to .env
echo "OPENAI_API_KEY=sk-your-key" >> .env

# Restart backend
```

### Issue: "Qdrant connection failed"

**Solution:**
```bash
# Check Qdrant is running
curl http://localhost:6333/collections

# Start Qdrant if needed
docker run -p 6333:6333 qdrant/qdrant
```

### Issue: "No chunks generated"

**Possible causes:**
1. Empty or corrupted file
2. Unsupported file format
3. File permissions issue

**Solution:**
```bash
# Check file exists and is readable
ls -lh /path/to/file.pdf

# Check file size
du -h /path/to/file.pdf

# Try with a different document
```

### Issue: Badge not updating in UI

**Solution:**
```javascript
// Refresh document list
window.location.reload();

// Or implement polling
setInterval(() => {
  refreshDocuments();
}, 5000); // Every 5 seconds
```

## Performance Benchmarks

| Document Type | Size | Chunks | Time | Vectors |
|---------------|------|--------|------|---------|
| PDF (5 pages) | 500 KB | 15 | ~30s | 15 |
| PDF (50 pages) | 5 MB | 150 | ~3min | 150 |
| DOCX (20 pages) | 200 KB | 60 | ~1min | 60 |
| CSV (1000 rows) | 100 KB | 30 | ~45s | 30 |
| Batch (10 docs) | Mixed | 500 | ~8min | 500 |

**Factors affecting speed:**
- Document size and complexity
- OpenAI API rate limits (3,500 RPM for embeddings)
- Network latency
- Qdrant server performance

## Automated Testing

### Unit Tests (future)

```python
# tests/test_vectorization.py
import pytest
from app.services.vectorization import chunking_service, embedding_service

def test_chunking_pdf():
    chunks = chunking_service.chunk_document(
        "test_files/sample.pdf",
        {"doc_id": "test-123"}
    )
    assert len(chunks) > 0
    assert all(hasattr(c, 'page_content') for c in chunks)

def test_embedding_generation():
    text = "This is a test document"
    embedding = embedding_service.get_embedding(text)
    assert len(embedding) == 1536  # OpenAI dimension
    assert all(isinstance(x, float) for x in embedding)
```

### Integration Tests

```bash
# Run full integration test
python scripts/test_vectorization_batch.py <org_id> --limit 5

# Check results
python -c "
from app.services.vectorization import vectorization_orchestrator
stats = vectorization_orchestrator.get_vectorization_stats('org_id')
print(f'Vectorized: {stats[\"document_counts\"][\"vectorized\"]}')
"
```

## Monitoring & Logs

### View Logs

```bash
# Backend logs
tail -f backend/logs/app.log | grep vectorization

# Filter by document ID
tail -f backend/logs/app.log | grep "doc-id-123"

# Show only errors
tail -f backend/logs/app.log | grep ERROR | grep vectorization
```

### Monitor Progress

```python
# scripts/monitor_vectorization.py
import time
from app.core.supabase import get_supabase

org_id = "your-org-id"
supabase = get_supabase()

while True:
    result = supabase.table("documents").select(
        "vectorization_status", count="exact"
    ).eq("organization_id", org_id).execute()
    
    # Count by status
    statuses = {}
    for doc in result.data:
        status = doc['vectorization_status']
        statuses[status] = statuses.get(status, 0) + 1
    
    print(f"\rStatus: {statuses}", end="", flush=True)
    time.sleep(2)
```

## Next Steps

1. ✅ Test single document vectorization
2. ✅ Test batch processing
3. ✅ Verify badges in UI
4. 🔜 Implement automatic vectorization on upload
5. 🔜 Add "Vectorize" button in UI
6. 🔜 Implement vector search for RAG
7. 🔜 Add analytics dashboard
