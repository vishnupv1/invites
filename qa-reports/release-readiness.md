# Release readiness — InvitesReady

**Date:** 10 October 2026  
**Recommendation:** Ready with known limitations

Phase 10 stores a pending payment when a Razorpay order is created. A signed-in host can finish that captured payment from a new browser session. Safari, Firefox, Edge, physical devices, and GA4 DebugView remain untested.

Phase 5 is the checkout and Chrome route pass below. Phase 6 opened the Bloom guest page from that payment and rechecked payment integrity from the recorded evidence and the current code. No product source file changed between those two passes.

Chrome 154.0.8037.98 headless is still the only browser engine that was driven. Safari 26.5.2 is installed on this Mac. `safaridriver` refused a session because Allow Remote Automation is off in Safari Settings, so Safari itself was not driven. Firefox and Edge are not installed. WebKit and Firefox browser engines were not downloaded. Playwright was not added to the project. No iPhone, iPad, or Android phone was attached. A production build is not evidence of device compatibility.

The live API stayed on port 4010 and the live site stayed on port 5173. `.env` was not edited. Its hash was the same after the pass as before it. The temporary test API on port 4012 and the temporary site on port 5179 were stopped. No order was created against the live Razorpay key.

## A. What this pass ran

### Chrome, previously fixed templates and main routes

Headless Chrome, viewport emulation. Sample invitation text unless a row says otherwise. No horizontal overflow, no broken images, and no console errors on these loads.

| Route | Viewport | Result |
|---|---|---|
| `/` and the menu button | 390×844 and 1280×800 | Pass |
| `/browse` | 320×568 | One column, 296px. Bloom Letter is on the page. |
| `/wedding`, `/login`, `/does-not-exist` | 390×844 | Pass. The missing route shows “We couldn’t find that page.” |
| `/open/villa`, `/open/pull`, `/open/beach`, `/open/vivah`, `/open/baptism`, `/open/palace`, `/open/thiruvizha`, `/open/bloom` | 390×844 | Pass for overflow, images, and console. |
| `/i/6JS7jMNU`, `/i/EfdiHCRE` | 390×844 | Gazal shows the Nikah wording. Aurelia shows both names and “A celebration of love.” |
| `/create/gazal` | 375×667 | The title `ആരവ് നമ്പ്യാർ & प्रिया शर्मा — Marriage` is 289×21 and the page does not scroll sideways. |

Pull’s heading “TONIGHT, THE CURTAIN RISES ON” wraps to a box 246×41 and sits above the tassel. Beach was opened from the bottle: the interior showed the wedding wording and logged no SVG path error. Thiruvizha’s open page includes English, தமிழ், and Both. The garland is 54px tall. The language-bar coordinates were not measured again.

Villa, Vivah, and Baptism were opened with their sample names. The long stress names from Phase 4 were not typed into those three again.

### API regression on the test-key process

These calls went to port 4012. Catalog, authorization, RSVP, and paywall behavior match the earlier pass.

| Check | Result |
|---|---|
| Catalog | 21 templates, including bloom |
| Unknown template | HTTP 404 |
| Another account reading a draft | HTTP 404 |
| Missing invitation code | HTTP 404 |
| Blank RSVP name | HTTP 400 |
| Publish a paid template with no purchase | HTTP 402 |
| Publish Gazal, then save it again | HTTP 200, status stays `live` |
| Wrong payment signature | HTTP 400 |
| RSVP, then the same reply token | One row, updated to not attending |
| Another account listing those replies | HTTP 404 |

### Website checkout on an isolated test site

A second API listened on port 4012. Its process environment supplied the test key (`rzp_test_…cTb`) and the test secret. `.env` was not the source of those process values. A second Vite server on port 5179 proxied `/api` and `/media` only to port 4012. The page’s own requests stayed on `127.0.0.1:5179`. Each create-order response was checked before the Razorpay frame was used, and each key was a test key.

Chrome 390×844. The checkout form has no horizontal overflow. Submitting it empty shows the name, email, and phone errors. The pay button sits below the first screen and is reached by scrolling.

