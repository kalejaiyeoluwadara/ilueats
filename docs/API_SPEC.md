# ilúeats — Backend API Requirements

Derived from the current Next.js frontend (which runs entirely on localStorage/mock data). This spec lists every endpoint the frontend will need, grouped by domain, with request/response payloads inferred from the actual client types and component behavior. Field names match `types/index.ts` and the context/lib layer exactly, so the frontend integration is a drop-in replacement of the localStorage layer.

Roles: `customer`, `admin`, `rider` (single `UserRole` enum, one account = one role).

Auth is currently 100% client-side (plaintext passwords in localStorage, route protection only in the React tree). **The real backend must add server-side session/JWT validation and role checks on every admin/rider endpoint** — today nothing stops a customer token from calling admin routes.

---

## 1. Auth

### `POST /auth/signup`
Create a new **customer** account (signup always creates role `customer`).
```json
// Request
{ "name": "string (min 2 chars)", "email": "string", "password": "string (min 4 chars)" }
// Response 201
{ "user": { "id": "string", "name": "string", "email": "string", "phone": null, "role": "customer" }, "token": "string" }
```
Errors: 409 email already registered, 400 validation.

### `POST /auth/signin`
```json
// Request
{ "email": "string", "password": "string", "allowedRoles": ["customer"] }  // allowedRoles optional, sent by admin/rider login screens as ["admin"] / ["rider"]
// Response 200
{ "user": { "id", "name", "email", "phone", "role" }, "token": "string" }
```
Errors: 401 invalid credentials, 403 account role not in `allowedRoles` (frontend shows a portal-specific hint, e.g. "This is a rider account — use the rider login").

### `POST /auth/signout`
Invalidates the session/token. `204`.

### `GET /auth/session`
Returns current user from token, used on app load to hydrate `AuthContext`. `200 { user }` or `401`.

### `PATCH /users/me`
```json
// Request (all optional)
{ "name": "string", "phone": "string" }
// Response 200 → updated user object
```

---

## 2. Catalog — Stores & Products (public read)

### `GET /stores`
Query params: `category` (CategoryId), `featured` (bool), `q` (search substring on name/tagline/description/location/tags).
```json
// Response 200
{ "items": [ StoreObject, ... ] }
```
`StoreObject`:
```json
{
  "id": "string", "slug": "string", "name": "string", "tagline": "string",
  "description": "string", "image": "string(url)", "cover": "string(url)",
  "categories": ["pizza", "..."], "rating": 4.5, "reviews": 120,
  "deliveryTimeMins": [15, 30], "deliveryFee": 300, "minOrder": 1000,
  "isOpen": true, "isFeatured": false, "isNew": false,
  "location": "string", "tags": ["string"], "orders7d": 0
}
```

### `GET /stores/:slug`
Single store, 404 if not found/not open (decide policy — frontend currently shows it regardless of `isOpen`, just badges it "Closed").

### `GET /stores/:slug/products`
Products for a store, optionally `?category=`.
`ProductObject`:
```json
{
  "id": "string", "storeId": "string", "storeSlug": "string", "slug": "string",
  "name": "string", "description": "string", "price": 1500, "oldPrice": null,
  "image": "string(url)", "category": "pizza", "isPopular": false, "isNew": false,
  "rating": 4.2, "reviews": 30,
  "options": [
    {
      "id": "string", "name": "Size", "required": true, "multi": false,
      "choices": [ { "id": "string", "name": "Large", "priceDelta": 500 } ]
    }
  ]
}
```

### `GET /products/:storeSlug/:productSlug`
Single product detail (product detail page).

### `GET /products/featured`
Featured/popular products for the home page carousel (`isPopular` products).

### `GET /search`
Query: `q` (string), `type` (`all` | `stores` | `dishes`).
```json
// Response
{ "stores": [StoreObject], "products": [ProductObject] }
```

---

## 3. Cart

Frontend currently keeps cart in localStorage; recommend a server cart keyed to the authenticated user (or a session id for guests) so it survives devices and the checkout step can validate stock/price server-side.

