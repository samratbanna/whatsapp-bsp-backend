# WhatsApp BSP — Integration Guide

Aapko ek app ko is WhatsApp BSP se jodna hai taaki wo apne users/customers ko **approved
template messages** bhej sake. Ye guide sirf **integration** batati hai — aapke app me feature
kaise banega (kab bhejna hai, kiska data bhejna hai, UI kya hoga) wo aapka apna decision hai.

Aapko BSP ka source code nahi chahiye. Ye ek HTTP API hai. Neeche jo likha hai wahi poora
contract hai.

---

## 1. Base URL aur auth

```
Base URL : https://api.msgconnectpro.com/api/v1
Auth     : X-API-Key: bsp_live_xxxxxxxx      (header, "Bearer" prefix NAHI)
```

Integration wale saare routes `public/v1` ke neeche hain, isliye poora path aisa banta hai:

```
https://api.msgconnectpro.com/api/v1/public/v1/messages/template
                              ^^^^^^^ ^^^^^^^^^
                              global  controller
                              prefix  prefix
```

> **Dhyan do:** kahin-kahin docs me base `https://api.msgconnectpro.com/public/v1` likha milta hai.
> **Wo galat hai.** `/api/v1` ke bina 404 aata hai. Shuru me hi ek curl maar ke confirm kar lena.

### API key kahan se milegi

Key **super admin** banata hai (BSP ke admin panel se, ya `POST /api/v1/admin/api-keys/:orgId/generate`).

- Format: `bsp_live_` + 48 hex chars
- **Ek organization ki ek hi key hoti hai** — dobara generate karne par purani turant mar jaati hai
- **Poori key sirf ek baar dikhti hai**, ban-te waqt. Server par sirf SHA-256 hash rehta hai. Kho gayi to naya generate karna padega.
- Key hi organization ko identify karti hai. Aapko kahin bhi `orgId` bhejne ki zarurat **nahi** hai.

### IP allowlist (optional, par risky)

Key par `allowedIps` set ho sakta hai. Do baatein:

- Match **exact string** hota hai. **CIDR support nahi hai** — `10.0.0.0/8` likhne se kuch match nahi karega.
- Server `X-Forwarded-For` ka pehla hop dekhta hai.
- Match fail = **403**.

Shuru me allowlist khaali rakho. Baad me lagao to har deploy/IP change par yaad rakhna.

---

## 2. Sabse pehle: connectivity check

Kuch bhi likhne se pehle ye chala lo. Dummy key se **401** aana chahiye (matlab route mil gaya
aur guard chala). **404** aaye to base URL galat hai.

```bash
curl -s -o /dev/null -w '%{http_code}\n' -H 'X-API-Key: dummy' \
  'https://api.msgconnectpro.com/api/v1/public/v1/templates?status=APPROVED'
# 401  → base URL sahi hai
# 404  → path galat hai
```

### ⚠️ Agar aapka app usi server par chal raha hai jahan BSP hai

`api.msgconnectpro.com` ek IP par hai. Agar aapka app **usi box** par hai, to public domain use
mat karo — server apne hi public IP par request karega aur zyadatar hosting setups me NAT
hairpin support nahi hota. Request **chup-chaap timeout** ho jaati hai (koi error nahi, bas
8-10 second ka wait). Bahar se wahi URL theek chalta hai, isliye debug karna mushkil hota hai.

Aise case me loopback use karo:

```
http://127.0.0.1:3000/api/v1        # 3000 = BSP process ka PORT
```

Aur us key ka `allowedIps` khaali rakhna (warna loopback `127.0.0.1` dikhayegi aur 403 milega).

**Base URL ko config se aane do, code me hardcode mat karo** — isi wajah se.

---

## 3. Template message bhejna (main endpoint)

```
POST /api/v1/public/v1/messages/template
```

```json
{
  "to": "919876543210",
  "templateName": "order_confirmation",
  "languageCode": "en",
  "category": "UTILITY",
  "components": [
    { "type": "body", "parameters": [
        { "type": "text", "text": "Rahul" },
        { "type": "text", "text": "1042" },
        { "type": "text", "text": "1,250.00" }
    ]},
    { "type": "button", "sub_type": "url", "index": 0,
      "parameters": [{ "type": "text", "text": "aB3xK9" }] }
  ]
}
```

Response:

```json
{ "success": true, "messageId": "wamid.HBgMOTE5...", "status": "sent" }
```

### Baaki send endpoints

| Method | Path | Body |
|---|---|---|
| POST | `/public/v1/messages/text` | `{ to, text, wabaId? }` — **sirf 24-hour window me**, warna Meta reject karega |
| POST | `/public/v1/messages/media` | `{ to, type, mediaUrl, caption?, wabaId? }` |

