# Campaign Overview List — Implementation Plan

## Endpoint

```
GET /campaigns/overview
```

Auth: JWT required (`ORG_ADMIN` / `SUPER_ADMIN`)

---

## Query Parameters

| Param    | Type       | Default | Description                              |
|----------|------------|---------|------------------------------------------|
| `page`   | `number`   | `1`     | Page number                              |
| `limit`  | `number`   | `10`    | Items per page (max 100)                 |
| `search` | `string`   | —       | Campaign name search (case-insensitive)  |
| `status` | `string`   | —       | Filter by `CampaignStatus` enum value    |
| `type`   | `string`   | —       | Filter by `CampaignType` (`broadcast` / `scheduled`) |
| `from`   | ISO date   | —       | `createdAt` range start                  |
| `to`     | ISO date   | —       | `createdAt` range end                    |

---

## Response Shape

```json
{
  "data": [
    {
      "_id": "664a1f...",
      "name": "Diwali Campaign",
      "status": "completed",
      "type": "broadcast",
      "template": {
        "name": "diwali_offer",
        "category": "MARKETING"
      },
      "waba": {
        "displayPhoneNumber": "9100000000",
        "verifiedName": "MyBrand"
      },
      "totalCount": 1000,
      "scheduledAt": null,
      "startedAt": "2026-05-01T10:00:00.000Z",
      "completedAt": "2026-05-01T10:30:00.000Z",
      "createdAt": "2026-05-01T09:55:00.000Z",
      "messageCounts": {
        "total": 998,
        "queued": 2,
        "sent": 300,
        "delivered": 500,
        "read": 76,
        "failed": 120,
        "success": 876
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### `messageCounts` Field Breakdown

| Field       | Source          | Description                              |
|-------------|-----------------|------------------------------------------|
| `total`     | Message schema  | All messages created for this campaign   |
| `queued`    | Message schema  | Status = `queued`                        |
| `sent`      | Message schema  | Status = `sent` (accepted by Meta)       |
| `delivered` | Message schema  | Status = `delivered`                     |
| `read`      | Message schema  | Status = `read`                          |
| `failed`    | Message schema  | Status = `failed`                        |
| `success`   | Derived         | `sent + delivered + read`                |

---

## Implementation Strategy

### Why Two Queries Instead of `$lookup`

A `$lookup` on an unpaginated collection would aggregate all messages before filtering campaigns — inefficient. The two-query approach:

1. **Query 1 (Campaign model)** — Apply all filters + pagination → get one page of campaigns
2. **Query 2 (Message model)** — Single aggregation using `$match { campaign: { $in: [...pageIds] } }` + `$group by campaignId + status` → get counts only for the current page's campaigns
3. **Merge** — Build an in-memory `Map<campaignId, counts>` and attach `messageCounts` to each campaign

This keeps DB work minimal — pagination cuts campaign IDs to at most 10, so Message aggregation only touches those 10 campaigns' messages.

---

## Files to Touch

| File | Change |
|------|--------|
| `dto/campaign.dto.ts` | Add `CampaignOverviewQueryDto` with `search`, `status`, `type`, `from`, `to`, `page`, `limit` |
| `campaigns.service.ts` | Add `getOverview(orgId, query)` method |
| `campaigns.controller.ts` | Add `GET /campaigns/overview` route |

> **Note:** `Message` model is already injected into `CampaignsService` (added for the report endpoints).

---

## Service Method Pseudocode

```ts
async getOverview(orgId: string, query: CampaignOverviewQueryDto) {

  // Step 1 — Build campaign filter
  const filter = { organization: orgId }
  if (query.search) filter.name = { $regex: query.search, $options: 'i' }
  if (query.status) filter.status = query.status
  if (query.type)   filter.type   = query.type
  if (query.from || query.to) filter.createdAt = {}
  if (query.from) filter.createdAt.$gte = new Date(query.from)
  if (query.to)   filter.createdAt.$lte = new Date(query.to)

  // Step 2 — Paginated campaign list
  const campaigns = await campaignModel
    .find(filter)
    .populate('template', 'name category')
    .populate('waba', 'displayPhoneNumber verifiedName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  // Step 3 — Message counts for this page only
  const ids = campaigns.map(c => c._id)
  const msgStats = await messageModel.aggregate([
    { $match: { campaign: { $in: ids } } },
    { $group: { _id: { campaign: '$campaign', status: '$status' }, count: { $sum: 1 } } }
  ])

  // Step 4 — Build lookup map and attach
  const countsMap = buildCountsMap(msgStats)
  return campaigns.map(c => ({ ...c.toObject(), messageCounts: countsMap[c._id] ?? defaults }))
}
```

---

## Controller Route

```
GET /campaigns/overview          → getOverview()
GET /campaigns/overview?search=diwali&status=completed&page=2
```

> Route must be declared **before** `GET /campaigns/:id` in the controller, otherwise NestJS will treat `overview` as an `:id` param.
