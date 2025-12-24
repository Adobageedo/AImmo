# 🧠 Document Vectorization System

## 📖 Overview

System for automatic document vectorization and storage in Qdrant vector database. Documents are chunked, embedded with OpenAI, and organized in collections per organization and document type for efficient RAG (Retrieval Augmented Generation).

## 🎯 Features

### ✅ Implemented

- **Automatic Chunking**: Documents split into optimal chunks (1000 chars, 200 overlap)
- **OpenAI Embeddings**: text-embedding-3-small (1536 dimensions)
- **Qdrant Collections**: Organized as `org_{organization_id}_{document_type}`
- **Status Tracking**: Real-time status in database (not_planned, planned, in_progress, vectorized, error, waiting)
- **Batch Processing**: Vectorize multiple documents efficiently
- **Content Hash**: Detect document changes to avoid re-processing
- **Background Jobs**: Asynchronous processing via FastAPI BackgroundTasks
- **Multi-format Support**: PDF, DOCX, TXT, MD, PPT, CSV, XLSX, etc.
- **Error Handling**: Retry logic, fallback processors, detailed error messages

### 📊 Collection Organization

Collections are automatically created per organization and document type:

```
org_{organization_id}_lease      → Lease documents
org_{organization_id}_property   → Property documents  
org_{organization_id}_owner      → Owner documents
org_{organization_id}_tenant     → Tenant documents
org_{organization_id}_general    → Other documents
```

This separation allows:
- **Targeted Search**: Query only relevant document types
- **Access Control**: Organization-level isolation
- **Better Performance**: Smaller, focused collections

## 🚀 Architecture

### Services

1. **QdrantService** (`qdrant_service.py`)
   - Manages Qdrant client and collections
   - Creates collections with proper naming
   - Adds/deletes vectors
   - Collection statistics

2. **ChunkingService** (`chunking_service.py`)
   - Loads documents using Langchain loaders
   - Splits into chunks with RecursiveCharacterTextSplitter
   - Computes file hashes for change detection
   - Supports 12+ file formats

3. **EmbeddingService** (`embedding_service.py`)
   - Generates embeddings via OpenAI API
   - Handles batch processing
   - Error handling with retries

4. **VectorizationOrchestrator** (`vectorization_orchestrator.py`)
   - Coordinates the full workflow
   - Updates database status
   - Manages vectorization jobs
   - Batch operations

### Database Schema

#### documents table (new columns)

```sql
vectorization_status TEXT         -- not_planned, planned, in_progress, vectorized, error, waiting
vectorization_started_at TIMESTAMP
vectorization_completed_at TIMESTAMP
vectorization_error TEXT
qdrant_collection_name TEXT
num_chunks INTEGER
content_hash TEXT                 -- SHA-256 hash for change detection
```

#### vectorization_jobs table (new)

```sql
id UUID PRIMARY KEY
document_id UUID                  -- FK to documents
organization_id UUID              -- FK to organizations
status TEXT                       -- pending, processing, completed, failed
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT
num_chunks_processed INTEGER
retry_count INTEGER
metadata JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 📡 API Endpoints

### Vectorize Single Document (Async)

```bash
POST /api/v1/vectorization/vectorize
Content-Type: application/json
Authorization: Bearer {token}

{
  "document_id": "uuid",
  "force": false
}
```

Returns immediately, processing in background.

### Vectorize Single Document (Sync)

```bash
POST /api/v1/vectorization/vectorize/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "document_id": "uuid",
  "force": false
}
```

Waits for completion (may take several minutes).

### Vectorize Batch

```bash
POST /api/v1/vectorization/vectorize/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "document_ids": ["uuid1", "uuid2", ...],
  "force": false
}
```

### Vectorize All Documents in Organization

```bash
POST /api/v1/vectorization/organization/{organization_id}/vectorize-all?force=false
Authorization: Bearer {token}
```

### Delete Document Vectors

```bash
DELETE /api/v1/vectorization/document/{document_id}/vectors
Authorization: Bearer {token}
```

### Get Vectorization Stats

```bash
GET /api/v1/vectorization/stats/{organization_id}
Authorization: Bearer {token}
```

Returns:
```json
{
  "organization_id": "uuid",
  "document_counts": {
    "not_planned": 10,
    "planned": 5,
    "in_progress": 2,
    "vectorized": 100,
    "error": 3,
    "waiting": 0
  },
  "qdrant": {
    "total_collections": 5,
    "total_vectors": 1234,
    "collections": {
      "org_uuid_lease": 456,
      "org_uuid_property": 789
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI (required)
OPENAI_API_KEY=sk-...

# Qdrant (required)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_key  # Optional for cloud Qdrant
```

### Chunking Parameters

Default values in `ChunkingService`:
```python
chunk_size = 1000        # Characters per chunk
chunk_overlap = 200      # Overlap between chunks
```

### Batch Size

Default batch size for Qdrant insertion: **10 documents**

Adjust in `QdrantService.add_documents()` or API calls.

## 🧪 Usage Examples

### 1. Vectorize a Document After Upload

```python
from app.services.vectorization import vectorization_orchestrator

# After document upload
result = vectorization_orchestrator.vectorize_document(
    document_id="uuid",
    force=False
)

if result["success"]:
    print(f"Vectorized: {result['num_chunks']} chunks")
    print(f"Collection: {result['collection_name']}")
else:
    print(f"Error: {result['error']}")
```

### 2. Check Vectorization Status

```python
from app.core.supabase import get_supabase

supabase = get_supabase()
doc = supabase.table("documents").select("*").eq("id", document_id).single().execute()

print(f"Status: {doc.data['vectorization_status']}")
print(f"Chunks: {doc.data['num_chunks']}")
print(f"Collection: {doc.data['qdrant_collection_name']}")
```

### 3. Programmatic Batch Vectorization

```python
from app.services.vectorization import vectorization_orchestrator

document_ids = ["uuid1", "uuid2", "uuid3"]

results = vectorization_orchestrator.vectorize_documents_batch(
    document_ids=document_ids,
    force=False
)

print(f"Success: {results['success']}")
print(f"Failed: {results['failed']}")
print(f"Skipped: {results['skipped']}")
```

### 4. Get Organization Stats

```python
from app.services.vectorization import vectorization_orchestrator

stats = vectorization_orchestrator.get_vectorization_stats(organization_id)
print(stats)
```

## 📱 Frontend Integration

### Display Vectorization Status Badge

```tsx
const statusColors = {
  not_planned: 'gray',
  planned: 'blue',
  in_progress: 'yellow',
  vectorized: 'green',
  error: 'red',
  waiting: 'orange'
};

<Badge color={statusColors[document.vectorization_status]}>
  {document.vectorization_status}
</Badge>
```

### Trigger Vectorization

```tsx
const vectorizeDocument = async (documentId: string) => {
  const response = await fetch('/api/v1/vectorization/vectorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      document_id: documentId,
      force: false
    })
  });
  
  const result = await response.json();
  console.log('Vectorization started:', result);
};
```

### Poll Status Updates

```tsx
const checkStatus = async (documentId: string) => {
  const response = await fetch(`/api/v1/documents/${documentId}`);
  const doc = await response.json();
  return doc.vectorization_status;
};

