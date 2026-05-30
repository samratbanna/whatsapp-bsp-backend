# Conversation Management — Implementation Plan

## Decisions Recap

| # | Decision |
|---|----------|
| 1 | One conversation per **phone + WABA** (unique constraint on `organization + waba + phone`) |
| 2 | Conversation created **only when a reply arrives** (not on campaign send) |
| 3 | Resolved conversation **auto-reopens** when contact messages again |
| 4 | Inbox list is **paginated** (cursor-based by `lastMessageAt`) |
| 5 | **Separate `conversations` module** (Option A) |

---

## New Module Structure

```
src/modules/conversations/
├── schemas/
│   └── conversation.schema.ts        ← MongoDB document definition
├── dto/
│   └── conversation.dto.ts           ← Request/query DTOs + validators
├── conversations.service.ts          ← Business logic
├── conversations.controller.ts       ← REST endpoints
└── conversations.module.ts           ← Module wiring
```

---

## Step 1 — Conversation Schema

**File:** `src/modules/conversations/schemas/conversation.schema.ts`

```ts
export enum ConversationStatus {
  OPEN       = 'open',
  RESOLVED   = 'resolved',
  ASSIGNED   = 'assigned',
}

export enum ConversationOrigin {
  INBOUND  = 'inbound',   // contact messaged us first (no campaign)
  CAMPAIGN = 'campaign',  // contact replied to a campaign message
  MANUAL   = 'manual',    // agent started conversation from inbox
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  // The contact's phone number (E.164)
  @Prop({ required: true, trim: true })
  phone: string;

  // Linked contact record (may be null if phone not in contacts)
  @Prop({ type: Types.ObjectId, ref: 'Contact', default: null })
  contact: Types.ObjectId | null;

  @Prop({ enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Prop({ enum: ConversationOrigin, default: ConversationOrigin.INBOUND })
  origin: ConversationOrigin;

  // Set only when origin = 'campaign'
  @Prop({ type: Types.ObjectId, ref: 'Campaign', default: null })
  campaign: Types.ObjectId | null;

  // Agent assigned to this conversation (nullable)
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  // Denormalized last message snapshot (avoids join on inbox list)
  @Prop({
    type: {
      text: String,
      type: String,        // MessageType enum value
      direction: String,   // 'inbound' | 'outbound'
      status: String,      // MessageStatus enum value
      createdAt: Date,
    },
    default: null,
    _id: false,
  })
  lastMessage: {
    text: string;
    type: string;
    direction: string;
    status: string;
    createdAt: Date;
  } | null;

  // Timestamp of last message — used for inbox sort
  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null;

  // Count of inbound messages not yet read by any agent
  @Prop({ default: 0 })
  unreadCount: number;

  // Labels / tags applied by agents
  @Prop({ type: [String], default: [] })
  labels: string[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Core uniqueness: one conversation per phone per WABA per org
ConversationSchema.index(
  { organization: 1, waba: 1, phone: 1 },
  { unique: true },
);

// Inbox list — latest first
ConversationSchema.index({ organization: 1, waba: 1, lastMessageAt: -1 });

// Filter by status
ConversationSchema.index({ organization: 1, waba: 1, status: 1 });

// Filter by campaign
ConversationSchema.index({ organization: 1, campaign: 1 });
```

**Why unique on `organization + waba + phone`:**
With multiple WABAs in one org, the same contact can have separate conversations per WABA (e.g., support WABA vs sales WABA). The unique index enforces one conversation per (org, waba, phone) triple and lets `findOrCreate` do an atomic upsert.

---

## Step 2 — DTOs

**File:** `src/modules/conversations/dto/conversation.dto.ts`

