# Analytics event plan — InvitesReady

**Date:** 9 October 2026  
**Platform:** Google Analytics 4, measurement ID `G-NNF07Q6XYV`, loaded by `src/lib/analytics.ts`.  
**This pass:** Added `save_draft`, `payment_cancelled`, `payment_failed`, and `first_edit`. Did not add a new tag, a consent banner, or server-side analytics. Events were not watched in the GA4 interface.

## 1. What already ships

`initialize()` injects `gtag.js` once. `config` sets `send_page_view: false`. Internal traffic (`?team=1`) adds `traffic_type: internal`.

`trackOnce` skips a repeat of the same event name and key for the life of the page. A refresh starts over.

| Event | When it fires | Parameters | Deduped? |
|---|---|---|---|
| `page_view` | Route metadata effect. A repeat of the same path, query, and hash is skipped while that address is current. Leaving and coming back sends another view. | `page_path`, `page_location`, `page_title`, optional `page_type` (`guest` on `/i/`) | Consecutive duplicate only |
| `template_preview` | Preview modal, open page, template page, browse preview | `template_id`, `template_name` | Once per template per page load |
| `start_design` | Editor mounts for a real template. Meaning unchanged: opening the editor, not the first keystroke. | `template_id`, `template_name` | Once per template per page load |
| `first_edit` | First field change, undo, or redo in the editor, or the first typed name, date, venue, or message in the guest wizard | `template_id` | Once per template per page load |
| `save_draft` | After `POST /api/invites/draft` or a draft `PUT /api/invites/record/:id` returns. Not on a failed request, a device-only save, or an update whose status is `live`. | `template_id` | Once per invite id per page load |
| `sign_up` | Email: after `signUp` resolves. Google: only when the API returns `created: true`. An existing Google account sends `login` even if the signup tab was open. | `method` | No |
| `login` | Same, after a successful login | `method` | No |
| `begin_checkout` | A new checkout form is submitted and valid, before Razorpay. Finishing a payment that was already captured does not send it again. | `currency`, `value`, `items[]` with `item_id`, `item_name`, `price` | No |
| `purchase` | After `onPurchased` resolves, which calls `POST /api/purchases`. Cancel, Razorpay failure, and a rejected purchase do not fire it. | `currency`, `value`, `template_id`, `template_name`, `items`, `transaction_id` when Razorpay returned a payment id, optional `coupon` | Once per page load. Paid key is `paid:<payment id>`. Zero-price key is `zero:<template id>:<coupon>`. |
| `payment_cancelled` | First Razorpay dismiss callback for that checkout attempt | `template_id`, `value`, `currency` | First callback wins. A later `payment.failed` on the same attempt is ignored. A new attempt can send the event again. |
| `payment_failed` | First Razorpay `payment.failed` callback for that checkout attempt | `template_id`, `value`, `currency`, optional `error_code` | Same first-callback rule. `error_code` is Razorpay `reason` or `code` only when it is a short token. The bank description is shown in the form and is not sent. |
| `publish` | After a successful publish | `template_id`, `template_name` | No |
| `share_whatsapp` | WhatsApp share button | optional `template_name` | No |
| `rsvp_submit` | Guest reply accepted | `response` (`yes` or `no`), optional template id and name | No |
| `guest_cta_click` | Guest-page prompt to the marketing site | optional `template_name` | No |

Names, emails, invitation text, phone numbers, and tokens are not parameters. Checkout still sends the shopper’s email to Razorpay as payment prefill. That is not an analytics parameter.

## 2. Change made in this pass

| Change | Why |
|---|---|
| Checkout no longer sends `sign_up` when it creates a passwordless session | That session is not a completed registration. It was inflating signup counts. Real signup still fires from `Auth.tsx` and `GuestAuthDialog.tsx`. |
| `purchase` now includes `template_id` | The items array already had `item_id`. The top-level id makes the event usable without parsing items. |
| Google `sign_up` follows `created`, not the tab | `POST /api/auth/google` returns `created: true` only when a host row is inserted. Login, the guest dialog, and the create-guest dialog send `login` for an existing Google account. |
| `purchase` is sent through `trackOnce` | A second submit in the same page load does not send another `purchase` for the same payment id, or for the same template and coupon when the price is zero. |
| `save_draft`, `payment_cancelled`, `payment_failed`, `first_edit` | These were the missing funnel events. `start_design` still means the editor opened. `first_edit` is the first change, so historical `start_design` counts stay comparable. |

