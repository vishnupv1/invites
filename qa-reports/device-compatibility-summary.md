# Device compatibility summary — InvitesReady

**Date:** 9 October 2026

## Coverage

| Item | Count |
|---|---|
| Templates discovered | 21 |
| Templates opened in Chrome | 21 |
| Chrome page loads measured | 208 |
| Document overflow failures | 0 |
| Broken-image failures | 0 |
| Console exceptions | 0 |
| Confirmed layout defects | 2, both fixed and rechecked |
| Open defects | 0 in the combinations that were measured |

Routes measured: `/open/:id` for every template, `/create/:id` for every template, `/`, `/browse`, `/login`, `/wedding`, `/template/moonlit`, `/does-not-exist`. Gazal and Shaadi also ran through the full viewport list, including landscape sizes.

## How it was tested

Automated Chrome headless emulation only. Safari is on this Mac and was not driven. Firefox and Edge are not installed. No iPhone, iPad, or Android device was used. Playwright was not added.

CSS zoom 2 was applied to the homepage, `/open/gazal`, and `/create/gazal`. The browser’s own 200% zoom, safe-area insets, and an open keyboard were not tested.

## Fixes

1. Phone editor title wraps onto its own row so a couple’s name is not ellipsized.
2. The catalog becomes one column below 420px so design names and prices are not forced into a 120px line.

Invitation artwork palettes were not changed. Payment behavior was not changed.

## Still required on a real device

- Safari on macOS and iOS, Chrome on Android, and Firefox or Edge on desktop.
- One published `/i/:code` link per template family, read on a phone in portrait and landscape.
- The editor with a long name, a long venue, and Malayalam or Hindi text, with the keyboard open.
- Browser zoom at 200% using the browser control, not CSS zoom.
- The Bloom checkout form was opened in Chrome at 390×844 during the first pass and was not submitted. A later pass covered test-mode payment on a separate API process. The live Razorpay key was not changed. See the test-mode payment section below.

## Phase 2 addition

Chrome 154.0.8037.98 headless only. Safari is installed and was not driven. Firefox and Edge are not installed. Playwright was not added. No physical device was used.

Stress text (long unequal names, long venue and address, Malayalam, Hindi, emoji, empty optional fields, date 14 February 2026 at 6:30 PM) was saved for all 21 templates. Gazal was published and opened at `/i/PgbrXaux`. Paid guest links were not published. Aurelia’s guest link was not published.

New defects found and fixed: Villa name clipping, Pull opening-line clipping, Bloom missing from the API catalog, Palace duplicate React keys. The two earlier responsive fixes still hold at 375 and 320.

Artwork interiors of sealed templates (Beach, Heavenly, Peace, and others that stay on a cover until tapped) were not all opened with this fixture. Those are not marked passed.

## Phase 3 addition

Chrome 154.0.8037.98 headless again. Safari is still installed and was not driven. Firefox, Edge, Playwright, WebKit, and physical devices were not used. Details are in `template-interior-audit.md` and `published-guest-view-matrix.md`.

Previous fixes were opened again and still hold: Villa names, Pull heading and names, Bloom draft save, Palace console (no duplicate-key warning), the editor title at 375px, the catalog at 320px, and a Gazal guest page.

Interiors were opened with each template’s own control. Beach, Baptism, and Vivah had readable-text failures and were fixed and rechecked. Heavenly, Peace, and Hearth were opened and reviewed. Thiruvizha’s next page and Grand Door’s name card were not confirmed by eye.

Gazal (`/i/6JS7jMNU`) and Aurelia (`/i/EfdiHCRE`) were published from disposable drafts. Paid guest links stay blocked because publish returns 402 without a purchase. An unknown template, a missing code, and a cross-account draft read all return 404. A live invite stays live when saved again.

## Test-mode payment

The site on port 5173 and the API on port 4010 were left on the live Razorpay key. A second API process on port 4012 was started with the test key (`rzp_test_…cTb`) and the test secret supplied as process environment. `.env` was not edited. No live charge was started.

| Case | Result |
|---|---|
| Successful card payment | Razorpay test mode showed Payment Successful for ₹499. Order `order_Tlu9ViQlDIQA7y`, payment `pay_Tlu9arIBbfih0Q`. `POST /api/verify-payment` returned 200. `POST /api/purchases` recorded Bloom. The guest page `/i/aGdXtK3S` returned the saved names. |
| Signature for an unpaid order | HTTP 400. A valid signature is not enough when Razorpay has not marked the order paid. |
| Wrong signature | HTTP 400. |
| Failed payment | A 2-digit OTP produced the checkout `payment.failed` callback: incorrect OTP, length must be 4–10 digits. The order stayed unpaid (`amount_paid` 0). Verify returned 400. The Beach draft stayed a draft and publish returned 402. The purchase list stayed empty. |
| Cancelled checkout | Close, then “Yes, exit”. The checkout `ondismiss` callback ran. No payment was created. The order stayed `created` with 0 attempts. The Villa draft publish returned 402. The purchase list stayed empty. |

The React checkout on the website was not submitted, because that page talks to the live-key API. The callbacks above are the ones that page maps to `payment_failed`, `payment_cancelled`, and the verify-then-purchase success path. Google Analytics DebugView was not watched.

## Phase 4 addition

Chrome 154.0.8037.98 headless again. Safari is installed and was not driven. Firefox and Edge are not installed. No physical device was used. Playwright was not added to the project. Details and the release recommendation are in `release-readiness.md`.

Thiruvizha’s “Enter the thiruvizha” page, Shaadi’s “Enter the celebrations” arch, and Grand Door’s name card were opened and reviewed. A disposable Gazal RSVP was submitted and stored. The earlier layout, catalog, authorization, and live-save checks were run again.

Two defects were fixed and rechecked: the Thiruvizha language controls sat under the leaf garland, and the Beach footer wave had a broken SVG path that logged a console error. Palace still produced no duplicate-key warning after the invitation was opened.