Business-initiated message (order update, OTP, reminder) **hamesha template hi hoga**. Plain text
tab hi chalta hai jab customer ne pichhle 24 ghante me aapko message kiya ho.

---

## 4. `components` — yahan galti hoti hai

Aapka `components` array **jaisa hai waisa** Meta Cloud API ko chala jaata hai. Koi translation
layer nahi hai. To Meta ka exact format follow karna padega.

### Rule 1 — send time par type lowercase, definition me UPPERCASE

| Template definition me | Bhejte waqt |
|---|---|
| `HEADER` | `header` |
| `BODY` | `body` |
| `BUTTONS` | `button` (har button ka alag entry) |

### Rule 2 — order matter karta hai, naam nahi

`parameters` array ka **position** decide karta hai ki kaunsa `{{N}}` bharega. Pehla element
`{{1}}`, doosra `{{2}}`. Koi key/name nahi hota. Template me jitne variables hain, **utne hi**
parameters bhejo — kam ya zyada = Meta 400.

### Rule 3 — URL button me sirf SUFFIX jata hai, poora URL nahi

Ye sabse zyada galat samjha jaane wala hissa hai.

Template me button aisa define hota hai:

```json
{ "type": "URL", "text": "View Bill", "url": "https://yourdomain.com/i/{{1}}" }
```

Base (`https://yourdomain.com/i/`) **template me baked hai aur approval ke baad freeze hai.**
Bhejte waqt sirf suffix do:

```json
{ "type": "button", "sub_type": "url", "index": 0,
  "parameters": [{ "type": "text", "text": "aB3xK9" }] }
```

Meta dono jod kar `https://yourdomain.com/i/aB3xK9` banata hai.

Poora URL bhejoge to link double ho jayega (`https://yourdomain.com/i/https://yourdomain.com/i/aB3xK9`).

- `index` = template ke buttons array me us button ki **0-based position**
- Static URL aur phone-number buttons ko koi parameter nahi chahiye — unhe bhejo hi mat
- Suffix me space ya `/`-prefixed scheme mat daalo

**Iska planning par asar:** agar aap template me link bhejna chahte ho, to wo domain **template
approve karwane se pehle** decide karna padega. Baad me badalna = naya template, naya approval.

### Rule 4 — parameter text ke rules

Meta reject kar deta hai agar parameter me:
- newline ho
- 4 ya usse zyada consecutive spaces hon
- khaali string ho

Bhejne se pehle har value ko saaf karo:

```js
const clean = String(v ?? "").replace(/\s+/g, " ").trim() || "-";
```

### Media header

```json
{ "type": "header", "parameters": [
    { "type": "image", "image": { "link": "https://..." } } ]}
```

URL publicly reachable honi chahiye. Private/authenticated URL par Meta error **131053** deta hai.
Meta media ID (`{"id": "..."}`) zyada reliable hai.

---

## 5. Phone number format

Meta ko chahiye: **country code ke saath, sirf digits**. Koi `+`, space, dash ya bracket nahi.

```
919876543210   ✓
+91 98765-43210 ✗
9876543210      ✗ (country code nahi hai)
```

API is par koi validation nahi karta — galat format seedha Meta tak jaata hai aur wahan fail hota
hai (ya us number par jaata hai jise aap bhejna nahi chahte the). **Bhejne se pehle khud normalize karo:**

```js
function normalizePhone(raw, defaultCC = "91") {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  while (d.startsWith("0")) d = d.slice(1);             // domestic trunk 0
  if (d.startsWith(defaultCC) && d.length === defaultCC.length + 10) return d;
  if (d.length === 10) return `${defaultCC}${d}`;
  if (d.length >= 11 && d.length <= 15) return d;        // already international
  return null;                                           // samajh nahi aaya → mat bhejo
}
```

`null` aaye to **skip karo aur log karo** — guess mat karo. Galat number par message jaana
credit barbaad karna aur kisi ajnabi ko aapke customer ka data bhejna hai.

---

## 6. Templates list karna

```
GET /api/v1/public/v1/templates?status=APPROVED
```

Bare JSON array aata hai (paginated nahi):

```json
[{
  "_id": "664a1f...", "name": "order_confirmation", "language": "en",
  "category": "UTILITY", "status": "APPROVED",
  "components": [
    { "type": "BODY", "text": "Hi {{1}}, order {{2}} of Rs {{3}}." },
    { "type": "BUTTONS", "buttons": [
        { "type": "URL", "text": "View Bill", "url": "https://yourdomain.com/i/{{1}}" }]}
  ],
  "variables": ["{{1}}", "{{2}}", "{{3}}"]
}]
```

