# Conversion improvement roadmap — InvitesReady

**Date:** 9 October 2026  
**Rule:** No percentage uplift is stated. There is no traffic export to support one.

Items marked **Done** were implemented in the earlier QA pass or in this pass. The rest are not implemented, because they need GA4 data or a product decision.

| Priority | Problem | Evidence | Proposed change | Expected impact | Confidence | Effort | Risk | Success metric | Validation |
|---|---|---|---|---|---|---|---|---|---|
| P1 Done | Phone visitors could not read the name or open Templates / How / FAQs. | 320px measurement: wordmark clipped; nav `display: none` until 960px. | Keep the wordmark, hide the extra pill under 430px, add a menu. | More people can identify the product and reach the catalog. Not a proven conversion lift. | High that the defect existed. Unknown traffic impact. | Done | Low | Wordmark `scrollWidth` equals `clientWidth` at 320 and 375. Menu lists three links. | Measured in the browser. |
| P1 Done | First phone screen was the film, not the prompt. | At 320×720 the prompt was below the film. | On widths under 960px, put the start section first. | The main action is on the first screen. | High for the layout. Unknown for starts. | Done | Low | Start section `top` near the header; film below. | Measured: start at 68px, film at 890px. |
| P1 Done | Unpaid publish could skip the paywall on the API. | `assertCanUse` ignored purchases. | Require a free template or a purchase before a live invite. | Revenue is not given away. Checkout stays the path for paid designs. | High | Done | Medium: drafts must still save. | Unpaid Shaadi publish and create return 402. Gazal still publishes. | `backend/test/regression.test.mjs` |
| P1 Done | Checkout counted a guest session as `sign_up`. | `Checkout.tsx` called `trackSignUp` after `ensureSession`. | Stop that call. Keep `sign_up` on the real signup form. | Signup rate becomes comparable to accounts that chose a password. Historical GA4 numbers stay inflated. | High | Done | Low | A new checkout email does not emit `sign_up`. | Code review. Not watched in GA4 DebugView. |
| P1 Done | Google signup tab counted an existing account as `sign_up`. A zero-price purchase could fire twice. | `Auth.tsx`, `GuestAuthDialog.tsx`, and `CreateGuest.tsx` used the tab, not whether a host row was created. `purchase` used `trackEvent`. | API returns `created`. The client sends `sign_up` only when that is true. `purchase` uses `trackOnce` keyed by payment id, or by template and coupon when the price is zero. | Signup and purchase counts match completed actions more closely. Still not proven in GA4. | High for the code path. | Done | Low | `purchaseEventKey` tests. Google itself was not signed in. | `node --experimental-strip-types --test src/lib/purchase-event-key.test.mjs` |
| P2 Done | Baby shower and housewarming suggestions included wedding designs. | `SETS.baby` and `SETS.home` labelled Botanica, Anna, and Beach as Wedding. | Show only Little Blessing and Hearth, the matching catalog designs. | Fewer people start the wrong occasion. | High | Done | Low: fewer cards. | Those chips do not render a Wedding label. | Code. Not clicked in the browser in this pass. |
| P2 Done | Favorites and purchases looked empty while loading. | Render was `null` until the catalog returned. | Show “Loading your favorites…” and “Loading your purchases…”. | Returning buyers are less likely to think the purchase vanished. | High for the blank state. | Done | Low | Loading text is in the tree before the list. | Code. Not screenshotted while throttled. |
| P2 Open | Nobody can see where the funnel leaks. | GA4 is installed. No export. Occasion and search events are still absent. Save and payment-outcome events are now in the code. | Pull the 28-day export in `analytics-event-plan.md`. Do not mix it with older `sign_up` counts. | Decisions stop depending on bounce rate alone. | High that the data gap exists. | Medium | Consent: do not add identifiers. | A report with preview, start, first edit, draft, checkout, cancel, failure, and purchase by device. | DebugView, then one real date range. Not run. |
| P2 Open | Password reset does not exist. | Login shows “Password reset is not available yet.” There is no mail sender. | Build reset only when email can be sent. Until then leave the honest line. | Returning buyers who forget a password can get back in. | High that it blocks return visits for those people. Unknown how many. | High | Account email enumeration if written carelessly. | Reset completes without saying whether an arbitrary email exists. | A test inbox. Not started. |
| P2 Done | `start_design` fires when the editor opens, before any edit. | `useEffect` on editor mount. | `save_draft` and `first_edit` were added. `start_design` still means the editor opened. | Editor abandonment can be measured once GA4 has the events. | High for the code. Unknown until an export. | Done | Low | `first_edit` and `save_draft` are each once per page load. | Local tests. DebugView not run. |
| P2 Done | Cancelled payments were invisible. | Razorpay dismiss now sends `payment_cancelled`. Failure sends `payment_failed`. | Keep bank text out of analytics. | Checkout loss can split into cancel, failure, and no purchase. | High for the code. Unknown until a test payment is watched in DebugView. | Done | Low | A cancel has one event and no `purchase`. | Local tests. Sandbox card not run. |
| P3 Open | `/pricing` is the homepage. | `App.tsx` redirects `/pricing` to `/`. | Keep the redirect unless ads need a URL that opens on the price tile (`/#pricing`). | Only useful if campaigns land on `/pricing` and people miss the price. | Low until landing-page data exists. | Low | Low | Landing path report. | GA4. Do not build a new pricing page yet. |
| P3 Experiment | Homepage film vs prompt on desktop. | Desktop still leads with the film. Phone leads with the prompt. No engagement split. | Do not change desktop until GA4 shows desktop engagement is worse. If it is, test prompt-first for new desktop sessions only. | Unknown. | Low | Medium | Can hurt a page that is already clear. | Engaged session rate and `start_design` / session, desktop only. | Needs volume. Not started. |
| P3 Experiment | Registration before the first edit. | Guests can edit first. That is the current rule. | Do not move signup earlier without evidence that drafts are abandoned. | Could raise signups and cut design starts. | Low | High | High | Guardrail: `start_design` must not fall. | Not started. |
| P3 Open | Large production JS chunk. | Build output about 1.08 MB JS (280 KB gzip). Local dev timings are not production. | Measure production LCP on `/` and `/browse` for mobile before splitting the bundle. | Only worth it if LCP is slow. | Medium that the file is large. Low that it is the bounce cause. | Medium | Code-splitting can break template loads. | Field LCP, not a local Vite number. | Not measured. |