Not verified inside GA4. Verification would be: open the site with `?team=1`, complete a sandbox purchase, and confirm one `purchase` with that `transaction_id` in DebugView.

## 3. Privacy

The privacy policy already says Google Analytics may set cookies and receive the IP address and page address. There is no consent banner and no Consent Mode. The new events use that same tag and send a template id, an amount, a currency, or a short payment code. They do not add a new identifier, so this pass did not add a banner. Do not add email, phone, or invitation text until someone decides whether a banner is required for the countries you advertise in.

Do not send: email, name, phone, invitation wording, passwords, session tokens, or full guest lists.

`coupon` on `purchase` is a code, not a person. Keep it only if the code is not unique per customer.

## 4. Status, kept separate

DebugView was not opened. There is no GA4 export in the repository. “Tested locally” means the Node tests below, not a browser session in GA4.

| Event | Implementation | Local test | GA4 DebugView |
|---|---|---|---|
| `page_view` | Implemented. Automatic page views stay off. | Pass. Same address once; a return visit counts again. | Not verified |
| `template_preview` | Implemented on preview modal, browse preview, template page, and open page. | Pass. Second call for the same template is skipped. | Not verified |
| `start_design` | Implemented when the editor opens. Not redefined. | Pass. Second call for the same template is skipped. | Not verified |
| `first_edit` | Implemented on the first field change, undo, or redo, and on the first typed wizard field. | Pass. Second call is skipped. | Not verified |
| `save_draft` | Implemented after a successful draft response. | Pass. Empty id, live status, and a second save of the same invite send nothing further. | Not verified |
| `begin_checkout` | Implemented after the checkout form is valid, before Razorpay. | Pass for the parameter names. A second attempt is allowed to send it again. | Not verified |
| `payment_cancelled` | Implemented on the first dismiss callback. | Pass. Does not send `purchase`. | Not verified |
| `payment_failed` | Implemented on the first failure callback. | Pass. Short `error_code` only. Does not send `purchase`. | Not verified |
| `purchase` | Implemented only after `onPurchased` resolves. | Pass. Same payment id is sent once. A rejected record sends nothing. | Not verified |
| `publish` | Implemented after a successful publish call. | Pass for the parameter names. Not deduped. | Not verified |
| `sign_up` | Implemented after email signup, or Google only when `created` is true. | Pass for `method`. Checkout does not call it. | Not verified |
| `login` | Implemented after a successful login. | Pass for `method`. | Not verified |

The local parameter check allows only the field names in the tables above. It rejects keys such as email, phone, name, password, and token. It does not read the text inside `page_title`. `template_name` and `item_name` are the design name. The `/i/` route title passed to `page_view` is “Guest invitation | InvitesReady”, not the hosts’ names.

A signed-in editor can save the sample invitation to the server before the person types. That save can emit `save_draft` without `first_edit`. Use `first_edit` when the question is whether they changed anything.

## Phase 8 — browser collect only

GA4 DebugView was not opened. There is no authorized property session in this environment. A collect request is not proof that DebugView received the event.

During the Villa lost-response recovery on the isolated test site, with `?team=1`, Chrome sent one `begin_checkout` before Razorpay and one `purchase` after Finish unlocking. The recovery click did not send a second `begin_checkout`. The Bloom recovery run did not keep its collect log. `payment_failed`, `payment_cancelled`, `publish`, and `rsvp_submit` were not watched in DebugView in this pass. The hits that were observed did not include a card number, signature, email, or phone in the event name. Parameter bodies were not exported.

## Phase 10

DebugView was not opened. In the fresh Chrome context that finished a captured test payment, the only collect event observed was one `purchase`. `begin_checkout` was not sent for that Finish unlocking click. The payment id is the dedupe key, so a repeat of the same finalization does not send a second `purchase` during that page load. No card number, signature, email, or phone was part of the event name. This is a browser request, not a DebugView record.