Query params: `status`, `category`, `wabaId`, `search`.

Template ki pehchaan **`name` + `languageCode`** se hoti hai, `_id` se nahi.

**Ye list bahut kaam ki hai:** isse parse karke aap apne app me template ke variables ka mapping
bana sakte ho (kitne `{{N}}` hain, URL button kis index par hai) — taaki template badalne par
code change na karna pade. Suggestion: hardcode mat karo, admin ko dropdown do.

`status` utna hi fresh hai jitni pichhli sync. Sync sirf admin (JWT) trigger karta hai, public
API se nahi — to `APPROVED` par blindly bharosa mat karo, failure handle karo.

---

## 7. Wallet / credits

Har message **1 credit** kharch karta hai. Teen alag buckets hain:

| `category` bheja | Kaunsa bucket katega |
|---|---|
| `UTILITY` (ya kuch nahi bheja) | `transactional` |
| `MARKETING` | `promotional` |
| `AUTHENTICATION` | `authentication` |

**`category` hamesha bhejo aur template ki asli category se match karao**, warna galat bucket
khali hoga.

```
GET /api/v1/public/v1/wallet/credits
```

```json
{ "transactional": 4820, "promotional": 1200, "authentication": 300,
  "blockOnEmpty": true,
  "thresholds": { "transactional": 100, "promotional": 100, "authentication": 20 } }
```

Credit **Meta call se pehle** kat-ta hai. Credit khatam = **400**, message jata hi nahi.

> Agar Meta call khud fail ho jaye to credit already kat chuka hota hai aur refund ke liye koi
> message id nahi hota — matlab failed sends par thoda credit leak hota hai. Balance drift ho
> sakta hai, isliye kabhi-kabhi reconcile karna.

Refund sirf tab hota hai jab Meta ka `failed` delivery webhook aaye.

---

## 8. Sender (WABA) chunna

Normally kuch nahi bhejna — key se organization, aur organization ka default sender apne aap
chun liya jaata hai.

```
GET /api/v1/public/v1/waba
→ [{ "phoneNumberId": "...", "displayPhoneNumber": "919000000000",
      "status": "active", "ownershipType": "shared" }]
```

> **Agar organization ke paas ek se zyada WABA hai:** default selection **deterministic nahi hai**
> — jo bhi active WABA DB pehle de de, wahi chun liya jaata hai (`isDefault` flag padha hi nahi
> jaata). Aur ye list `_id` return nahi karti, jabki send ka `wabaId` param wahi `_id` maangta hai.
> Matlab public API se reliable sender-selection abhi possible nahi hai.
>
> Ek hi WABA hai to koi dikkat nahi. Zyada hain to BSP admin se `_id` maang lo aur `wabaId`
> explicitly bhejo.

---

## 9. Errors — inhe alag-alag handle karo

Error envelope:

```json
{ "statusCode": 400, "timestamp": "...", "path": "...",
  "message": "...", "metaCode": 132000, "metaSubCode": null,
  "errorUserTitle": null, "errorUserMsg": null }
```

Meta ki apni errors bhi **HTTP 400** hi banti hain, `metaCode` bhara hota hai.

| Kya mila | Matlab | Kya karo |
|---|---|---|
| `401` | Key galat / expired / revoked | Alert karo. Retry se kuch nahi hoga. |
| `403` | IP allowlist me nahi | Alert karo. Retry bekaar. |
| `400` + `"Insufficient ... credits"` | Wallet khali | **Operational alert** — top-up chahiye, code bug nahi |
| `400` + `"No active WABA found"` | Org ka Meta token expire ho gaya | **Operational alert** — BSP side ka issue, aapki request theek hai |
| `400` + `metaCode` | Template/payload galat | Log karo, payload dekho. Retry se wahi hoga. |
| Timeout | Network (§2 wala hairpin dekho) | Retry safe hai |

Do errors ko naam se pehchano — `"Insufficient"` + `"credit"`, aur `"No active WABA"`. Ye code
bug nahi hain, inpe alag alert jaana chahiye.

### Rate limit

**100 requests / minute.** Yaani ~1.6/second. Bulk bhejna ho to apni taraf se throttle karo.

Response headers me `X-RateLimit-Remaining` aata hai par wo **hardcoded hai** — uspe backoff
logic mat banao. `X-Request-Id` zaroor log karo, support ke liye wahi handle hai.

---

## 10. Delivery status — ye abhi nahi milta

Saaf baat: **bheje hue message ka delivered/read/failed status aapko nahi milega.**