```ts
// Query DTO for listing conversations
export class ConversationListDto {
  @IsOptional() @IsString()
  wabaId: string;               // required in practice — filter by WABA

  @IsOptional() @IsEnum(ConversationStatus)
  status?: ConversationStatus;  // filter: open | resolved | assigned

  @IsOptional() @IsString()
  assignedTo?: string;          // filter by agent userId

  @IsOptional() @IsString()
  campaignId?: string;          // filter: replies from a specific campaign

  @IsOptional() @IsString()
  search?: string;              // phone number or contact name search

  @IsOptional() @IsString()
  label?: string;               // filter by label

  @IsOptional() @IsInt() @Min(1)
  page?: number;                // page number (default: 1)

  @IsOptional() @IsInt() @Min(1) @Max(100)
  limit?: number;               // page size (default: 30)
}

// PATCH status
export class UpdateConversationStatusDto {
  @IsEnum(ConversationStatus)
  status: ConversationStatus;
}

// PATCH assign
export class AssignConversationDto {
  @IsString()
  userId: string;
}

// PATCH labels
export class UpdateLabelsDto {
  @IsArray() @IsString({ each: true })
  labels: string[];
}
```

---

## Step 3 — ConversationsService

**File:** `src/modules/conversations/conversations.service.ts`

### 3.1 `findOrCreate` — the core method

Called by `WebhookService` every time an inbound message arrives.

```ts
async findOrCreate(
  orgId: string,
  wabaId: string,
  phone: string,
  origin: ConversationOrigin,
  campaignId?: string,
  contactId?: string,
): Promise<{ conversation: ConversationDocument; isNew: boolean }>
```

**Logic:**

```
1. Try findOne({ organization, waba, phone })
2. If found AND status = RESOLVED → set status = OPEN (auto-reopen), save → return { isNew: false }
3. If found AND status = OPEN/ASSIGNED → return { isNew: false }
4. If NOT found → create new Conversation:
     - organization, waba, phone
     - origin = provided origin
     - campaign = campaignId (if any)
     - contact = contactId (if any, lookup by phone)
     - status = OPEN
   → return { isNew: true }
```

**Implementation note:** Use MongoDB `findOneAndUpdate` with `upsert: true` to handle race conditions (two webhook events arriving simultaneously for the same phone).

```ts
const conversation = await this.conversationModel.findOneAndUpdate(
  { organization: orgId, waba: wabaId, phone },
  {
    $setOnInsert: {            // only set these on INSERT (new doc)
      organization: orgId,
      waba: wabaId,
      phone,
      origin,
      campaign: campaignId ?? null,
      contact: contactId ?? null,
      status: ConversationStatus.OPEN,
      unreadCount: 0,
      labels: [],
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);
```

After upsert, if the conversation already existed and is RESOLVED → re-open it separately.

---

### 3.2 `updateAfterMessage` — called after every inbound/outbound message

```ts
async updateAfterMessage(
  conversationId: string,
  message: MessageDocument,
): Promise<void>
```

**Logic:**

```
1. Build lastMessage snapshot from the message document
2. $set lastMessage, lastMessageAt = message.createdAt
3. If direction = INBOUND → $inc unreadCount by 1
4. If direction = OUTBOUND → unreadCount stays (agent sent, no new unread)
```

---

### 3.3 `list` — paginated inbox

```ts
async list(orgId: string, dto: ConversationListDto): Promise<{
  data: ConversationDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}>
```

**Logic:**

```
Build filter: { organization, waba }
  + status (if provided)
  + assignedTo (if provided)
  + campaign (if provided)
  + labels: { $in: [label] } (if provided)
  + search: $or [{ phone: /regex/ }, lookup contact by name]

Sort: { lastMessageAt: -1 }  (latest activity first)
Paginate: skip = (page-1) * limit, limit

Populate: contact (name, avatar) — single lookup
```

---

### 3.4 Other methods

```ts
// Single conversation detail (with contact populated)
findOne(orgId: string, conversationId: string): Promise<ConversationDocument>

// Full message history for a conversation (paginated)
getMessages(orgId: string, conversationId: string, page: number, limit: number)
  → queries Message collection: { from|to: phone, waba: wabaId }
  → sorted createdAt ASC (oldest first, like a chat)
  → paginated

// Agent actions
updateStatus(orgId: string, id: string, status: ConversationStatus): Promise<void>
assignAgent(orgId: string, id: string, userId: string): Promise<void>
updateLabels(orgId: string, id: string, labels: string[]): Promise<void>

// Mark all inbound messages in this conversation as read
markRead(orgId: string, id: string): Promise<{ updated: number }>
  → sets unreadCount = 0 on Conversation
  → bulk update Messages: { from: phone, direction: INBOUND, status != READ }
```