| Case | Evidence | Result |
|---|---|---|
| Cancelled Villa checkout | Order `order_TlvFgwuP6cPCxh`. The Razorpay frame opened, the back control led to the exit confirmation, and the page showed that payment was cancelled. Purchases stayed empty. | Pass |
| Failed Beach payment | Order `order_TlvJs7dhPEv1k6`, ₹549. A 2-digit OTP was rejected in the Razorpay frame. Purchases stayed empty. Publish returned HTTP 402. | Pass |
| Successful Bloom payment | Order `order_TlvKB9tuUUdBEc`, ₹499. The card payment completed and the editor showed that the invitation is live. The purchase list had one row. Sending that same purchase request again returned HTTP 200 and the list still had one row. | Pass |

The guest URL for that new Bloom invitation was not opened after publish. The earlier Bloom guest page `/i/aGdXtK3S` was not reloaded.

The earlier test-key cases were not repeated: success `order_Tlu9ViQlDIQA7y` / `pay_Tlu9arIBbfih0Q`, the unpaid-order signature rejection, and the first failed and cancelled orders. Those results still stand.

## B. Analytics

GA4 DebugView was not opened. There is no property login in this environment.

On `/i/6JS7jMNU?team=1`, Chrome sent one `page_view` collect hit. `ep.page_type` was `guest`. The hit title was `Guest invitation | InvitesReady`. The collect query had no email, phone, name, password, or token parameter. After the invitation loaded, the browser tab title changed to the couple’s names. A scroll did not send a second hit carrying those names during the observation window.

Local funnel tests still pass. That is not DebugView verification.

## C. Outstanding

- Safari on macOS and iOS. Remote automation is installed and currently disabled.
- Firefox, Edge, and the WebKit and Firefox engines.
- A physical iPhone, iPad, or Android phone: portrait and landscape, the on-screen keyboard, safe-area insets, sticky controls, dialog scrolling, touch targets, and the browser’s own 200% zoom.
- GA4 DebugView for the funnel events.
- Grand Door at 320 and 768 remains a measurement from Phase 4, not a new frame-by-frame review.
- Safari manual check, listed below, is still required. Remote automation remains off.

### Physical-device checklist, still pending

Use the long couple name, the long Kochi address, and a Malayalam or Hindi line.

1. Safari on an iPhone, portrait and landscape: open Gazal `/i/6JS7jMNU`, Aurelia `/i/EfdiHCRE`, and one sealed design (Beach or Villa). Submit an RSVP.
2. Chrome on an Android phone, same three links, plus the editor with the keyboard open.
3. A tablet, if one is available: catalog, editor, and one published invitation.
4. Confirm the home indicator does not cover the Thiruvizha language controls, the editor publish button, or the checkout pay button.
5. Set the browser zoom to 200% with the browser control and recheck the editor title and the catalog.

## D. Commands

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs` | Pass. 10 tests, 0 failed. |
| `npm run lint` | Pass. Exit code 0. Existing oxlint warnings remain. CSS is not linted. |
| `npm run build` | Pass. Typecheck succeeded. Production build succeeded. SEO wrote 43 public URLs. The JavaScript chunk is about 1,083 kB and the build warns about chunk size. |

## Phase 6 — Bloom guest page and payment integrity

The Phase 5 Bloom payment `order_TlvKB9tuUUdBEc` has one purchase row: template bloom, price 499, payment id present. The live invitation for that host is `/i/CfGuuJqf`, status `live`, saved names `Diya & Aryan`, saved date `2027-03-07`.

Chrome 154.0.8037.98 headless opened `http://127.0.0.1:5173/i/CfGuuJqf`. This was a read of the existing invitation. No RSVP was submitted. The live API was not restarted and no checkout was sent to it.

| Viewport | Overflow | Broken images | Console errors | Names | RSVP |
|---|---|---|---|---|---|
| 320×568 | 0 | None | None | Diya & Aryan are on the page | “Kindly reply” is on the page. It was not submitted. |
| 390×844 | 0 | None | None | Same | Same |
| 768×1024 | 0 | None | None | Same | Same |
| 1280×800 | 0 | None | None | Same | Same |