### `GET /cart`
```json
{
  "items": [
    {
      "id": "string(lineId)", "productId": "string", "storeId": "string",
      "storeSlug": "string", "storeName": "string", "name": "string",
      "image": "string", "price": 1500, "quantity": 2, "notes": "string|null",
      "selectedOptions": [ { "groupId": "string", "choiceId": "string", "name": "string" } ]
    }
  ],
  "storeId": "string|null", "storeSlug": "string|null", "storeName": "string|null",
  "subtotal": 3000, "count": 2
}
```

### `POST /cart/items`
```json
// Request
{
  "productId": "string",
  "quantity": 1,
  "selectedOptions": [ { "groupId": "string", "choiceId": "string" } ],
  "notes": "string (optional)"
}
// Response 200 → full cart object (as GET /cart)
// Response 409 { "error": "different-store" } if cart already contains items from another store
```
Server must recompute unit price from `product.price + sum(choice.priceDelta)` — never trust a client-sent price.

### `PATCH /cart/items/:lineId`
```json
{ "quantity": 1 }  // 0 removes the line; server clamps 0-99
```
Response → full cart object.

### `DELETE /cart/items/:lineId`
Response → full cart object.

### `DELETE /cart`
Clears cart entirely. `204`.

---

## 4. Orders / Checkout

**This is the biggest gap in the current frontend** — the checkout screen fakes a 2.2s delay, generates a random `ILU-XXXX` id client-side, and never persists anything. No order ever reaches the admin or rider apps today. This needs to be built from scratch.

### `POST /orders`
```json
// Request
{
  "storeId": "string", "storeSlug": "string",
  "items": [
    { "productId": "string", "quantity": 1, "selectedOptions": [{"groupId":"string","choiceId":"string"}], "notes": "string|null" }
  ],
  "deliveryMode": "door" | "landmark",
  "address": "string (required if deliveryMode=door)",
  "landmarkId": "string (required if deliveryMode=landmark)",
  "contactName": "string",
  "contactPhone": "string",
  "notes": "string (optional)",
  "paymentMethod": "card" | "transfer" | "cash"
}
// Response 201
{
  "orderId": "string (e.g. ILU-XXXXXX)",
  "status": "new",
  "subtotal": 3000, "deliveryFee": 300, "serviceFee": 100, "total": 3400,
  "estimatedDeliveryWindow": "string|[minMins,maxMins]"
}
```
Server should re-validate: single-vendor cart, `subtotal >= store.minOrder`, recompute all prices, and clear the user's cart on success.

### `GET /users/me/orders`
Paginated order history for the signed-in customer (`/orders` page currently shows a static empty state — needs real data to replace it).
```json
{ "items": [OrderSummary...], "page": 1, "pageSize": 10, "pageCount": 3, "totalItems": 24 }
```

### `GET /orders/:id`
Full order detail incl. line items, status, timestamps (for tracking/re-order).

### Admin order management

### `GET /admin/orders`
Query: `status` (`new`|`preparing`|`out`|`delivered`), `q` (search), `page`, `pageSize`.
```json
{
  "items": [
    {
      "id": "string", "customer": "string", "customerPhone": "string",
      "deliveryAddress": "string", "store": "string", "storeAddress": "string",
      "paymentLabel": "string", "total": 3400, "deliveryFee": 300, "serviceFee": 100,
      "status": "new", "placedAt": "ISO8601",
      "lineItems": [ { "name": "string", "qty": 1, "unitPrice": 1500, "modifiers": ["string"] } ]
    }
  ],
  "page": 1, "pageSize": 10, "pageCount": 2, "totalItems": 13
}
```
Note: current mock uses `placed: "2 min ago"` (a human string) — real API should return an ISO timestamp and let the frontend format relative time.

### `GET /admin/orders/:id`
Full detail (feeds `AdminOrderDetailModal`).

### `PATCH /admin/orders/:id/status`
```json
{ "status": "new" | "preparing" | "out" | "delivered" }
```
(Not in current UI but required to make the order lifecycle real — the modal is currently read-only.)

### `GET /admin/orders/export`
Returns CSV of filtered orders (button exists in UI, currently non-functional).

---

## 5. Addresses (per customer)

### `GET /users/me/addresses`
```json
{ "items": [ { "id", "label", "addressLine", "phone", "isDefault" } ] }
```