---

## Step 4 — ConversationsController

**File:** `src/modules/conversations/conversations.controller.ts`

```
GET    /conversations                       list (paginated inbox)
GET    /conversations/:id                   single conversation
GET    /conversations/:id/messages          message history (paginated)
PATCH  /conversations/:id/status            open | resolved
PATCH  /conversations/:id/assign            assign agent
PATCH  /conversations/:id/labels            update labels
POST   /conversations/:id/mark-read         clear unread count
```

All routes are guarded with `JwtAuthGuard + RolesGuard` (same as messages controller).
`wabaId` is passed as a query param on the list endpoint; for single-conversation routes, the WABA is derived from the conversation document itself.

---

## Step 5 — Webhook Integration

**File to modify:** `src/modules/webhook/webhook.service.ts`

### 5.1 Inject ConversationsService

```ts
constructor(
  ...
  private conversationsService: ConversationsService,  // ← ADD
) {}
```

### 5.2 Modify inbound message handling

In `processChange()`, after `storeInbound()` succeeds:

```ts
// BEFORE (existing)
const stored = await this.messagesService.storeInbound(...)
this.inboxGateway?.broadcastInbound(orgId, stored)

// AFTER
const stored = await this.messagesService.storeInbound(...)

// ── Conversation management ──────────────────────────────────────
// Detect if this phone replied to a campaign message
const campaignRef = await this.messagesService.findCampaignByPhone(
  orgId, wabaDbId, message.from
)

const { conversation, isNew } = await this.conversationsService.findOrCreate(
  orgId,
  wabaDbId,
  message.from,
  campaignRef ? ConversationOrigin.CAMPAIGN : ConversationOrigin.INBOUND,
  campaignRef?.toString(),
)

await this.conversationsService.updateAfterMessage(
  conversation._id.toString(),
  stored,
)

// Broadcast to inbox via WebSocket
if (isNew) {
  this.inboxGateway?.broadcastNewConversation(orgId, conversation)
} else {
  this.inboxGateway?.broadcastConversationUpdate(orgId, conversation)
}
this.inboxGateway?.broadcastInbound(orgId, stored)  // existing — unchanged
```

### 5.3 New helper in MessagesService

```ts
// Find the most recent outbound campaign message sent to this phone
// Returns the campaignId if found, null otherwise
async findCampaignByPhone(
  orgId: string,
  wabaId: string,
  phone: string,
): Promise<Types.ObjectId | null>
```

Queries:
```
Message.findOne({
  organization: orgId,
  waba: wabaId,
  to: phone,
  direction: OUTBOUND,
  campaign: { $ne: null },
})
.sort({ createdAt: -1 })
.select('campaign')
```

---

## Step 6 — InboxGateway Additions

**File to modify:** `src/modules/inbox/gateways/inbox.gateway.ts`

Add two new broadcast methods:

```ts
// Called when a brand-new conversation is created (first reply)
broadcastNewConversation(orgId: string, conversation: any) {
  this.server.to(`org:${orgId}`).emit('new:conversation', conversation)
}

// Called when an existing conversation updates (new message, status change)
broadcastConversationUpdate(orgId: string, conversation: any) {
  this.server.to(`org:${orgId}`).emit('conversation:update', conversation)
}

// Called when agent resolves / reopens a conversation
broadcastConversationStatus(orgId: string, id: string, status: string) {
  this.server.to(`org:${orgId}`).emit('conversation:status', { id, status })
}

// Called when conversation is assigned to an agent
broadcastConversationAssigned(orgId: string, id: string, userId: string) {
  this.server.to(`org:${orgId}`).emit('conversation:assigned', { id, userId })
}
```

