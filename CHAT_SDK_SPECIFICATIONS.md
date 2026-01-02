# SDK Chat UI Immobilier - Cahier des Charges
## Architecture & Spécifications Complètes

---

## 1. VISION & POSITIONNEMENT

### Objectifs
- SDK modulaire pour intégrations conversationnelles IA
- Streaming natif temps réel
- RAG configurable par utilisateur (sources métier)
- Génération d'artefacts métier (tableaux, exports Excel/PDF)
- Mode Canvas interactif
- DX premium TypeScript-first

### Public cible
- **Frontend Devs** : Intégration rapide React/Next.js
- **Fullstack Teams** : Orchestration LLM + RAG + métier
- **Product SaaS** : Fondation conversationnelle
- **Enterprise** : Contrôle strict, audit, sécurité

### Parité Vercel AI SDK

| Fonctionnalité | Vercel AI | Notre SDK |
|----------------|-----------|-----------|
| Streaming | ✅ | ✅ Optimisé Edge |
| RAG | ❌ | ✅ First-class |
| Citations cliquables | ❌ | ✅ |
| Mode Canvas | ❌ | ✅ |
| Exports Excel/PDF | ❌ | ✅ |
| Pre-call API métier | ⚠️ Custom | ✅ Native |
| Mode strict RAG-only | ❌ | ✅ |

---

## 2. ARCHITECTURE GLOBALE

```
CLIENT (React/Next.js)
├── UI Components (ChatBox, Messages, Sources)
├── Hooks (useChat, useRag, useCanvas)
└── State Management (Zustand + TanStack Query)
    ↓ HTTP/SSE
EDGE/SERVER (Next.js API Routes)
├── Auth & Rate Limiting
├── LLM Orchestration
└── Pre-call API métier
    ↓
RAG LAYER (MCP ou API REST)
├── Vector Search (Pinecone/Qdrant)
├── Reranking
└── Citation Extraction
    ↓
BUSINESS LAYER
├── Lease API
├── Property API
└── KPI/Analytics API
```

### Principes
- **Composable** : Hooks séparés pour composition fine
- **Headless + Opinionated** : UI custom ou composants prêts
- **TypeScript-first** : Types stricts, autocomplete
- **Edge-optimized** : Latence minimale

---

## 3. SDK CORE

### 3.1 Modèles de données

```typescript
interface Conversation {
  id: string
  userId: string
  organizationId?: string
  title: string
  createdAt: Date
  updatedAt: Date
  metadata: {
    model: string
    ragEnabled: boolean
    strictMode: boolean
    sourceTypes: SourceType[]
    messageCount: number
  }
}

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt: Date
  
  // RAG
  sources?: Source[]
  citations?: Citation[]
  
  // Streaming
  streaming?: boolean
  
  // Artefacts (tables, exports)
  artifacts?: Artifact[]
  
  // Metadata
  metadata: {
    model?: string
    tokensUsed?: number
    latencyMs?: number
    mode?: ChatMode
  }
}

interface Source {
  id: string
  type: SourceType  // DOCUMENT | LEASE | PROPERTY | KPI
  name: string
  url?: string
  excerpt: string
  score: number  // 0-1
  metadata: Record<string, any>
}

interface Citation {
  id: string
  sourceId: string
  text: string
  startOffset: number
  endOffset: number
}

interface Artifact {
  id: string
  type: 'table' | 'document' | 'chart' | 'export'
  title: string
  content: any
  downloadUrl?: string
}

enum ChatMode {
  STANDARD = 'standard',
  RAG_ENHANCED = 'rag_enhanced',
  RAG_ONLY = 'rag_only'
}

enum SourceType {
  DOCUMENT = 'document',
  LEASE = 'lease',
  PROPERTY = 'property',
  TENANT = 'tenant',
  KPI = 'kpi',
  CONVERSATION = 'conversation'
}
```

### 3.2 Streaming

