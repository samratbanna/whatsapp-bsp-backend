# AI Auto-Reply System — Frontend Implementation Prompt

## Context

WhatsApp BSP platform (NestJS backend, React/Next.js frontend already exists). Backend API base: `/api/v1`. Auth: JWT Bearer token already wired. Existing design system in use — match all existing UI patterns (sidebar, cards, tables, modals, toasts).

Ek nayi section banana hai **"AI Agents"** — vendors apne WhatsApp number ke liye AI chatbot configure kar sakte hain jo automatically customers ke messages ka reply kare.

---

## Routes / Pages

```
/ai-agents                          → Agent list page
/ai-agents/new                      → Create agent
/ai-agents/:id                      → Agent detail (tabbed)
  /ai-agents/:id?tab=overview        → Stats + quick actions
  /ai-agents/:id?tab=knowledge       → Knowledge base management
  /ai-agents/:id?tab=conversations   → Live conversation dashboard
  /ai-agents/:id?tab=test            → Test query playground
  /ai-agents/:id?tab=settings        → Agent config / edit form
```

---

## Page 1 — Agent List (`/ai-agents`)

- Header: **"AI Agents"** + `+ New Agent` button (primary)
- Empty state: robot icon, "No AI agents yet. Create one to start auto-replying."
- Agent cards (grid, 2-col on desktop):
  - Name + provider badge (OpenAI / Gemini / DeepSeek) with icon
  - Status badge: `active` → green pill, `inactive` → gray pill
  - `isDefault` → gold star icon + "Default" tag
  - Stats row: `totalConversations` · `totalReplies` · `totalHandoffs`
  - Footer actions: **Edit** | **Test** | **Set Default** | toggle switch for active/inactive
- Clicking card → `/ai-agents/:id`

---

## Page 2 — Create / Edit Agent (`/ai-agents/new`, settings tab)

Multi-section form. All fields from schema:

### Section: Basic Info

| Field | Type | Notes |
|-------|------|-------|
| `name` | text | required |
| `description` | textarea | optional |
| `waba` | select | load from existing WABAs API, label = phone number |
| `isDefault` | toggle | "Make this the default agent for selected WABA" |

### Section: AI Provider