## Order to do next

1. Export GA4 for 28 days and separate `page_type = guest` from marketing sessions.
2. Read `begin_checkout` against `purchase` before changing checkout layout.
3. Watch `save_draft`, `payment_cancelled`, and `payment_failed` in DebugView with a Razorpay test payment.
4. Build password reset only with a real sender.
5. Leave the desktop film and the “edit before you pay” rule alone until those numbers exist.

## Done in this pass

- `src/pages/Home.tsx` — baby and housewarming suggestions match the catalog.
- `src/pages/LoggedInHome.tsx` — favorites and purchases loading copy.
- `src/components/Checkout.tsx` — no false `sign_up`; `purchase` includes `template_id` and is deduped for the page load.
- `src/lib/analytics.ts`, `src/lib/purchase-event-key.ts` — purchase dedupe key.
- `src/pages/Auth.tsx`, `src/components/GuestAuthDialog.tsx`, `src/pages/CreateGuest.tsx`, `src/lib/google.ts`, `src/api.ts`, `backend/src/application/services.ts` — Google `sign_up` only when `created` is true.

`npm run build` passed (1,082 kB JS, 280 kB gzip). `node --experimental-strip-types --test src/lib/purchase-event-key.test.mjs` passed (2 tests). Backend `tsc --noEmit` passed. A Razorpay payment and GA4 DebugView were not run.
