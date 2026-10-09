# UI, UX, and responsive audit — InvitesReady

**Date:** 9 October 2026  
**Mode:** Audit only. No application styles or components were changed.  
**Environment:** Local frontend `http://127.0.0.1:5173`, local API `http://127.0.0.1:4010`.  
**How screens were tested:** Headless Chrome at the requested viewport sizes, plus the in-app browser for interaction context from the same local build. Measurements are in `qa-reports/evidence/metrics.json`. Screenshots are in `qa-reports/evidence/`.

This is not a WCAG conformance claim. Contrast figures below are computed from the hex values in the stylesheets (WCAG relative luminance). They were not produced by an automated auditor such as axe.

---

## 1. Executive summary

The marketing site, catalog, login, and editor already look like one product. The palette is a deep green ink (`#1C3A2A`) on a mist background (`#F4F8F5`), with a mint fill (`#C5E0D2`) for primary buttons. Invitation templates are deliberately different from that chrome; that difference is the product, not a defect.

Responsive behavior is stronger than a typical early product. Across 138 route-and-width checks, **no page produced a document-level horizontal scrollbar**. Cards, the catalog, login, and the studio reflow. The failures are specific: the public wordmark is clipped at 320px and 375px, public navigation disappears on tablet with no menu to replace it, and several text colors fail contrast because old token names now point at the mint fill.

**Visual quality:** High on laptop and on phones at 430px and wider. Uneven at 320–375px.  
**Responsive quality:** Good. Overflow is controlled. A few controls are clipped or hidden without a replacement.  
**UX quality:** The first screen explains the product. The sentence prompt and account tools are understandable. Loading and a few labels are weaker than the visual design.  
**Accessibility:** Focus rings exist on the studio and several templates. Error red, logout text, topic links, and link hover colors fail WCAG 2.2 AA contrast. Some text links are under 24px tall.

**Most significant inconsistencies**

- `--plum`, `--rose`, and `--gold` in `src/index.css` are aliases of the mint button fill, so anything that still uses them as text becomes pale on a pale page.
- Two headers: public `invitesready` versus signed-in `InvitesReady`, with different navigation.
- Breakpoints are scattered (`720`, `759`, `860`, `900`, `960`, `980`, `1024`, `1100`, `1180`, `1240`, `1400`, `1680`) instead of one scale.
- Guests renders nothing while replies are loading. Events can show an empty “create” card in that same moment.

**Top five improvements**

1. Use mint only for fills. Point text, links, and errors at colors that clear 4.5:1.
2. Keep the wordmark intact at 320px and 375px, and give the public header a menu below 960px.
3. Repair the global color tokens so `--plum` / `--rose` / `--gold` are not the button mint.
4. Show a loading state on Guests and Events instead of a blank or a false empty card.
5. Adopt one type and spacing scale for chrome (marketing headlines can stay large). Do not introduce a new CSS framework.

**Release view:** The interface is polished enough to show. It is not ready to call accessible, and it should not ship the clipped header or the low-contrast links as the finished mobile experience.

---

## 2. Page inventory

| Route | What it is | Test status |
|---|---|---|
| `/` | Landing, carousel, prompt, features, FAQ | Visually tested, all 8 widths |
| `/how`, `/faq` | Same landing, scrolled to a section | Measured all 8 widths; `/how` screenshot at 375 |
| `/browse` | Public template catalog | Visually tested 375, 768, 1440; measured all 8 |
| `/wedding` | Topic page and template cards | Visually tested 375 and 1280; measured all 8 |
| `/login` | Log in / sign up | Visually tested 375 and 1280; measured all 8 |
| `/contact`, `/privacy` | Legal/contact | Contact screenshots 375 and 1440; both measured all 8 |
| `/unauthorized` | Signed-out wall | Screenshot 375; measured all 8 |
| `/does-not-exist` | Unmatched route | Measured all 8; blank page (functional bug, already reported) |
| `/admin` | Admin sign-in | Screenshot 375; measured all 8. Console not entered |
| `/i/2IjqHxV0` | Live Gazal guest invite | Screenshots 375 and 1280; measured all 8 |
| `/studio` | Signed-in home | Screenshots 375, 1280, 1440; measured 6 widths |
| `/events`, `/drafts` | Account lists | Events screenshot 375; measured 6 widths |
| `/guests` | Reply list | Screenshots 375 and 1280 captured the loading gap |
| `/settings` | Profile | Measured 6 widths. Populated form was used in the earlier interactive session |
| `/templates` | Signed-in catalog | Measured 6 widths |
| `/create/gazal` | Editor | Screenshots 375 and 1280; measured 6 widths |
| `/create` guest wizard, checkout, `/favorites`, `/purchases` with rows, other template openings | — | Not visually retested in this pass |