- `provider` (segmented control / radio): **OpenAI** | **Gemini** | **DeepSeek** — each with logo
- `model` (text input with dropdown suggestions, placeholder changes by provider):
  - OpenAI → `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
  - Gemini → `gemini-2.0-flash`, `gemini-1.5-pro`
  - DeepSeek → `deepseek-chat`, `deepseek-reasoner`
- `apiKey` (password input — **never prefill on edit**, show `"API Key saved (hidden)"` if already set)

### Section: Personality

| Field | Type | Notes |
|-------|------|-------|
| `systemPrompt` | large textarea (4+ rows) | "Describe the bot's personality, role, and what it knows" |
| `hardRules` | tag input (array) | "Always say... / Never mention..." — add/remove tags |
| `showCitations` | toggle | "Show source name in reply (e.g. 'According to [Pricing Doc]')" |

### Section: Response Settings

| Field | Type | Notes |
|-------|------|-------|
| `temperature` | slider 0–1, step 0.1 | "Creativity — 0 = precise, 1 = creative" |
| `maxTokens` | number input 50–2000 | "Max reply length (tokens)" |
| `maxHistoryTurns` | number 1–20 | "Conversation memory (past turns to remember)" |

### Section: Human Handoff

| Field | Type | Notes |
|-------|------|-------|
| `maxTurnsBeforeHandoff` | number | "Auto-handoff after N turns" |
| `handoffKeywords` | tag input | "Handoff trigger words", placeholder: "human, agent, support" |
| `handoffMessage` | textarea | "Message sent before handoff" |
| `cantAnswerMessage` | textarea | "Message when AI can't answer (no matching knowledge)" |
| `confidenceThreshold` | slider 0–1, step 0.05 | "Minimum knowledge match score" |

Submit: **Save Agent** / **Update Agent**

> **Important**: On PUT request, only include `apiKey` in the body if the user has typed a new value. If field is empty/unchanged, omit it entirely.

---

## Page 3 — Knowledge Base Tab

### Source Type Selector (icon grid)

```
📝 Plain Text    📄 PDF / DOCX    📊 Excel / CSV
🌐 Website       🕷 Web Crawler    ▶️ YouTube
❓ Q&A Pairs     📋 Rules          🛍 Product Catalog
```

### Add Form (changes based on selected type)

**Common fields (all types):**
- `title` (required)
- `description` (optional)
- `language` (optional, default: Auto)

**Type-specific fields:**

| Type | Extra Fields |
|------|-------------|
| **Text** | Large textarea for raw text |
| **PDF / DOCX / Excel / CSV / PPTX** | Drag-and-drop file upload. Accept: `.pdf .docx .xlsx .xls .csv .pptx`. Max 50MB. Show file name + size after pick. |
| **Website** | URL input |
| **Web Crawler** | Start URL + "Advanced Settings" collapsible accordion: `maxPages` (1–500), `maxDepth` (1–10), Include paths (tag input), Exclude paths (tag input), Auto-sync toggle + interval select (Daily / Weekly / Monthly / Manual) |
| **YouTube** | YouTube URL input. Show video thumbnail preview if URL is valid. |
| **Q&A Pairs** | Dynamic list: add row with Question + Answer fields. "Bulk import CSV" option (format: question,answer per line). |
| **Rules** | Numbered list — one rule per line in textarea, split on newline on submit. |
| **Product Catalog** | Dynamic table: Name\* / Price / Description. Add Row button + CSV import option. |

### Knowledge List (table below the form)

Columns: **Title** · **Type** (icon) · **Status** · **Words** · **Chunks** · **Last Used** · **Actions**

**Status badges:**
- `pending` → yellow dot "Pending"
- `processing` → blue spinner "Processing..."
- `ready` → green dot "Ready"
- `failed` → red dot "Failed" + error message in tooltip
- `outdated` → orange dot "Outdated"

**Actions per row:**
- **View** → modal showing extracted text (first 2000 chars + "Show more")
- **Retrigger** → only for `failed` or `outdated` status
- **Delete** → confirm modal

**Stats bar above table:**
```
X docs ready  ·  Y,ZZZ words indexed  ·  N never used  ·  M failed
```

**Polling:** Auto-refresh list every 5 seconds if any doc has status `pending` or `processing`. Stop polling when all docs are `ready` or `failed`. Show subtle "Syncing..." indicator while polling.

**After adding website / crawler / YouTube** → show toast: *"Extracting content in background... status will update automatically."*

---

## Page 4 — Test Query Playground Tab

Split-panel layout (left input, right output):

### Left Panel (Input)

- `message` — large textarea, placeholder: *"Ask a question as if you're a customer..."*
- `[→ Test]` button (primary, full width)
- Loading state: animated typing indicator dots

> Show warning banner if knowledge doc count = 0: *"No knowledge added yet. AI will answer from its base model only."*

### Right Panel (Output — shown after response)

```
┌─ AI Reply ─────────────────────────────────────┐
│  [reply text rendered here]                     │
└─────────────────────────────────────────────────┘

┌─ Knowledge Used (N chunks) ─────────────────────┐
│  ████████░░  0.89   "Pricing Doc"  (pdf)        │
│  [snippet — first 300 chars of chunk content]   │
│  ─────────────────────────────────────────────  │
│  ███████░░░  0.72   "FAQ Page"  (website)       │
│  [snippet]                                      │
└─────────────────────────────────────────────────┘

┌─ Debug Info ────────────────────────────────────┐
│  ⏱ 1,240ms    📥 820 tokens in    📤 95 out     │
│  🤖 gpt-4o  (openai)                            │
└─────────────────────────────────────────────────┘
```

**Score bar colors:**
- `score >= 0.80` → green
- `score 0.60–0.79` → yellow/amber
- `score < 0.60` → red (shouldn't appear — filtered by threshold)

**If `knowledgeUsed === 0`** → show amber warning box:
*"No knowledge matched this query. The agent replied using its base model only. Add relevant documents to improve accuracy."*

**"System Prompt Preview"** — collapsible section (collapsed by default) showing first 500 chars of the built prompt.

---

## Page 5 — Conversations Tab

### Top Stats Row (4 KPI tiles)

```
[ Total ]   [ Active ]   [ Handed Off ]   [ Resolved ]
                          (orange tile)
