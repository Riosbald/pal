# PAL Instant-On Mobile App Layer

**Version:** 1.0  
**Status:** Specification  
**Target:** Mobile-first voice automation for African entrepreneurs  
**Key Innovation:** System-level audio ingestion without app in foreground

---

## Executive Summary

The **Instant-On App Layer** replaces wearables by using:
- **Lock Screen Widgets** + **Floating Action Buttons** for voice triggers
- **Background audio services** capturing ambient business intent
- **Secure WebSocket streaming** to PAL kernel
- **Zero-form data capture** (voice → structured data, no typing)

**9 use cases enabled**:

| Feature | Primary Flow | Risk Gate | Output |
|---------|--------------|-----------|--------|
| **2.1 Voice-to-Workflow** | Spoken intent → Rein YAML → Executable | Draft + Policy | Workflow trigger |
| **2.2 Voice CRM** | Meeting transcript → Graph mutations | Entity extraction | Customer nodes updated |
| **2.3 Accounts Receivable** | Post-call promise → pg-boss jobs | Quiet hours + approval | Scheduled reminders |
| **2.4 Voice Forms** | Audio overlay → Structured JSON | Real-time validation | Form submission |
| **2.5 Market Intelligence** | Ambient market data → Vector clusters | Public/private weighting | Weekly intel report |
| **2.6 Field Operations** | Hands-free reporting → GPS + inventory | High-gravity delta | VisitRecord + ledger |
| **2.7 Research (2nd Brain)** | "Ask PAL" query → Semantic search + TTS | Cosine similarity (k=10) | Spoken answer |
| **2.8 Vision Studio** | Camera → VLM → Text extraction | Scene understanding | Invoice data captured |
| **2.9 Entrepreneur Health** | Vocal biomarkers → Stress detection | Privacy-first, isolated | Health notification |

---

## 1. ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────┐
│      PAL MOBILE APP                  │
│  (Instant-On Ingestion Layer)        │
├──────────────────────────────────────┤
│ • Lock Screen Widget                 │  ← User triggers (1 tap)
│ • Floating Action Button             │
│ • Background Audio Service           │  ← Mic runs in background
│ • Secure WebSocket Stream            │  ← No credentials exposed
│ • Camera Vision Module               │  ← OCR/scene understanding
│ • Health Metrics (Vocal Analysis)    │
└──────────────────────────────────────┘
          │ (Secure WebSocket)
          ▼
┌──────────────────────────────────────────────────┐
│   MEANING-TO-ACTION KERNEL (Server)              │
├──────────────────────────────────────────────────┤
│ 1. Sahara STT (Code-switch enabled)              │
│ 2. Context Router (App Mode selection)           │
│ 3. Semantic Agent (Intent → MeaningState)        │
│ 4. Workflow Compiler (YAML generation)           │
│ 5. Policy Engine (Risk classification)           │
│ 6. Approval Gate (Human decision)                │
│ 7. Execution Service (Safe side effects)         │
│ 8. Specialized Agents (CRM, Field Ops, etc.)     │
│ 9. pg-boss Scheduler (Reminders, recovery jobs)  │
│ 10. pgvector Memory (Entity resolution, RAG)     │
│ 11. Health Service (Stress metrics)              │
└──────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│   WORKSPACE DATA LAYER (Supabase)                │
├──────────────────────────────────────────────────┤
│ • VoiceSession (background streams)              │
│ • VoiceRecording (persistent audio + metadata)   │
│ • CRMGraph (customer relationships + sentiment)  │
│ • ScheduledJob (pg-boss + quiet hours)           │
│ • MarketIntel (vector clusters, time-weighted)   │
│ • VisitRecord (field ops + GPS)                  │
│ • HealthMetric (encrypted, isolated workspace)   │
│ • MobileContext (app mode, screen state)         │
└──────────────────────────────────────────────────┘
```

---

## 2. INGESTION ARCHITECTURE

### 2.1 Background Audio Service

**Contract**: Capture ambient audio without requiring app in foreground.

```typescript
// src/services/mobile/background-audio.ts
export interface BackgroundAudioService {
  // Start listening (runs indefinitely until stopped)
  startListening(
    sessionId: string,
    options: {
      appMode: AppMode  // "quick_action" | "meeting" | "post_call" | "pocket" | "field_ops" | "research" | "health"
      sampleRate: 16000  // Fixed: 16kHz
      encoding: "pcm16"  // Fixed: PCM 16-bit
      quietHoursEnabled?: boolean
      vendorContext?: Record<string, unknown>
    }
  ): Promise<{ token: string; wsUri: string }>