## Phase 9

DebugView was not opened. The overlapping purchase replay was two API calls, not a browser session, so it produced no `begin_checkout` or `purchase` hit to inspect. The DebugView checklist in section 7 is still the manual procedure, including one extra expectation: Finish unlocking must not send a second `begin_checkout`, and `purchase` must appear only after the purchase request succeeds.

## 5. Still not implemented

| Event | Trigger | Parameters | Notes |
|---|---|---|---|
| `select_occasion` | Homepage chip or topic filter | `occasion` (`wedding`, `birthday`, `baby`, `housewarming`) | Fire once per click, not on the default wedding fallback. |
| `search` | Catalog search submitted | `search_term` truncated to 40 characters | Do not send the homepage invitation sentence. It often contains names. |
| `view_item_list` | Catalog results rendered | `item_list_name` (`browse` or occasion) | Skip until `template_preview` is trusted. |

## 6. Duplicate prevention

| Event | Rule |
|---|---|
| `page_view` | The current path, query, and hash. A later return sends another view. That is a navigation, not a React re-render. |
| `template_preview`, `start_design`, `first_edit` | `trackOnce` by template id for this page load. |
| `save_draft` | `trackOnce` by invite id. Later autosaves of that invite do not send it again until a refresh. |
| `payment_cancelled`, `payment_failed` | The first Razorpay callback for that attempt claims the outcome. A second callback does not send another event and cannot replace the first. |
| `purchase` (paid) | `trackOnce` key `paid:<razorpay_payment_id>`. A refresh can send it again if the shopper pays again. GA4 can also dedupe on `transaction_id`. |
| `purchase` (coupon, value 0) | `trackOnce` key `zero:<template id>:<coupon>` for this page load. There is still no server purchase id on the event, so a refresh can count again. |
| `sign_up` | Email fires only after `signUp` resolves. Google fires only when `created` is true. A passwordless checkout session does not fire it. |

## 7. DebugView checklist

Use the Razorpay **test** key and the success and failure cards from Razorpay’s current test-card list. Do not use a live key or a real card. Open the site with `?team=1`, then in GA4 choose Admin, DebugView, and this browser. None of these steps were run, including in Phase 9. After a captured payment, Finish unlocking must not send another `begin_checkout`.

| Step | Action | Expect | Must not appear |
|---|---|---|---|
| 1 | Open `/`, then `/` again without leaving | One `page_view`. `page_path` `/`. No automatic second view from the tag config. | A second `page_view` from staying put |
| 2 | Open `/browse`, then return to `/` | A new `page_view` for each navigation | |
| 3 | Open `/i/` plus any invitation code | `page_view` with `page_type` `guest` and title “Guest invitation \| InvitesReady” | Host names, email, phone |
| 4 | Open a template preview, then open that same preview again | One `template_preview` with `template_id` and `template_name` | |
| 5 | Open `/create/gazal` | One `start_design` for `gazal` before typing | `first_edit` before a change |
| 6 | Change one field, then change it again | One `first_edit` with `template_id` | Invitation text |
| 7 | Signed out, edit until the label says the copy is on this device | No `save_draft` | |
| 8 | Signed in, wait until “Draft saved”, then edit again | One `save_draft` with `template_id` | A second `save_draft` for that invite |
| 9 | Publish a free design successfully | One `publish` with `template_id` and `template_name` | `purchase` |
| 10 | Create an account with a test email | One `sign_up` with `method` `email` | |
| 11 | Log in with that account | One `login` with `method` `email` | A second `sign_up` |
| 12 | Submit checkout with a new email and do not finish payment | `begin_checkout` with `currency` INR, `value`, and `items` | `sign_up` |
| 13 | Close the Razorpay test modal | One `payment_cancelled` with `template_id`, `value`, `currency` | `purchase` |
| 14 | Submit again and use a Razorpay test failure card | One `payment_failed`. `error_code` only if it is a short token | `purchase`, bank text, email, phone |
| 15 | Pay with a Razorpay test success card | One `purchase` after the purchase request succeeds. Paid events include `transaction_id`, `template_id`, `value`, `currency` INR | A `purchase` before that request returns |
| 16 | Repeat the same success handler in that page | No second `purchase` for that payment id | |