There is no dark theme. `:root` sets `color-scheme: light`.

---

## 3. Responsive test matrix

Widths: 320×720, 375×812, 430×932, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080.  
Account routes were measured at 320, 375, 768, 1024, 1280, and 1440.

**Overflow:** PASS on every measured route. `documentElement.scrollWidth` never exceeded the viewport. Decorative carousel layers (`lv-aur`, `lv-slide`) extend past the viewport inside an overflow-hidden stage. They do not create a page scrollbar.

**Layout / type / nav / interaction** below. PASS means the chrome fits, type stays readable, and the main control is on screen. FAIL is a confirmed visual or interaction defect at that size.

| Route | Widths | Layout | Overflow | Type | Navigation | Interaction | Evidence | Finding |
|---|---|---|---|---|---|---|---|---|
| `/` | 320, 375 | FAIL | PASS | PASS | FAIL | PASS | `home-320.png`, `home-375.png`, `ui-home-375.jpg` | Wordmark becomes “invit…” / “invitesrea…”. Center links are hidden. The start prompt is below the film. |
| `/` | 430, 768 | PASS | PASS | PASS | FAIL at 768 | PASS | `home-768.png` | Wordmark fits. Header still has no Templates / How / FAQs and no menu. Carousel and price button fit. |
| `/` | 1024–1920 | PASS | PASS | PASS | PASS | PASS | `home-1440.png`, `home-1280.png` | Center nav appears at 960px+. Headline is 68px. Film is centered. |
| `/browse` | 320, 375 | FAIL | PASS | PASS | FAIL | PASS | `browse-375.png` | Same clipped wordmark. Two-column cards, filters, and Preview/Use buttons fit. |
| `/browse` | 430–1920 | PASS | PASS | PASS | FAIL below 960 | PASS | `browse-768.png`, `browse-1440.png` | Four cards at 1440. Price sits on the card. No page overflow. |
| `/login` | 320–430 | PASS | PASS | PASS | PASS | NOT FULLY CLICKED | `login-375.png` | Wordmark fits because “Log in” is omitted on this route. Form stacks. Primary button is full width. |
| `/login` | 768–1920 | PASS | PASS | PASS | PASS | NOT FULLY CLICKED | `login-1280.png` | Split layout. Marketing panel and form card align. |
| `/wedding` | 320, 375 | FAIL | PASS | PASS | FAIL | PASS | `wedding-375.png` | Clipped wordmark. Cards stack in a readable grid. Related links are pale. |
| `/wedding` | 768–1920 | PASS | PASS | PASS | FAIL below 960 | PASS | `wedding-1280.png` | Large “Wedding invitations” headline. Four cards. Related links fail contrast. |
| `/contact`, `/privacy` | 320, 375 | FAIL | PASS | PASS | FAIL | PASS | `contact-375.png` | Clipped wordmark. Copy column is `min(760px, 100% - 40px)` and stays readable. |
| `/contact`, `/privacy` | 430–1920 | PASS | PASS | PASS | FAIL below 960 | PASS | `contact-1440.png` | Single reading column. |
| `/unauthorized` | 320, 375 | FAIL | PASS | PASS | FAIL | PASS | `unauthorized-375.png` | Clipped wordmark. Message and actions are clear. |
| `/how`, `/faq` | same as `/` | same as `/` | PASS | PASS | same as `/` | PASS | metrics | These routes are the landing page scrolled to a section. |
| `/i/2IjqHxV0` | all 8 | PASS | PASS | PASS | n/a | NOT OPENED | `i-2IjqHxV0-375.png`, `i-2IjqHxV0-1280.png` | Invite is a centered card. Desktop keeps the ceremony palette and does not stretch the card. Opening animation was not replayed in this pass. |
| `/admin` | all 8 | PASS | PASS | PASS | n/a | SSO not completed | `admin-375.png` | Sign-in card fits. Decorative rings are marked as extending; they do not scroll the page. |
| `/does-not-exist` | all 8 | FAIL | PASS | n/a | FAIL | n/a | metrics | Blank document. No layout to assess. |
| `/studio` | 320, 375 | PASS | PASS | PASS | PASS | NOT OPENED | `studio-375.png` | Burger, logo, search, and avatar fit. Headline and two actions stack. Art is cropped by the viewport, not by overflow. |
| `/studio` | 768–1440 | PASS | PASS | PASS | PASS | NOT OPENED | `studio-1280.png`, `studio-1440.png` | Category row fits, including Housewarming, at 1280. |
| `/events`, `/drafts` | 375–1440 | PASS | PASS | PASS | PASS | NOT OPENED | `events-375.png` | Create card fits. This capture did not show the existing live event (load timing; see UX-03). |
| `/guests` | 375, 1280 | FAIL | PASS | PASS | PASS | NOT OPENED | `guests-375.png`, `guests-1280.png` | Title, then a large empty field, then the footer. No spinner. |
| `/settings` | 320–1440 | PASS | PASS | PASS | PASS | Seen earlier | metrics | No horizontal overflow. |
| `/templates` | 320–1440 | PASS | PASS | FAIL at ≥1024 | PASS | NOT OPENED | metrics | Page `h1` grows with the global clamp: 30px at 320, 76.8px at 1280, 80px at 1440. |
| `/create/gazal` | 375 | PASS | PASS | PASS | PASS | NOT OPENED | `create-gazal-375.png` | Bottom tab bar fits. Form is a sheet over the preview. Title truncates to “Imran Hashim & Sa…”. |
| `/create/gazal` | 768–1440 | PASS | PASS | PASS | PASS | NOT OPENED | `create-gazal-1280.png` | Two columns. Preview card matches the form. Long invitation line is clipped inside a single-line field. |

