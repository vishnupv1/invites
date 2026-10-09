# Device compatibility matrix — InvitesReady

**Date:** 9 October 2026  
**App:** local `http://127.0.0.1:5173`  
**Engine:** Chrome headless  (Chromium), viewport emulation. Not a physical phone, tablet, or a second browser.  
**Playwright / Cypress:** not installed. Firefox and Edge are not on this Mac. Safari is installed, but it was not driven. Playwright was considered as a development-only dependency and was not added: this pass stayed on the installed Chrome binary, and a WebKit automation run would not stand in for Safari on iOS.

Safari is installed. Firefox and Edge are not. Safari, Firefox, Edge, iOS, and Android were not run. A CSS `zoom: 2` check is not the same as the browser’s 200% zoom control.

## Templates

21 designs from `src/data/templates.ts`: gazal, aurelia, anna, baptism, vivah, beach, botanica, heavenly, pull, inland, hearth, shaadi, thiruvizha, peace, grandoor, grandenvelope, palace, moonlit, villa, bloom, hansa.

`/open/:id` renders the same invitation component used for a published guest view, with that template’s sample text. The editor embeds the same components inside a scaled frame. A saved draft and a live `/i/:code` page were not created for every template in this pass.

## What was measured

208 page loads. For each: document overflow, clipped text that uses `overflow: hidden`, broken images, and console exceptions.

| Surface | Viewports | Result |
|---|---|---|
| `/open/:id` for all 21 templates | 320×568, 390×844, 768×1024, 1280×720, 1920×1080 | No document overflow. No broken images. No console exceptions. |
| `/create/:id` for all 21 templates | 375×667, 1280×720 | No document overflow. Editor title was clipped at 375 before the fix. |
| `/open/gazal`, `/open/shaadi`, `/` | All 13 requested sizes, plus phone and tablet landscape (568×320, 844×390, 932×430, 1024×600) | No document overflow. |
| `/browse`, `/login`, `/wedding`, `/template/moonlit`, `/does-not-exist` | 320×568, 768×1024, 1366×768, 2560×1440 | No document overflow. Catalog names were ellipsized at 320 before the fix. |
| `/`, `/open/gazal`, `/create/gazal` | CSS zoom 2 at 1280×720, 390×844, and 375×667 | No document overflow. |

Not run: safe-area insets, an open on-screen keyboard, 200% browser-chrome zoom, portrait/landscape on a real device, and a published invite for every template. Checkout was not submitted against the live key. A later pass covered success, failure, and cancel with the test key on a separate API process; see `device-compatibility-summary.md`.

## Matrix

Pass means no document-level horizontal overflow in Chrome emulation. It does not mean every browser or a physical device passed.

| Route group | Chrome emulation | Safari | Firefox | Edge | Physical device |
|---|---|---|---|---|---|
| Invitation open pages | Pass after the checks above | Untested | Untested | Untested | Untested |
| Editors | Pass for overflow. Title clip fixed and rechecked at 375 | Untested | Untested | Untested | Untested |
| Catalog, login, wedding, missing page | Pass for overflow. Narrow catalog names fixed and rechecked at 320 and 375 | Untested | Untested | Untested | Untested |
| Guest `/i/:code` for every template | Untested this pass | Untested | Untested | Untested | Untested |
| Checkout | Layout only, Chrome 390×844. The pay button was not submitted. | Untested | Untested | Untested | Untested |

## Phase 2 — 9 October 2026

**Browser:** Google Chrome 154.0.8037.98, headless, Chromium engine, viewport emulation. Not a physical device.  
**Fixture:** names `ആരവ് നമ്പ്യാർ & प्रिया शर्मा`, venue `The Grand Ballroom of the Lakeside Palace and Convention Centre`, address `12/4, ശാന്തി നഗർ, Marine Drive, Kochi 682001`, message in Malayalam, Hindi, and English ending with 🎉, date `2026-02-14`, time `18:30`. Hosts, dress, and photos left empty.  
**How:** disposable local account, `POST /api/invites/draft` for all 21 templates, then Chrome opened `/create/:id?invite=` at 390×844. Evidence: `qa-reports/evidence/device/stress-matrix.json`, `art-measure.json`, and the `art-*.png` / `fix-*.png` screenshots.

| Check | Result |
|---|---|
| Homepage, catalog, wedding, login, missing page | Already measured in the first pass. Missing page rechecked at 390: “We couldn’t find that page.” |
| Draft save, all 21 templates | Pass after Bloom was added to the API catalog. Bloom had returned 404 “Unknown template.” |
| Editor title at 375 with the stress names | Pass. Full title is in the header. The page does not scroll sideways. |
| Catalog at 320 | Pass. One column (`296px`). No page overflow. |
| Gazal guest `/i/PgbrXaux` | Pass in Chrome at 390. Opened invitation shows both full names, the long address, the mixed-language message, and Saturday, February 14, 2026. The editor cover matches the guest cover. |
| Aurelia guest `/i/:code` | Not published in this pass. Draft save passed. |
| Paid guest `/i/:code` | Blocked. Publishing needs a purchase, and the Razorpay key is live. |
| Checkout | Pass for layout only. Bloom checkout at 390 shows the design, the stress names, ₹499, and the details form. Payment was not submitted. Screenshot: `checkout-bloom-390.png`. |
| Safari, Firefox, Edge, WebKit | Not tested. |
| Physical iPhone, iPad, Android, keyboard, safe area, native 200% zoom | Not tested. |
