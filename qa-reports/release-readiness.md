# Release readiness — InvitesReady

**Date:** 9 October 2026  
**Recommendation:** Ready with known limitations

Chrome 154.0.8037.98 headless, with viewport emulation, is the only browser engine that was driven. Safari is installed on this Mac and was not driven. Firefox and Edge are not installed. No iPhone, iPad, or Android device was used. Playwright was not added to the project. A production build is not evidence of device compatibility.

The live API stayed on port 4010. The live Razorpay key was not used. `.env` was not changed. The completed test-mode payment cases were not run again.

## A. Completed checks

### Invitation interactions that Phase 3 left open

Stress text was the same long couple name, venue, and address used in Phase 3. Chrome opened each draft in the editor.

| Template | What was opened | 320, 390, and 768 | Result |
|---|---|---|---|
| Thiruvizha | “Enter the thiruvizha” | No horizontal page overflow, no broken images, no console errors. The ceremony, both names, the date, and the Tamil lines are on the revealed page. | Pass after the language-bar fix below. Rechecked by eye at 390. |
| Shaadi | “Lift the veil”, then “Enter the celebrations” | No horizontal page overflow, no broken images, no console errors. The revealed arch text contains both names, “weds”, 14 · 02 · 2026, and the full venue. | Pass. The 390 screenshot shows the arch. |
| Grand Door | “Enter the invitation”, then the name card and the RSVP block | No horizontal page overflow, no broken images, no console errors. Both names sit inside the card. The RSVP block shows “Will you be joining us?” with yes and no controls. | Pass at 390 by eye. 320 and 768 were measured, not reviewed frame by frame. |

### RSVP

Disposable Gazal `/i/2QzTe-T-`, local API on port 4010, Chrome 390×844. The guest was “Phase Four Guest”.

| Check | Result |
|---|---|
| Submit from the guest page | The page shows “Jazakallah khair” and the note under Duas & wishes. |
| Persistence | The host greeting list returned that name, the note, and attending true. |
| Same browser replies again | The saved reply token updates the same row. The list still has one greeting, now attending false, note “Updated the same reply.” |
| That token used on a different live invitation | The Gazal note did not change. |
| Another account listing this invitation’s replies | HTTP 404. |
| Reply to a missing code | HTTP 404. |
| Reply to a draft | HTTP 404. |
| Blank name | HTTP 400. |

### Regression

| Check | Result |
|---|---|
| Villa cover | The stress names are one readable line under the frame at 390. |
| Villa hero | The name block is 358×199 and stays inside the 390px screen, so the names wrap. |
| Pull the Curtain | At 390 the heading wraps to two lines and sits above the tassel. The names wrap to the left of the rope. |
| Beach | At 320 both names wrap on the hero. The seal reads Saturday, 14.02, and `2026 · 12/4`, and the seal box sits from x=90 to x=230. |
| Vivah | The open-door name block is 312×413, contains both names, and stays inside the 390px screen. |
| Baptism | The invitation line ends at y=151 and the names start at y=171. The 390 screenshot shows them stacked. |
| Bloom | The API catalog includes bloom. A new draft save returned HTTP 200. |
| Palace | After “Open the invitation”, the console had no duplicate-key warning and no runtime exception. |
| Editor title at 375 | “ആരവ് നമ്പ്യാർ & प्रिया शर्मा — Marriage” is 289×21. The page does not scroll sideways. |
| Catalog at 320 | One column, 296px. Bloom is on the page. The page does not scroll sideways. |
| Gazal `/i/6JS7jMNU` | Opened. Both names, Saturday, February 14, 2026, and the Nikah wording are on the page. |
| Aurelia `/i/EfdiHCRE` | Both names and “A celebration of love” are on the page. |
| Unknown template | HTTP 404. |
| Missing invitation code | HTTP 404. |
| Another account reading a draft | HTTP 404. |
| Publish a paid template with no purchase | HTTP 402, “Pay for this template before publishing.” |
| Save a live invitation | HTTP 200, status stays `live`. |
| Catalog | Frontend registry and API catalog both have the same 21 ids, including bloom. |

### Fixes in this pass