Intermediate widths were not screenshotted one pixel at a time. The public nav switch is a hard cut at 960px. The studio burger appears at 900px. Nothing in the measurements suggests a broken band between 430 and 768 or between 1024 and 1280.

---

## 4. Color and typography audit

### What the product actually uses

Chrome (marketing, catalog, account, editor shell):

| Role | Value | Where |
|---|---|---|
| Text | `#1C3A2A` | `--ink` |
| Muted text | `#5E7368` | `--muted` |
| Page | `#F4F8F5` | `body` / landing / studio |
| Surface | `#FFFFFF` | Cards, inputs |
| Border | `#D7E6DC` | `--line` |
| Primary button fill | `#C5E0D2` | Header pill, Publish, catalog actions |
| Button hover | `#B5D6C4` | Public pill |
| Decorative mint | `#8FB9A0` | Gradients, link hover |
| Focus ring | `#1C3A2A` or template-specific | Studio, several invites |

Computed contrast against `#F4F8F5` or `#FFFFFF`:

| Pair | Ratio | AA for normal text (4.5:1) |
|---|---|---|
| `#1C3A2A` on `#F4F8F5` | 11.61 | Pass |
| `#1C3A2A` on `#C5E0D2` | 8.87 | Pass |
| `#FFFFFF` on `#1C3A2A` | 12.44 | Pass |
| `#5E7368` on `#F4F8F5` | 4.75 | Pass, with little margin |
| `#5E7368` on `#FFFFFF` | 5.09 | Pass |
| `#C5E0D2` on `#F4F8F5` | about 1.3 | Fail |
| `#8FB9A0` on `#F4F8F5` | 2.04 | Fail |
| `#f87171` on `#FFFFFF` | 2.77 | Fail |

Invitation templates (Gazal, Shaadi, Bloom, Villa, and the rest) each keep their own ceremony colors. Those should stay local to the invite. They should not leak into the account chrome.

### Inconsistencies

- **Broken aliases.** In `src/index.css`, `--rose`, `--gold`, and `--plum` all resolve to `#C5E0D2`, and `--berry` / `--plum-dark` resolve to the ink. `.topic-links a { color: var(--plum) }` therefore paints wedding-topic links in the button mint. That is visible on `/wedding`.
- **Hover lightens links into failure.** `.board a:hover` and several catalog hovers use `#8FB9A0`.
- **Error red is a light Tailwind red.** `#f87171` is used for checkout errors (`.co-field small`, `.co-alert`) and for Log out (`.li-logout`). Both sit on white or mist.
- **Two wordmarks.** Public header is lowercase `invitesready`. Studio is `InvitesReady`.
- **No status scale.** Success is mostly the same mint as the primary button. Warning is not defined. Error is the light red above.

There is no chart palette in the signed-in product. Admin charts were not opened.

### Recommended tokens

Keep the brand. Do not replace it. Add real names and stop overloading mint.

| Token | Proposed value | Use |
|---|---|---|
| `color-primary` | `#1C3A2A` | Text, focus, wordmark |
| `color-primary-hover` | `#163024` | Pressed ink, if a filled ink button is needed |
| `color-accent` | `#C5E0D2` | Primary button fill only |
| `color-accent-hover` | `#B5D6C4` | Button hover |
| `color-page` | `#F4F8F5` | Page background |
| `color-surface` | `#FFFFFF` | Cards, inputs |
| `color-text` | `#1C3A2A` | Body and headings |
| `color-text-muted` | `#5E7368` | Secondary copy. Do not lighten it further |
| `color-border` | `#D7E6DC` | Hairlines |
| `color-link` | `#1C3A2A` | Links, with underline |
| `color-error` | `#8F2D2D` | Error text. Confirm the pair is at least 4.5:1 on white before shipping |
| `color-success` | `#1C3A2A` | Positive status text, not the button mint |
| `color-focus` | `#1C3A2A` | 2–3px ring, 2px offset |