- Koi outbound delivery callback/webhook register nahi kar sakte
- Koi public "message status" read endpoint nahi hai
- Status sirf BSP ke apne DB aur uske admin UI ke socket me jaata hai

Response ka `messageId` asli WhatsApp `wamid` hai — **use store zaroor karo**, taaki aage
jab kabhi status endpoint ya callback aaye to correlate kar sako.

> Purane deployments me ye field fake timestamp (`msg_live_…`) return karti thi. Agar aapko
> `messageId` me `msg_live_` dikhe to BSP purana chal raha hai — update karwao.

Isliye **apna khud ka log rakho.** Ye optional nahi hai — iske bina "message gaya ya nahi"
ka koi jawab hi nahi hoga.

---

## 11. Integration kaise likhna hai (design rules)

Ye vendor-specific nahi, experience se aaye rules hain. Follow karo.

**1. Send call kabhi main flow ko block ya fail na kare.**
Ye third-party network call hai. Aapka order/signup/payment iske 8-second timeout par nahi
rukna chahiye, aur iske fail hone par fail to bilkul nahi hona chahiye. Main work complete
hone ke **baad**, `await` kiye bina dispatch karo.

**2. Client kabhi throw na kare.**
Har outcome ko ek typed result me badlo: `{ ok, httpStatus, body, error, kind }`. Caller
uska decision le, exception na pakde.

**3. Timeout lagao.** 8-10 second. Default infinite timeout matlab ek hang hua connection
aapka worker atka dega.

**4. Har attempt ka log likho — including jo bheje hi nahi gaye.**
Ek append-only table: kisko, kaunsa template, kya payload, kya response, `wamid`, aur
**kyun skip kiya** (number nahi tha / number galat tha / feature off tha). Delivery status
milta nahi (§10), to ye log hi aapka ekmaatra jawab hai jab koi kahe "mujhe message nahi aaya".

**5. Base URL, template name, language aur variable mapping — sab config se aaye.**
Template Meta ke approval se bandha hai aur badalta rehta hai. Har baar code deploy karna
padega to ye feature bojh ban jayega.

**6. Apna idempotency key rakho.** Response ka id aapke bhejne se pehle nahi hota, to duplicate
send rokne ke liye apni side par key rakho.

**7. Retry soch-samajh kar.** Timeout aur 5xx par retry safe hai. `400`/`401`/`403` par
**bilkul mat** karo — wahi error dobara aayega aur credit bhi ja sakta hai.

---

## 12. Minimal client (shape)

```ts
type Result = { ok: boolean; httpStatus?: number; body?: any; error?: string;
                kind?: "NO_CREDITS" | "NO_WABA" | "UNAUTHORIZED" | "NETWORK" };

async function sendTemplate(cfg, { to, templateName, languageCode, category, components }): Promise<Result> {
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/public/v1/messages/template`;
  try {
    const res = await axios.post(url,
      { to, templateName, languageCode, category, components },
      { timeout: 8000,
        headers: { "X-API-Key": cfg.apiKey, "Content-Type": "application/json" },
        validateStatus: () => true });          // status khud handle karo

    if (res.status >= 200 && res.status < 300)
      return { ok: true, httpStatus: res.status, body: res.data };

    const msg = res.data?.message ?? `HTTP ${res.status}`;
    const kind =
      /insufficient/i.test(msg) && /credit/i.test(msg) ? "NO_CREDITS"
      : /no active waba/i.test(msg)                    ? "NO_WABA"
      : res.status === 401 || res.status === 403       ? "UNAUTHORIZED"
      : undefined;
    return { ok: false, httpStatus: res.status, body: res.data, error: msg, kind };
  } catch (e: any) {
    return { ok: false, kind: "NETWORK",
             error: e?.code === "ECONNABORTED" ? "timeout" : e?.message };
  }
}
```

---

## 13. Bring-up checklist

1. Super admin se API key lo (ek baar dikhegi — turant save karo)
2. `curl` se base URL confirm karo — dummy key par **401** (§2)
3. Same server par ho to loopback URL par switch karo (§2)
4. `GET /public/v1/templates?status=APPROVED` — apna template aur uske `components` dekho
5. Template ke `{{N}}` count aur URL button ka index note karo (§4)
6. Ek asli number par test send karo — **phone par jaake check karo, aur button dabakar dekho**
7. Failure paths test karo: galat number, galat template name, galat key
8. Log table bharti hui dikhni chahiye — success aur skip dono
9. Tab jaakar asli flow me jodo, non-blocking (§11)

Sabse zyada time template `components` ka format sahi karne me jayega, aur usme bhi URL button
ke suffix wale rule me (§4, Rule 3). Waise hi expect karke chalna.