### `POST /users/me/addresses`
```json
{ "label": "string", "addressLine": "string (min 5 chars)", "phone": "string (optional)", "makeDefault": true }
```
Server invariant: exactly one address has `isDefault: true` per user; first address created is always default regardless of `makeDefault`.

### `PATCH /users/me/addresses/:id`
```json
{ "label": "string", "addressLine": "string", "phone": "string", "isDefault": true }
```
(any subset of fields)

### `DELETE /users/me/addresses/:id`

### `POST /users/me/addresses/:id/default`
Sets this address as default, unsets all others.

---

## 6. Favorites (per customer)

### `GET /users/me/favorites`
Return hydrated product+store data directly (not just ids) so the frontend doesn't need a second round trip:
```json
{ "productIds": ["string", ...], "products": [ProductObject, ...] }
```
Order = most-recently-favorited first.

### `POST /users/me/favorites/:productId`
Adds to favorites. `204`.

### `DELETE /users/me/favorites/:productId`
Removes from favorites. `204`.

---

## 7. Banners / Ads (admin-managed, publicly read)

### `GET /banners`
```json
{ "items": [ { "id", "title", "subtitle", "cta", "href", "image", "badge" } ] }
```
Ordered by display order.

### `POST /banners` (admin)
Should accept **multipart/form-data** with an actual image file — the current frontend embeds base64 data URLs directly in the record (capped ~900KB client-side), which will not scale; backend should upload to object storage/CDN and return a URL.
```
multipart fields: title, subtitle, cta, href, badge (optional), image (file)
```
```json
// Response 201 → { "id", "title", "subtitle", "cta", "href", "image": "cdn-url", "badge" }
```

### `PATCH /banners/:id` (admin)
Same fields, any subset, multipart if image is replaced.

### `DELETE /banners/:id` (admin)

### `POST /banners/reorder` (admin)
```json
{ "orderedIds": ["id1", "id2", "id3"] }
```

---

## 8. Rider

### `GET /rider/offers`
Available job offers for the signed-in rider, only returned while rider is online. Likely zone/geo-based matching server-side (currently a hardcoded pool of 4).
```json
{
  "items": [
    {
      "id": "string", "store": "string", "customer": "string", "drop": "string",
      "pay": 400, "etaMin": 15, "phone": "string",
      "lineItems": [ { "name": "string", "qty": 1, "modifiers": ["string"] } ]
    }
  ]
}
```

### `POST /rider/online`
```json
{ "isOnline": true }
```
Toggles rider availability; offline riders stop receiving offers.

### `POST /rider/offers/:offerId/accept`
```json
// Response 200 → RiderJob
{
  "id": "string", "store": "string", "customer": "string", "address": "string",
  "payout": 400, "status": "pickup", "phone": "string",
  "lineItems": [ { "name", "qty", "modifiers" } ]
}
```
409 if offer no longer available or rider already has an active job with same id.

### `GET /rider/jobs`
Paginated list of the rider's jobs/deliveries. Query: `status` (`pickup`|`en_route`|`done`), `page`, `pageSize`.

### `POST /rider/jobs/:jobId/pickup`
Transitions `pickup` → `en_route`. 409 if job isn't currently `pickup`.

### `POST /rider/jobs/:jobId/deliver`
Transitions `en_route` → `done`. 409 if job isn't currently `en_route`.
```json
// Response 200
{ "job": RiderJob, "tip": 220 }
```
Tip should be computed server-side from real payment/tipping data — currently the frontend randomly generates `150 + random*200` client-side as a placeholder.

### `GET /rider/earnings/summary`
```json
{ "basePayouts": 18400, "peakBonuses": 2100, "tips": 220, "deliveriesToday": 5, "onTimePercent": 94 }
```
(Currently `basePayouts`/`peakBonuses` are hardcoded constants and `onTimePercent` is a hardcoded "94%" string on the frontend — all three need real computation.)

### `GET /rider/earnings/ledger`
Paginated list of completed jobs (`status === "done"`) for the earnings statement view.

### `GET /rider/earnings/statement`
Downloadable statement (PDF/CSV) for a date range — UI button currently just shows a fake success toast.

### `GET /rider/profile`
Rider profile + verification/document status.

### `PATCH /rider/profile`