`--plum`, `--rose`, and `--gold` should be removed or given their real hues. They must not alias the button fill.

### Type

Chrome font is Geist, loaded from Google Fonts through `useFonts`, with `Segoe UI` then `sans-serif` as fallback. Invitation pages load display faces (Cormorant, Pinyon, Noto Sans Malayalam, Tiro Devanagari, and others) only when that invite opens. That split is right.

Observed chrome sizes:

| Context | Size |
|---|---|
| Landing `h1` below 960px | 40px |
| Landing `h1` at 960px+ | 68px |
| Login form title on a phone | 30px |
| Login marketing `h1` at 1440 | 80px, from the global `clamp(2.6rem, 6vw, 5rem)` |
| Topic and signed-in template `h1` at 1440 | 80px, same global rule |
| Legal `h1` | `clamp(36px, 5vw, 56px)`, `font-weight: 560` (560 is not a valid CSS weight; browsers will snap it) |
| Studio page title | 32px on a phone, 44px from 1024px |
| Body / legal | 16px, line-height 1.6 |
| Eyebrows | ~12px, tracked uppercase |

The global `h1` rule in `index.css` is the leak. Pages that forget a local `h1` size become poster-sized. Headings also use `letter-spacing: -0.04em` everywhere, which is tight for small UI labels.

**Recommended chrome scale** (Geist, existing weights 400 / 500 / 600 / 700):

| Role | Size | Weight | Line height |
|---|---|---|---|
| Display (home, topic hero only) | 40px, 56px from 960px | 600 | 1.05 |
| Page title | 32px | 600 | 1.15 |
| Section title | 22px | 600 | 1.25 |
| Card title | 18px | 600 | 1.3 |
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Caption / meta | 13px | 500 | 1.4 |

Do not put the display size on account pages or forms.

---

## 5. Layout and spacing audit

**What is consistent:** 18px page padding on the public header, 68px header height, pill radius 999px, card radius around 18–28px, mint buttons with 40px height, mist page color.

**What is not:**

- Page side padding jumps between `18px`, `7vw`, `32px`, and `40px` depending on the file (`index.css` `.wrap`, public header, studio).
- Radius values in chrome include 8, 12, 16, 18, 22, and 28 with no shared token.
- `.legal h1` uses `font-weight: 560`.
- The home film is the entire first screen at 320×720, so “Use this design” sits on the bottom edge and the description field is off screen (`home-320.png`). That is a hierarchy choice, not overflow.
- Editor title truncates on a phone (`create-gazal-375.png`). The occasion is still in the heading, so the names are what get cut.
- The invitation-line field on the desktop editor shows “We joyfully invite you to the Nikah of our bel…” inside the control (`create-gazal-1280.png`). A single-line box hides the rest of a sentence the host is editing.
- Studio category labels at 1280 are comfortable. At 1400px and below, `logged-in.css` already tightens their padding. They did not overflow in the 1280 screenshot.
- Guest and event footers sit under a large empty region when the list has not painted (`guests-1280.png`).

**Spacing scale to adopt**, using what the product already prefers: 4, 8, 12, 16, 24, 32, 48, 72. Map the one-off 18px header padding to 16 or 20 and keep it in both headers.

---

## 6. Component consistency audit

| Component | Across routes | Verdict |
|---|---|---|
| Primary button | Mint pill on home, browse, login, studio, editor Publish | Consistent fill and ink text. Labels differ (“See the designs”, “Use”, “Publish & share”). |
| Secondary button | White pill with a hairline, used for “My events”, “Details”, “Desktop” | Consistent. |
| Header | Public vs studio | Two systems. Public has no menu under 960px. Studio has a burger under 900px. |
| Wordmark | Lowercase vs title case | Inconsistent. |
| Inputs | Login, editor, settings, checkout | Shared radius and border. Error color is only defined in checkout and is too light. |
| Cards | Browse and wedding | Same image-plus-title pattern. Browse says “₹499 · Marriage”; wedding puts the price in a badge and the category under the title. Close, not identical. |
| Tabs | Login (Log in / Sign up), editor bottom bar | Different shapes, same mint selected state. Acceptable. |
| Empty states | Drafts and events use a dashed card. Guests uses a sentence, but only after load. Unknown URLs use nothing. | Inconsistent. |
| Loading | Home has a designed “working” panel. Guests renders `null`. Editor shows “Saving…”. | Inconsistent. |
| Toasts | `Notice` on the studio | One component. Not compared on every page in this pass. |
| Modals | Publish dialog was opened in the earlier session | Focus is not moved into the dialog. Not re-shot here. |
| Tables | Guests | Desktop is a 5-column grid. Under 1100px the header is hidden and rows stack (`studio.css`). The stacked state was not captured because the list had not painted. |
| Links | Topic links, footer, “Create an account” | Topic links use the broken `--plum` token. Footer links are muted and underlined by context only. |

