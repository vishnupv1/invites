# Responsive defects — InvitesReady

**Date:** 9 October 2026  
**Environment:** Chrome headless, viewport emulation, local app. Screenshots for the editor recheck are in `qa-reports/evidence/device/`.

## RD-01 — Editor title hides a normal couple name on a phone

| | |
|---|---|
| Severity | High |
| Template / route | Every template, `/create/:id` |
| Browser / viewport | Chrome emulation, 375×667. The header rule applies below 860px. |
| Steps | Open `/create/gazal` at 375px wide. |
| Expected | The invitation title, including both names, can be read. |
| Actual | The title sat in one row with Undo, Save, and Publish, with `text-overflow: ellipsis`. “Anjali & Rohan” was cut to “Anjali & Roha…”. |
| Cause | `.ed-top` was a fixed 60px row. `.ed-brand` was allowed to shrink to zero beside fixed buttons. |
| Fix | Below 860px the actions stay on the first row and the title wraps on the next row. The guest notice and the canvas start lower so they are not covered. |
| Recheck | At 375px the Gazal title “Imran Hashim & Safa Rahman — Marriage” is fully visible, 311×43, and the page does not scroll sideways. Screenshot: `qa-reports/evidence/device/editor-gazal-375.png`. |
| Regression test | Rechecked in Chrome. No Playwright suite was added. |

## RD-02 — Catalog names and prices are cut off on a very narrow screen

| | |
|---|---|
| Severity | Medium |
| Template / route | Catalog cards, `/browse`. First seen on Moonlit Jharokha. |
| Browser / viewport | Chrome emulation, 320×568. |
| Steps | Open `/browse` at 320px. |
| Expected | The design name and the price line can be read. |
| Actual | Two columns left about 120px for the name. “Moonlit Jharokha” and “₹599 · Housewarming” were ellipsized. |
| Cause | Below 980px the grid is two columns, and the name and price line use `white-space: nowrap` with ellipsis. |
| Fix | Below 420px the grid is one column, and those lines may wrap. |
| Recheck | At 320 and 375, visible names and price lines no longer report a clip. The price line is about 274px wide at 320. |
| Regression test | Rechecked in Chrome. |

## Checked and not filed

- Document horizontal overflow across 208 loads: none.
- Grand Door “Yes, I’ll be there”: the label span fits inside the button (118px in a 148px button). The decorative shine is wider and is clipped by `overflow: hidden` on purpose.
- CSS zoom 2 on the homepage, Gazal open page, and Gazal editor: no page overflow. This is not a browser 200% zoom test.

## RD-03 — Villa cover and hero clip a long couple name

| | |
|---|---|
| Severity | High |
| Template / route | Villa, `/create/villa?invite=` |
| Browser / viewport | Chrome 154 headless, 390×844, mobile emulation |
| Fixture | `ആരവ് നമ്പ്യാർ & प्रिया शर्मा` |
| Steps | Save that name on a Villa draft and open the editor preview. |
| Expected | Both names stay inside the green cover and inside the hero. |
| Actual | `.vs-names` was `white-space: nowrap` and extended 98px past its clipping frame. The cover line used `letter-spacing: 0.32em` and ran to the edges. |
| Cause | The cover and hero are sized for a short Latin name. |
| Fix | The hero may wrap. The cover uses `0.12em` tracking, side padding, and `overflow-wrap: anywhere`. The card aspect ratio is unchanged. |
| Recheck | The cover name is one line, 223px wide, starting at x=84 inside a 390px cover. The hero’s `white-space` is `normal` and its clip measurement is 0. |
| Regression | Chrome measurement in this pass. Screenshot: `qa-reports/evidence/device/fix-villa-names.png`. |

## RD-04 — Pull the Curtain cuts the opening line and crowds the rope

| | |
|---|---|
| Severity | Medium |
| Template / route | Pull, `/create/pull?invite=` |
| Browser / viewport | Chrome 154 headless, 390×844 |
| Fixture | Same stress names |
| Steps | Open the curtain screen with the stress names. |
| Expected | “TONIGHT, THE CURTAIN RISES ON” and both names are readable and clear of the tassel. |
| Actual | The kicker was clipped at the sides. The names wrapped into the rope. |
| Cause | The intro was a flex row with 20px padding, and the kicker’s 5px tracking did not wrap inside that width. |
| Fix | The intro is inset 72px. The kicker and script are constrained to that width and may wrap. Tracking on the kicker is `0.22em`. |
| Recheck | Kicker box is 246px and wraps to two lines. Names are fully visible and sit clear of the tassel. Screenshot: `qa-reports/evidence/device/fix-pull-names.png`. |
| Regression | Chrome screenshot and box measurement in this pass. |

## RD-05 — Bloom could not be saved

| | |
|---|---|
| Severity | High |
| Template / route | Bloom Letter, `POST /api/invites/draft` |
| Steps | Save a Bloom draft against the local API. |
| Expected | The draft is stored. |
| Actual | `404 Unknown template.` The site lists Bloom; `catalog-seed.json` did not. |
| Cause | The API catalog is seeded from that file and had 20 templates. |
| Fix | Bloom was added to the seed with the same price (₹499), occasion, and sample used on the site. |
| Recheck | `GET /api/templates` returns 21 ids, including bloom. A Bloom draft returned 200. |
| Regression | Local API call in this pass. No artwork CSS was changed for Bloom. |

## RD-06 — Palace logs duplicate React keys

| | |
|---|---|
| Severity | Low |
| Template / route | Palace, editor preview |
| Browser | Chrome 154, console |
| Steps | Open a Palace draft in the editor. |
| Actual | React warned that glints and petals shared keys such as `1.07` because the key was a sum of two numbers. |
| Fix | Keys are `glint-${index}` and `petal-${index}`. |
| Recheck | Not re-run in the browser after the change. The warning was captured before the edit. |