```

Handoff rate % — show as a badge. Red if > 30%.

### Filter Bar

- Status filter: **All** | **Active** | **Handed Off** | **Resolved**
- Search by phone number

### Conversation Table

| Column | Notes |
|--------|-------|
| Phone | formatted number |
| Last Message | truncated to 60 chars |
| Turns | turnCount |
| Status | colored badge |
| Last Active | relative time ("2 min ago") |
| Actions | View · Resolve (if handed_off) · Reactivate (if resolved) |

**`handed_off` rows** → orange left border or highlight — support team notices them first.

### Conversation Detail Drawer (slides from right on row click)

- Header: phone number + status badge + action buttons
- **Message thread (WhatsApp-style bubbles):**
  - User messages → left, gray background
  - AI messages → right, green background
  - Timestamp on each bubble
- If `status === 'handed_off'` → orange banner at top: *"Human handoff triggered — Reason: [handoffReason]"*
- **Footer actions:**
  - `handed_off` → **Mark Resolved** button
  - `resolved` → **Reactivate AI** button (re-enables AI replies for this conversation)

---

## Page 6 — Analytics Tab

### Agent Stats (from `GET /ai-agents/:id/analytics?days=30`)

**4 KPI cards:**
- Total Conversations
- Total Replies
- Total Handoffs
- Handoff Rate %

**Line chart:** Daily conversation count for last 30 days (x = date, y = count). Use existing chart library in the project.

### Knowledge Analytics (from `GET /ai-agents/:id/knowledge-analytics`)

**Horizontal bar chart:** Top 5 knowledge docs by `timesRetrieved`

**Table:** All docs with columns — Title · Type · Times Retrieved · Last Used · Words · Chunks

**Never-used rows** (timesRetrieved === 0) → faded gray + "Never Used" badge. Helper text: *"Consider removing or improving these documents."*

---

## API Reference

### Agents

```
GET    /ai-agents                                → list all agents for org
POST   /ai-agents                                → create agent
GET    /ai-agents/:id                            → get one (no apiKey)
PUT    /ai-agents/:id                            → update (omit apiKey if unchanged)
DELETE /ai-agents/:id                            → delete
PATCH  /ai-agents/:id/set-default                → body: { wabaId? }
PATCH  /ai-agents/:id/toggle-status              → toggle active ↔ inactive
```

### Knowledge (prefix: `/ai-agents/:agentId/knowledge`)

```
GET    /knowledge                                → list (no extractedText field)
GET    /knowledge/stats                          → { total, ready, failed, totalWords, byType }
GET    /knowledge/:id                            → single doc (includes extractedText)
POST   /knowledge/text                           → { title, description?, text, language? }
POST   /knowledge/file                           → multipart: file + title + description? + language?
POST   /knowledge/website                        → { title, description?, url, language? }
POST   /knowledge/crawler                        → { title, startUrl, config?, autoSync?, syncInterval? }
POST   /knowledge/youtube                        → { title, description?, youtubeUrl, language? }
POST   /knowledge/qa-pairs                       → { title, pairs: [{question, answer}] }
POST   /knowledge/rules                          → { title, rules: string[] }
POST   /knowledge/product-catalog                → { title, products: [{name, price?, description?}] }
PATCH  /knowledge/:id                            → { title?, description?, autoSync?, syncInterval? }
POST   /knowledge/:id/retrigger                  → re-process failed/outdated
DELETE /knowledge/:id
```

### Test + Analytics

```
POST   /ai-agents/:id/test                       → body: { message: string }
GET    /ai-agents/:id/analytics?days=30
GET    /ai-agents/:id/knowledge-analytics
```

### Conversations

```
GET    /ai-agents/:id/conversations?page=1&limit=20&status=active
GET    /ai-agents/:id/conversations/:convId      → includes messages[]
PATCH  /ai-agents/:id/conversations/:convId/resolve
PATCH  /ai-agents/:id/conversations/:convId/reactivate
```

---

## Response Shapes (Key)

### Agent object
```json
{
  "_id": "...",
  "name": "Support Bot",
  "description": "...",
  "provider": "openai",
  "model": "gpt-4o",
  "waba": { "_id": "...", "displayPhoneNumber": "+91 98765 43210" },
  "systemPrompt": "You are a helpful assistant...",
  "hardRules": ["Always respond in Hindi", "Never mention competitors"],
  "temperature": 0.7,
  "maxTokens": 500,
  "maxHistoryTurns": 10,
  "maxTurnsBeforeHandoff": 50,
  "handoffKeywords": ["human", "agent", "support"],
  "handoffMessage": "Connecting you to our team...",
  "cantAnswerMessage": "I'm not sure about this. Let me connect you with our team.",
  "confidenceThreshold": 0.65,
  "showCitations": false,
  "isDefault": true,
  "status": "active",
  "totalConversations": 142,
  "totalReplies": 891,
  "totalHandoffs": 23
}
```

### Test query response
```json
{
  "reply": "Our Paathshala plan costs ₹2999/year...",
  "chunks": [
    {
      "title": "Pricing Doc",
      "type": "pdf",
      "score": 0.891,
      "content": "Paathshala annual subscription: ₹2999...",
      "knowledgeId": "..."
    }
  ],
  "knowledgeUsed": 2,
  "processingMs": 1240,
  "inputTokens": 820,
  "outputTokens": 95,
  "agentUsed": { "name": "Support Bot", "provider": "openai", "model": "gpt-4o" },
  "systemPromptPreview": "You are a helpful assistant for..."
}
```

### Knowledge doc (list item)
```json
{
  "_id": "...",
  "title": "Product FAQ",
  "type": "pdf",
  "status": "ready",
  "wordCount": 3420,
  "chunkCount": 14,
  "fileName": "faq.pdf",
  "fileSize": 204800,
  "timesRetrieved": 47,
  "lastUsedAt": "2026-07-12T10:30:00Z",
  "createdAt": "2026-07-01T09:00:00Z"
}
```

### Conversation list item
```json
{
  "_id": "...",
  "phone": "919876543210",
  "status": "handed_off",
  "handoffReason": "keyword",
  "turnCount": 8,
  "lastMessageAt": "2026-07-12T11:45:00Z"
}
```

### Conversation messages
```json
{
  "_id": "...",
  "phone": "919876543210",
  "status": "active",
  "turnCount": 5,
  "messages": [
    { "role": "user", "content": "Paathshala ka price kya hai?", "timestamp": "..." },
    { "role": "assistant", "content": "Paathshala plan ₹2999/year mein aata hai...", "timestamp": "..." }
  ]
}
```

---

## Enums Reference

```typescript
// Provider
type AiProvider = 'openai' | 'gemini' | 'deepseek'