Buttons are not using one shared class. Mint pills are reimplemented in `public-header.css`, `landing.css`, `auth.css`, `all-templates.css`, and `editor.css`. They match today because the hex values were copied. They will drift.

---

## 7. UX findings

### UX-01 — The public header hides its navigation and clips its name

On a phone the only header actions are Log in and “See the designs.” Templates, How it works, and FAQs exist in the footer and, from 960px, in the center of the header. Between those widths there is no menu. At 320px and 375px the wordmark is ellipsized so the pill can stay. A first-time visitor can still scroll, but they cannot tell the brand name and they cannot open the information architecture without hunting the footer.

**Change:** Below 960px, drop or icon-collapse “See the designs” (the page already is the designs) and add the same burger pattern the studio uses. Give the wordmark a minimum width so it never ellipsizes.

### UX-02 — The first mobile screen is the film, not the task

At 320×720 and 375×812 the carousel fills the viewport. “Describe your celebration” and the occasion chips sit below it. The product’s own story says a sentence is enough to start, but that sentence is not on the first screen.

**Change:** On narrow widths, put the prompt above the film, or make the film shorter so the prompt and one primary button share the first viewport.

### UX-03 — Account lists do not show that they are loading

`/guests` at 375 and 1280 rendered the title “Replies from every invitation.” and then empty space until the footer (`guests-375.png`, `guests-1280.png`). The code path is `{!ready ? null : …}`. `/events` in the same timed capture showed the dashed “Create a new event” card and not the live invite that exists on this local account. An earlier interactive session, after the data returned, did show that invite and the two replies. A host who lands here mid-load can believe they have no guests.

**Change:** Use the same spinner already used for “Loading replies…” for the whole panel, and do not show the empty card until the request has finished.

### UX-04 — Topic links look disabled

On `/wedding`, “Nikah invitations”, “Hindu wedding invitations”, and “Tamil wedding invitations” are mint-on-mist. They do not look clickable next to the dark headline (`wedding-1280.png`, `.topic-links a`).

**Change:** Ink color plus an underline, using `color-link`.

### UX-05 — Mobile editing hides the invitation

At 375px the Gazal editor is a form sheet. A sliver of the green preview shows under the app bar; the card itself does not (`create-gazal-375.png`). “Done” is present. This pass did not tap it, so whether Done reveals the preview is unverified. A host cannot see the line they are typing.

**Change:** Keep a persistent “View invitation” control that expands the preview, which the stylesheet already supports via `.is-expanded`.

### UX-06 — Long invitation lines disappear inside the field

The desktop details form clips the invitation sentence at the edge of a one-line box (`create-gazal-1280.png`).

**Change:** Use a textarea that grows, at least for the invitation line and the note.

### UX-07 — “Go Premium” and the home feature list promise tools that are not on the screen

“Go Premium” is another path to the template list. The home bento says hosts can nudge late replies. Those are product-copy issues that make the interface feel less finished than it looks. They were confirmed in the previous functional pass and still match the current chrome.

---

## 8. Accessibility findings

Manual and computed. No axe run. Not a conformance certificate.

