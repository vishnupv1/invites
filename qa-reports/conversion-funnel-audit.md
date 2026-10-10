# Conversion funnel audit — InvitesReady

**Date:** 9 October 2026  
**Source:** Routes in `src/App.tsx`, tracking in `src/lib/analytics.ts`, checkout in `src/components/Checkout.tsx`, editor in `src/pages/Editor.tsx`.  
**Rates:** Not measured. No analytics export was available.

## Actual order

People do not all follow one line. These are the paths that exist.

| Path | Steps |
|---|---|
| Browse to design | `/` or a topic page → catalog or a cover → `/create/:id` → edit → publish |
| Template marketing page | `/template/:id` → preview → buy or customise → editor or checkout |
| Guest | `/i/:code` → RSVP. No purchase. A small “make your own” prompt can send them to the marketing site. |
| Return | `/login` → `/studio`, `/drafts`, `/events`, `/purchases` → `/create/:id?invite=` |

Designing does not require an account. Publishing a paid template does require a verified purchase. Free Gazal can be published without payment. The server enforces that.

## Stage by stage

### 1. Land

| | |
|---|---|
| Intended action | Understand that this is a digital invitation product. |
| UI | Homepage film and prompt. Topic pages such as `/wedding`. Shared links `/i/:code`. |
| Event | `page_view` with `page_path`, `page_title`, and `page_type: guest` on invitation links. Duplicate views of the same path in one SPA session are skipped. |
| Code | `src/lib/seo.tsx` `PageMeta`, `src/pages/Home.tsx`, `src/pages/InvitePage.tsx` |
| Next | Scroll, pick a chip, open a design, or RSVP. |
| Abandonment | Guest links are complete visits. Marketing visits can leave if the first screen does not match the search. On a phone the prompt is now first. |
| Status | Layout confirmed in the browser at 320px. Bounce share is unknown. |

### 2. Understand the offer

| | |
|---|---|
| Intended action | See that design is free and payment is once, at publish. |
| UI | Homepage tile “Pay once, from ₹299.” Cards show the price. `/pricing` redirects to `/`. |
| Event | None beyond `page_view`. |
| Next | “See the designs,” a chip, or a cover. |
| Abandonment | Someone who expected a subscription price page only gets the homepage. The copy matches the catalog. |
| Status | Confirmed redirect. Impact unknown. |

### 3. Discover an occasion or template

| | |
|---|---|
| Intended action | Pick wedding, birthday, baby, or housewarming, or open the catalog. |
| UI | Chips and a sentence on `/`. Filters on `/browse`. Topic routes. Studio categories hide empty occasions, including Anniversary. |
| Event | **None** for chip, search, or filter. |
| Code | `occasionOf` in `src/pages/Home.tsx`, `src/pages/AllTemplates.tsx`, `src/pages/Topic.tsx` |
| Next | A design card. |
| Abandonment | A sentence that does not mention birthday, baby, or house defaults to wedding. Empty input now says a sample wedding is being shown. Baby and housewarming no longer include wedding cards. |
| Status | Matching rules confirmed in code. How often the default is wrong is unknown. |

### 4. Browse and preview

| | |
|---|---|
| Intended action | Open a design before committing. |
| UI | `/browse`, `/browse/:id`, `/open/:id`, `/template/:id`. Preview and Use links include the design name. |
| Event | `template_preview` once per template id per page load (`template_id`, `template_name`). |
| Code | `AllTemplates.tsx`, `OpenInvite.tsx`, `TemplatePage.tsx`, `PreviewModal.tsx` |
| Next | Use / customise, which goes to `/create/:id`. |
| Abandonment | Preview and create are separate. A person can watch the opening and never edit. That is not tracked as a distinct “preview closed” event. |
| Status | Events exist. Volume unknown. |

### 5. Start editing

| | |
|---|---|
| Intended action | Change names, date, and wording and see the invitation. |
| UI | `/create/:id`. Guest strip says changes save on the phone until there is an account. Mobile sheet has “View invitation” and Done. Invitation line is a textarea. |
| Event | `start_design` once per template id per page load, when the editor mounts. It fires even if the person does not type. |
| Code | `src/pages/Editor.tsx` |
| Next | Keep editing, save, or publish. |
| Abandonment | Opening the editor counts as a start. There is no event for the first successful edit or for autosave. |
| Status | Confirmed. “View invitation” was seen in the accessibility tree and not clicked in this pass. |

