# Templates API Documentation

Base URL: `/templates`  
Auth: All endpoints require `Authorization: Bearer <jwt_token>` header  
Role: `ORG_ADMIN` or `SUPER_ADMIN`

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/templates` | Create & submit template to Meta |
| `GET` | `/templates` | List all templates (with filters) |
| `GET` | `/templates/:id` | Get single template |
| `PUT` | `/templates/:id` | Edit template on Meta + DB |
| `DELETE` | `/templates/:id` | Delete template from Meta + DB |
| `POST` | `/templates/upload-media` | Upload header media file |
| `POST` | `/templates/sync` | Sync templates from Meta |

---

## 1. Create Template

**`POST /templates`**

Creates a new template and submits it to Meta for approval. Template status will be `PENDING` until Meta approves it.

### Request Body

```json
{
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en_US",
  "wabaId": "optional-waba-id",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Update"
    },
    {
      "type": "BODY",
      "text": "Hi {{1}}, your order {{2}} has been confirmed.",
      "example": {
        "body_text": [["John", "ORD-123"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Thank you for shopping with us"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Track Order"
        },
        {
          "type": "URL",
          "text": "Visit Website",
          "url": "https://example.com"
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Call Us",
          "phone_number": "+919999999999"
        }
      ]
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Snake_case, unique per WABA (e.g. `order_update`) |
| `category` | string | Yes | `MARKETING` \| `UTILITY` \| `AUTHENTICATION` |
| `language` | string | Yes | Language code (e.g. `en_US`, `hi`, `mr`) |
| `components` | array | Yes | Template components (see below) |
| `wabaId` | string | No | WABA ID — uses org default if omitted |

### Component Types

#### HEADER component

```json
{ "type": "HEADER", "format": "TEXT", "text": "Header text here" }
```

For media header (IMAGE / VIDEO / DOCUMENT) — use `mediaId` returned from upload-media:

```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "mediaId": "upload123|||media456"
}
```

| Field | Values |
|-------|--------|
| `format` | `TEXT` \| `IMAGE` \| `VIDEO` \| `DOCUMENT` |
| `text` | Required if format is `TEXT` |
| `mediaId` | Required if format is media type (use value from `/upload-media`) |

#### BODY component

```json
{
  "type": "BODY",
  "text": "Hello {{1}}, your booking is on {{2}}.",
  "example": {
    "body_text": [["John Doe", "25 May 2026"]]
  }
}
```

Use `{{1}}`, `{{2}}` etc. for dynamic variables. Provide `example` when variables are present.

#### FOOTER component

```json
{ "type": "FOOTER", "text": "Footer text here" }
```

#### BUTTONS component

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Yes" },
    { "type": "QUICK_REPLY", "text": "No" },
    { "type": "URL", "text": "Open Link", "url": "https://example.com" },
    { "type": "PHONE_NUMBER", "text": "Call Us", "phone_number": "+91XXXXXXXXXX" }
  ]
}
```

| Button Type | Required Fields |
|-------------|----------------|
| `QUICK_REPLY` | `text` |
| `URL` | `text`, `url` |
| `PHONE_NUMBER` | `text`, `phone_number` |

### Response

```json
{
  "_id": "664a1f...",
  "organization": "org123",
  "waba": "waba123",
  "metaTemplateId": "meta_id_from_meta",
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en_US",
  "status": "PENDING",
  "components": [...],
  "variables": ["{{1}}", "{{2}}"],
  "createdAt": "2026-05-29T10:00:00.000Z",
  "updatedAt": "2026-05-29T10:00:00.000Z"
}
```

---

## 2. List Templates

**`GET /templates`**

Returns all templates for the organization, sorted latest first.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `APPROVED` \| `PENDING` \| `REJECTED` \| `PAUSED` \| `DISABLED` |
| `category` | string | Filter by category: `MARKETING` \| `UTILITY` \| `AUTHENTICATION` |
| `wabaId` | string | Filter by WABA ID |
| `search` | string | Search by template name (case-insensitive) |

### Example Request

```
GET /templates?status=APPROVED&category=MARKETING&search=order
```

### Response

```json
[
  {
    "_id": "664a1f...",
    "name": "order_confirmation",
    "category": "UTILITY",
    "language": "en_US",
    "status": "APPROVED",
    "metaTemplateId": "123456789",
    "components": [...],
    "variables": ["{{1}}", "{{2}}"],
    "waba": {
      "_id": "...",
      "displayPhoneNumber": "919000000000",
      "verifiedName": "MyBrand"
    },
    "qualityScore": { "score": "GREEN" },
    "lastSyncedAt": "2026-05-29T09:00:00.000Z",
    "createdAt": "2026-05-01T10:00:00.000Z"
  }
]
```

---

## 3. Get Single Template

**`GET /templates/:id`**

### Response

Same shape as a single item from the list response above.

---

## 4. Edit Template

**`PUT /templates/:id`**

Edits the template components (and optionally category) on Meta and updates the DB. Template status resets to `PENDING` after edit — Meta re-reviews it.

> **Note:** Only `components` and `category` can be edited. `name` and `language` cannot be changed after creation.

### Request Body

```json
{
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Updated Header"
    },
    {
      "type": "BODY",
      "text": "Hi {{1}}, your updated order {{2}} is confirmed.",
      "example": {
        "body_text": [["John", "ORD-456"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "We appreciate your business"
    }
  ],
  "category": "MARKETING"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `components` | array | Yes | Full updated component list (replaces existing) |
| `category` | string | No | `MARKETING` \| `UTILITY` \| `AUTHENTICATION` |

### Response

Updated template document with `status: "PENDING"`.

### Error Cases

| Status | Reason |
|--------|--------|
| `400` | Template has no `metaTemplateId` (was never submitted to Meta) |
| `404` | Template not found or belongs to another org |

---

## 5. Delete Template

**`DELETE /templates/:id`**

Deletes the template from Meta AND the local database. If Meta deletion fails (e.g. already deleted on Meta side), it logs a warning and still removes from DB.

### Response

```json
{ "message": "Template deleted successfully" }
```

### Error Cases

| Status | Reason |
|--------|--------|
| `404` | Template not found or belongs to another org |

---

## 6. Upload Media

**`POST /templates/upload-media`**

Upload a media file to use as a template header. Returns a `mediaId` to pass in the `HEADER` component when creating/editing a template.

### Request

`Content-Type: multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Media file to upload |

### Supported File Types & Limits

| Type | Formats | Max Size |
|------|---------|----------|
| Image | JPG, PNG | 5 MB |
| Video | MP4 | 16 MB |
| Document | PDF, DOC, DOCX | 100 MB |

### Response

```json
{
  "mediaId": "upload_handle_123|||standard_media_id_456"
}
```

Pass the entire `mediaId` string as-is into the `HEADER` component's `mediaId` field.

---

## 7. Sync Templates from Meta

**`POST /templates/sync`**

Fetches all templates from Meta and upserts them into the DB. Useful to get latest approval status, quality scores, and pick up templates created directly on Meta.

**Deduplication:** If a template with the same `metaTemplateId` already exists in DB, it is **skipped** (not duplicated).

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `wabaId` | string | WABA to sync (uses org default if omitted) |

### Example Request

```
POST /templates/sync?wabaId=optional-waba-id
```

### Response

```json
{
  "synced": 12,
  "skipped": 2
}
```

| Field | Description |
|-------|-------------|
| `synced` | Number of templates created or updated |
| `skipped` | Number of templates skipped (duplicate `metaTemplateId`) |

---

## Data Reference

### Template Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Submitted to Meta, awaiting review |
| `APPROVED` | Approved by Meta, ready to use in campaigns |
| `REJECTED` | Rejected by Meta (check `rejectedReason` field) |
| `PAUSED` | Paused by Meta due to quality issues |
| `DISABLED` | Disabled by Meta |

### Template Category Values

| Category | Description |
|----------|-------------|
| `MARKETING` | Promotional messages |
| `UTILITY` | Transactional / order updates |
| `AUTHENTICATION` | OTP / verification messages |

### Language Codes (Common)

| Code | Language |
|------|----------|
| `en_US` | English (US) |
| `en` | English |
| `hi` | Hindi |
| `mr` | Marathi |
| `gu` | Gujarati |
| `ta` | Tamil |
| `te` | Telugu |

---

## Complete Flow Example (Create → Use in Campaign)

```
1. POST /templates/upload-media       ← (if media header needed)
   → returns { mediaId: "..." }

2. POST /templates                    ← create template
   → returns { _id: "...", status: "PENDING" }

3. POST /templates/sync               ← wait for approval, then sync
   → returns { synced: N, skipped: N }

4. GET /templates?status=APPROVED     ← confirm template is approved

5. POST /campaigns                    ← use templateId in campaign
```