The page also shows the sample letter, “Tap the seal to open our story,” and the sample timeline. The browser tab title is the couple’s names. No layout defect was found at these four widths.

Payment integrity, from Phase 5 evidence plus the current server code. The payment cases were not run again.

| Check | Evidence |
|---|---|
| Server verifies the payment | `verifyPaymentProof` checks the signature with the server secret, then fetches the Razorpay order and requires status `paid` and a matching host id. |
| Purchase follows verification | Checkout calls verify, then `POST /api/purchases`, then `purchase`. `purchase` is not sent when verify or the purchase request throws. |
| Paid template can publish | Bloom `/i/CfGuuJqf` is live after the ₹499 test payment. |
| Unpaid template cannot publish | Beach after the failed OTP returned HTTP 402. Phase 5. |
| One purchase row | The order has one row. Repeating the purchase request in Phase 5 returned HTTP 200 and left the count at 1. The schema has a unique index on host plus template, and a sparse unique index on the payment id. |
| Cancel and failure do not unlock | Villa cancel and Beach failure left the purchase list empty. Phase 5. |
| Client payment fields cannot skip verification | A wrong signature returned HTTP 400 on the test-key API. An unpaid order with a valid signature returned HTTP 400 in the earlier test-key pass. Neither was repeated. |
| Zero-price duplicates | A zero-price `purchase` event is deduped per page load by template and coupon. The tests cover that. A live zero-price checkout was not submitted. |

No release-blocking defect was found. The untested purchase-failure retry remains a risk, not an observed failure.

### Commands this pass

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs` | Exit 0. 10 passed, 0 failed. |
| `npm run lint` | Exit 0. Existing oxlint warnings remain. CSS is not linted. |
| `npm run build` | Exit 0. `tsc -b` succeeded. Production build succeeded. SEO wrote 43 public URLs. JavaScript chunk about 1,083 kB, with the existing chunk-size warning. |
| `npm run typecheck` in `backend` | Exit 0. `tsc --noEmit`. |

Safari, Firefox, Edge, physical devices, and GA4 DebugView were not tested. `published-guest-view-matrix.md` is not in the repository.

## Phase 7 — payment recovery

Checkout now keeps a captured payment in `sessionStorage` under `invitesready.captured-payment.v1`. If verify or purchase fails for a reason other than HTTP 400, the form stays on “Finish unlocking” and says the payment was received and will not be charged again. That action retries verify and purchase with the stored order. It does not create a new Razorpay order and does not send `begin_checkout`. The proof is removed after purchase resolves. A 400 drops it. The server still checks the signature, requires a paid order for that host, and checks amount, template, and coupon. A duplicate-key collision on the purchase row is treated as already owned when that host already has the template. Publish in the editor still runs only after that purchase call resolves; a later publish uses the entitlement and does not open checkout.

No live or test-mode payment was submitted in this pass. The live API was not restarted.

| Check | Result |
|---|---|
| Frontend recovery tests | 8 passed. They use an in-memory store, not Razorpay. |
| Backend payment-decision tests | 6 passed. They cover a bad signature, an unpaid order, a different host, a mismatched amount or template, and a duplicate-key collision. |
| Checkout button in Chrome 154 | On `/template/bloom` at 1280px the button read “Pay ₹499 securely.” With a local proof stored for bloom, it read “Finish unlocking” and showed the recovery message. The button was not pressed. No create-order request was made. |
| Cover recheck at 390, catalog at 320, editor title at 375, Gazal, Aurelia, and Bloom `/i/CfGuuJqf` | No horizontal overflow and no console errors. Interiors that open only after a tap were not opened again. |

### Commands this pass

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs src/lib/payment-recovery.test.mjs` | Exit 0. 18 passed, 0 failed. |
| `node --experimental-strip-types --test src/application/payment-decision.test.mjs` in `backend` | Exit 0. 6 passed, 0 failed. |
| `npm run lint` | Exit 0. Existing oxlint warnings remain. |
| `npm run build` | Exit 0. Typecheck succeeded. JavaScript chunk about 1,085 kB, with the same chunk-size warning. SEO wrote 43 public URLs. |
| `npm run typecheck` in `backend` | Exit 0. |