```typescript
interface StreamManager {
  startStream(url: string, options: StreamOptions): Promise<void>
  stopStream(): void
  resumeStream(messageId: string): Promise<void>
}

interface StreamOptions {
  onStart?: () => void
  onChunk?: (chunk: string) => void
  onComplete?: (content: string) => void
  onError?: (error: Error) => void
  onMetadata?: (meta: StreamMetadata) => void
}

interface StreamMetadata {
  sources?: Source[]
  citations?: Citation[]
  artifacts?: Artifact[]
  tokensUsed?: number
}

// Format SSE
event: chunk
data: {"text": "..."}

event: sources
data: {"sources": [...]}

event: citations
data: {"citations": [...]}

event: artifact
data: {"type": "table", "content": {...}}

event: done
data: {"tokensUsed": 1250}
```

### 3.3 Error Handling

```typescript
enum ErrorCode {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  UNAUTHORIZED = 'unauthorized',
  RATE_LIMIT = 'rate_limit',
  LLM_ERROR = 'llm_error',
  RAG_ERROR = 'rag_error',
  NO_SOURCES_FOUND = 'no_sources_found'
}

class ChatSDKError extends Error {
  code: ErrorCode
  retryable: boolean
  metadata?: Record<string, any>
}

interface RetryStrategy {
  maxAttempts: number
  backoffMs: number
  backoffMultiplier: number
}
```

---

## 4. API PUBLIQUE

### 4.1 Hook useChat

```typescript
interface UseChatOptions {
  conversationId?: string
  apiUrl?: string
  model?: string
  temperature?: number
  ragEnabled?: boolean
  strictMode?: boolean
  sourceTypes?: SourceType[]
  autoLoadHistory?: boolean
  autoLoadSuggestions?: boolean
  streamEnabled?: boolean
  onStreamChunk?: (chunk: string) => void
  onError?: (error: ChatSDKError) => void
}

interface UseChatReturn {
  // État
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  error: ChatSDKError | null
  
  // Données enrichies
  sources: Source[]
  citations: Citation[]
  artifacts: Artifact[]
  suggestions: string[]
  
  // Mode
  mode: ChatMode
  setMode: (mode: ChatMode) => void
  
  // Actions
  sendMessage: (content: string, options?: SendOptions) => Promise<void>
  stopStreaming: () => void
  retryLastMessage: () => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  
  // Conversation
  createNewConversation: () => Promise<void>
  deleteConversation: () => Promise<void>
  renameConversation: (title: string) => Promise<void>
  
  // RAG controls
  activeSources: SourceType[]
  toggleSource: (source: SourceType) => void
}

// Usage
const {
  messages,
  isStreaming,
  sendMessage,
  sources,
  suggestions
} = useChat({
  ragEnabled: true,
  autoLoadSuggestions: true
})
```

### 4.2 Hook useRag

```typescript
interface UseRagReturn {
  enabled: boolean
  strictMode: boolean
  selectedSources: SourceType[]
  selectedDocuments: string[]
  selectedLeases: string[]
  selectedProperties: string[]
  
  toggleRAG: () => void
  toggleStrictMode: () => void
  toggleSource: (source: SourceType) => void
  setSelectedDocuments: (ids: string[]) => void
  
  searchDocuments: (query: string) => Promise<Source[]>
  totalSources: number
}
```

### 4.3 Hook useCanvas

```typescript
interface UseCanvasReturn {
  mode: 'table' | 'document' | 'chart' | 'mixed'
  artifacts: Artifact[]
  activeArtifactId: string | null
  
  createArtifact: (type: ArtifactType, content: any) => Promise<Artifact>
  updateArtifact: (id: string, updates: Partial<Artifact>) => Promise<void>
  deleteArtifact: (id: string) => Promise<void>
  
  exportToExcel: (id: string) => Promise<Blob>
  exportToPDF: (id: string) => Promise<Blob>
  
  selectArtifact: (id: string) => void
}
```

---

## 5. UI COMPONENTS

### 5.1 Composants principaux

