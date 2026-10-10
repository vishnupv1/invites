# Device compatibility summary — InvitesReady

**Date:** 10 October 2026

## Phase 10

Chrome 154 headless, on an isolated test-key site, completed a Bloom test payment and then finished it from a second browser context with an empty `sessionStorage`. That context showed “Finish unlocking”, sent no second checkout order, and published the invitation. Safari remote automation is still off. Firefox and Edge are still not installed. No phone was attached.

## Phase 9

Chrome 154.0.8037.98 headless again, on the live site at 390×844. `/`, `/browse`, `/login`, `/create/gazal`, and `/i/CfGuuJqf` had no horizontal overflow and no console errors. Keyboard entry was not repeated.

Safari 26.5.2 is installed and `AllowRemoteAutomation` is unset, so Safari was not driven. Firefox and Edge are not installed. No phone was attached. The physical checklist in the section below is still not tested.

## Phase 8

Chrome 154.0.8037.98 headless. Safari 26.5.2 is installed and `AllowRemoteAutomation` is unset, so Safari was not driven. Firefox and Edge are not installed. No phone was attached. Playwright was not added to the project.

On the live site at 390×844, `/`, `/browse`, `/login`, `/create/gazal`, and `/i/CfGuuJqf` had no horizontal overflow and no console errors. Login accepted typing and Tab moved from email to password. The Gazal name field accepted typing. The Bloom seal on `/i/CfGuuJqf` was not opened again.

The recovery payments ran on an isolated site at port 5179. After Finish unlocking, Bloom `/i/ncstYSVY` and Villa `/i/Vop_ck1B` opened at 390×844 with overflow 0 and no console errors. Those processes were stopped. Details are in `release-readiness.md`.

## This pass

Chrome 154.0.8037.98 headless only. Safari 26.5.2 is installed. A WebDriver session was refused because Allow Remote Automation is off, so Safari was not driven. Firefox and Edge are not installed. No physical phone or tablet was attached. Playwright was not added to the project, and the WebKit and Firefox engines were not downloaded.

| Check | Viewport | Result |
|---|---|---|
| Home, including the menu button | 390 and 1280 | No horizontal overflow, no broken images, no console errors |
| Catalog `/browse` | 320 | One column, 296px. Bloom Letter is listed |
| Wedding, login, missing page | 390 | Pass |
| Open Villa, Pull, Beach, Vivah, Baptism, Palace, Thiruvizha, Bloom | 390 | Pass for overflow, images, and console |
| Gazal `/i/6JS7jMNU` and Aurelia `/i/EfdiHCRE` | 390 | Names and invitation wording are on the page |
| Gazal editor title with the long couple name | 375 | Title is 289×21. The page does not scroll sideways |

Beach was opened from the bottle and logged no SVG path error. Pull’s opening line wraps above the tassel. Thiruvizha shows English, Tamil, and Both. Villa, Vivah, and Baptism used their sample names in this pass; the Phase 4 stress-name measurements were not repeated.

CSS zoom, safe-area insets, an open keyboard, and the browser’s own 200% zoom were not tested.

## Website checkout

The live site on port 5173 still proxies to the live-key API on port 4010. Checkout was not submitted there.

A separate site on port 5179 proxied only to a test-key API on port 4012. Chrome at 390×844 opened Razorpay from the real checkout form. The test key suffix was `cTb`. Cancel, a failed OTP, and a successful ₹499 Bloom payment were completed. Details are in `release-readiness.md`. Those processes were stopped. `.env` was not changed.

## Still required on a real device

Not tested. Desktop viewport emulation is not a physical device.

On an actual iPhone and an actual Android phone:

- Home, catalog, login, the editor, and Bloom `/i/CfGuuJqf`.
- Portrait and landscape.
- The browser’s own zoom at 200%.
- Safe-area padding around the notch and home indicator, including the Thiruvizha language controls, the publish button, and the checkout pay button.
- The virtual keyboard opening and closing, with the focused field still visible above it.
- Touch-target size and spacing.
- Long couple names and a long venue address.
- Checkout scrolling and payment-button visibility.
- RSVP usability.
- A network interruption during Finish unlocking, only on a test payment.

## Phase 7

Chrome 154.0.8037.98 again. Safari remote automation is still off. Firefox and Edge are still not installed. No phone was attached.

The new checkout recovery state was opened on `/template/bloom` at 1280px. With no stored payment the button says “Pay ₹499 securely.” With a local proof for bloom it says “Finish unlocking.” That button was not pressed.

A read-only pass at 390 found no horizontal overflow and no console errors on the Villa, Pull, Beach, Vivah, Baptism, Thiruvizha, Palace, Shaadi, Grand Door, and Bloom covers, or on Gazal `/i/6JS7jMNU`, Aurelia `/i/EfdiHCRE`, and Bloom `/i/CfGuuJqf`. The catalog at 320px is still one 296px column. The Gazal editor title at 375px is still 289×21. Tapped interiors were not opened again.

## Phase 6

No invitation source changed after Phase 5, so Villa, Pull, Beach, Vivah, Baptism, Thiruvizha, Shaadi, Grand Door, Palace, the editor title, the catalog, Gazal, and Aurelia were not opened again.

The Bloom invitation from order `order_TlvKB9tuUUdBEc` is `/i/CfGuuJqf`. Chrome 154.0.8037.98 headless opened it at 320, 390, 768, and 1280. Each width had no horizontal overflow, no broken images, and no console errors. The page shows the saved names Diya & Aryan and a reply section. No RSVP was submitted. Safari, Firefox, Edge, and physical devices remain untested.

## Carried forward

Phases 2–4 used the same Chrome version and the same stress names. Those passes fixed Villa and Pull clipping, added Bloom to the catalog, removed Palace duplicate keys, and fixed Beach, Baptism, Vivah, the Thiruvizha language bar, and the Beach footer path. The test-mode orders `order_Tlu9ViQlDIQA7y` and `pay_Tlu9arIBbfih0Q` remain the earlier successful payment. They were not run again.