| ID | Severity | Issue | Evidence | Remediation |
|---|---|---|---|---|
| A11Y-01 | High | Topic links `#C5E0D2` on `#F4F8F5` fail text contrast. | `wedding-1280.png`, `.topic-links a`, token `--plum` | Ink plus underline |
| A11Y-02 | High | Error text and Log out use `#f87171` on white (2.77:1). | `checkout.css`, `logged-in.css` | Darken to at least 4.5:1 and do not use color alone |
| A11Y-03 | Medium | Link hover `#8FB9A0` on the mist page is 2.04:1. | `.board a:hover` | Hover with underline or a darker ink, not a lighter mint |
| A11Y-04 | Medium | “Watch the opening” is 103×18. Desktop header links are about 21px tall. WCAG 2.2 target size minimum is 24×24 CSS pixels, with an inline-text exception that these nav items do not cleanly meet. | metrics at `/` 375 and 1280 | Increase hit padding without changing the visual size much |
| A11Y-05 | Medium | Home `h2` (“Designs that open like a film.”) comes before the `h1`. Login renders two `h1`s. | Accessibility tree in the previous session; still true in the DOM | One `h1`, then sections |
| A11Y-06 | Medium | Field errors are not wired with `aria-invalid` or `aria-describedby`. The publish dialog does not move focus. | Previous interactive pass; dialog not re-shot | Associate errors and move focus into dialogs |
| A11Y-07 | Low | Guests loading state has no status text, so a screen reader gets a heading and silence. | `guests-1280.png` | `aria-busy` and a visible “Loading replies” |
| A11Y-08 | Low | Muted text `#5E7368` on `#F4F8F5` is 4.75:1. It passes AA and will fail if it is lightened or set smaller than 16px on a tinted card. | Computed | Leave this pair alone |

**What did pass visual checks:** Primary mint buttons with ink text (8.87:1). Body ink on mist (11.61:1). Studio `:focus-visible` is a 3px ink ring. Many invite stylesheets honor `prefers-reduced-motion`. Login inputs have visible labels. The editor bottom bar has text labels, not icon-only tabs.

**Not verified:** Full keyboard path through the editor, date popover, account menu, and screen reader announcements. Zoom to 200% was not run. Invite template contrast was not measured one design at a time; those palettes are artwork and need their own pass.

---

## 9. Design system recommendations

Do not add Tailwind, a component library, or a second theme. The app is global CSS plus one file per surface. Keep that.

1. **Replace the aliases in `:root`.** One token file (the top of `index.css` is enough) with the table in section 4. Delete the misleading `--plum` / `--rose` / `--gold` names or give them distinct values that are not the button fill.
2. **One button.** A `.btn` and `.btn-primary` / `.btn-secondary` used by the header, catalog, login, and editor. Same height (40px, 44px on touch), radius, and hover.
3. **One header behavior under 960px.** Burger plus an unclipped wordmark. The studio burger is the pattern to copy, not a new one.
4. **One type ramp** for chrome, with a `.display` class only on marketing heroes. Remove the global `h1 { font-size: clamp(2.6rem, 6vw, 5rem) }` so account pages cannot inherit it.
5. **Breakpoints.** Keep 720 and 960, which the public header and landing already use. Treat 1100 as the studio “single column / stacked table” point. Stop adding 759, 860, and 1680 unless a screenshot shows a real break there.
6. **States.** Document default, hover, focus-visible, active, disabled, and loading on the button and the field. Error text uses `color-error`, not `#f87171`.
7. **Leave invite CSS alone** except where a control (RSVP field, send button) fails contrast or clips the viewport. Those files are the designs.

---

## 10. Prioritized issue register

### UI-01 — Public wordmark is ellipsized at 320px and 375px

| | |
|---|---|
| Category | Responsive |
| Severity | High |
| Where | Public header. `/`, `/browse`, `/wedding`, `/contact`, `/privacy`, `/how`, `/faq`, `/unauthorized` |
| Viewports | 320 and 375. Gone by 430. Login does not clip, because that header omits “Log in”. |
| Steps | Open `/` at 320×720 or 375×812. |
| Expected | The name `invitesready` is fully visible. |
| Actual | “invit…” at 320 (`home-320.png`). “invitesrea…” at 375 (`home-375.png`, `browse-375.png`). Logo box is 57px wide at 320 against a 102px word. |
| Confirmed | Yes, measurement and screenshots. |
| Fix | Do not ellipsize the wordmark. Hide or shorten the trailing pill under 400px. |

### UI-02 — Topic links and several hovers fail contrast

| | |
|---|---|
| Category | Color / accessibility |
| Severity | High |
| Where | `/wedding` and any `.topic-links`. Studio link hover. Checkout errors. Log out. |
| Steps | Open `/wedding` at 1280. Read the related links under the intro. |
| Expected | Link text at least 4.5:1, distinct from body copy, and visibly interactive. |
| Actual | Links use `var(--plum)`, which is `#C5E0D2` on `#F4F8F5`. Hover and error reds are listed in section 4. |
| Evidence | `wedding-1280.png`, `src/index.css` lines 10–22 and 123. |
| Confirmed | Yes. |
| Fix | Retokenize as in section 4. Do not use the button mint as a text color. |

### UI-03 — Public navigation has no small-screen replacement

