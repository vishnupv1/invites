# Invitation template visual audit — InvitesReady

**Date:** 9 October 2026  
**Method:** Chrome headless opened `/open/:id` for every template at 320, 390, 768, 1280, and 1920, and `/create/:id` at 375 and 1280. Gazal and Shaadi were also opened at every requested viewport, including landscape. This is sample content, not a long-name, emoji, or missing-image stress pass for each design.

Each template is its own component (`GazalInvite`, `ShaadiInvite`, and the rest). `InviteView`, `OpenInvite`, the editor, and the guest page all pick that same component. They do not share one canvas size. Fixed-format openings keep their own aspect ratio and scale inside the editor frame.

## Shared result

No template produced a page-level horizontal scrollbar at the sizes above. No invitation image was reported broken. No console exception was captured during those loads. That does not prove every line of decorative text stays inside its frame at every size. The automatic clip check only flags elements that themselves use `overflow: hidden`.

A signed-out editor shows the sample names. Those names were readable in the Gazal header after the header fix. Long custom text, non-Latin names, and emoji were not typed into all 21 editors.

## Per template

| Template | Open page | Editor | Notes |
|---|---|---|---|
| gazal | Pass, all requested sizes plus landscape | Pass at 375 and 1280 after the title fix | Sample couple name is fully visible at 375. CSS zoom 2 did not add page overflow. |
| aurelia | Pass at the five core sizes | Pass at 375 and 1280 for overflow | Not opened by eye at every width. |
| anna | Pass | Pass for overflow | |
| baptism | Pass | Pass for overflow | |
| vivah | Pass | Pass for overflow | |
| beach | Pass | Pass for overflow | |
| botanica | Pass | Pass for overflow | |
| heavenly | Pass | Pass for overflow | |
| pull | Pass | Pass for overflow | |
| inland | Pass | Pass for overflow | |
| hearth | Pass | Pass for overflow | |
| shaadi | Pass, all requested sizes plus landscape | Pass at 375 and 1280 for overflow | |
| thiruvizha | Pass | Pass for overflow | |
| peace | Pass | Pass for overflow | |
| grandoor | Pass at the five core sizes | Overflow pass. RSVP label measured inside the preview. | The “Yes, I’ll be there” label’s own box fits the button. A shine layer still paints wider than the button and is clipped on purpose. |
| grandenvelope | Pass | Pass for overflow | |
| palace | Pass | Pass for overflow | |
| moonlit | Pass. Template page also opened at 320, 768, 1366, and 2560. | Pass for overflow | Catalog card name was ellipsized at 320 before the one-column fix. |
| villa | Pass | Pass for overflow | |
| bloom | Pass | Pass for overflow | |
| hansa | Pass | Pass for overflow | |

## Preview versus published

`/open/:id` and the guest invitation use the same component and the sample or saved fields. The editor shows that component inside a phone or desktop frame, so the artwork is scaled rather than restretched. This pass did not publish a new invite for each template and compare it with the editor, so preview-versus-live is confirmed by the shared component, not by 21 live links.

## Phase 2 — stress text in Chrome 154

Fixture and route are recorded in `device-compatibility-matrix.md`. This was Chrome emulation at 390×844, not a physical device. “Cover” means the closed opening screen. Interiors of templates that stay closed until a tap were not all opened, so they are not marked passed.

| Template | Draft | Cover or opened art | Guest `/i/:code` |
|---|---|---|---|
| gazal | Saved | Opened guest page. Names wrap in the arch. Message, address, and date are readable. Seal initials and the short cover line are the template’s own shortening. | Pass, code `PgbrXaux`. Matches the editor cover. |
| aurelia | Saved | Editor still on “Opening your invitation…” when the shot was taken. | Not published. |
| anna | Saved | Name nodes found, clip measurement 0. Interior not reviewed frame by frame. | Blocked. Paid. |
| baptism | Saved | Cover only. | Blocked. Paid. |
| vivah | Saved | Cover only. | Blocked. Paid. |
| beach | Saved | Bottle cover only. Interior not opened. | Blocked. Paid. |
| botanica | Saved | Cover only. | Blocked. Paid. |
| heavenly | Saved | Door cover only. Interior not opened. | Blocked. Paid. |
| pull | Saved | Fail, then fixed. Kicker and names are readable and clear of the tassel. | Blocked. Paid. |
| inland | Saved | Name text present. Clip measurement 0. | Blocked. Paid. |
| hearth | Saved | Cover only. | Blocked. Paid. |
| shaadi | Saved | Cover only. | Blocked. Paid. |
| thiruvizha | Saved | Names found, clip 0. | Blocked. Paid. |
| peace | Saved | Gift cover only. Interior not opened. | Blocked. Paid. |
| grandoor | Saved | Cover only in this pass. | Blocked. Paid. |
| grandenvelope | Saved | Names found, clip 0. | Blocked. Paid. |
| palace | Saved | Seal `ആ & प` sits in the medallion. Interior not fully opened. Duplicate React keys fixed; console not rechecked. | Blocked. Paid. |
| moonlit | Saved | Lantern and later sample lines visible. Name clip measurement 0 on the phone layout. | Blocked. Paid. |
| villa | Saved | Fail, then fixed. Cover name measures 223×1 line inside the 390px cover. | Blocked. Paid. |
| bloom | Saved after the catalog fix | Cover names wrap onto two lines and stay readable. | Blocked. Paid. Checkout layout opened, not paid. |
| hansa | Saved | Cover names wrap onto two lines and stay readable. | Blocked. Paid. |

Gazal is the only template compared as editor, saved draft, and published guest with this fixture. The other twenty have a saved draft reopened in the editor. Their published pages were not created.

## Not claimed

- Every glyph stays inside ornamental frames.
- Slow or failed web fonts.
- A keyboard covering the bottom of the editor.
- Artwork at 200% browser zoom. Only CSS zoom 2 was applied, on Gazal and the homepage.