No changes to existing events (`new:message`, `message:status`).

---

## Step 7 — Module Wiring

**File:** `src/modules/conversations/conversations.module.ts`

```ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },   // direct model access (no circular dep)
    ]),
    InboxModule,    // for InboxGateway injection
    JwtModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],   // exported so WebhookModule can inject it
})
export class ConversationsModule {}
```

**Why import `MessageSchema` directly:**
`ConversationsService` needs to query messages for `getMessages()`. By importing the Mongoose model directly (not `MessagesModule`), we avoid a circular dependency chain: `ConversationsModule → MessagesModule → ConversationsModule`.

**Modules to update:**

| File | Change |
|------|--------|
| `src/app.module.ts` | Add `ConversationsModule` to `imports` |
| `src/modules/webhook/webhook.module.ts` | Add `ConversationsModule` to `imports` |
| `src/modules/webhook/webhook.service.ts` | Inject `ConversationsService`, call `findOrCreate` + `updateAfterMessage` |
| `src/modules/messages/messages.service.ts` | Add `findCampaignByPhone()` helper method |

---

## Complete Socket.io Event Reference

### Client → Server (existing, unchanged)

| Event | Payload | Action |
|-------|---------|--------|
| `join:conversation` | `{ phone }` | Agent starts watching a conversation |
| `leave:conversation` | `{ phone }` | Agent stops watching |
| `send:message` | `{ to, text, wabaId? }` | Send outbound message |
| `mark:read` | `{ phone }` | Mark conversation as read |

### Server → Client (existing)

| Event | Payload | Trigger |
|-------|---------|---------|
| `new:message` | message document | Any new inbound or outbound message |
| `message:status` | `{ metaMessageId, status, timestamp }` | Delivery/read receipts from Meta |

### Server → Client (new)

| Event | Payload | Trigger |
|-------|---------|---------|
| `new:conversation` | conversation document | First inbound message from a new phone |
| `conversation:update` | conversation document | `lastMessage`, `unreadCount`, `lastMessageAt` changed |
| `conversation:status` | `{ id, status }` | Agent resolves or reopens |
| `conversation:assigned` | `{ id, userId }` | Conversation assigned to an agent |

---

## API Reference

### `GET /conversations`

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `wabaId` | string | yes | Filter by WABA |
| `status` | enum | no | `open` \| `resolved` \| `assigned` |
| `assignedTo` | string | no | Agent userId |
| `campaignId` | string | no | Replies from a specific campaign |
| `label` | string | no | Filter by label |
| `search` | string | no | Phone number or contact name |
| `page` | number | no | Default: 1 |
| `limit` | number | no | Default: 30, max: 100 |

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "phone": "919876543210",
      "status": "open",
      "origin": "campaign",
      "campaign": "...",
      "assignedTo": null,
      "lastMessage": {
        "text": "Hello, I'm interested",
        "type": "text",
        "direction": "inbound",
        "status": "delivered",
        "createdAt": "2026-05-30T10:00:00Z"
      },
      "lastMessageAt": "2026-05-30T10:00:00Z",
      "unreadCount": 3,
      "labels": ["hot-lead"],
      "contact": { "_id": "...", "name": "Ravi Kumar", "avatar": null }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 30,
  "pages": 1
}
```

---

### `GET /conversations/:id`
Returns single conversation document with contact populated.

---

### `GET /conversations/:id/messages`

**Query params:** `page`, `limit`

Returns paginated messages sorted `createdAt ASC` (oldest first — chat style).

---

### `PATCH /conversations/:id/status`
```json
{ "status": "resolved" }
```
Also fires `broadcastConversationStatus` via WebSocket.

---

### `PATCH /conversations/:id/assign`
```json
{ "userId": "..." }
```
Sets `status = assigned`, `assignedTo = userId`.
Also fires `broadcastConversationAssigned` via WebSocket.

---

### `PATCH /conversations/:id/labels`
```json
{ "labels": ["hot-lead", "follow-up"] }
```

---

### `POST /conversations/:id/mark-read`
Sets `unreadCount = 0` on the conversation.
Bulk-updates all inbound messages for this phone to `status = READ`.

---

## Full Data Flow

```
Campaign → 1000 contacts
  (no conversation created yet)