### Still not tested

Safari 26.5.2: `safaridriver` again refused a session until Allow Remote Automation is enabled in Safari Settings. Do not turn that on from automation. Manual steps: open Safari, visit `/`, `/browse` at a narrow window, `/login`, `/create/gazal`, and `/i/CfGuuJqf`. Look for sideways scrolling, console errors, and clipped names.

Firefox and Edge are not installed. No WebKit or Firefox engine was downloaded.

No phone was attached. Physical checks remain not tested: portrait and landscape, touch targets, keyboard over the editor and checkout fields, safe areas, native 200% zoom, long names, RSVP visibility, checkout scrolling, and a dropped network during “Finish unlocking.”

GA4 DebugView was not opened. A browser network hit is not DebugView evidence.

The duplicate-key test checks the decision for error code 11000. It is not two live database requests at the same time.

Phase 8 narrowed the client rule. A 400 clears the stored proof only when the message is “Razorpay could not verify that payment.”, “That payment does not match this purchase.”, or “Check those details.” A coupon 400, a 400 with no message, a 5xx, and a lost response keep the proof.

## Phase 8 — test-mode recovery

The live API on port 4010 and the live site on port 5173 stayed up and were not used to pay. `.env` was not edited. Its hash was the same after this pass. A new API on port 4012 received the test key only in its process environment. The returned key was `rzp_test_` and ended in `cTb`. Vite on port 5179 proxied `/api` and `/media` only to port 4012. Both temporary processes were stopped at the end. Chrome 154.0.8037.98 headless drove the pages.

Before checkout, one unpaid Villa order was created only to confirm the key: `order_TlvePODH58iSHs`, status `created`. It has no payment and is not a recovery charge.

### Purchase request failed after a real test payment

Bloom, ₹499. The card payment completed in the Razorpay test frame. The browser then answered the first `POST /api/purchases` itself with HTTP 500 and “Could not finish that. Try again.” That request did not reach the API. The signature was not changed.

The checkout kept the proof and showed “Payment received. Finish unlocking this design. You will not be charged again.” The button read “Finish unlocking.” Pressing it sent the original order through verification and purchase.

| Item | Result |
|---|---|
| Order | `order_TlvfBkvcOxsucT`, status `paid`, amount 49900 |
| Payment | `pay_TlvfEoI0rvbvuz`, status `captured`. Razorpay lists one payment on this order. |
| Purchases before retry | 0. The 500 never reached the API. |
| Purchases after retry | 1. Template bloom, price 499. |
| Second order or charge | None. The recent test-order list has this one paid Bloom order from this pass. |
| Publish | The editor showed that the invitation is live. Guest code `/i/ncstYSVY`. |
| Guest page | Chrome at 390×844. Overflow 0. Title “Diya & Aryan”. No console errors. Reply text is on the page. |
| `begin_checkout` on this run | Not captured. The harness crashed after the invitation went live, before it wrote the collect log. The lost-response run below uses the same button and recorded one `begin_checkout`. |

### Purchase response lost after the server recorded it

Villa, ₹499, same isolated site. The first `POST /api/purchases` reached the API and returned HTTP 200. The browser then aborted that response, so the page saw a network failure.

| Item | Result |
|---|---|
| Order | `order_TlviezUm6pQrJX`, status `paid`, amount 49900. The held proof used this same order. |
| Payment | `pay_TlvijrUOGUNHzN`, status `captured`. One payment on the order. |
| Purchases before Finish unlocking | 1, template villa. The invitation was still `draft`. |
| Purchases after Finish unlocking | 1. The retry returned HTTP 200. |
| Second order or charge | None. One create-order id was observed. |
| Publish | Only after the retry. Guest code `/i/Vop_ck1B`, status live. |
| Guest page | Chrome at 390×844. Overflow 0. Title “Aditi & Vikram”. No console errors. |
| Collect hits in the browser | `begin_checkout` once, before Razorpay. `purchase` once, after the retry. Finish unlocking did not send a second `begin_checkout`. |
| Proof after success | Removed from `sessionStorage`. |

These collect hits are browser requests. They were not seen in GA4 DebugView.

### Other failure checks

