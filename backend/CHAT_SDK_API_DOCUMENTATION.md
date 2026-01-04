# Chat SDK API Documentation

Documentation complète de l'API Chat SDK pour le frontend Next.js.

## 🎯 Vue d'ensemble

L'API Chat SDK fournit toutes les fonctionnalités nécessaires pour le SDK Chat UI immobilier:
- **Chat streaming SSE** avec RAG multi-sources
- **Gestion des conversations** avec pagination
- **Recherche RAG** avec Row-Level Security
- **Canvas & Artifacts** (tables, charts, documents)
- **Exports** (Excel, PDF)
- **Suggestions contextuelles**

## 🔐 Authentification

Toutes les routes (sauf `/sdk/suggestions/`) requièrent l'authentification Supabase JWT.

**Header requis:**
```http
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```

Le token JWT Supabase de l'utilisateur connecté est utilisé pour:
- Authentification
- Isolation multi-tenant
- Permissions RAG (Row-Level Security)

## 📡 Base URL

```
http://localhost:8000/api/v1/sdk
```

---

## 1️⃣ CONVERSATIONS

### `POST /sdk/chat/conversations`
Crée une nouvelle conversation.

**Request:**
```json
{
  "title": "Analyse des baux",
  "organization_id": "uuid",
  "initial_message": "Bonjour" // optionnel
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Analyse des baux",
  "organization_id": "uuid",
  "user_id": "uuid",
  "messages_count": 0,
  "last_message_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### `GET /sdk/chat/conversations?organization_id=uuid&page=1&page_size=20`
Liste les conversations avec pagination.

**Response:**
```json
{
  "conversations": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### `GET /sdk/chat/conversations/{conversation_id}`
Récupère une conversation avec ses messages.

**Response:**
```json
{
  "id": "uuid",
  "title": "Analyse des baux",
  "organization_id": "uuid",
  "user_id": "uuid",
  "messages_count": 5,
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Bonjour",
      "citations": [],
      "artifacts": [],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### `PATCH /sdk/chat/conversations/{conversation_id}`
Renomme une conversation.

**Request:**
```json
{
  "title": "Nouveau titre"
}
```

### `DELETE /sdk/chat/conversations/{conversation_id}`
Supprime une conversation et tous ses messages/artefacts.

**Response:** `204 No Content`

---

## 2️⃣ MESSAGES

### `GET /sdk/chat/conversations/{conversation_id}/messages?limit=100&offset=0`
Récupère les messages d'une conversation.

### `DELETE /sdk/chat/messages/{message_id}`
Supprime un message.

### `POST /sdk/chat/messages/{message_id}/retry`
Retry un message (supprime la réponse assistant pour régénérer).

---

## 3️⃣ CHAT & STREAMING

### `POST /sdk/chat/chat` (Non-streaming)
Envoie un message et reçoit une réponse complète.

**Request:**
```json
{
  "conversation_id": "uuid",
  "message": "Quels sont mes baux actifs ?",
  "mode": "rag_enhanced",  // normal, rag_only, rag_enhanced
  "source_types": ["documents", "leases"],
  "include_citations": true,
  "max_citations": 5
}
```

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "assistant",
    "content": "Voici vos baux actifs...",
    "citations": [
      {
        "id": "uuid",
        "chunk_id": "uuid",
        "document_id": "uuid",
        "document_title": "Bail Paris",
        "content_preview": "...",
        "source_type": "leases",
        "relevance_score": 0.95
      }
    ],
    "artifacts": [],
    "created_at": "2024-01-01T00:00:00Z"
  },
  "citations": [...],
  "artifacts": [],
  "processing_time_ms": 1234
}
```

### `POST /sdk/chat/chat/stream` (Streaming SSE) ⭐
Envoie un message et reçoit une réponse en streaming.

**Request:** Identique à `/chat`

**Response:** Server-Sent Events (SSE)

**Format des événements:**
```
data: {"event":"chunk","content":"Voici","done":false}
data: {"event":"chunk","content":" vos","done":false}
data: {"event":"citation","citation":{...},"done":false}
data: {"event":"artifact","artifact":{...},"done":false}
data: {"event":"done","done":true}
```

**Types d'événements:**
- `chunk`: Contenu token-by-token
- `citation`: Citation/source trouvée
- `artifact`: Artefact généré (table, chart)
- `done`: Fin du stream
- `error`: Erreur survenue

**Frontend (EventSource):**
```typescript
const eventSource = new EventSource('/api/v1/sdk/chat/chat/stream', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.event === 'chunk') {
    // Ajouter le contenu progressivement
    setStreamingContent(prev => prev + data.content);
  } else if (data.event === 'citation') {
    // Ajouter la citation
    setCitations(prev => [...prev, data.citation]);
  } else if (data.event === 'done') {
    // Stream terminé
    eventSource.close();
  }
};
```

---

## 4️⃣ RAG MULTI-SOURCES

### `POST /sdk/rag/search`
Recherche multi-sources avec RAG.

**Request:**
```json
{
  "query": "bail paris loyer",
  "organization_id": "uuid",
  "source_types": ["documents", "leases", "properties"],
  "document_ids": ["uuid1", "uuid2"],  // optionnel
  "limit": 10,
  "min_score": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "document_title": "Bail Paris 15e",
      "content": "Le loyer mensuel est de...",
      "score": 0.95,
      "source_type": "leases",
      "metadata": {
        "property_id": "uuid",
        "start_date": "2023-01-01"
      }
    }
  ],
  "total": 5,
  "query": "bail paris loyer",
  "processing_time_ms": 234
}
```

### `POST /sdk/rag/index/document/{document_id}`
Indexe un document dans le RAG.

### `POST /sdk/rag/index/lease/{lease_id}`
Indexe un bail dans le RAG.

### `POST /sdk/rag/index/property/{property_id}`
Indexe une propriété dans le RAG.

### `DELETE /sdk/rag/index/document/{document_id}`
Supprime l'indexation d'un document.

### `POST /sdk/rag/exclude/{document_id}?excluded=true`
Exclut ou inclut un document du RAG.

### `GET /sdk/rag/stats/{organization_id}`
Récupère les statistiques RAG.

**Response:**
```json
{
  "total_chunks": 1234,
  "by_source_type": {
    "documents": 500,
    "leases": 300,
    "properties": 434
  },
  "excluded_chunks": 50
}
```

---

## 5️⃣ CANVAS & ARTIFACTS

### `POST /sdk/canvas/artifacts`
Crée un nouvel artefact.

**Request:**
```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",  // optionnel
  "type": "table",  // table, chart, document, code
  "title": "Tableau des baux",
  "content": {
    "headers": ["Propriété", "Loyer", "Date"],
    "rows": [
      ["Paris 15e", "1500€", "2023-01-01"],
      ["Lyon 2e", "1200€", "2023-02-01"]
    ]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "message_id": "uuid",
  "type": "table",
  "title": "Tableau des baux",
  "content": {...},
  "metadata": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### `GET /sdk/canvas/artifacts/{artifact_id}`
Récupère un artefact.

### `GET /sdk/canvas/conversations/{conversation_id}/artifacts?artifact_type=table`
Liste les artefacts d'une conversation.

### `PATCH /sdk/canvas/artifacts/{artifact_id}`
Met à jour un artefact.

**Request:**
```json
{
  "title": "Nouveau titre",
  "content": {...}
}
```

### `DELETE /sdk/canvas/artifacts/{artifact_id}`
Supprime un artefact.

### `POST /sdk/canvas/sync`
Synchronise les artefacts du Canvas.

**Request:**
```json
{
  "conversation_id": "uuid",
  "artifacts": [
    {
      "id": "uuid",  // si existant
      "type": "table",
      "title": "Tableau",
      "content": {...}
    },
    {
      // sans id = nouvel artefact
      "type": "chart",
      "title": "Graphique",
      "content": {...}
    }
  ]
}
```

### `GET /sdk/canvas/{conversation_id}`
Récupère l'état complet du Canvas.

---

## 6️⃣ EXPORTS

### `POST /sdk/export/conversation/excel`
Exporte une conversation en Excel.

**Request:**
```json
{
  "conversation_id": "uuid",
  "include_citations": true
}
```

**Response:** Fichier `.xlsx` directement téléchargeable

### `POST /sdk/export/conversation/pdf`
Exporte une conversation en PDF.

**Response:** Fichier `.pdf` directement téléchargeable

### `POST /sdk/export/artifact/{artifact_id}/excel`
Exporte un artefact de type table en Excel.

### `POST /sdk/export/artifacts/bulk/excel`
Exporte plusieurs artefacts dans un fichier Excel.

**Request:**
```json
{
  "artifact_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### `POST /sdk/export/markdown`
Exporte du contenu Markdown en HTML.

**Request:**
```json
{
  "content": "# Titre\n\nContenu markdown..."
}
```

---

## 7️⃣ SUGGESTIONS

### `GET /sdk/suggestions/?count=5` (Public)
Récupère des suggestions générales (pas d'auth requise).

**Response:**
```json
[
  {
    "id": "lease_summary_1",
    "category": "lease_analysis",
    "title": "Résumé des baux",
    "prompt": "Peux-tu me donner un résumé de tous mes baux actifs ?",
    "icon": "📄",
    "description": "Obtenir une vue d'ensemble des baux"
  }
]
```

### `POST /sdk/suggestions/contextual`
Génère des suggestions contextuelles.

**Request:**
```json
{
  "conversation_id": "uuid",  // optionnel
  "organization_id": "uuid",
  "count": 5
}
```

**Response:**
```json
{
  "suggestions": [...],
  "context_based": true
}
```

---

## 🔄 Workflow Complet

### Exemple: Chat avec RAG et streaming

```typescript
// 1. Créer une conversation
const conversation = await fetch('/api/v1/sdk/chat/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Nouvelle conversation',
    organization_id: 'uuid'
  })
});

// 2. Envoyer un message avec streaming
const eventSource = new EventSource(
  `/api/v1/sdk/chat/chat/stream?conversation_id=${conversation.id}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleStreamChunk(data);
};

// 3. Créer un artefact depuis la réponse
await fetch('/api/v1/sdk/canvas/artifacts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversation_id: conversation.id,
    type: 'table',
    title: 'Tableau des baux',
    content: tableData
  })
});

