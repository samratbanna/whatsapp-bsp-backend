# Conversations — Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [TypeScript Types](#typescript-types)
4. [REST API](#rest-api)
   - [List Conversations (Inbox)](#1-list-conversations-inbox)
   - [Get Single Conversation](#2-get-single-conversation)
   - [Get Message History](#3-get-message-history)
   - [Update Status](#4-update-status)
   - [Assign Agent](#5-assign-agent)
   - [Update Labels](#6-update-labels)
   - [Mark as Read](#7-mark-as-read)
5. [WebSocket (Real-time)](#websocket-real-time)
   - [Connection Setup](#connection-setup)
   - [Client → Server Events](#client--server-events)
   - [Server → Client Events](#server--client-events)
6. [Complete Integration Examples](#complete-integration-examples)
   - [Inbox Panel](#inbox-panel-example)
   - [Conversation Window](#conversation-window-example)
7. [State Management Flow](#state-management-flow)
8. [Error Handling](#error-handling)

---

## Overview

The conversation system works as follows:

- You send a **campaign** to 1000 contacts.
- When any of those contacts **replies**, a **Conversation** is automatically created for that contact's phone number.
- All future messages (inbound or outbound) with that phone number are part of the **same Conversation** — forever.
- Conversations are scoped to a **WABA** (WhatsApp Business Account). You must always pass `wabaId` when listing conversations.
- The inbox updates **in real-time** via WebSocket — no polling required.

---

## Authentication

Every REST API request requires a **Bearer token** in the `Authorization` header.

```
Authorization: Bearer <jwt_token>
```

The WebSocket connection also requires the token — passed at connection time (see [Connection Setup](#connection-setup)).

---

## TypeScript Types

Copy these types into your frontend project.

```ts
// ── Enums ──────────────────────────────────────────────────────────────────

export type ConversationStatus = 'open' | 'resolved' | 'assigned';
export type ConversationOrigin = 'inbound' | 'campaign' | 'manual';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus    = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType =
  | 'text' | 'image' | 'video' | 'audio' | 'document'
  | 'template' | 'interactive' | 'location' | 'sticker'
  | 'reaction' | 'contacts';

// ── Conversation ───────────────────────────────────────────────────────────

export interface LastMessage {
  text:      string;        // preview text — media types show emoji e.g. "📷 Image"
  type:      MessageType;
  direction: MessageDirection;
  status:    MessageStatus;
  createdAt: string;        // ISO date string
}

export interface ContactSummary {
  _id:    string;
  name:   string | null;
  avatar: string | null;
  labels: string[];
}

export interface AgentSummary {
  _id:   string;
  name:  string;
  email: string;
}

export interface CampaignSummary {
  _id:    string;
  name:   string;
  status: string;
}

export interface Conversation {
  _id:           string;
  organization:  string;
  waba:          string;
  phone:         string;           // E.164 e.g. "919876543210"
  contact:       ContactSummary | null;
  status:        ConversationStatus;
  origin:        ConversationOrigin;
  campaign:      CampaignSummary | null;
  assignedTo:    AgentSummary | null;
  lastMessage:   LastMessage | null;
  lastMessageAt: string | null;    // ISO date string — used for inbox sort
  unreadCount:   number;
  labels:        string[];
  createdAt:     string;
  updatedAt:     string;
}

// ── Message ────────────────────────────────────────────────────────────────

export interface MessageContent {
  text?:               string;
  mediaUrl?:           string;
  mediaId?:            string;
  mimeType?:           string;
  caption?:            string;
  filename?:           string;
  templateName?:       string;
  templateLanguage?:   string;
  templateComponents?: any[];
  location?:           { latitude: number; longitude: number; name?: string; address?: string };
  reaction?:           { messageId: string; emoji: string };
}

export interface Message {
  _id:              string;
  organization:     string;
  waba:             string;
  metaMessageId?:   string;
  from:             string;
  to:               string;
  direction:        MessageDirection;
  type:             MessageType;
  status:           MessageStatus;
  content:          MessageContent;
  contact:          string | null;
  campaign:         string | null;
  sentAt?:          string;
  deliveredAt?:     string;
  readAt?:          string;
  failedAt?:        string;
  failureReason?:   string;
  createdAt:        string;
  updatedAt:        string;
}

// ── Paginated responses ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}
```

---

## REST API

**Base URL:** `https://your-api.com` (replace with your actual API URL)

All endpoints require `Authorization: Bearer <token>`.

---

### 1. List Conversations (Inbox)

Fetches the paginated inbox list, sorted by **latest activity first**.

```
GET /conversations
```

**Query Parameters:**

| Parameter    | Type   | Required | Default | Description |
|-------------|--------|----------|---------|-------------|
| `wabaId`    | string | **Yes**  | —       | Filter by WABA ID |
| `status`    | string | No       | —       | `open` \| `resolved` \| `assigned` |
| `assignedTo`| string | No       | —       | Agent user ID |
| `campaignId`| string | No       | —       | Show only replies from a specific campaign |
| `label`     | string | No       | —       | Filter by label name |
| `search`    | string | No       | —       | Search by phone number or contact name |
| `page`      | number | No       | `1`     | Page number |
| `limit`     | number | No       | `30`    | Items per page (max: 100) |

**Example Request:**

```ts
const response = await fetch(
  `/conversations?wabaId=664abc123&status=open&page=1&limit=30`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const inbox: PaginatedResponse<Conversation> = await response.json();
```

**Example Response:**

```json
{
  "data": [
    {
      "_id": "6648a1f2e4b0c3d9a1234567",
      "phone": "919876543210",
      "status": "open",
      "origin": "campaign",
      "campaign": {
        "_id": "663f...",
        "name": "May Offer Campaign",
        "status": "completed"
      },
      "assignedTo": null,
      "contact": {
        "_id": "663e...",
        "name": "Ravi Kumar",
        "avatar": null,
        "labels": ["hot-lead"]
      },
      "lastMessage": {
        "text": "Hello, I'm interested in the offer",
        "type": "text",
        "direction": "inbound",
        "status": "delivered",
        "createdAt": "2026-05-30T10:22:00.000Z"
      },
      "lastMessageAt": "2026-05-30T10:22:00.000Z",
      "unreadCount": 3,
      "labels": ["hot-lead"],
      "createdAt": "2026-05-30T10:22:00.000Z",
      "updatedAt": "2026-05-30T10:22:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 30,
  "pages": 1
}
```

---

### 2. Get Single Conversation

Returns full conversation detail with contact, agent, and campaign populated.

```
GET /conversations/:id
```

**Example Request:**

```ts
const response = await fetch(`/conversations/6648a1f2e4b0c3d9a1234567`, {
  headers: { Authorization: `Bearer ${token}` }
});
const conversation: Conversation = await response.json();
```

---

### 3. Get Message History

Returns paginated messages for a conversation, sorted **oldest first** (chat style).

```
GET /conversations/:id/messages
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| `page`    | number | No       | `1`     | Page number |
| `limit`   | number | No       | `50`    | Messages per page (max: 100) |

**Example Request:**

```ts
const response = await fetch(
  `/conversations/6648a1f2e4b0c3d9a1234567/messages?page=1&limit=50`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const history: PaginatedResponse<Message> = await response.json();
```

**Note:** Load older messages by incrementing the page number (page 1 = oldest 50, page 2 = next 50, etc.).

---

### 4. Update Status

Set a conversation to `open` or `resolved`.

```
PATCH /conversations/:id/status
```

**Request Body:**

```json
{ "status": "resolved" }
```

```ts
await fetch(`/conversations/6648.../status`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ status: 'resolved' }),
});
```

**Behavior:**
- Setting `resolved` closes the conversation in the inbox.
- If the contact messages again after resolving, the conversation **automatically reopens** to `open` — no action needed from frontend.

---

### 5. Assign Agent

Assigns the conversation to a specific agent. Also sets `status` to `assigned`.

```
PATCH /conversations/:id/assign
```

**Request Body:**

```json
{ "userId": "664agent123" }
```

```ts
await fetch(`/conversations/6648.../assign`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: '664agent123' }),
});
```

---

### 6. Update Labels

Replace the full label list on a conversation.

```
PATCH /conversations/:id/labels
```

**Request Body:**

```json
{ "labels": ["hot-lead", "follow-up"] }
```

```ts
await fetch(`/conversations/6648.../labels`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ labels: ['hot-lead', 'follow-up'] }),
});
```

---

### 7. Mark as Read

Clears the unread badge (`unreadCount → 0`) and marks all inbound messages as read.

**Call this when an agent opens a conversation.**

```
POST /conversations/:id/mark-read
```

```ts
await fetch(`/conversations/6648.../mark-read`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
```

**Response:**

```json
{ "updated": 3 }
```

---

## WebSocket (Real-time)

The inbox panel stays live using **Socket.io** on the `/inbox` namespace.

**Install:**

```bash
npm install socket.io-client
```

---

### Connection Setup

```ts
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('https://your-api.com/inbox', {
  auth: { token: '<jwt_token>' },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to inbox:', socket.id);
});

socket.on('connected', (data) => {
  // { message: 'Connected to inbox', clientId: '...' }
  console.log(data.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from inbox');
});

socket.on('error', (err) => {
  console.error('Socket error:', err.message);
  // Token invalid — redirect to login
});
```

**Important:** On connection, the socket automatically joins the room for your organization (`org:<orgId>`). All org-level broadcasts are received without any extra subscription.

---

### Client → Server Events

These are events your frontend **emits** to the server.

---

#### `join:conversation`

Call this when an agent **opens** a conversation to start receiving real-time messages for it.

```ts
socket.emit('join:conversation', { phone: '919876543210' });

socket.once('joined:conversation', (data) => {
  // { room: 'conv:orgId:919876543210', phone: '919876543210' }
  console.log('Joined room:', data.room);
});
```

---

#### `leave:conversation`

Call this when an agent **closes** a conversation panel.

```ts
socket.emit('leave:conversation', { phone: '919876543210' });
```

---

#### `send:message`

Send a text message from the inbox panel. Returns an ack.

```ts
socket.emit(
  'send:message',
  { to: '919876543210', text: 'Hello! How can I help you?', wabaId: '664abc123' },
  (ack) => {
    if (ack.error) {
      console.error('Send failed:', ack.error);
    } else {
      console.log('Message sent, id:', ack.messageId);
    }
  }
);
```

---

#### `mark:read`

Notify other agents that this conversation has been read.

```ts
socket.emit('mark:read', { phone: '919876543210' });
```

**Note:** This only broadcasts to other agents. To actually clear the unread count in the database, also call the REST endpoint `POST /conversations/:id/mark-read`.

---

### Server → Client Events

These are events the server **emits** to your frontend. Listen for these to keep the inbox live.

---

#### `new:conversation`

Fires when a **brand-new conversation is created** (first ever reply from a phone number).

**Who receives it:** All connected agents in the organization.

```ts
socket.on('new:conversation', (conversation: Conversation) => {
  // Add this conversation to the top of your inbox list
  addConversationToInbox(conversation);
});
```

---

#### `conversation:update`

Fires when an **existing conversation is updated** — new message arrived, `lastMessage` and `unreadCount` changed.

**Who receives it:** All connected agents in the organization.

```ts
socket.on('conversation:update', (conversation: Conversation) => {
  // Update the existing conversation in your inbox list
  // Re-sort the list by lastMessageAt
  updateConversationInInbox(conversation);
});
```

---

#### `new:message`

Fires when a new **individual message** arrives (inbound from contact, or outbound sent by another agent).

**Who receives it:**
- All agents in the org (via `org:` room)
- Agents who have joined the specific conversation room via `join:conversation`

```ts
socket.on('new:message', (message: Message) => {
  if (isActiveConversation(message.from || message.to)) {
    appendMessageToChat(message);
  }
});
```

---

#### `message:status`

Fires when a message delivery status updates (sent → delivered → read).

**Who receives it:** All connected agents in the organization.

```ts
socket.on('message:status', (update: {
  metaMessageId: string;
  status: MessageStatus;
  timestamp: number;
}) => {
  // Update the tick/status icon next to the message
  updateMessageStatus(update.metaMessageId, update.status);
});
```

---

#### `conversation:status`

Fires when an agent **resolves or reopens** a conversation.

**Who receives it:** All connected agents in the organization.

```ts
socket.on('conversation:status', (data: {
  id: string;        // conversation _id
  status: ConversationStatus;
}) => {
  if (data.status === 'resolved') {
    removeFromOpenInbox(data.id);
  } else {
    moveToOpenInbox(data.id);
  }
});
```

---

#### `conversation:assigned`

Fires when a conversation is assigned to an agent.

**Who receives it:** All connected agents in the organization.

```ts
socket.on('conversation:assigned', (data: {
  id: string;     // conversation _id
  userId: string; // agent user ID
}) => {
  updateConversationAgent(data.id, data.userId);
});
```

---

#### `conversation:read`

Fires when another agent marks a conversation as read.

**Who receives it:** Agents who have joined that specific conversation room.

```ts
socket.on('conversation:read', (data: {
  phone: string;
  by: string;    // userId of the agent who read it
}) => {
  clearUnreadBadge(data.phone);
});
```

---

## Complete Integration Examples

### Inbox Panel Example

```ts
// inbox-panel.ts

import { io } from 'socket.io-client';

const API_BASE = 'https://your-api.com';
const WABA_ID  = '664abc123';

let conversations: Conversation[] = [];
let currentPage  = 1;
let hasMore      = true;

// ── Step 1: Load initial inbox ─────────────────────────────────────────────
async function loadInbox(page = 1) {
  const res = await fetch(
    `${API_BASE}/conversations?wabaId=${WABA_ID}&status=open&page=${page}&limit=30`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  const data: PaginatedResponse<Conversation> = await res.json();

  if (page === 1) {
    conversations = data.data;
  } else {
    conversations = [...conversations, ...data.data];
  }

  hasMore = page < data.pages;
  renderInboxList(conversations);
}

// ── Step 2: Connect WebSocket ──────────────────────────────────────────────
const socket = io(`${API_BASE}/inbox`, {
  auth: { token: getToken() },
  transports: ['websocket'],
});

// Brand-new conversation from a reply
socket.on('new:conversation', (conv: Conversation) => {
  conversations = [conv, ...conversations];  // prepend to top
  renderInboxList(conversations);
});

// Existing conversation updated (new message came in)
socket.on('conversation:update', (updated: Conversation) => {
  conversations = conversations
    .map((c) => c._id === updated._id ? updated : c)
    .sort((a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime()
    );
  renderInboxList(conversations);
});

// Another agent resolved a conversation
socket.on('conversation:status', ({ id, status }) => {
  if (status === 'resolved') {
    conversations = conversations.filter((c) => c._id !== id);
    renderInboxList(conversations);
  }
});

// Load more on scroll
function onScrollBottom() {
  if (hasMore) loadInbox(++currentPage);
}

loadInbox();
```

---

### Conversation Window Example

```ts
// conversation-window.ts

let messages: Message[]   = [];
let messagePage           = 1;
let hasMoreMessages        = true;
let activeConversation: Conversation | null = null;

// ── Step 1: Open a conversation ────────────────────────────────────────────
async function openConversation(conversation: Conversation) {
  activeConversation = conversation;

  // Reset message state
  messages     = [];
  messagePage  = 1;
  hasMoreMessages = true;

  // Load first page of messages (oldest first)
  await loadMessages();

  // Join the real-time room for this conversation
  socket.emit('join:conversation', { phone: conversation.phone });

  // Clear unread badge — call REST to persist in DB
  await fetch(`${API_BASE}/conversations/${conversation._id}/mark-read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

// ── Step 2: Load message history ───────────────────────────────────────────
async function loadMessages() {
  const res = await fetch(
    `${API_BASE}/conversations/${activeConversation!._id}/messages?page=${messagePage}&limit=50`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  const data: PaginatedResponse<Message> = await res.json();

  // Prepend older messages to the top
  messages        = [...data.data, ...messages];
  hasMoreMessages = messagePage < data.pages;
  renderMessages(messages);
}

// Load older messages on scroll to top
async function onScrollTop() {
  if (hasMoreMessages) {
    messagePage++;
    await loadMessages();
  }
}

// ── Step 3: Receive real-time new messages ─────────────────────────────────
socket.on('new:message', (msg: Message) => {
  if (!activeConversation) return;

  const isThisConversation =
    msg.from === activeConversation.phone ||
    msg.to   === activeConversation.phone;

  if (isThisConversation) {
    messages = [...messages, msg];
    renderMessages(messages);
    scrollToBottom();

    // Auto mark-read if agent is looking at this conversation
    socket.emit('mark:read', { phone: activeConversation.phone });
  }
});

// ── Step 4: Update message tick on delivery/read ───────────────────────────
socket.on('message:status', ({ metaMessageId, status }) => {
  messages = messages.map((m) =>
    m.metaMessageId === metaMessageId ? { ...m, status } : m
  );
  renderMessages(messages);
});

// ── Step 5: Send a message ─────────────────────────────────────────────────
function sendMessage(text: string) {
  socket.emit(
    'send:message',
    {
      to:     activeConversation!.phone,
      text,
      wabaId: WABA_ID,
    },
    (ack: { success?: boolean; messageId?: string; error?: string }) => {
      if (ack.error) showError(ack.error);
    }
  );
}

// ── Step 6: Close conversation ─────────────────────────────────────────────
async function resolveConversation() {
  await fetch(`${API_BASE}/conversations/${activeConversation!._id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'resolved' }),
  });

  socket.emit('leave:conversation', { phone: activeConversation!.phone });
  activeConversation = null;
}
```

---

## State Management Flow

This diagram shows how the inbox and conversation window stay in sync.

```
Contact replies to campaign
          │
          ▼
   WebhookService
   (server-side)
          │
          ├── storeInbound()      → saves Message to DB
          │
          ├── findOrCreate()      → creates/updates Conversation in DB
          │
          └── broadcastNewConversation() ─────────────────────────────────┐
              OR broadcastConversationUpdate()                             │
              AND broadcastInbound()                                       │
                                                                           ▼
                                                              Socket.io   ORG ROOM
                                                                           │
                         ┌─────────────────────────────────────────────────┘
                         │
             ┌───────────┴────────────┐
             │                        │
      new:conversation        conversation:update
             │                        │
             ▼                        ▼
    Add to inbox list         Update in inbox list
    (with unread badge)       (re-sort, new preview)


When agent opens conversation:
          │
          ├── GET /conversations/:id/messages   → load chat history
          │
          ├── socket.emit('join:conversation')  → join real-time room
          │
          └── POST /conversations/:id/mark-read → clear unread badge
```

---

## Error Handling

### REST API Errors

All error responses follow this shape:

```json
{
  "statusCode": 404,
  "message": "Conversation not found",
  "error": "Not Found"
}
```

| Status Code | Meaning |
|-------------|---------|
| `401` | Token missing or expired — redirect to login |
| `403` | Role not permitted (must be `org_admin`, `super_admin`, or `agent`) |
| `404` | Conversation not found (wrong `id` or wrong `orgId`) |
| `400` | Validation error — check request body fields |

### WebSocket Errors

```ts
socket.on('error', (err: { message: string }) => {
  if (err.message === 'Unauthorized') {
    // Token invalid — disconnect and redirect to login
    socket.disconnect();
    redirectToLogin();
  }
});

// Handle disconnection with auto-reconnect
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server force-disconnected (token expired) — do not reconnect
    redirectToLogin();
  }
  // Otherwise socket.io reconnects automatically
});
```

### Socket.io `send:message` ack errors

```ts
socket.emit('send:message', { to, text, wabaId }, (ack) => {
  if (ack.error) {
    // Common: "No active WABA found", "Insufficient credits"
    showToast(ack.error);
  }
});
```

---

## Quick Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | Paginated inbox list |
| `GET` | `/conversations/:id` | Single conversation |
| `GET` | `/conversations/:id/messages` | Message history (oldest first) |
| `PATCH` | `/conversations/:id/status` | `open` \| `resolved` |
| `PATCH` | `/conversations/:id/assign` | Assign agent |
| `PATCH` | `/conversations/:id/labels` | Update labels |
| `POST` | `/conversations/:id/mark-read` | Clear unread badge |

### WebSocket Events

| Direction | Event | When |
|-----------|-------|------|
| Client → Server | `join:conversation` | Agent opens a conversation |
| Client → Server | `leave:conversation` | Agent closes a conversation |
| Client → Server | `send:message` | Agent sends a message |
| Client → Server | `mark:read` | Agent reads a conversation |
| Server → Client | `new:conversation` | First reply from a new phone |
| Server → Client | `conversation:update` | New message in existing conversation |
| Server → Client | `new:message` | Individual message (inbound or outbound) |
| Server → Client | `message:status` | Delivery / read receipt update |
| Server → Client | `conversation:status` | Agent resolved or reopened |
| Server → Client | `conversation:assigned` | Conversation assigned to agent |
| Server → Client | `conversation:read` | Another agent read a conversation |