| Check | Result |
|---|---|
| Invalid proof | A locally stored fake order, payment, and signature. No charge. The button started as “Finish unlocking.” The API returned “Razorpay could not verify that payment.” The proof was removed and the button returned to “Pay ₹499 securely.” No create-order request and no `begin_checkout`. |
| Cleared session or another browser | Not run against a valid captured payment. The proof is only in that tab’s `sessionStorage`. The server does not keep an unfinished payment the next browser can look up. After the invalid-proof rejection, storage was empty and the button was the normal pay button. |
| Repeated recovery | The Villa retry ran once after the purchase already existed. The count stayed 1. Two overlapping Finish unlocking requests were not sent. |
| Inactive coupon after capture | Reviewed in code. A coupon that no longer verifies does not by itself reject a captured order, and the order amount, template, and coupon note still have to match. No test payment used an inactive coupon. |
| Socket drop before the API sees the purchase | Not run. The Bloom case was a local HTTP 500, not a dropped connection. |

### Chrome routes this pass

Live site `http://127.0.0.1:5173`, Chrome 154.0.8037.98 headless, 390×844. No horizontal overflow, no console errors, and no failed document or API responses.

| Route | Observation |
|---|---|
| `/` | Home copy is on the page. |
| `/browse` | Bloom Letter is listed. |
| `/login` | Email accepted typing. Tab moved focus to the password field, which then accepted typing. The form was not submitted. |
| `/create/gazal` | The first name field accepted typing. |
| `/i/CfGuuJqf` | The sealed Bloom page loaded. The seal was not opened again in this pass. Phase 6 already showed the names and “Kindly reply.” |

Safari 26.5.2 is installed. `AllowRemoteAutomation` is not set. Safari was not driven, and that setting was not turned on. Firefox and Edge are not installed. No iPhone or Android device was attached. GA4 DebugView was not opened.