// Poll every 5 seconds
const interval = setInterval(async () => {
  const status = await checkStatus(documentId);
  if (status === 'vectorized' || status === 'error') {
    clearInterval(interval);
  }
}, 5000);
```

## 🔍 Supported File Types

| Extension | Loader | Fallback |
|-----------|--------|----------|
| `.pdf` | PyPDFLoader | UnstructuredPDFLoader |
| `.docx`, `.doc` | Docx2txtLoader | UnstructuredWordDocumentLoader |
| `.txt` | TextLoader | - |
| `.md`, `.markdown` | UnstructuredMarkdownLoader | TextLoader |
| `.pptx`, `.ppt` | UnstructuredPowerPointLoader | - |
| `.csv` | pandas | TextLoader |
| `.xlsx`, `.xls`, `.xlsm` | UnstructuredExcelLoader | pandas |

## ⚠️ Error Handling

### Common Errors

1. **"Document not found"**
   - Document doesn't exist in database
   - Check document_id

2. **"OPENAI_API_KEY not configured"**
   - Missing API key in .env
   - Add `OPENAI_API_KEY=sk-...`

3. **"Failed to load document"**
   - Unsupported file type
   - Corrupted file
   - Check file integrity

4. **"Qdrant connection failed"**
   - Qdrant server not running
   - Wrong URL or API key
   - Check `QDRANT_URL` and `QDRANT_API_KEY`

### Retry Logic

- Documents in `error` state can be re-vectorized with `force=true`
- Failed batches continue processing other documents
- Automatic retry on transient OpenAI API errors

## 📊 Performance

### Benchmarks (Approximate)

- **Small PDF (5 pages)**: ~30 seconds
- **Large PDF (100 pages)**: ~5-10 minutes
- **DOCX (50 pages)**: ~2-3 minutes
- **Batch (10 documents)**: ~5-15 minutes

Factors:
- Document size and complexity
- OpenAI API rate limits
- Network latency
- Qdrant server performance

### Optimization Tips

1. **Use Batch Processing**: More efficient than individual calls
2. **Set `force=false`**: Avoid re-processing unchanged documents
3. **Background Jobs**: Don't block user interface
4. **Monitor Errors**: Fix problematic documents to avoid retries

## 🔐 Security

- **RLS Policies**: Users can only vectorize their organization's documents
- **Access Verification**: All endpoints check user membership
- **Collection Isolation**: Each organization has separate collections
- **No Cross-Org Access**: Impossible to query other organizations' vectors

## 🚧 Future Enhancements

### Planned

1. **Scheduler**: Automatic vectorization of new documents
2. **Webhooks**: Notify on completion/errors
3. **Custom Embeddings**: Support for other embedding models
4. **Advanced Chunking**: Semantic chunking, page boundaries
5. **OCR Support**: For scanned PDFs
6. **Vector Search API**: Query endpoints for RAG
7. **Analytics Dashboard**: Visualization of vectorization metrics

## 📞 Troubleshooting

### Check System Status

```bash
# Check Qdrant connection
curl http://localhost:6333/collections

# Check vectorization stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/vectorization/stats/{org_id}
```

### View Logs

```bash
# Backend logs
tail -f backend/logs/app.log | grep vectorization

# Check document status in database
psql -c "SELECT id, title, vectorization_status, num_chunks FROM documents WHERE organization_id='org_id';"
```

### Reset Failed Documents

```sql
-- Reset error status to allow retry
UPDATE documents 
SET vectorization_status = 'not_planned',
    vectorization_error = NULL
WHERE vectorization_status = 'error' 
  AND organization_id = 'your_org_id';
```

## 📚 Additional Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Langchain Document Loaders](https://python.langchain.com/docs/modules/data_connection/document_loaders/)
- [RecursiveCharacterTextSplitter](https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/recursive_text_splitter)