// 4. Exporter la conversation
const pdfBlob = await fetch('/api/v1/sdk/export/conversation/pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversation_id: conversation.id,
    include_citations: true
  })
});
```

---

## 🔒 Sécurité & RLS

### Authentification Supabase
- JWT token extrait du header `Authorization: Bearer <token>`
- Validation via `supabase.auth.get_user(token)`
- Extraction de `user_id` pour isolation

### Row-Level Security (RLS)
- Toutes les requêtes filtrent par `organization_id` et `user_id`
- Vérification d'appartenance à l'organisation via `organization_users`
- Permissions RAG vérifiées via Supabase RLS sur chaque source

### Multi-tenant
- Isolation stricte par organisation
- Pas d'accès cross-organization
- Filtrage automatique dans Qdrant par `organization_id`

---

## 📊 Codes de statut HTTP

- `200 OK`: Succès
- `201 Created`: Ressource créée
- `204 No Content`: Suppression réussie
- `400 Bad Request`: Requête invalide
- `401 Unauthorized`: Non authentifié
- `403 Forbidden`: Pas d'accès (mauvaise organisation)
- `404 Not Found`: Ressource introuvable
- `500 Internal Server Error`: Erreur serveur

---

## 🚀 Déploiement

### Variables d'environnement requises

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Qdrant
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=xxx
QDRANT_COLLECTION=aimmo_documents

# Config
SECRET_KEY=xxx
ALLOWED_ORIGINS=http://localhost:3000,https://app.aimmo.fr
```

### Lancer le serveur

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 📝 Notes importantes

1. **Streaming SSE**: Utiliser `EventSource` côté frontend (pas `fetch`)
2. **Tokens**: Le JWT Supabase doit être rafraîchi régulièrement
3. **Pagination**: Toujours utiliser `page` et `page_size` pour les listes
4. **RAG**: Les chunks sont indexés automatiquement à l'upload de documents
5. **Canvas**: La synchronisation doit être appelée après modifications client
6. **Exports**: Les fichiers sont retournés directement (pas d'URLs signées)