### Commands this pass

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs src/lib/payment-recovery.test.mjs` | Exit 0. 18 passed, 0 failed. |
| `node --experimental-strip-types --test src/application/payment-decision.test.mjs` in `backend` | Exit 0. 6 passed, 0 failed. |
| `npm run lint` | Exit 0. Existing oxlint warnings remain, including a set-state-in-effect warning in `Checkout.tsx`. CSS is not linted. |
| `npm run build` | Exit 0. JavaScript chunk `index-J5XaUwer.js` is 1,084.83 kB, with the existing chunk-size warning. CSS 679.28 kB. SEO wrote 43 public URLs. |
| `npm run typecheck` in `backend` | Exit 0. |

## Phase 9 — overlapping recovery and storage loss

No new payment was created. The live API on port 4010 and the live site on port 5173 stayed up. `.env` was not edited. A temporary test-key API on port 4012 was started only to replay the existing Bloom purchase, then stopped. Its key was the test key. The newest Razorpay test orders after this pass are still the Phase 8 orders.

### Same-tab double click

`beginFinalization` takes a gate before any network call. A second call while that gate is held returns immediately, leaves the stored order in place, and does not open Razorpay. The pay button is also disabled while the request is in flight. A unit test covers the gate. Two browser tabs do not share it.

### Two overlapping requests for the existing Bloom order

The isolated API replayed `order_TlvfBkvcOxsucT` and `pay_TlvfEoI0rvbvuz` for the host that already owns Bloom. This was not a new card payment. The purchase row already existed, so this exercises two concurrent finalizations of a recorded purchase, not two racing inserts.

| Check | Result |
|---|---|
| Two `POST /api/purchases` at the same time | Both HTTP 200 |
| Purchases for that host and bloom | 1 before and 1 after |
| A valid request beside a bad signature | HTTP 200 and HTTP 400, “Razorpay could not verify that payment.” The purchase row remained. |
| `POST /api/create-order` for bloom | HTTP 409, “You already own this template.” The ownership check runs before Razorpay is asked for an order. |
| Razorpay payments on that order | Still 1, status `captured` |
| Newest test orders | No order newer than the Phase 8 Villa and Bloom orders |
| Two `POST /api/invites/record/:id/publish` | Both HTTP 200. One live Bloom invitation, same code |

Publishing an invitation that is already live returns that invitation. A draft is published only after `assertCanUse` finds the purchase. That 402 path was not repeated.

The first-insert collision, where two requests both try to create the purchase row, was not run against MongoDB. There is no separate test database. An in-memory ledger with the same duplicate-key rule leaves one row, returns owned to both callers, and does not remove that row when the other attempt fails. That ledger is not two live database writes.

### Recovery after storage is cleared

Not implemented, and not claimed.

Today `createPaymentOrder` stores the Razorpay order only in the response. The order id, payment id, and signature then live in `sessionStorage` under `invitesready.captured-payment.v1`. The server has no pending-payment record. After the tab’s storage is cleared, or in another browser, the client cannot name the order, and the server cannot list it.

A safe recovery would add a pending-payment record when the order is created: host, template, order id, amount, currency, coupon note, and an expiry. It would not store a card number, signature, email, or phone. An authenticated host could ask to finish one template. The server would load only that host’s pending rows, fetch the order and its captured payment from Razorpay, check host, template, amount, and coupon, then use the existing purchase upsert. It would not create a second order when a captured payment is found. Publish would still wait for that upsert to return owned. Unpaid rows would expire and be deleted. Paid rows would be deleted once the purchase exists. A client-supplied payment id would not be accepted as proof.

Listing every Razorpay order on the account and filtering notes was rejected. It only sees a recent page of orders, and it reads other hosts’ order notes on the server.

That design needs a new collection and a new route. It was left unimplemented.

### Browsers, devices, and DebugView

Chrome 154.0.8037.98 headless opened `/`, `/browse`, `/login`, `/create/gazal`, and `/i/CfGuuJqf` on the live site at 390×844. Overflow was 0. There were no console errors and no failed document or API responses. Names are visible on the Bloom page. Keyboard entry was not repeated; Phase 8 already typed into login and the Gazal name field.

Safari 26.5.2 is installed. `AllowRemoteAutomation` is unset. Safari was not driven, and the setting was not changed. Manual check: open Safari and visit those five addresses. Look for sideways scrolling, clipped names, console errors, and whether Tab reaches the login and editor fields.

Firefox and Edge are not installed. No WebKit or Firefox engine was run.

No iPhone or Android device was attached. Physical checks remain not tested.

GA4 DebugView was not opened. There is still no authorized property session.

### Commands this pass

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs src/lib/payment-recovery.test.mjs` | Exit 0. 19 passed, 0 failed. |
| `node --experimental-strip-types --test src/application/payment-decision.test.mjs` in `backend` | Exit 0. 9 passed, 0 failed. |
| `npm run lint` | Exit 0. Existing oxlint warnings remain, including a set-state-in-effect warning in `Checkout.tsx`. |
| `npm run build` | Exit 0. JavaScript chunk `index-DnDuFRtw.js` is 1,084.86 kB, with the existing chunk-size warning. CSS 679.28 kB. SEO wrote 43 public URLs. |
| `npm run typecheck` in `backend` | Exit 0. |

## Phase 10 — server-side recovery

Pending payments are stored in the `pendingpayments` collection. A row holds the host id, template id, Razorpay order id, amount in paise, currency, coupon code, status, expiry, and finalization time. It does not hold a card number, CVV, signature, secret, email, or phone.

Indexes: unique sparse `razorpayOrderId`; a unique partial index on host plus template while the status is `opening`, `awaiting-payment`, or `captured`; a TTL index on `expiresAt`. Unpaid attempts expire after 48 hours. A captured attempt has no expiry, so it is not deleted before it is finished. Completed and failed rows expire after 30 days. An `opening` row that never receives an order id expires after 15 minutes.

Statuses move from `opening` to `awaiting-payment` when the order id is saved, to `captured` when Razorpay shows the order paid, then to `completed` when the purchase row exists. `failed` is a mismatch that must not be paid again. `expired` is an unpaid attempt past its deadline.

Order creation writes the pending row before calling Razorpay. If Razorpay fails, the row is marked failed and the client is not given an order. If Razorpay creates an order but the order id cannot be saved, the client is not given that order and is told they have not been charged. A second request for the same host, template, amount, and coupon reuses the open order. A captured attempt returns `action: "recover"` and does not create an order.