If the purchase request fails after a test payment succeeds, expect neither `payment_failed` nor `purchase`. `payment_failed` is only the Razorpay failure callback.

## 8. Local tests

`node --experimental-strip-types --test src/lib/analytics-wiring.test.mjs src/lib/funnel-events.test.mjs src/lib/purchase-event-key.test.mjs` passed on 9 October 2026: 1 wiring test, 7 funnel tests, 2 purchase-key tests. `npx tsc -b --noEmit` passed. DebugView was not opened.

## 8.1 Browser dataLayer check

Checked on the local app at `http://127.0.0.1:5173` by reading `dataLayer`. This is not GA4 DebugView. The configured Razorpay key is a live key, so the payment steps were not run.

| Check | Result |
|---|---|
| `?team=1` | `traffic_type` is `internal`. Config has `send_page_view: false`. |
| Home, browse, Gazal template, editor, guest link, back home | One `page_view` per navigation. Guest view has `page_type` `guest` and the generic guest title. |
| Gazal template page | One `template_preview` for `gazal`. |
| Signed-out editor | One `start_design`. Two name edits produced one `first_edit`. Label became “Saved on this device.” No `save_draft`. |
| Signed-in editor | The sample save sent one `save_draft` for `gazal` before `first_edit`. A later edit did not send a second `save_draft`. No `purchase`. |

Earlier funnel cases:

| Test | Result |
|---|---|
| Successful draft save, once per invite | Pass |
| Failed save and local-only save emit nothing | Pass |
| Live invitation update is not `save_draft` | Pass |
| Dismiss records `payment_cancelled` and not `purchase` | Pass |
| Failure records `payment_failed` with `error_code`, and a rejected purchase records nothing | Pass |
| Bank text is dropped from `error_code` | Pass |
| A second callback is ignored | Pass |

## 9. First 28-day baseline

No GA4 export, CSV, or analytics data file is in this repository. `qa-reports/evidence/` is not present. Do not fill these reports with estimated sessions or rates.

Pull the property `G-NNF07Q6XYV` for 28 completed days, and the previous 28 days only as a comparison after noting which events did not exist yet. Exclude `traffic_type` internal. In Explore, use session source / medium, device category, landing page, and new versus returning.

| Report | Numerator | Denominator |
|---|---|---|
| Marketing engagement | Engaged sessions | Sessions whose landing `page_view` does not have `page_type` `guest` |
| Preview | Sessions with `template_preview` | Those marketing sessions |
| Editor opened | Sessions with `start_design` | Sessions with `template_preview` |
| Edited | Sessions with `first_edit` | Sessions with `start_design` |
| Draft stored | Sessions with `save_draft` | Sessions with `start_design` |
| Checkout started | Sessions with `begin_checkout` | Sessions with `start_design` on a paid template |
| Purchase | Sessions with `purchase` | Sessions with `begin_checkout` |
| Cancelled | Sessions with `payment_cancelled` | Sessions with `begin_checkout` |
| Failed payment | Sessions with `payment_failed` | Sessions with `begin_checkout` |
| Account | `sign_up` and `login` counts | Show beside checkout. Do not treat `sign_up` as a purchase. |

`save_draft` can occur on the guest wizard before `start_design`, because the wizard saves typed fields before step 3. Do not assume every draft has an earlier `start_design` in that same session. A signed-in editor can also save the sample before `first_edit`.

`sign_up` from before the checkout fix includes passwordless checkout sessions. Do not compare that history with the current definition without a note. `first_edit`, `save_draft`, `payment_cancelled`, and `payment_failed` have no history from before this implementation.

## 10. What not to do

- Do not send the homepage sentence to analytics. It contains names.
- Do not count a guest RSVP page as a failed marketing visit.
- Do not add a second purchase event on the client “thank you” state.
- Do not turn automatic page views back on. They would double `page_view`.