Contact replies via WhatsApp
  ↓
Meta sends webhook event
  ↓
WebhookService.processChange()
  ↓
messagesService.storeInbound()          → saves Message doc (direction: inbound)
  ↓
messagesService.findCampaignByPhone()   → finds campaign ref (if any outbound campaign msg exists)
  ↓
conversationsService.findOrCreate()
  ├─ Conversation does NOT exist → CREATE (status: open, origin: campaign/inbound)
  │    → isNew = true
  └─ Conversation EXISTS
       ├─ status = resolved → RE-OPEN (status: open)
       │    → isNew = false
       └─ status = open/assigned → no change
            → isNew = false
  ↓
conversationsService.updateAfterMessage()
  → sets lastMessage snapshot
  → sets lastMessageAt
  → increments unreadCount
  ↓
inboxGateway.broadcastNewConversation()    (if isNew)
   OR
inboxGateway.broadcastConversationUpdate() (if existing)
  ↓
inboxGateway.broadcastInbound()            (always — for open conversation windows)

─────────────────────────────────────────────────────

Agent opens inbox panel
  ↓
GET /conversations?wabaId=...&status=open
  → paginated list, sorted by lastMessageAt DESC
  → inbox shows 10 conversations with unread badges

Agent clicks conversation #3
  ↓
GET /conversations/:id/messages?page=1&limit=50
  → full chat history (oldest first)
  ↓
WebSocket: emit('join:conversation', { phone })
  → agent joins conv:orgId:phone room

Agent replies
  ↓
WebSocket: emit('send:message', { to, text, wabaId })
  → MessagesService.sendText()
  → conversationsService.updateAfterMessage()  ← outbound, no unread increment
  → broadcastConversationUpdate()
  → broadcast new:message to conversation room

Agent resolves
  ↓
PATCH /conversations/:id/status  { status: 'resolved' }
  → broadcastConversationStatus()
  → frontend removes from open inbox

Contact replies again (after resolved)
  ↓
findOrCreate() detects status=resolved → re-opens
  → broadcastConversationUpdate() with status=open
  → conversation reappears in inbox
```

---

## Implementation Order

| Step | File | What |
|------|------|------|
| 1 | `conversations/schemas/conversation.schema.ts` | Schema + indexes |
| 2 | `conversations/dto/conversation.dto.ts` | All DTOs |
| 3 | `conversations/conversations.service.ts` | All service methods |
| 4 | `conversations/conversations.controller.ts` | All REST endpoints |
| 5 | `conversations/conversations.module.ts` | Module wiring |
| 6 | `messages/messages.service.ts` | Add `findCampaignByPhone()` |
| 7 | `inbox/gateways/inbox.gateway.ts` | Add 4 new broadcast methods |
| 8 | `webhook/webhook.service.ts` | Inject `ConversationsService`, add `findOrCreate` + `updateAfterMessage` calls |
| 9 | `webhook/webhook.module.ts` | Import `ConversationsModule` |
| 10 | `app.module.ts` | Register `ConversationsModule` |

---

## Notes

- **Idempotency:** `storeInbound` already deduplicates by `metaMessageId`. `findOrCreate` uses `upsert: true` — safe for concurrent webhook deliveries.
- **`getConversations()` in MessagesService:** This existing method (used by `GET /messages/conversations`) can remain as-is for now. Once the new `conversations` collection is in use, it can be deprecated and removed.
- **Contact lookup:** `findOrCreate` should attempt to find a Contact by `{ organization, phone }` and set the `contact` field. If no contact exists, `contact` stays `null` — the inbox shows the phone number raw.
- **`lastMessage.text` for non-text types:** For image/video/audio messages, store a placeholder string like `"📷 Image"` / `"🎥 Video"` in `lastMessage.text` so the inbox preview is always populated.
