# Template interior audit — InvitesReady

**Date:** 9 October 2026  
**Browser:** Google Chrome 154.0.8037.98, headless, Chromium. Viewport emulation. Not a physical device.  
**Fixture:** names `ആരവ് നമ്പ്യാർ & प्रिया शर्मा`, venue `The Grand Ballroom of the Lakeside Palace and Convention Centre`, address `12/4, ശാന്തി നഗർ, Marine Drive, Kochi 682001`, message in Malayalam, Hindi, and English with 🎉, date `2026-02-14`, time `18:30`. Hosts, dress, and photos left empty.  
**How:** a disposable local account saved a draft for every template. Chrome opened `/create/:id?invite=` and clicked the template’s own open control inside the invitation. Evidence is in `qa-reports/evidence/device/phase3/`.

Safari is installed and was not driven. Firefox, Edge, Playwright, WebKit, iOS, and Android were not used.

An interior is **passed** only when the open control was clicked and the revealed text was looked at or measured. A closed cover is not a pass.

## Open controls

| Template | Control that was used | 390×844 |
|---|---|---|
| gazal | Open invitation | Opened. Guest page shows both full names, the date, the address, and the message. |
| aurelia | Splash | Opened on the published guest page. Names, date, time, and venue are readable. |
| anna | View invitation | Clicked. Screenshot saved. Horizontal clip sweep passed. Frame-by-frame review of every section was not done. |
| baptism | Open invitation | Fail, then fixed. The blessing line and the invitation line were inline and ran together. They now stack. Recheck gap between the line and the names is 13px. Screenshot: `fix-baptism-390.png`. |
| beach | Bottle, then enter | Fail, then fixed. The date seal put the whole address on one line and clipped it. The seal now shows `2026 · 12/4`. The full address stays on the event details. At 320px the first name also ran 29px past the screen; the name now fits from x=20 to x=300. |
| botanica | Loader, then the call to action | Clicked. Horizontal clip sweep passed. Not reviewed section by section. |
| heavenly | Open the doors, then View invitation | Opened. Names, date, and venue wrap on the hero. Screenshot: `interior-heavenly-390.png`. |
| pull | Pull the rope | Opened. The heading wraps and the names stay clear of the tassel. Rechecked this phase. |
| inland | Tear open the inland letter | Clicked. Horizontal clip sweep passed. |
| hearth | Open the door | Opened. Names and the address wrap under “Welcome to our new home!” Screenshot: `interior-hearth-390.png`. |
| shaadi | Lift the veil | The veil card shows the first word of each name and the full venue. The page after “Enter the celebrations” was not reviewed as its own screen. |
| thiruvizha | Gate is already on screen | The gate shows both names, 14 February 2026, and 6:30 PM. “Enter the thiruvizha” was not followed into the next page, so that page is not passed. |
| peace | Open your gift, then Open the invitation | The gift card shows both names, 14 · 02 · 2026, and the venue. Screenshot: `interior-peace-390.png`. |
| grandoor | Enter the invitation | The click ran. The screenshot is still the approach painting, so the name card was not confirmed by eye. The names and venue were present in the document. |
| grandenvelope | Break the seal | Clicked. Horizontal clip sweep passed. Not reviewed section by section. |
| palace | Open the invitation | Clicked. No React duplicate-key warning and no runtime exception in this load. |
| moonlit | Light the lantern | Clicked. Horizontal clip sweep passed. |
| villa | Open the invitation | Cover name is one line, 223px wide, starting at x=84 inside the 390px cover. The hero wraps. |
| bloom | Break the seal | Clicked. The editor shows the stress title and “Draft saved”. |
| hansa | Break the seal | Clicked. Horizontal clip sweep passed. |
| vivah | Open the doors | Fail, then fixed. Each letter was 64px in one row, so the names left the door. The rows wrap. The recheck shows both names inside the frame. Screenshot: `fix-vivah-390.png`. |

## Other widths

The same drafts were opened at 320×700, 768×1024, and 1280×800. The check was horizontal overflow of stress text that was actually on screen, plus page overflow. It was automated in Chrome.

| Width | Result |
|---|---|
| 320 | Beach first name overflowed by 29px. After the name-size fix, the name sits inside the screen and the page does not scroll sideways. The other 20 templates had no on-screen horizontal clip in this sweep. |
| 768 | No on-screen horizontal clip and no page overflow for the 21 templates. |
| 1280 | No on-screen horizontal clip and no page overflow for the 21 templates. |

This sweep does not prove every line below the fold is inside its ornament. Sections that were not scrolled into view stay unreviewed.

## Fixes in this phase

1. Beach seal no longer prints the full address inside the circle. Narrow screens use a smaller name size so Malayalam does not leave the hero.
2. Vivah door and hero names wrap instead of staying on one letter row. A non-Latin couple no longer collapses to the hashtag `#Weds`.
3. Baptism phone hero stacks the blessing, the invitation line, and the names. They were inline spans, so the lines ran into each other.

Previous fixes rechecked after these edits: Villa cover and hero, Pull heading and names, Bloom in the catalog and in the editor, Palace console, editor title at 375px, catalog at 320px, Gazal guest page.