| | |
|---|---|
| Category | Navigation |
| Severity | High |
| Where | `PublicHeader` |
| Viewports | Everything under 960px, including 768 tablet (`home-768.png`) |
| Expected | Templates, How it works, and FAQs remain reachable from the header. |
| Actual | `.ph-links` is `display: none` until 960px. There is no button that opens them. |
| Confirmed | Yes. |
| Fix | Reuse the studio burger behavior on the public header. |

### UI-04 — Guests (and likely Events) have no loading appearance

| | |
|---|---|
| Category | Feedback |
| Severity | Medium |
| Where | `/guests`, `/events` |
| Viewports | 375 and 1280 screenshots |
| Expected | A spinner or skeleton until replies or events arrive, then the list or a real empty state. |
| Actual | Guests is a blank band (`guests-1280.png`). The list render is skipped while `ready` is false. |
| Confirmed | The blank loading appearance is confirmed. That the live data is missing after load is not claimed; an earlier session showed the rows once loading finished. |
| Fix | Render the existing “Loading replies…” state before `ready`. |

### UI-05 — Global `h1` size leaks into account and topic pages

| | |
|---|---|
| Category | Typography |
| Severity | Medium |
| Where | `/templates` measured 80px at 1440. `/wedding` headline is intentionally large but uses the same unconstrained clamp. Login’s side `h1` is 80px at 1440, which is acceptable only because that panel is a poster. |
| Expected | Account page titles stay near 32–44px, matching studio. |
| Actual | `index.css` sets every `h1` to `clamp(2.6rem, 6vw, 5rem)` unless a page overrides it. |
| Confirmed | Yes, computed style in metrics. |
| Fix | Remove the global size. Put `.display` only on marketing heroes. |

### UI-06 — Mobile editor covers the preview

| | |
|---|---|
| Category | UX |
| Severity | Medium |
| Where | `/create/gazal` at 375 |
| Evidence | `create-gazal-375.png` |
| Expected | The host can see the invitation while editing the line. |
| Actual | The form sheet covers the card. A thin strip of the preview remains. “Done” was not activated in this pass. |
| Confirmed | The covered preview is confirmed. The Done behavior is not. |
| Fix | A visible “View invitation” control that uses the existing expanded state. |

### UI-07 — Invitation line is clipped in the field

| | |
|---|---|
| Category | Forms |
| Severity | Medium |
| Where | Editor details, 1280 |
| Evidence | `create-gazal-1280.png` |
| Expected | The full sentence is visible while editing. |
| Actual | The field ends at “our bel”. |
| Confirmed | Yes. |
| Fix | Textarea for long lines. |

### UI-08 — First viewport on a phone does not include the start prompt

| | |
|---|---|
| Category | UX / responsive |
| Severity | Medium |
| Where | `/` at 320×720 and 375×812 |
| Evidence | `home-320.png`, `home-375.png` |
| Expected | The main action is visible without scrolling. |
| Actual | The film and a partial “Use this design” button fill the screen. |
| Confirmed | Yes. |
| Fix | Reorder or shorten the film under 960px. |

### UI-09 — Two wordmarks and two header systems

| | |
|---|---|
| Category | Brand consistency |
| Severity | Low |
| Where | Public header vs studio header |
| Evidence | `home-1440.png` vs `studio-1280.png` |
| Expected | One name treatment. |
| Actual | `invitesready` vs `InvitesReady`. |
| Confirmed | Yes. |
| Fix | Pick one lockup and use it in both headers. |

### UI-10 — Text-link hit areas are under 24px

| | |
|---|---|
| Category | Accessibility |
| Severity | Low |
| Where | “Watch the opening”, header text links, footer legal links, “Forgot password?” |
| Evidence | metrics `small` arrays |
| Confirmed | Yes, by bounding boxes. |
| Fix | Add vertical padding so the hit target is at least 24px, preferably 40px for primary header actions. |

### UI-11 — Invalid font weight on legal titles

| | |
|---|---|
| Category | Typography |
| Severity | Low |
| Where | `.legal h1` |
| Actual | `font-weight: 560` |
| Confirmed | In CSS. The rendered contact page still looks medium-bold, so the browser is substituting. |
| Fix | Use 600. |

---

## 11. Implementation roadmap

Do this only after approval. No broad visual redesign.

### P0 — Accessibility and mobile header

Shared files first: `src/index.css` tokens, then `public-header.css` and `PublicHeader.tsx`.

- UI-02 / A11Y-01–03: fix tokens and every `color: var(--plum)` / `#f87171` / hover `#8FB9A0` used as text.
- UI-01 and UI-03: header overflow and the missing menu.

These two changes affect every public page. Screenshot `/`, `/browse`, `/wedding`, and `/login` at 320, 375, 768, and 1280 after.