// Agent status
type AiAgentStatus = 'active' | 'inactive'

// Knowledge type
type KnowledgeType =
  | 'text' | 'pdf' | 'docx' | 'excel' | 'csv' | 'pptx'
  | 'website' | 'website_crawler' | 'youtube'
  | 'audio' | 'video' | 'image'
  | 'qa_pairs' | 'rules' | 'product_catalog'

// Knowledge status
type KnowledgeStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'outdated'

// Conversation status
type AiConversationStatus = 'active' | 'handed_off' | 'resolved'

// Handoff reason
type HandoffReason = 'max_turns' | 'keyword' | 'cant_answer' | 'manual'
```

---

## Important UX Rules

1. **apiKey field** — on edit form, never prefill. Show `"API Key saved (hidden)"` text. Only include in PUT body if user types a new value.
2. **Knowledge polling** — if any doc has `status: pending | processing`, auto-refresh list every 5 seconds. Stop when all are `ready | failed`. Show subtle "Syncing..." indicator.
3. **File upload** — validate extension client-side before uploading. Show progress bar. Accepted: `.pdf .docx .xlsx .xls .csv .pptx`.
4. **Async sources** — after adding website / crawler / YouTube, show toast: *"Extracting content in background..."* and start polling.
5. **Test query loading** — disable button while loading. Show typing animation. If `knowledgeUsed === 0`, show amber warning (not error).
6. **Handed-off conversations** — visually prominent (orange border/highlight). Support team should see these first.
7. **Default agent badge** — if `isDefault: true`, show gold badge on agent detail header: *"Default agent for +91 98765 43210"*.
8. **Crawler config** — show as collapsible "Advanced Settings" accordion, collapsed by default.
9. **Empty knowledge warning on Test tab** — if no knowledge docs, show banner explaining AI will use base model only.
10. **Delete confirmation** — always show confirm modal before deleting an agent or knowledge doc.
11. **Status polling stops** — never poll indefinitely. Stop after all items are in terminal state (`ready` or `failed`). Max 10 minutes polling timeout.
12. **Conversation drawer** — load messages lazily when drawer opens (don't load all conversations' messages upfront).