  // Stop listening and finalize session
  stopListening(sessionId: string): Promise<{ recordingId: string }>

  // Query active session metadata
  getSessionMetadata(sessionId: string): Promise<VoiceSession>
}
```

**Platform-specific implementations**:

- **iOS**: `AVAudioEngine` + background mode (`audio`) + `NWConnection` (WebSocket)
- **Android**: `AudioRecord` + `WorkManager` (background tasks) + `OkHttp3` WebSocket
- **Web**: `getUserMedia()` + Service Worker (limited to foreground)

### 2.2 Secure WebSocket Stream

**Route**: `POST /api/voice/sessions` → returns `{ token, wsUri }`

```typescript
// src/app/api/voice/sessions/route.ts
export async function POST(req: Request) {
  const { appMode, workspaceId } = await req.json()

  // 1. Create signed token (5-minute expiry)
  const token = await signVoiceToken({ workspaceId, appMode })

  // 2. Open WebSocket connection to Sahara
  const wsUri = `wss://voice.sahara.api/stream?token=${token}`

  // 3. Create VoiceSession record
  const session = await db.voiceSessions.create({
    workspaceId,
    appMode,
    status: "active",
    wsUri,
    createdAt: new Date(),
  })

  return { sessionId: session.id, token, wsUri }
}
```

**Audio → Sahara Pipeline**:

```
Mobile Mic (PCM16)
  ↓
↳ WebSocket to /api/voice/stream
  ↓
↳ Server receives chunks, forwards to Sahara WebSocket
  ↓
↳ Sahara returns partial transcripts
  ↓
↳ Server broadcasts to client + persists to DB
  ↓
↳ On final: Create SpeechEvent + route to semantic agent
```

### 2.3 App Mode Context Router

**Routing logic** (deterministic, not ML):

```typescript
// src/services/mobile/context-router.ts
export function routeByAppMode(
  speechEvent: SpeechEvent,
  appMode: AppMode
): RoutingDecision {
  const routes = {
    "quick_action": {
      agent: "workflow",
      priority: "rapid",
      initialRiskGate: 3.0,  // G_s baseline
      riskBoost: 0.0,
    },
    "meeting": {
      agent: "crm",
      priority: "batch",
      initialRiskGate: 2.0,  // Context-rich = lower threshold
      speakers: "diarized",
      entityResolution: "pgvector",
    },
    "post_call": {
      agent: "receivable",
      priority: "urgent",
      initialRiskGate: 3.0,
      schedulerEnabled: true,
      quietHours: "9pm-8am",
    },
    "pocket": {
      agent: "market_intel",
      priority: "batch",
      initialRiskGate: 1.0,  // Public data, low risk
      clustering: "vector",
      isolation: "public_weights",
    },
    "field_ops": {
      agent: "operations",
      priority: "transactional",
      initialRiskGate: 4.0,  // Inventory critical
      gpsContext: true,
      gravityMultiplier: 1.2,
    },
    "research": {
      agent: "rag",
      priority: "interactive",
      initialRiskGate: 0.0,  // Read-only, no approval needed
      retrieval: "semantic_search",
      ttsOutput: true,
    },
    "health": {
      agent: "health",
      priority: "passive",
      initialRiskGate: 0.0,  // No execution
      isolation: "health_workspace",
      encryption: "at_rest",
    },
  }

  return routes[appMode]
}
```

---

## 3. FEATURE SPECIFICATIONS

### 3.1 Voice-to-Workflow (Composer's Voice Twin)

**Goal**: Convert spoken intent into executable workflows with cron triggers.

**UX Flow**:

```
User taps "Compose" → Audio starts
User: "Anytime I post new stock for Catalog, send my customers message and record am for ledger."
Audio streams → Sahara STT (Code-switch: EN, PCM, YOR, IBO, HAU)
↓
Semantic Agent extracts:
  - Trigger: "post new stock for Catalog"
  - Action: "send customers message"
  - Side effect: "record am for ledger"