### `POST /rider/documents`
```json
// multipart
{ "type": "id" | "vehicle" | "insurance", "file": "<binary>" }
```
Tracks upload/verification state — currently pure unpersisted local UI state (resets on refresh).

---

## 9. Admin (store/menu/settings management)

### `POST /stores` (admin)
```json
{
  "name": "string", "slug": "string (optional, derived from name)",
  "tagline": "string", "description": "string", "location": "string",
  "image": "string(url)", "cover": "string(url)",
  "categories": ["pizza", "..."],  // "all" filtered out server-side; defaults to ["snacks"] if empty
  "deliveryTimeMins": [15, 30], "deliveryFee": 300, "minOrder": 1000,
  "rating": 4.5, "reviews": 0, "orders7d": 0,
  "tags": ["string"], "isOpen": true, "isFeatured": false, "isNew": false
}
```
Server generates `id`; derives a unique `slug` from `name` if not given (slugify + numeric suffix on collision).

### `PATCH /stores/:id` (admin)
Same fields, any subset. If `slug` changes, cascade the new `storeSlug` onto every product belonging to that store.

### `POST /stores/:storeId/menu-items` (admin)
```json
{
  "name": "string", "slug": "string (optional)", "description": "string",
  "price": 1500, "oldPrice": 2000, "category": "pizza",  // CategoryId excluding "all"
  "image": "string(url)", "isPopular": false, "isNew": false,
  "rating": 4.2, "reviews": 0,
  "options": [
    { "id": "string", "name": "string", "required": true, "multi": false,
      "choices": [ { "id": "string", "name": "string", "priceDelta": 0 } ] }
  ]
}
```
Server rounds `price`/`oldPrice` to integers; drops `oldPrice` if ≤ 0; slug unique per-store.

### `PATCH /menu-items/:id` (admin)
Same fields, any subset.

### `DELETE /menu-items/:id` (admin)

### `GET /admin/dashboard/kpis` (admin)
```json
{ "ordersToday": 128, "grossVolumeToday": 0, "activeRiders": 14, "avgPrepTimeMins": 24 }
```
(Currently hardcoded constants on the frontend — needs real aggregation.)

### `GET /admin/activity` (admin)
Query: `segment` (`orders`|`stores`|`finance`|`platform`), `q`, `page`, `pageSize`. Feed of recent platform events (currently a static array of 14 fake events).

### `GET /admin/settings/fees` / `PATCH /admin/settings/fees` (admin)
```json
{ "platformFeePercent": 12, "zone": "ilisan-core" | "ilisan-extended" | "campus" }
```
(Currently UI-only, save/reset buttons have no handlers.)

### `GET /admin/settings/feature-flags` / `PATCH /admin/settings/feature-flags/:id` (admin)
```json
{ "on": true }
```
(Currently 10 hardcoded flags, toggled only in local component state, not persisted.)

---

## Notes for the backend developer

1. **Order placement is the top priority gap** — checkout today is entirely fake (no API call, no persisted order, nothing reaches admin/rider). Everything else (catalog, auth, cart) has a reasonably complete client-side shape to mirror; orders need to be designed from scratch to connect all three apps (customer places → admin sees it → rider gets offered the job).
2. Enforce server-side what the frontend currently only enforces client-side: single-vendor-per-cart, address `isDefault` uniqueness, subtotal ≥ store minOrder before checkout, rider job status transitions (`pickup→en_route→done` only), and all admin/rider route authorization (role checks currently exist only in the React tree and are trivially bypassable via direct API calls).
3. Categories (`CategoryId`) are currently a fixed hardcoded enum (`all, pizza, cakes, burgers, local, snacks, drinks, shawarma, smoothies`), not a manageable entity — confirm whether the backend should keep this fixed or make categories a real CRUD resource.
4. Banner images and (implied) product/store images are currently handled as base64 data URLs or raw URL strings — recommend real object storage + CDN with multipart upload endpoints rather than embedding image bytes in JSON records.
5. All paginated admin/rider lists (`orders`, `stores`, `activity`, `offers`, `jobs`, `earnings ledger`, `feature flags`) should return `{ items, page, pageSize, pageCount, totalItems }` to match the existing `usePaginatedList` UI contract.