```typescript
// ChatBox (composant principal)
<ChatBox
  messages={messages}
  isStreaming={isStreaming}
  streamingContent={streamingContent}
  sources={sources}
  suggestions={suggestions}
  onSend={sendMessage}
  onStop={stopStreaming}
  showSources
  showSuggestions
/>

// MessageList
<MessageList
  messages={messages}
  isStreaming={isStreaming}
  streamingContent={streamingContent}
  onCitationClick={(citation) => scrollToSource(citation)}
/>

// MessageInput
<MessageInput
  onSend={sendMessage}
  isLoading={isLoading}
  placeholder="Posez votre question..."
/>

// SourcesPanel
<SourcesPanel
  sources={sources}
  citations={citations}
  onSourceClick={(source) => openDetails(source)}
  showScores
/>

// SuggestionsBar
<SuggestionsBar
  suggestions={suggestions}
  onSelect={(suggestion) => sendMessage(suggestion)}
  variant="chips"
/>

// CanvasView
<CanvasView
  artifacts={artifacts}
  activeArtifactId={activeId}
  onExport={(id, format) => exportArtifact(id, format)}
  editable
/>
```

### 5.2 Modes d'utilisation

**Headless**
```typescript
const { messages, sendMessage } = useChat()
return <MyCustomUI messages={messages} onSend={sendMessage} />
```

**Opinionated**
```typescript
return <ChatBox apiUrl="/api/chat" />
```

**Render Props (Slots)**
```typescript
<ChatBox
  messages={messages}
  onSend={sendMessage}
  renderMessage={(msg) => <CustomMessage message={msg} />}
  renderHeader={() => <CustomHeader />}
  renderSource={(source) => <CustomSourceCard source={source} />}
/>
```

### 5.3 Theming

```css
:root {
  --chat-bg: #ffffff;
  --message-user-bg: #3b82f6;
  --message-assistant-bg: #f3f4f6;
  --source-bg: #eff6ff;
  --citation-highlight: #fef3c7;
}

[data-theme="dark"] {
  --chat-bg: #111827;
  --message-user-bg: #2563eb;
  --message-assistant-bg: #374151;
}
```

```typescript
import { themes } from '@aimmo/chat-ui/themes'
<ChatBox theme={themes.dark} />
```

---

## 6. BACKEND & LLM PROVIDERS

### 6.1 Abstraction LLM

```typescript
interface LLMProvider {
  name: string
  models: string[]
  streamChat(messages: Message[], options: StreamOptions): AsyncGenerator<string>
  generateResponse(messages: Message[], options: GenerateOptions): Promise<string>
  executeFunctions(messages: Message[], functions: FunctionDefinition[]): Promise<FunctionCallResult>
}

// Providers : OpenAI, Anthropic, Azure OpenAI
class OpenAIProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }

// Registry
const registry = new LLMProviderRegistry()
registry.register(new OpenAIProvider())
registry.register(new AnthropicProvider())

const provider = registry.get('openai')
```

### 6.2 Function Calling

```typescript
const searchLeaseFunction: FunctionDefinition = {
  name: 'search_leases',
  description: 'Recherche des baux selon critères',
  parameters: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['active', 'expired'] },
      minRent: { type: 'number' }
    }
  }
}

async function executeFunction(name: string, args: any): Promise<any> {
  switch (name) {
    case 'search_leases':
      return await leaseService.search(args)
    case 'compare_properties':
      return await propertyService.compare(args.ids)
    case 'export_to_excel':
      return await exportService.toExcel(args.data)
  }
}
```

### 6.3 RAG Pipeline

```typescript
interface RagService {
  retrieve(query: RagQuery): Promise<RagContext>
  rerank(results: Source[], query: string): Promise<Source[]>
  extractCitations(content: string, sources: Source[]): Promise<Citation[]>
}

interface RagQuery {
  query: string
  sourceTypes: SourceType[]
  userId: string
  topK?: number
  scoreThreshold?: number
  documentIds?: string[]
}

interface RagContext {
  sources: Source[]
  query: string  // reformulée
  metadata: {
    retrievalMs: number
    rerankingMs: number
  }
}

// Implémentation MCP
class MCP_RagService implements RagService {
  async retrieve(query: RagQuery): Promise<RagContext> {
    // 1. Query reformulation
    const reformulated = await this.reformulate(query.query)
    
    // 2. Embeddings
    const embeddings = await this.generateEmbeddings(reformulated)
    
    // 3. Vector search via MCP
    const results = await mcpClient.call('search', {
      embeddings,
      filters: { sourceTypes: query.sourceTypes },
      topK: query.topK || 5
    })
    
    // 4. Reranking
    const reranked = await this.rerank(results, reformulated)
    
    // 5. Filter by threshold
    return {
      sources: reranked.filter(r => r.score >= (query.scoreThreshold || 0.7)),
      query: reformulated,
      metadata: { ... }
    }
  }
}
```