`GET /api/payments/pending?templateId=` returns only the signed-in host's attempt for that template: id, template, amount, currency, coupon, and status. `POST /api/payments/recover` loads that host's row, fetches the order and its captured payment from Razorpay, and checks host, template, amount, currency, and coupon. The client does not send a payment id or signature. Finalize then uses the existing purchase upsert. Publish still runs only after that entitlement exists. Another host's attempt id returns 404.

The checkout still keeps `sessionStorage` for the same tab. If that storage is empty and the host is signed in, the server attempt is the source. A captured attempt shows “Finish unlocking” and does not send `begin_checkout`. A reused unpaid order does not send it either. `purchase` is sent after finalization and is deduped by the payment id.

### Local MongoDB concurrency

`mongod` on `127.0.0.1:27018`, database `invites-p10`, was started for this pass and then stopped. It was not the application database.

`INVITES_TEST_MONGO=mongodb://127.0.0.1:27018/invites-p10 node --experimental-strip-types --test src/application/purchase-concurrency.test.mjs`

Two simultaneous purchase upserts for a new host and template both resolved as owned. The collection had one row. A rejected follow-up left that row in place. A second open pending row for the same host and template was rejected with duplicate-key code 11000. A different host saw none of those rows. Exit 0.

### Fresh Chrome session against the test key

An API on port 4012 used the test key, suffix `cTb`, and the local database above. Vite on port 5179 proxied only to that API. `.env` was not edited. Its hash was unchanged. The live ports were not used for the payment. Both temporary processes were stopped.

| Check | Result |
|---|---|
| First `POST /api/create-order` | `action: pay`, `reused: false`, order `order_Tm7kPHhwI9ZWxl` |
| Second create for the same host and template | `action: pay`, `reused: true`, same order id |
| Another account calling recover with that attempt id | HTTP 404 |
| Pending list | Owner saw 1 attempt. The other account saw 0. |
| Before payment | Recover preview was `unpaid` |
| Test card payment, then the purchase response was replaced with HTTP 500 | Same-tab button became “Finish unlocking” |
| New Chrome context, same sign-in, empty `sessionStorage` | Button was “Finish unlocking”. No stored proof. |
| Finish unlocking in that new context | No `create-order` request. `begin_checkout` was not sent. One `purchase` collect hit. The editor showed the invitation is live. |
| Purchases | `["bloom"]` |
| Razorpay | One captured payment, `pay_Tm7kXjXLjntK8V`, amount 49900 |

An earlier card attempt that stopped before the OTP left unpaid order `order_Tm7jdIeQ8mcZU0`. It was not created by Finish unlocking.

GA4 DebugView was not opened. The collect hit above is a browser request.

### Commands this pass

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs src/lib/payment-recovery.test.mjs` | Exit 0. 20 passed, 0 failed. |
| `node --experimental-strip-types --test src/application/payment-decision.test.mjs` in `backend` | Exit 0. 13 passed, 0 failed. |
| `INVITES_TEST_MONGO=mongodb://127.0.0.1:27018/invites-p10 node --experimental-strip-types --test src/application/purchase-concurrency.test.mjs` | Exit 0. The MongoDB race passed. |
| `npm run lint` | Exit 0. Existing oxlint warnings remain, including a set-state-in-effect warning in `Checkout.tsx`. |
| `npm run build` | Exit 0. JavaScript chunk `index-D_cfnH7u.js` is 1,088.43 kB, with the existing chunk-size warning. CSS 679.28 kB. SEO wrote 43 public URLs. |
| `npm run typecheck` in `backend` | Exit 0. |

## E. Release recommendation

**Ready with known limitations.**

A captured test payment was finished from a new Chrome session after `sessionStorage` was empty. The original order was reused, one purchase was stored, and Razorpay shows one captured payment. Two first-time purchase upserts on a local MongoDB left one row.

Safari, Firefox, Edge, physical devices, and GA4 DebugView remain untested. The concurrency test used a disposable local database, not the application database. Do not treat this as full device or analytics verification.