1. Thiruvizha’s language controls were tucked under the leaf garland. The bar now starts below the garland. At 390, English, Tamil, and Both are fully visible, and the first control starts one pixel below the leaves.
2. The Beach footer wave path ended with an incomplete curve, so Chrome logged `Expected number` for the SVG path. The extra pair was removed. A later Beach load logged no console error.

## B. Razorpay test evidence

These cases were completed earlier on a separate API process with the test key `rzp_test_…cTb`. That process has stopped. They were not repeated. The website checkout on port 5173 was not submitted, because it talks to the live-key API. Google Analytics DebugView was not watched.

| Case | Evidence | Result |
|---|---|---|
| Successful payment, Bloom, ₹499 | Order `order_Tlu9ViQlDIQA7y`, payment `pay_Tlu9arIBbfih0Q`. Verify returned HTTP 200. The purchase list recorded Bloom. Guest page `/i/aGdXtK3S` returned the saved names. | Pass |
| Failed payment, Beach | A 2-digit OTP fired `payment.failed` because the OTP must be 4–10 digits. The order stayed unpaid. Verify returned HTTP 400. The invitation stayed a draft. Publish returned HTTP 402. The purchase list stayed empty. | Pass |
| Cancelled checkout, Villa | Close, then “Yes, exit”. The dismiss callback ran. No payment was created. The order stayed unpaid. Publish returned HTTP 402. The purchase list stayed empty. | Pass |
| Wrong signature | HTTP 400. | Pass |
| Correct signature for an order Razorpay had not marked paid | HTTP 400. | Pass |

## C. Outstanding work

- Safari on macOS and iOS, Firefox, and Edge.
- A physical iPhone, iPad, or Android phone, including landscape.
- Safe-area insets, an open on-screen keyboard, and the browser’s own 200% zoom.
- The website checkout submitted against an API that is using the test key.
- GA4 DebugView for `page_view`, `start_design`, `first_edit`, `save_draft`, `payment_cancelled`, `payment_failed`, and `purchase`.
- Grand Door at 320 and 768 was measured for overflow and was not reviewed frame by frame.
- Thiruvizha at 320 was reviewed before the language-bar fix. The fix was rechecked at 390.

## D. Build and test results

| Command | Result |
|---|---|
| `node --experimental-strip-types --test src/lib/funnel-events.test.mjs src/lib/analytics-wiring.test.mjs src/lib/purchase-event-key.test.mjs` | Pass. 10 tests, 0 failed. |
| `npm run lint` | Pass. Exit code 0. Existing oxlint warnings remain. CSS is not linted. |
| `npm run build` (`tsc -b && vite build && node scripts/seo-pages.mjs`) | Pass. Typecheck succeeded. Production build succeeded. |

Chrome checks above are browser-observed. Catalog, draft, publish, greeting, and authorization checks are API checks against `http://127.0.0.1:4010`. The Razorpay rows are carried forward from the earlier test-key process and were not run again.

Not run: Safari, Firefox, Edge, WebKit, physical devices, GA4 DebugView, and a new Razorpay payment.

## E. Known risks

- Backend payment verification passed in test mode. The website checkout form was not driven through to Razorpay while the site pointed at the live key, so the full browser checkout path is still unproven.
- Analytics behavior matches the event plan in local tests: manual `page_view` only, `send_page_view: false`, `start_design` on editor open, `first_edit` on the first change, `save_draft` only after a successful draft save, `payment_cancelled` and `payment_failed` do not emit `purchase`, and `purchase` is emitted only after the purchase is recorded. Dedup keys are unchanged. The allowed parameters do not include names, email, phone, passwords, or tokens. None of this was confirmed inside GA4.
- Only Chrome headless has been used. A layout that depends on Safari, a device font, or a safe area can still fail.
- The production JavaScript bundle is about 1,083 kB before gzip. The build warns about chunk size. That is not a functional failure.

## F. Release recommendation

**Ready with known limitations.**

The invitation interactions that were still open now open and stay readable in Chrome. RSVP submission, persistence, duplicate updates, and the authorization gates behave as intended. The earlier responsive fixes still hold. The test-mode payment cases already passed and were left as recorded. The production typecheck, lint, and build pass.

It is not a claim of full device compatibility. Ship with the outstanding Safari, Firefox, Edge, physical-device, website-checkout, and GA4 DebugView items still open.