### 6.4 Middleware Pipeline

```typescript
// API Route complète
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    // 1. Auth
    const user = await authMiddleware(request)
    
    // 2. Rate limiting
    await rateLimitMiddleware(user)
    
    // 3. Validation
    const body = await validateRequest(request)
    
    // 4. Pre-call API métier
    const businessContext = await fetchBusinessContext(user, body)
    
    // 5. RAG retrieval
    let ragContext = null
    if (body.ragEnabled) {
      ragContext = await ragService.retrieve({
        query: body.messages[body.messages.length - 1].content,
        sourceTypes: body.sourceTypes,
        userId: user.id
      })
    }
    
    // 6. LLM call
    const provider = registry.get(body.provider || 'openai')
    const stream = provider.streamChat(
      enrichMessages(body.messages, businessContext, ragContext),
      { model: body.model }
    )
    
    // 7. Stream SSE response
    return new Response(createSSEStream(stream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    await logError(error, user, startTime)
    throw error
  }
}
```

---

## 7. FONCTIONNALITÉS PRODUIT

### 7.1 UI Conversationnelle [MVP]

**Streaming token-by-token**
- Animation curseur pendant streaming
- Annulation en temps réel (Stop button)
- Reprise après interruption

**Historique persisté**
- Sauvegarde auto des conversations
- Chargement lazy (pagination)
- Synchronisation temps réel

**Renommage & suppression**
- Édition inline du titre
- Confirmation avant suppression
- Restauration (trash 30j)

**Citations cliquables**
- Parser `[1]`, `[2]` dans le texte
- Highlight source au clic
- Scroll auto vers source
- Preview excerpt

**Suggestions dynamiques**
- 3-5 next prompts générés par LLM
- Contextuelles à la conversation
- Variées (questions, actions, comparaisons)

### 7.2 RAG Configuration [MVP]

**Toggles utilisateur**
```typescript
<RagPanel>
  <Switch checked={ragEnabled} onChange={toggleRAG} />
  <Switch checked={strictMode} onChange={toggleStrictMode} />
  
  <SourceSelector
    sources={[DOCUMENT, LEASE, PROPERTY, KPI]}
    selected={selectedSources}
    onToggle={toggleSource}
  />
</RagPanel>
```

**Support multi-sources**
- Documents personnels (uploads)
- Google Drive (OAuth)
- OneDrive (OAuth)
- Baux (DB interne)
- Propriétés (DB interne)
- KPIs métier (API temps réel)

**Mode strict RAG-only**
- Aucune connaissance générale du LLM
- Uniquement corpus utilisateur
- Affichage explicite "Mode Strict Activé"
- Warning si aucune source trouvée

**Affichage sources**
- Liste sources utilisées
- Score de pertinence visible
- Type de source (icon + badge)
- Lien cliquable vers document source

### 7.3 Capacités Avancées [MVP]

**Génération de tableaux**
```typescript
// LLM génère structure table
{
  type: 'artifact',
  artifactType: 'table',
  content: {
    headers: ['Propriété', 'Loyer', 'Surface'],
    rows: [
      ['Appt 1', '1200€', '75m²'],
      ['Appt 2', '950€', '55m²']
    ]
  }
}

// UI affiche DataGrid interactif
<TableArtifact
  data={artifact.content}
  sortable
  editable
  onExport={() => exportToExcel(artifact)}
/>
```