### P1 — Feedback and type scale

- UI-04: loading state in the studio list views (`LoggedInHome.tsx` / `Studio.tsx`).
- UI-05: remove the global `h1` clamp; restyle marketing heroes locally.
- UI-06 and UI-07: editor sheet and long fields (`editor.css`, editor fields).

### P2 — Consistency

- UI-08: home order on small screens (`landing.css` only).
- UI-09: one wordmark.
- UI-10: hit-area padding on text buttons.
- Extract `.btn-primary` once the tokens exist, and point the copied mint buttons at it.

### P3 — Polish

- UI-11 legal weight.
- Document the 720 / 960 / 1100 breakpoints in a short comment on `:root`.
- A later pass on each invitation’s RSVP form contrast. Do not restyle the artwork.

**Dependencies:** Token repair before the shared button, or the button will bake in the wrong hover. Header work before any page-level padding tweaks.

---

## 12. Limitations

- Checkout, the publish dialog, date popovers, the account menu, and the studio burger were not reopened in this visual pass. Burger presence is from the 375 studio screenshot (the control is visible). Its open state was not captured.
- Guest and event **populated** layouts were not re-screenshotted. The 375/1280 guest images are the loading gap. A previous interactive session showed the populated list.
- Invite openings other than Gazal’s cover were not walked. Bloom, Shaadi, Villa, and the rest were seen as catalog art only.
- 768px was screenshotted for home and browse, and measured for the other routes. Not every route has a 768 or 1920 image.
- 200% zoom, forced colors, and a screen reader were not used.
- Production CSS (after `vite build`) was not captured. Sizes are from the dev server, which is the same CSS the build ships.
- Contrast math uses stylesheet hex against the page background. Gradients, photos, and text drawn on invitation art were not measured.
- No pixel-diff tool is installed. This pass is a baseline, not a before/after comparison. Playwright is not in `package.json`.

---

## 13. Release assessment

Visually, InvitesReady already feels like a single product on a laptop and on a 430px-wide phone. The catalog, login, studio home, and desktop editor are aligned, quiet, and on-brand. I would not block a design review on taste.

I would block an accessibility-minded release on three evidenced problems: mint text on a mint page, the light red used for errors and log out, and a public header that both clips the name and hides the navigation below 960px. Those are shared-component fixes, not a redesign.

The invitation templates should stay visually independent. Unifying them with the account chrome would damage the product.

---

## Screenshot index

| File | Viewport | Notes |
|---|---|---|
| `qa-reports/evidence/home-320.png` | 320×720 | Wordmark clipped |
| `qa-reports/evidence/home-375.png` | 375×812 | Wordmark clipped |
| `qa-reports/evidence/home-768.png` | 768×1024 | Fits; center nav still absent |
| `qa-reports/evidence/home-1280.png` | 1280×800 | Desktop film |
| `qa-reports/evidence/home-1440.png` | 1440×900 | Desktop film |
| `qa-reports/evidence/browse-375.png` | 375 | Clipped wordmark, usable cards |
| `qa-reports/evidence/browse-768.png` | 768 | Catalog |
| `qa-reports/evidence/browse-1440.png` | 1440 | Four-up catalog |
| `qa-reports/evidence/login-375.png` | 375 | Form stacks; wordmark fits |
| `qa-reports/evidence/login-1280.png` | 1280 | Split layout |
| `qa-reports/evidence/wedding-375.png` | 375 | Topic |
| `qa-reports/evidence/wedding-1280.png` | 1280 | Pale related links |
| `qa-reports/evidence/contact-375.png` | 375 | Legal column |
| `qa-reports/evidence/contact-1440.png` | 1440 | Legal column |
| `qa-reports/evidence/studio-375.png` | 375 | Burger header |
| `qa-reports/evidence/studio-1280.png` | 1280 | Signed-in home |
| `qa-reports/evidence/studio-1440.png` | 1440 | Signed-in home |
| `qa-reports/evidence/guests-375.png` | 375 | Blank loading |
| `qa-reports/evidence/guests-1280.png` | 1280 | Blank loading |
| `qa-reports/evidence/events-375.png` | 375 | Create card |
| `qa-reports/evidence/create-gazal-375.png` | 375 | Form sheet |
| `qa-reports/evidence/create-gazal-1280.png` | 1280 | Editor columns |
| `qa-reports/evidence/i-2IjqHxV0-375.png` | 375 | Guest cover |
| `qa-reports/evidence/i-2IjqHxV0-1280.png` | 1280 | Guest cover |
| `qa-reports/evidence/metrics.json` | all measured sizes | Overflow, type size, clip flags |