↓
Workflow Compiler generates Rein YAML:
  ```yaml
  trigger:
    type: webhook
    event: catalog.item.created
  actions:
    - check: quiet_hours
    - dispatch: notification
      to: customers
      template: new_item
    - record: ledger
      event_type: item_created
  ```
↓
Policy Engine: riskClass = "external_write" → requires approval
↓
User approves (or edits) on approval dashboard
↓
Workflow deployed to pg-boss scheduler
```

**Database schema**:

```sql
CREATE TABLE voice_workflows (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  rein_yaml TEXT NOT NULL,
  speech_event_id UUID REFERENCES speech_events(id),
  status TEXT CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);
```

### 3.2 Voice CRM (Meeting Mode)

**Goal**: Zero-form relational database updates via conversation transcripts.

**UX Flow**:

```
User taps "Meeting Mode" → Screen darkens, mic stays active
↓
Speaker Diarization (if enabled):
  - "Owner" stream (recognized voice)
  - "Client" stream (unknown speaker)
↓
Entity Extraction (multilingual-e5-base embeddings):
  - "that Musa wey buy last week" → UUID lookup → musa_001
  - "negotiated price: 85,000" → relationship edge
  - "sentiment: positive" → graph mutation
↓
Graph mutations (PostgreSQL + pgvector):
  - UPDATE customers SET sentiment = 'positive' WHERE id = 'musa_001'
  - INSERT INTO customer_interactions (date, summary, sentiment)
  - UPSERT into semantic index (pgvector)
↓
Sync strategy:
  - Write to local cache immediately
  - Async upload when connectivity available
  - Conflict resolution: server timestamp wins