**Résumé de bail**
```typescript
// Function call
{
  name: 'generate_lease_summary',
  args: { leaseId: 'lease_123' }
}

// Retour structuré
{
  reference: 'BAIL-2024-A3F2',
  tenant: 'Jean Dupont',
  property: 'Appartement 15 rue Victor Hugo',
  startDate: '2024-01-01',
  rent: 1200,
  charges: 150,
  duration: '3 ans',
  conditions: ['Caution 2 mois', 'Préavis 3 mois'],
  status: 'active'
}
```

**Comparaison de propriétés**
```typescript
// Function call
{
  name: 'compare_properties',
  args: { propertyIds: ['prop_1', 'prop_2', 'prop_3'] }
}

// Retour tableau comparatif
{
  type: 'artifact',
  artifactType: 'comparison_table',
  content: {
    properties: [...],
    metrics: ['surface', 'rent', 'yield', 'location'],
    scores: { ... }
  }
}
```

**Exports Excel/PDF**
```typescript
// API routes
POST /api/export/excel
POST /api/export/pdf

// Payload
{
  artifactId: 'artifact_123',
  format: 'excel',
  includeMetadata: true,
  filename: 'comparaison_biens.xlsx'
}

// Retour
Response: Blob (application/vnd.openxmlformats)
Headers: Content-Disposition: attachment; filename="..."
```

**Mode Canvas**
```typescript
interface Canvas {
  mode: 'table' | 'document' | 'chart' | 'mixed'
  artifacts: Artifact[]
  layout: 'grid' | 'stack' | 'split'
}

// UI Layout
<div className="canvas-layout">
  <ChatBox className="w-1/2" />
  <CanvasView className="w-1/2">
    <ArtifactGrid artifacts={artifacts} />
  </CanvasView>
</div>

// Interactions
- Chat → Génère artefact → Affiche dans Canvas
- Canvas → Édition → Sync avec chat history
- Export multiple artefacts en un clic
```

### 7.4 Intégration Backend [MVP]

**Pre-call API métier**
```typescript
async function fetchBusinessContext(user: User, request: ChatRequest): Promise<BusinessContext> {
  // Enrichissement contextuel avant LLM
  
  const context: BusinessContext = {}
  
  // 1. Profile utilisateur
  context.userProfile = await userService.getProfile(user.id)
  
  // 2. KPIs récents
  if (request.sourceTypes.includes(SourceType.KPI)) {
    context.kpis = await kpiService.getLatest(user.organizationId)
  }
  
  // 3. Données métier pertinentes
  if (request.intent === 'lease_analysis') {
    context.recentLeases = await leaseService.getRecent(user.id, { limit: 10 })
  }
  
  // 4. Comportement utilisateur
  context.recentActions = await activityService.getRecent(user.id)
  
  return context
}

// Injection dans prompt système
const systemMessage = {
  role: 'system',
  content: `
Tu es un assistant immobilier pour ${context.userProfile.name}.

Contexte métier :
- Organisation : ${context.userProfile.organizationName}
- Portefeuille : ${context.kpis.totalProperties} propriétés, ${context.kpis.totalLeases} baux
- Taux d'occupation : ${context.kpis.occupancyRate}%
- Actions récentes : ${context.recentActions.map(a => a.type).join(', ')}

Utilise ces informations pour personnaliser tes réponses.
  `
}
```

**Choix du RAG**

**Option A : MCP (Model Context Protocol)**
- ✅ Standard émergent
- ✅ Agnostic du LLM
- ✅ Serverless-friendly
- ⚠️ Moins mature

**Option B : API REST amont**
- ✅ Contrôle total
- ✅ Monitoring facile
- ✅ Cache personnalisé
- ⚠️ Latence réseau

**Décision : Hybrid**
- MCP pour prototypage rapide et intégrations tierces
- API REST pour logique métier critique et performance
- Interface unifiée `RagService` pour abstraction

```typescript
interface RagService {
  retrieve(query: RagQuery): Promise<RagContext>
}

// Implémentation MCP
class MCPRagService implements RagService { ... }

// Implémentation REST
class RestRagService implements RagService { ... }

// Factory
function createRagService(config: RagConfig): RagService {
  return config.provider === 'mcp'
    ? new MCPRagService(config.mcpUrl)
    : new RestRagService(config.apiUrl)
}
```