### 6. Save

| | |
|---|---|
| Intended action | Keep the draft. |
| UI | Autosave and Save. Signed-out work can stay on the device until a session exists. |
| Event | **None** for save. |
| API | `POST /api/invites/draft`, `PUT /api/invites/record/:id` |
| Abandonment | A refresh before the first server save can lose work for a signed-out visitor who has not triggered a session. Not retested in this pass. |
| Status | Suspected from the guest-save copy. Not measured. |

### 7. Account

| | |
|---|---|
| Intended action | Sign up or log in when publishing or paying. |
| UI | `/login` with Log in and Sign up. Editor can ask the guest to sign in. Checkout creates a session for a new email. “Password reset is not available yet.” |
| Event | `sign_up` after email signup, or after Google only when the API says the account was created. Existing Google accounts send `login`. Checkout does not send `sign_up`. |
| API | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/session` |
| Abandonment | No reset email. Google was not completed. An existing email at checkout must log in; email alone is refused (401). |
| Status | Auth API tested in the regression suite. Google not tested. |

### 8. Premium and checkout

| | |
|---|---|
| Intended action | Pay once for a paid design, then publish. |
| UI | Publish dialog: “Pay ₹499 and publish” for Shaadi. Checkout collects name, email, and phone, then opens Razorpay. A 100% coupon can zero the price. |
| Event | `begin_checkout` when the checkout form is submitted, with `currency`, `value`, and `items` (`item_id`, `item_name`, `price`). It fires before Razorpay opens, so a cancel still has a begin. |
| API | `POST /api/create-order`, Razorpay, `POST /api/verify-payment`, `POST /api/purchases` |
| Abandonment | Cancel and failure are shown in the form and are **not** analytics events. |
| Status | Paywall copy confirmed earlier. Live Razorpay charge not run. |

### 9. Purchase recorded

| | |
|---|---|
| Intended action | Entitlement is stored, then the invite can go live. |
| UI | After payment, the editor can publish. Purchases list shows the design. |
| Event | `purchase` only after `onPurchased` resolves. Paid events include `transaction_id`, `template_id`, `value`, `currency`, and `items`, and are deduped by payment id for that page load. A zero-price coupon purchase has `value: 0`, no transaction id, and is deduped by template and coupon for that page load. |
| API | Purchase row is written only after signature and order checks. Unpaid publish returns 402. |
| Status | 402 path tested. Successful payment not tested. |

### 10. Publish and share

| | |
|---|---|
| Intended action | Copy the link or open WhatsApp. |
| Event | `publish` with template id and name. `share_whatsapp` when that button is used. Copy-link is not a separate event. |
| Next | Guest opens `/i/:code` and may `rsvp_submit`. |
| Status | Free publish was tested in the earlier QA pass. Not repeated as a browser journey here. |

### 11. Return

| | |
|---|---|
| Intended action | Continue a draft or reuse a purchase. |
| UI | `/studio`, `/drafts`, `/purchases`, `/favorites`. Loading text shows while lists load. |
| Event | Only `page_view`. No “returned and continued” event. |
| Status | Loading copy is in the code. A populated return visit was not screenshotted in this pass. |

## Missing or unreliable tracking

| Gap | Why it matters |
|---|---|
| No occasion, search, or filter event | Cannot tell if people fail to find a design. |
| `start_design` fires on open. `first_edit` is separate. | Use `first_edit` for real editing. `start_design` remains “editor opened.” |
| `save_draft` exists, but a signed-in sample can save before an edit | A draft count can include an untouched sample. |
| `payment_cancelled` and `payment_failed` exist in code | They are not in a GA4 export yet, so checkout loss is still unmeasured. |
| Zero-price `purchase` has no transaction id | A repeat in the same page load is suppressed. A refresh can still count it again. |
| Guest RSVP sessions look like bounces | Filter `page_type = guest` before judging the homepage. |
| No consent mode | If a consent requirement is added later, historical rates will change. |
| Checkout used to emit `sign_up` | Removed in this pass. Older GA4 signup counts include guest sessions. |

## Metrics that would explain conversion

For one date range, in this order:

1. `page_view` where `page_type` is not `guest`, by landing path and device.
2. `template_preview` / those page views.
3. `start_design` / previews. Then `first_edit` / `start_design`, and `save_draft` / `start_design`.
4. `publish` / `start_design`, split by template free vs paid.
5. `begin_checkout` / paid design starts.
6. `purchase` / `begin_checkout`. Also `payment_cancelled` / `begin_checkout` and `payment_failed` / `begin_checkout`. Use `transaction_id` so paid purchases are unique.
7. `sign_up` and `login` beside checkout, not instead of it.

## Phase 7 — captured payment recovery

If Razorpay captures a payment and the purchase request then fails, checkout keeps that payment proof in `sessionStorage` and shows “Finish unlocking.” That button sends the same order through verify and purchase. It does not call `POST /api/create-order` and it does not send another `begin_checkout`. Publish still runs only after the purchase call resolves. A 400 from the server drops the proof. A lost response or a 5xx keeps it.

This was checked with unit tests and by opening the Bloom checkout in Chrome with a locally stored proof. The finish button was not pressed, and no payment was sent. DebugView was not watched.

Phase 8 changed the 400 rule. Only “Razorpay could not verify that payment.”, “That payment does not match this purchase.”, and “Check those details.” clear a stored proof. Other 400 responses, including an invalid coupon, keep it.

## Phase 8 — recovery against Razorpay test mode

Two real test-mode payments were completed on an isolated site. The live site was not used to pay.

Bloom: the first purchase request was answered in the browser with HTTP 500 and never reached the API. Finish unlocking reused `order_TlvfBkvcOxsucT` and `pay_TlvfEoI0rvbvuz`. The purchase count went from 0 to 1. Razorpay shows one captured payment. The guest page `/i/ncstYSVY` opened. The collect log for this run was not saved.

Villa: the API recorded the purchase and returned HTTP 200, then the browser dropped that response. Before Finish unlocking there was one villa purchase and the invitation was still a draft. After the retry there was still one purchase, no second order, and `/i/Vop_ck1B` was live. The browser sent `begin_checkout` once and `purchase` once.

A fake signature was rejected with “Razorpay could not verify that payment.”, the proof was removed, and no order was created. Clearing the session, opening another browser, and two overlapping recovery requests were not run in Phase 8. The server has no unfinished-payment lookup, so another browser cannot finish the same charge. DebugView was not opened.

## Phase 9 — overlapping finalization

Two purchase requests for the existing Bloom order `order_TlvfBkvcOxsucT` were sent at the same time to an isolated test-key API. Both returned HTTP 200. The host still had one bloom purchase. Razorpay still lists one captured payment, `pay_TlvfEoI0rvbvuz`. Asking for a new order returned HTTP 409 before Razorpay could create one. A bad signature returned HTTP 400 beside a successful retry and did not remove the purchase. Two publishes of the live invitation both returned HTTP 200 and left `/i/ncstYSVY` as the one live Bloom code.

The same-tab button now ignores a second click while the first request is running. That does not cover two tabs.

The case of two requests inserting the purchase row for the first time was not run on MongoDB. An in-memory unique index, using the same duplicate-key decision, keeps one row. There is no isolated database for that insert race.

Recovery after cleared storage was not built in Phase 9. Phase 10 added it.

## Phase 10 — server-side recovery

Creating an order now writes a pending row for the signed-in host before Razorpay is called. The row stores the order id, amount, currency, coupon, and status. It does not store a card, signature, email, or phone. A second create for the same price reuses that order. A captured attempt does not create another order.

`POST /api/payments/recover` fetches the order and the captured payment from Razorpay. The client cannot supply the payment id. Another host receives 404. Publish still waits until the purchase upsert has succeeded.

Chrome, isolated test key, local database: the first create and the second create shared `order_Tm7kPHhwI9ZWxl`. A test card payment was captured (`pay_Tm7kXjXLjntK8V`). The purchase response was then failed on purpose. A new browser context with the same sign-in and empty `sessionStorage` showed “Finish unlocking”, sent no `create-order` and no `begin_checkout`, sent one `purchase`, stored one bloom purchase, and published. DebugView was not opened.

Two first-time purchase upserts on that local MongoDB left one row. That database was not the application database.