```

**Database schema**:

```sql
CREATE TABLE crm_interactions (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  customer_id TEXT NOT NULL,  -- External CRM ID or internal UUID
  interaction_type TEXT,  -- "meeting" | "call" | "message"
  transcript TEXT,
  entities JSONB,  -- Extracted entities + confidence
  sentiment TEXT,  -- "positive" | "negative" | "neutral" | "mixed"
  speaker_diarization JSONB,  -- { "owner": [...], "client": [...] }
  embedding vector(1536),  -- pgvector embedding of transcript
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX crm_interactions_embedding_idx ON crm_interactions USING ivfflat (embedding vector_cosine_ops);
```

### 3.3 Customer Collections (Accounts Receivable)

**Goal**: Convert oral payment commitments into scheduled recovery jobs.

**UX Flow**:

```
User hangs up call → Taps "Post-Call" notification
↓
User dictates: "Bisi say she go pay balance on Friday."
↓
Extraction:
  {
    customer_id: "bisi_091",
    due_date: "2026-09-18",
    amount: 450000,  // Inferred from previous balance
    currency: "NGN",
    state: "pending"
  }
↓
pg-boss scheduling:
  job_id_1: job_reminder_t_minus_1 (Thu, 9:00 AM, 24h before)
  job_id_2: job_reminder_t_zero (Fri, 9:00 AM, due date)
  job_id_3: job_reminder_overdue (Sun, 9:00 AM, 48h late)
↓
Safeguards:
  - Respect quiet_hours (9 PM - 8 AM Africa/Lagos)
  - Skip weekends if configured
  - Require approval if amount > threshold
↓
User can cancel:
  User: "Bisi don pay"
  → await boss.cancel(jobIds)
  → All reminders cancelled
```

**Database schema**:

```sql
CREATE TABLE payment_commitments (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  customer_id TEXT NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(15,2),
  currency TEXT,
  commitment_text TEXT,  -- Original spoken text
  speech_event_id UUID REFERENCES speech_events(id),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  pg_boss_job_ids TEXT[],  -- Array of scheduled job IDs
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE scheduled_reminders (
  id UUID PRIMARY KEY,
  commitment_id UUID NOT NULL REFERENCES payment_commitments(id),
  reminder_type TEXT CHECK (reminder_type IN ('t_minus_1', 't_zero', 'overdue')),
  scheduled_for TIMESTAMP NOT NULL,
  pg_boss_job_id TEXT,
  status TEXT CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.4 Voice Forms (Audio Overlay)

**Goal**: Interactive structured data collection without looking at screen.

**UX Flow**:

```
User selects "Inventory Intake" form
↓
PAL Voice Overlay (TTS):
  "Wetin be the item name?"
User: "Dangote Cement 50kg"
↓
TTS: "How much?"
User: "Eight thousand five hundred"
↓
Real-time validation:
  - amount: 8500 (historical pricing)
  - Historical range: 8000-9000
  - Price drift: 0% ✓
↓
If drift > 20%:
  PAL: "That price high o, you sure?"
  User: "Yes" → Confirmed flag
↓
Schema parity:
  {
    "itemName": "Dangote Cement 50kg",
    "quantity": 1,
    "unitPrice": 8500,
    "currency": "NGN",
    "confirmed": true,
    "confidence": 0.94
  }
↓
Submission via standard form API
```

**Database schema**:

```sql
CREATE TABLE voice_form_responses (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  form_id TEXT NOT NULL,  -- External form identifier
  fields JSONB NOT NULL,  -- Structured form data
  confidence NUMERIC(3,2),  -- Overall confidence
  field_confidence JSONB,  -- Per-field confidence scores
  audio_segments JSONB,  -- { "field_name": { start_ms, end_ms, text } }
  speech_event_id UUID REFERENCES speech_events(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.5 Market Intelligence (Pocket Mode)

**Goal**: Discrete capture of market dynamics and price signals.

**UX Flow**:

```
User activates "Pocket Mode" (blocks touch input, keeps mic active)
User walks through market, speaks observations:
  "...competitor X selling at 8,200 per bag... seems like shortage... new supplier Y trying 7,900..."
↓
Auto-tagger (k-NN, k=7):
  - #PriceSignal (high confidence)
  - #Shortage (medium confidence)
  - #NewSupplier (medium confidence)
↓
Vector clustering (pgvector):
  - Embed transcript (multilingual-e5-base)
  - Find k=7 nearest price signals from past 30 days
  - Group by similarity
↓
Weekly cron job:
  - Aggregate clusters
  - Calculate weighted avg prices
  - Generate market report
↓
Isolation:
  - Public data weights: 1.0
  - Private ledger weights: 0.0
  - Prevents private pricing from leaking into shared intel
```

**Database schema**:

```sql
CREATE TABLE market_signals (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  transcript TEXT,
  embedding vector(1536),
  tags TEXT[],
  tag_confidence JSONB,  -- { "PriceSignal": 0.95, "Shortage": 0.72 }
  competitor_mentions TEXT[],
  prices JSONB,  -- { "item": "...", "price": 8200, "currency": "NGN" }
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE market_intelligence_reports (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  report_week DATE,
  clusters JSONB,  -- Grouped price signals
  avg_prices JSONB,  -- Weighted averages
  summary TEXT,
  generated_at TIMESTAMP DEFAULT now()
);
```

### 3.6 Field Operations (Hands-Free Reporting)

**Goal**: Structured reporting for logistics and inventory while on the move.

**UX Flow**:

```
Driver keeps phone in vehicle mount
Driver: "Hey PAL, delivered 50 cartons to Shop B. Retrieve 3 damaged crates."
↓
Audio streams → Sahara STT
↓
Semantic Agent extracts:
  - action: "delivery_complete"
  - quantity: 50
  - destination: "Shop B" → GPS lookup → location_id_xyz
  - issue: "damaged" (high gravity flag)
  - quantity_damaged: 3
↓
Context injection (GPS):
  - Current latitude/longitude
  - Route: origin → shop_b → next_stop
  - Travel time: eta to next delivery
↓
Workflow Agent generates:
  - Create VisitRecord (timestamp + GPS)
  - Update inventory delta (+50 delivered, -3 damaged)
  - Gravity multiplier: 1.2 (damaged = critical)
  - Create alert notification (damaged goods)
↓
pg-boss Job:
  - job_type: "inventory_audit"
  - priority: "high"
  - retry: 3
↓
Sync: Store locally, sync when connectivity available
```

**Database schema**:

```sql
CREATE TABLE visit_records (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  agent_id TEXT NOT NULL,  -- Driver/field agent
  location_id TEXT,  -- Stop or store ID
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  arrived_at TIMESTAMP,
  departed_at TIMESTAMP,
  delivered JSONB,  -- { "sku": qty, ... }
  retrieved JSONB,  -- { "sku": qty, ... }
  damaged JSONB,  -- { "sku": qty, reason }
  notes TEXT,
  speech_event_id UUID REFERENCES speech_events(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE inventory_deltas (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  sku TEXT NOT NULL,
  delta INTEGER,  -- +50 or -3
  gravity_multiplier NUMERIC(3,2),  -- 1.0 normal, 1.2 damaged
  visit_record_id UUID REFERENCES visit_records(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.7 Research (Second Brain)

**Goal**: Conversational RAG system over institutional memory.

**UX Flow**:

```
User taps "Ask PAL" widget
User: "What was the last price we agreed with Tunde?"
↓
Query embedding (multilingual-e5-base):
  - Embed query: "last price Tunde"
  - Vector search (pgvector, k=10, cosine similarity)
↓
Retrieved documents:
  - CRM interaction: "Tunde negotiated 4,500 NGN per unit" (confidence: 0.98)
  - Invoice: "Tunde, Invoice #INV-2024-8762, unit price: 4,500 NGN" (confidence: 0.95)
  - Meeting notes: "Tunde mentioned 4,500 is market rate" (confidence: 0.87)
↓
Response synthesis:
  "Last Tuesday you agreed on 4,500 naira per unit. [Citation: mem_892f]"
↓
Output:
  - TTS (phone speaker or Bluetooth headset)
  - Written summary (if screen visible)
  - Citation links (for verification)
```

**Database schema**:

```sql
CREATE TABLE rag_memory (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  source_type TEXT,  -- "crm_interaction" | "invoice" | "meeting" | "ledger"
  source_id TEXT,  -- Reference to original record
  content TEXT,  -- Indexed content
  embedding vector(1536),
  metadata JSONB,  -- { "date": "...", "entity": "Tunde", "amount": 4500 }
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX rag_memory_embedding_idx ON rag_memory USING ivfflat (embedding vector_cosine_ops);
```

### 3.8 Vision Studio (Camera Integration)

**Goal**: Scene description and visual context capture.

**UX Flow**:

```
User opens PAL "Vision Mode" (viewfinder)
User points phone at shelf → Taps "Describe"
↓
VLM (Vision Language Model, local):
  - Frame capture + inference
  - Output: "Stock level: 12 units Dangote Cement, 8 units Lafarge. Shelf needs restocking."
↓
Scene understanding:
  - Item recognition (product SKU matching)
  - Quantity estimation (via image analysis)
  - Shelf state (full/partial/empty)
↓
Data extraction:
  - SKU: "CEMENT_DANGOTE_50KG"
  - Observed quantity: 12
  - Status: "requires_restocking"
↓
TTS output (if audio enabled):
  "I see 12 Dangote Cement and 8 Lafarge on this shelf. Should I update inventory?"
User: "Yes"
↓
Automatic ledger entry:
  - Item: Dangote Cement 50kg
  - Quantity: 12
  - Photo: captured frame
  - Timestamp: now
  - Confidence: 0.87
```

**Database schema**:

```sql
CREATE TABLE vision_captures (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  image_url TEXT,  -- Stored in Supabase storage
  image_hash TEXT,  -- For deduplication
  scene_description TEXT,  -- VLM output
  extracted_items JSONB,  -- [{ sku, quantity, confidence }]
  audio_segment_id UUID REFERENCES speech_events(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE vision_inventory_imports (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  vision_capture_id UUID REFERENCES vision_captures(id),
  inventory_updates JSONB,  -- Applied to ledger
  confidence NUMERIC(3,2),
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.9 Entrepreneur Health (Vocal Biomarkers)

**Goal**: Privacy-first mental resilience tracking.

**UX Flow**:

```
PAL runs continuously, analyzing voice samples from existing interactions
↓
Vocal metrics extracted (during transcription):
  - Fundamental frequency (F0)
  - Speech rate (words per minute)
  - Pitch variance (stress indicator)
  - Energy level
  - Pause duration
↓
Stress detection algorithm:
  - Elevated F0 (high pitch → anxiety)
  - Rapid speech rate (>180 wpm → stress)
  - High variance in pitch (instability)
  - Short pauses (rushed thinking)
↓
Threshold crossing:
  - Score: (F0_elevation + rate_acceleration + variance + energy) / 4
  - If score > 0.7: STRESS_DETECTED
↓
Intervention flow:
  Notification: "Oga, you sound stressed in that last note. Take 5 minutes?"
  User taps → Opens relaxation mode (breathing guide)
↓
Evening mode:
  App prompts (9 PM): "Day don end. Anything on your mind?"
  User can voice journal (optional)
  Storage: Encrypted in health_workspace (isolated from business data)
↓
Privacy guarantee:
  - Health data never leaves device (or encrypted in isolated DB)
  - No sharing with business intelligence
  - User-only access (not even workspace admins)
  - 30-day retention (auto-delete)
```

**Database schema**:

```sql
-- Separate schema for health data (strict isolation)
CREATE SCHEMA health;

CREATE TABLE health.vocal_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  -- Deliberately NOT workspace_id (privacy isolation)
  
  fundamental_frequency NUMERIC(5,2),  -- Hz
  speech_rate NUMERIC(5,2),  -- words per minute
  pitch_variance NUMERIC(5,3),  -- std dev
  energy_level NUMERIC(3,2),  -- 0..1
  pause_duration_avg NUMERIC(5,3),  -- seconds
  
  stress_score NUMERIC(3,2),  -- 0..1
  stress_detected BOOLEAN,
  
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  
  -- Auto-delete after 30 days
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '30 days')
);

-- RLS: User can only read own metrics
ALTER TABLE health.vocal_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_can_read_own_metrics" ON health.vocal_metrics
  FOR SELECT USING (user_id = auth.uid());

CREATE TABLE health.voice_journals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  transcript TEXT,
  embedding vector(1536),  -- For future journal clustering
  mood TEXT,  -- "stressed" | "calm" | "happy" | "neutral"
  noted_concerns JSONB,  -- Auto-extracted themes
  
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '30 days')
);

ALTER TABLE health.voice_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_can_read_own_journals" ON health.voice_journals
  FOR SELECT USING (user_id = auth.uid());
```

---

## 4. MOBILE PLATFORM DETAILS

### 4.1 iOS Implementation

**Key Components**:
- `AVAudioEngine` (real-time audio capture)
- `NWWebSocket` (secure WebSocket)
- `WidgetKit` (lock screen widget)
- `BackgroundTasks` (background audio)

```swift
// ios/PAL/Services/BackgroundAudioService.swift
import AVFoundation
import Network

class BackgroundAudioService {
    let audioEngine = AVAudioEngine()
    let inputNode = AVAudioInputNode()
    var webSocket: NWWebSocket?
    
    func startListening(appMode: AppMode) async throws {
        // 1. Request microphone permission
        try await AVAudioApplication.requestRecordPermission()
        
        // 2. Establish secure WebSocket
        let sessionToken = try await getVoiceToken()
        webSocket = try NWWebSocket(uri: "wss://...", token: sessionToken)
        
        // 3. Configure audio capture (PCM16, 16kHz)
        configureAudioEngine()
        
        // 4. Start capturing
        try audioEngine.start()
    }
    
    private func configureAudioEngine() {
        let format = AVAudioFormat(
            commonFormat: .pcm16,
            sampleRate: 16000,
            channels: 1,
            interleaved: true
        )
        
        inputNode.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, _ in
            self.sendAudioToWebSocket(buffer)
        }
    }
}
```

### 4.2 Android Implementation

**Key Components**:
- `AudioRecord` (audio capture)
- `OkHttp3` WebSocket (secure streaming)
- `WorkManager` (background tasks)
- `Glance` (lock screen widget)

```kotlin
// android/app/src/main/java/com/pal/services/BackgroundAudioService.kt
import android.media.AudioRecord
import okhttp3.WebSocket
import androidx.work.Worker

class BackgroundAudioService : Worker() {
    override fun doWork(): Result = runBlocking {
        try {
            // 1. Get voice token from server
            val sessionToken = getVoiceToken()
            
            // 2. Create AudioRecord (PCM16, 16kHz)
            val audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                16000,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            
            // 3. Open WebSocket to PAL server
            webSocket = OkHttpClient().newWebSocket(
                Request.Builder()
                    .url("wss://pal.server/voice/stream?token=$sessionToken")
                    .build(),
                AudioStreamListener()
            )
            
            // 4. Stream audio
            audioRecord.startRecording()
            streamAudioFrames(audioRecord, webSocket)
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

### 4.3 Web Implementation

**Constraints**:
- Cannot run in true background (service worker limitations)
- Requires app window to stay open or browser tab active
- Useful for browser-based deployments

```typescript
// src/services/web/browser-audio.ts
export async function startBrowserAudioCapture(
  appMode: AppMode
): Promise<{ sessionId: string; stop: () => Promise<void> }> {
  // Request microphone
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

  // Create WebSocket to PAL server
  const response = await fetch("/api/voice/sessions", {
    method: "POST",
    body: JSON.stringify({ appMode, workspaceId }),
  })
  const { sessionId, wsUri } = await response.json()
  const ws = new WebSocket(wsUri)

  // Capture audio (PCM16, 16kHz)
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const source = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(4096, 1, 1)

  processor.onaudioprocess = (event) => {
    const audioData = event.inputBuffer.getChannelData(0)
    const pcm16 = encodePCM16(audioData)
    ws.send(pcm16)
  }

  source.connect(processor)
  processor.connect(audioContext.destination)

  return {
    sessionId,
    stop: async () => {
      processor.disconnect()
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      ws.close()
    },
  }
}
```

---

## 5. RISK GATES & SAFEGUARDS

### 5.1 Risk Classification (G_s)

Each app mode has an initial risk baseline:

```
Initial Risk Gate (G_s):

Workflow Composer:    G_s = 3.0  (rapid action, needs supervision)
Meeting Mode (CRM):   G_s = 2.0  (rich context, lower false-positive)
Post-Call (AR):       G_s = 3.0  (time-sensitive, moderate caution)
Pocket Mode (Intel):  G_s = 1.0  (public data, low risk)
Field Ops:            G_s = 4.0  (inventory critical, high caution)
Research (RAG):       G_s = 0.0  (read-only, no execution)
Health:               G_s = 0.0  (no side effects, monitoring only)
```

### 5.2 Quiet Hours Enforcement

**Feature**: Automatic scheduling respects business quiet hours.

```typescript
// src/services/mobile/quiet-hours.ts
export async function shouldScheduleReminder(
  jobConfig: ScheduledJobConfig
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date()
  const tz = "Africa/Lagos"  // User's timezone

  // 1. Check quiet hours
  const quietStart = 21  // 9 PM
  const quietEnd = 8    // 8 AM
  const currentHour = new Date().toLocaleString("en-US", { timeZone: tz, hour: "2-digit" })

  if (currentHour >= quietStart || currentHour < quietEnd) {
    // Schedule for next business hour
    const nextSlot = calculateNextBusinessHour(tz)
    return {
      allowed: true,
      reschedule: nextSlot,
      reason: "Quiet hours active, rescheduled to morning"
    }
  }

  // 2. Check weekend
  const dayOfWeek = new Date(jobConfig.scheduledFor).toLocaleString("en-US", { timeZone: tz, weekday: "long" })
  if (["Saturday", "Sunday"].includes(dayOfWeek)) {
    return {
      allowed: false,
      reason: "Weekend: payment reminders suspended"
    }
  }

  return { allowed: true }
}
```

### 5.3 Approval Requirements

**Policy Matrix** (extended for mobile):

| App Mode | Risk Class | Auto-Approve? | Requires Approval? | Notes |
|----------|------------|---------------|--------------------|-------|
| Workflow | DRAFT | ✅ | ❌ | Review before send |
| Workflow | EXTERNAL_WRITE | ❌ | ✅ | **Must approve** |
| Workflow | FINANCIAL | ❌ | ✅ | **Must approve** |
| Meeting (CRM) | DRAFT | ✅ | ❌ | Entity updates (low risk) |
| Meeting (CRM) | EXTERNAL_WRITE | ❌ | ✅ | Only if customer data mutated |
| Post-Call (AR) | DRAFT | ✅ | ❌ | Reminder scheduling |
| Post-Call (AR) | EXTERNAL_WRITE | ❌ | ✅ | Only if amount > threshold |
| Pocket (Intel) | READ | ✅ | ❌ | Public data aggregation |
| Field Ops | DRAFT | ✅ | ❌ | Inventory recording |
| Field Ops | EXTERNAL_WRITE | ❌ | ✅ | Critical deltas (damage) |
| Research (RAG) | READ | ✅ | ❌ | Query execution |
| Health | READ | ✅ | ❌ | Metrics + journals |

---

## 6. DATABASE EXTENSIONS

**New tables** (beyond PAL_DOMAIN_MODEL.md):

```sql
-- Mobile app ingestion
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  app_mode TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'error')),
  ws_uri TEXT,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

-- Mobile-specific context
CREATE TABLE mobile_context (
  id UUID PRIMARY KEY,
  voice_session_id UUID UNIQUE REFERENCES voice_sessions(id),
  screen_state TEXT,  -- "locked" | "unlocked" | "off"
  battery_level NUMERIC(3,2),
  connectivity TEXT,  -- "wifi" | "cellular" | "none"
  app_version TEXT,
  device_os TEXT,  -- "iOS" | "Android"
  created_at TIMESTAMP DEFAULT now()
);

-- Vision captures
CREATE TABLE vision_captures (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  image_url TEXT,
  scene_description TEXT,
  extracted_items JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- And 9 more tables per feature (see section 3.x)
```

---

## 7. SECURITY & COMPLIANCE

### 7.1 Token Lifecycle

```
Mobile requests token:
  POST /api/voice/sessions
  { appMode, workspaceId, nonce }
  ↓
Server generates JWT (RS256):
  {
    sub: workspaceId,
    appMode: "meeting",
    iat: now,
    exp: now + 5min,
    nonce: req.nonce  // Replay protection
  }
  ↓
Token sent to mobile + signed with NEXT_PRIVATE_VOICE_KEY
↓
Mobile uses token to connect to WebSocket:
  wss://voice.sahara.api/stream?token=JWT
  ↓
Sahara validates token (short expiry = low risk)
```

### 7.2 RLS for Mobile Data

All mobile-generated data must be scoped to workspace:

```sql
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON voice_sessions
  FOR ALL USING (workspace_id = auth.jwt()->'app_metadata'->>'workspace_id');

ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON crm_interactions
  FOR ALL USING (workspace_id = auth.jwt()->'app_metadata'->>'workspace_id');

-- Same for all 9 feature tables
```

### 7.3 Audio Storage

**Compliance requirements**:
- Audio files stored in Supabase Storage (encrypted at rest)
- RLS: User can only access own workspace audio
- Retention: 30 days default, configurable per workspace
- Compliance flag: If GDPR scope, enforce deletion on request

```typescript
// src/lib/storage/audio.ts
export async function storeAudioRecording(
  workspaceId: string,
  sessionId: string,
  audioBuffer: Buffer
): Promise<string> {
  const path = `workspaces/${workspaceId}/audio/${sessionId}.wav`

  await supabase.storage
    .from("voice-data")
    .upload(path, audioBuffer, {
      contentType: "audio/wav",
      metadata: {
        workspaceId,
        sessionId,
        uploadedAt: new Date().toISOString(),
      },
    })

  return path
}
```

---

## 8. OPERATIONAL METRICS

**Monitoring dashboard** (new):

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| WebSocket connection uptime | 99.9% | < 99% |
| Audio latency (capture → server) | < 200ms | > 500ms |
| Speech-to-text latency (final chunk) | < 3s | > 5s |
| Semantic agent latency | < 2s | > 4s |
| Policy engine latency | < 500ms | > 1s |
| Approval rate (% requiring human review) | 15-25% | < 10% or > 40% |
| Stress detection false-positive rate | < 5% | > 10% |
| Vector search (RAG, k=10) latency | < 1s | > 2s |

---

## 9. ROLLOUT STRATEGY

### Phase 5a: Core Ingestion (Weeks 1-2)
- Background audio service (iOS + Android)
- Secure WebSocket streaming
- App mode context router
- Database schema

### Phase 5b: Features 2.1–2.5 (Weeks 3-6)
- Voice-to-Workflow
- Voice CRM
- Accounts Receivable
- Voice Forms
- Market Intelligence

### Phase 5c: Features 2.6–2.9 (Weeks 7-8)
- Field Operations
- Research (RAG)
- Vision Studio
- Entrepreneur Health

### Phase 5d: Hardening & Scale (Weeks 9+)
- Load testing (concurrent sessions)
- Security audit (audio storage, token lifecycle)
- Regional deployment (edge WebSocket endpoints)
- Challenge submission (Phase 4 results + mobile demo)

---

## 10. REFERENCES

- **PAL_ARCHITECTURE.md** — Core system design
- **PAL_DOMAIN_MODEL.md** — Extended with mobile schemas
- **PAL_SECURITY.md** — Audio storage, RLS, token lifecycle
- **AGENTS.md** — Mobile-specific development rules
- **PAL_EXECUTION_PLAN.md** — Phase 5 task breakdown