---

## 8. SÉCURITÉ

### 8.1 Authentification
- JWT tokens avec refresh mechanism
- Session-based pour web
- API keys pour server-to-server

### 8.2 Autorisation
- RBAC (Role-Based Access Control)
- RLS (Row-Level Security) sur RAG
- Isolation multi-tenant stricte

### 8.3 Rate Limiting
- Par utilisateur : 100 req/hour
- Par organisation : 1000 req/hour
- Token bucket algorithm
- Headers `X-RateLimit-*`

### 8.4 Sécurité RAG
- Vérification permissions sur sources
- Anonymisation données sensibles
- Audit trail des requêtes
- GDPR compliance (droit à l'oubli)

---

## 9. STREAMING & PERFORMANCES

### 9.1 Optimisations Streaming
- Compression gzip sur SSE
- Keep-alive avec heartbeat
- Reconnexion automatique
- Buffer size optimal (1KB chunks)

### 9.2 Edge Deployment
- Next.js Edge Runtime
- Vercel Edge Functions
- Cloudflare Workers compatible
- Latence globale < 100ms

### 9.3 Caching
- TanStack Query pour conversations
- Redis pour RAG results (TTL 1h)
- CDN pour assets statiques

### 9.4 Performance Targets
- Time to First Token (TTFT) : < 500ms
- Tokens/second : > 50
- RAG retrieval : < 200ms
- Total latency : < 3s (p95)

---

## 10. EXTENSIBILITÉ

### 10.1 Plugins System
```typescript
interface Plugin {
  name: string
  version: string
  onInit?: (sdk: ChatSDK) => void
  onMessageSent?: (message: Message) => void
  onMessageReceived?: (message: Message) => void
  onStreamStart?: () => void
  onStreamChunk?: (chunk: string) => void
}

// Usage
sdk.registerPlugin(new AnalyticsPlugin())
sdk.registerPlugin(new CustomRagPlugin())
```

### 10.2 Lifecycle Hooks
```typescript
sdk.on('conversation:created', (conversation) => { ... })
sdk.on('message:sent', (message) => { ... })
sdk.on('stream:start', () => { ... })
sdk.on('rag:retrieved', (sources) => { ... })
sdk.on('error', (error) => { ... })
```

### 10.3 Middlewares
```typescript
sdk.useMiddleware(async (request, next) => {
  console.log('Before LLM call')
  const response = await next(request)
  console.log('After LLM call')
  return response
})
```

---

## 11. DX & TOOLING

### 11.1 Installation
```bash
npm install @aimmo/chat-ui
# ou
pnpm add @aimmo/chat-ui
```

### 11.2 Configuration Minimale
```typescript
// app/api/chat/route.ts
import { ChatHandler } from '@aimmo/chat-ui/server'

export const POST = ChatHandler({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  ragEnabled: true
})

// app/chat/page.tsx
import { ChatBox } from '@aimmo/chat-ui'

export default function ChatPage() {
  return <ChatBox apiUrl="/api/chat" />
}
```

### 11.3 Debugging
```typescript
// Mode debug
<ChatBox
  apiUrl="/api/chat"
  debug
  onDebugEvent={(event) => console.log(event)}
/>

// Logs structurés
[Chat SDK] Message sent: {...}
[Chat SDK] Stream started
[Chat SDK] RAG retrieved: 5 sources
[Chat SDK] Stream completed: 1234 tokens, 2.3s
```

### 11.4 TypeScript Support
- Types exportés pour tous les modèles
- Autocomplete IDE complet
- Validation à la compilation
- JSDoc détaillée

---

## 12. TESTS & QUALITÉ

### 12.1 Tests Unitaires
```typescript
describe('useChat', () => {
  it('should send message and stream response', async () => {
    const { result } = renderHook(() => useChat())
    
    await act(async () => {
      await result.current.sendMessage('Hello')
    })
    
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].role).toBe('assistant')
  })
})
```

### 12.2 Mocks LLM & RAG
```typescript
// Mock provider
class MockLLMProvider implements LLMProvider {
  async *streamChat(messages) {
    yield 'Hello'
    yield ' world'
  }
}

// Mock RAG
class MockRagService implements RagService {
  async retrieve(query) {
    return {
      sources: [mockSource1, mockSource2],
      query: query.query
    }
  }
}
```

### 12.3 Tests d'intégration
- Tests end-to-end avec Playwright
- Tests API avec Vitest
- Tests streaming réels

### 12.4 Métriques Qualité
- Coverage > 80%
- Type safety 100%
- Bundle size < 50KB (gzipped)
- Lighthouse score > 90

---

## 13. DOCUMENTATION

### 13.1 Structure
```
docs/
├── getting-started.md
├── api-reference/
│   ├── hooks.md
│   ├── components.md
│   └── server.md
├── guides/
│   ├── streaming.md
│   ├── rag-configuration.md
│   ├── canvas-mode.md
│   └── exports.md
├── recipes/
│   ├── lease-summary.md
│   ├── property-comparison.md
│   └── custom-theming.md
└── examples/
    ├── basic-chat.tsx
    ├── rag-chat.tsx
    └── canvas-chat.tsx
```

### 13.2 Tutorials
1. **Quick Start** (5 min) : Chat basique
2. **RAG Integration** (15 min) : Configuration sources
3. **Canvas Mode** (20 min) : Tableaux interactifs
4. **Advanced** (30 min) : Custom providers, middleware

### 13.3 Recipes Métier
- **Résumé automatique de bail** : Function calling + template
- **Comparaison multi-propriétés** : RAG + tableau
- **Export Excel personnalisé** : Canvas + export service
- **Dashboard KPIs live** : Streaming + Canvas

---

## 14. ROADMAP

### MVP (3 mois)
- ✅ Streaming SSE natif
- ✅ RAG avec toggles utilisateur
- ✅ Citations cliquables
- ✅ Mode strict RAG-only
- ✅ Génération tableaux
- ✅ Exports Excel/PDF
- ✅ Mode Canvas basique
- ✅ Pre-call API métier
- ✅ Function calling
- ✅ Composants UI principaux
- ✅ Hooks React core

### V1 (6 mois)
- 🔲 Multi-provider LLM (OpenAI, Anthropic, Azure)
- 🔲 RAG avancé (reranking, hybrid search)
- 🔲 Canvas collaboratif (real-time)
- 🔲 Voice input
- 🔲 Image analysis
- 🔲 Suggestions ML-powered
- 🔲 Analytics dashboard
- 🔲 A/B testing framework

### Future
- Agents autonomes multi-étapes
- Memory long-term (conversation history search)
- Multimodal (images, docs, videos)
- API publique pour tiers
- White-label solution
- Mobile SDK (React Native)

---

## 15. METRICS & SUCCESS CRITERIA

### Adoption
- 100+ installations/mois
- 10+ organisations en production
- < 5 min time-to-first-message

### Performance
- TTFT p50 < 500ms
- TTFT p95 < 1s
- Uptime > 99.9%

### Qualité
- Bug rate < 1%
- Customer satisfaction > 4.5/5
- RAG precision > 0.8

### Business
- Réduction 50% temps implémentation vs custom
- ROI positif en < 3 mois
- Churn < 5%

---

## CONCLUSION

Ce SDK Chat UI offre une fondation complète pour construire des interfaces conversationnelles IA de niveau production avec :

1. **RAG first-class** : Contrôle total utilisateur, mode strict, citations
2. **Capabilities métier** : Tableaux, exports, Canvas interactif
3. **DX premium** : TypeScript, hooks idiomatiques, composants prêts
4. **Production-ready** : Streaming, edge-optimized, sécurité, monitoring
5. **Extensible** : Plugins, middleware, custom providers

**Next Steps** :
1. Valider architecture avec équipe technique
2. Prototyper MVP (hooks core + RAG + streaming)
3. Itérer sur feedback utilisateurs early adopters
4. Documenter patterns d'intégration métier
5. Lancer beta ouverte

**Contact** : Pour questions ou contributions, ouvrir issue GitHub ou contact@aimmo.com
