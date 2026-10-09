# Real-user testing report — InvitesReady

**Date:** 9 October 2026  
**Environment:** Local only. Frontend `http://127.0.0.1:5173` (Vite, already running). API `http://127.0.0.1:4010` (already running).  
**Method:** Browser interaction as a signed-out visitor, then as a newly created local test account (`qa.realuser.20261009@example.com`). API checks used the local server and recorded status codes and error text only. No production traffic, no completed payment, no Google sign-in, no admin credentials.  
**Build checks:** `tsc -b --noEmit` passed. `npm run lint` (oxlint) passed with warnings only. The repository has no automated test suite.

Screenshots from this session:

- `qa-reports/evidence/home-narrow.png` — landing page at a very narrow width (wordmark clipped).
- `qa-reports/evidence/studio-desktop.png` — signed-in studio home.

---

## 1. Executive summary

InvitesReady is a digital invitation product: pick a design, personalise it, publish a link, and collect guest replies. The first-time path is understandable, and the free-template journey works end to end on this local stack. A host can sign up, edit Gazal, publish, open the guest link, and see the reply on the Guests page. Validation on login and signup is clear. Protected pages redirect to a useful sign-in screen. Paid templates show a paywall in the editor.

Quality is not release-ready. Two confirmed issues change data or access:

- **Changing an RSVP creates a second reply.** The host’s headcount became “2 attending” for one person who tapped “Change my reply.”
- **Accounts created without a password can be taken over** by anyone who knows the email. `POST /api/session` issues a new session and invalidates the previous one. Password accounts are rejected.

A third issue is confirmed in server code and blocked in the editor UI, and was **not executed**: publishing an invite does not check that the template was purchased. The editor shows “Pay ₹499 and publish” for Shaadi. The API function that marks an invite live does not consult purchases.

**Counts from this pass**

| | |
|---|---|
| Features / areas examined | 22 |
| User journeys executed | 14 |
| Confirmed bugs | 11 |
| Suspected issues (not executed) | 2 |
| UX / accessibility findings | 9 |
| Critical (P0) | 0 |

**Release view for the tested scope:** do not ship until RSVP updates replace the previous reply, and passwordless session minting cannot seize an existing account. Confirm the paywall on the server before real Razorpay charges. Google sign-in, live payments, email/WhatsApp notifications, and the admin console were not completed.

---

## 2. Application feature inventory

| Feature | Entry point | Expected behavior | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Marketing home | `/` | Explain the product, show designs, start from a sentence | None | Medium | Tested — pass with content bugs |
| Design carousel | `/` templates region | Cycle designs, open editor or preview | Cover images | Medium | Tested — pass |
| Occasion prompt | `/` “Describe your celebration” | Match designs to the sentence | Client-only matching | Low | Tested — birthday labels are wrong |
| Template catalog (public) | `/browse` | Filter free/paid, preview, start a design | API templates + local catalog | High | Tested — pass |
| Template catalog (account) | `/templates` | Search, category, price, sort, favourites | Session | High | Tested — search and empty state pass |
| Topic / SEO pages | `/wedding`, `/birthday`, `/how`, `/faq` | Land on the matching home section or topic | Static copy | Low | Spot-checked routes exist; not every topic opened |
| Sign up / log in | `/login` | Validate, create account, reject bad credentials | API auth | High | Tested — pass, except password reset |
| Google sign-in | `/login` | OAuth | Google | High | Blocked — not completed |
| Password reset | “Forgot password?” | Recover access | Email | High | Tested — explicitly unavailable |
| Studio home | `/studio` | Greeting, shortcuts, trending designs | Session | Medium | Tested — pass |
| Editor | `/create/:id` | Edit sample copy, autosave, undo, preview | API drafts | High | Tested on Gazal and Shaadi |
| Publish free invite | Editor → Publish | Live link, share panel | API publish | High | Tested — pass (Gazal) |
| Paywall | Paid editor → Publish | Require payment before publish | Razorpay | High | UI confirmed; payment not completed; server check suspected missing |
| Guest invitation | `/i/:code` | Open animation, details, RSVP | Public API | High | Tested — pass, then RSVP bug |
| RSVP / wishes | Guest page form | One reply per guest, visible to host | Greetings API | High | Tested — fail (duplicates) |
| My events | `/events` | List live invites and counts | Session | High | Tested — pass, counts reflect duplicate RSVPs |
| Drafts | `/drafts` | Unpublished designs | Session | Medium | Tested — empty-state copy is good; Shaadi draft appeared in the account menu |
| Guests | `/guests` | Search and filter replies | Session | High | Tested — search works; no nudge action |
| Purchases | `/purchases` | Owned templates | Session + Razorpay | High | Empty state seen; no purchase made |
| Favourites | `/favorites` | Saved designs | Session / local | Low | Menu entry seen; save-while-signed-out not finished |
| Settings | `/settings` | Name, phone, notification toggles, language | Session | Medium | Name save persists; toggles do not drive delivery |
| Account menu / logout | Header “Your account” | Events, drafts, settings, log out | Session | High | Tested — pass |
| Protected routes | `/studio`, `/events`, `/guests`, `/settings`, `/templates` | Sign-in wall | Session | High | Tested — pass |
| Unknown URL | `/does-not-exist` | Not-found page | Router | Medium | Tested — fail (blank page) |
| Legal / contact | `/privacy`, `/terms`, `/refunds`, `/contact` | Readable policy and a contact path | None | Low | Contact tested; policies linked |
| Admin console | `/admin` | Team-only summary | Admin session | High | Login wall seen; console not entered |
| Media upload | Editor photos / music | Accept image or audio under 4.5 MB | API `/api/media` | Medium | Auth rejection checked; UI upload not exercised |
| Coupons | Checkout | Reject unknown codes | API | Medium | Invalid code returns a clear error |

---

## 3. User journey results

| Journey | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| First impression | Open `/` | Purpose and a primary action are obvious | Headline, design film, “Create my invitations,” and “See the designs” are clear. Wordmark clips under ~390px | Pass, with responsive defect |
| Empty celebration prompt | Submit the home field empty | Ask for a description, or say a sample will be used | Silently uses the first sample wedding sentence and shows three designs after a short animation | Pass as a demo, confusing if the user wanted validation |
| Birthday chip | Tap Birthday | Birthday designs | Inland Letter is Birthday. Sunset Shore and Peace are labeled Wedding | Fail |
| Login validation | Submit empty, then a bad email, then an unknown account | Field errors, then a safe API error | “Enter a valid email address.” Unknown account: “No account for that email. Create one to continue.” Values kept | Pass |
| Forgot password | Tap Forgot password? | Reset flow | “Password reset isn’t available yet.” | Fail |
| Sign up | Short password, missing name, missing terms, then valid data | Inline errors, then account created | Errors match the fields. Account created and a session is stored. Document title stays “Log in” | Pass, with title bug |
| Show password | Toggle the eye control | Password becomes visible and the button renames | Works. Button becomes “Hide password” | Pass |
| Studio after signup | Go to dashboard | Personalised home | “Ready to celebrate, QA?” and working shortcuts | Pass |
| Free publish | Edit Gazal name to “QA Bride,” publish | Live link shows the new name | Link `/i/2IjqHxV0` shows “QA & Safa.” Share panel offers WhatsApp, copy, and QR | Pass |
| Guest RSVP | Open the link, submit empty, then a named reply | Name required; one reply stored | Empty submit shows “Please enter your name.” A valid reply appears on the invite and under Guests | Pass |
| Change RSVP | Tap “Change my reply” and send again | Previous reply replaced | A second “QA Guest” row is stored. Events reads “2 attending · 0 waiting” | Fail |
| Paid publish UI | Open Shaadi and choose Publish | Payment required | Dialog: “Pay and publish” and “Pay ₹499 and publish.” Payment not completed | Pass (UI only) |
| Settings | Clear the name, then save “QA Host,” refresh | Reject blank; keep a real name | Toast “Enter your full name.” After a real save, refresh still shows “QA Host” | Pass |
| Logout and locked pages | Log out, open `/studio` | Session cleared; sign-in wall | Home loads, token gone. `/studio` becomes `/unauthorized` with “This page is for your account” and a login link back to `/studio` | Pass |
| Unknown route | Open `/does-not-exist` | A not-found page | Blank document titled “InvitesReady” | Fail |
| Missing invite | Open `/i/not-a-real-code` | “Not found” | “This invitation link is incomplete.” | Fail |
| Template search | Search `GAZAL`, then `zzz-no-such` | Case-insensitive hit; empty state | 1 template, then “No templates match” and “Clear filters” | Pass |
| Free filter | `/browse` → Free | Only free designs | Aurelia and Gazal | Pass |
| Guest search | Search `zzz` on Guests | No rows, honest count | “No replies yet.” and “Showing 0 of 1 replies” | Pass |
| Anniversary menu | Open Anniversary in the signed-in nav | Designs, or no nav item | “No designs in this category yet.” | Fail |
| Admin as a normal user | Open `/admin` | No console data | Separate login form. SSO says it is not set up. Console not entered | Pass (access), incomplete (SSO / 2FA) |
| Contact | Open `/contact` | A way to reach support | `hello@invitesready.com` mailto link. No form | Pass |

---

## 4. Detailed bug register

### BUG-01 — Changing a reply creates a second RSVP

| | |
|---|---|
| Severity | **P1 — High** |
| Category | Data integrity |
| Route | Guest invite `/i/:code`; host `/guests` and `/events` |
| Preconditions | A published invite. One guest reply already sent. |
| Steps | 1. Open the live invite. 2. Submit a reply with a name and a wish. 3. Tap “Change my reply.” 4. Submit again with the same name and a new wish. 5. Open Guests and My events. |
| Expected | The earlier reply is updated. Headcount stays at one attending guest. |
| Actual | Both replies are listed. Guests showed two “QA Guest” rows (7:17 PM and 7:18 PM). My events showed “2 attending · 0 waiting.” |
| Reproducibility | Confirmed, once, on the local Gazal invite. |
| Evidence | Guest list text captured in the browser. The public greeting API always inserts a new row. |
| Console / network | `POST /api/invites/:slug/greetings` succeeds for each submit. No error. |
| Root cause | **Confirmed in code and in the UI.** `GazalInvite` “Change my reply” only clears the local “done” state. `addGreeting` always `GreetingModel.create`s. There is no guest identity, so a refresh also allows another reply. |
| Fix | Store one reply per browser (or a guest token) and update it. Show the host a single current answer, and keep history only if the product wants an audit trail that is not the headcount. |
| Regression | Publish a free invite, reply, change the reply, assert the guest list length stays 1 and the note is the latest text. |

### BUG-02 — A passwordless account can be taken over by email

| | |
|---|---|
| Severity | **P1 — High** |
| Category | Authorization |
| Route | `POST /api/session` |
| Preconditions | Local API. An account created through guest checkout (`ensureSession` / `openSession`) with no password. |
| Steps | 1. Call `POST /api/session` with that email and any name. 2. Call it again with the same email. 3. Call `GET /api/session` with the first token, then the second. |
| Expected | Only the person who already holds the session can refresh it. A second caller is refused. |
| Actual | Both calls return 200 and a new token. The first token then gets 401 “That session is no longer valid.” The second token is signed in, and the stored name becomes the second caller’s name. The same call against the password test account returns 401 “Log in to use that email.” |
| Reproducibility | Confirmed on the local API with a throwaway `@example.com` address. Tokens are not recorded here. |
| Evidence | Status codes only. |
| Root cause | **Confirmed.** `openSession` rotates `tokenHash` and returns the new token whenever the email has no `passwordHash`. The editor and checkout call this for guests. |
| Fix | Do not mint or rotate a session from an email alone. Use a one-time code, or keep the existing token and require the password / Google flow to claim the account. |
| Regression | Create a passwordless host, call `POST /api/session` twice, assert the first token still works or the second call is rejected. Assert a password account still returns 401. |

### BUG-03 — Server publish does not check that a paid template was bought

| | |
|---|---|
| Severity | **P1 — High** (suspected at runtime) |
| Category | Payments / authorization |
| Route | `POST /api/invites`, `POST /api/invites/record/:id/publish` |
| Preconditions | A signed-in host who has not purchased the template. |
| Steps | Not executed. Creating a live paid invite would publish it. The editor UI was used instead. |
| Expected | The API refuses to mark a paid template live until a verified payment or a zero-price coupon exists. |
| Actual | **Not observed through a successful unpaid publish.** The Shaadi editor correctly shows “Pay ₹499 and publish.” In code, `assertCanUse` only checks that the template id exists. `publishInvite` and `createInvite` call it and do not look at purchases. `purchaseTemplate` itself does require payment when the price is above zero. |
| Reproducibility | Suspected. Root cause in `backend/src/application/services.ts` is confirmed by reading. Runtime bypass was not run. |
| Fix | In `assertCanUse`, require `template.free`, an existing purchase, or a verified zero balance before `status` becomes `live`. Add a test that a paid draft publish returns 402. |
| Regression | Authenticated request to publish Shaadi with no purchase returns 402. Free Gazal still publishes. |

### BUG-04 — Unknown URLs are a blank page

| | |
|---|---|
| Severity | **P2 — Medium** |
| Category | Navigation |
| Route | Any unmatched path, e.g. `/does-not-exist` |
| Preconditions | None |
| Steps | Open `/does-not-exist`. |
| Expected | A not-found page with a way home. |
| Actual | Empty `#root`. Title is “InvitesReady.” No heading, no link. |
| Reproducibility | Confirmed. |
| Root cause | **Confirmed.** `App.tsx` has no catch-all route. |
| Fix | Add a `path="*"` route with the same tone as the unauthorized page. |
| Regression | Visit a nonsense path and assert a heading and a home link. |

### BUG-05 — Notification settings report success but do not send anything

| | |
|---|---|
| Severity | **P2 — Medium** |
| Category | Settings / misleading success |
| Route | `/settings` |
| Preconditions | Signed in. |
| Steps | Open Settings. Leave “Email me when a guest replies” and “Daily WhatsApp summary” on (they default on). Save. |
| Expected | Those channels are stored on the account and a reply produces an email or WhatsApp message, or the controls are marked as not available yet. |
| Actual | Save shows “Settings saved.” The name is stored on the account. Phone, toggles, and language are written only to `localStorage` key `invitesready.settings.v1`. Nothing in the app reads those toggles to send mail or WhatsApp. |
| Reproducibility | Confirmed in the UI and in `AccountHub`. Delivery was not integration-tested because there is no sender. |
| Root cause | **Confirmed.** |
| Fix | Either wire the toggles to the API or label them “Coming soon” and stop defaulting them on. |
| Regression | Saving settings does not toast success for a channel that has no backend. |

### BUG-06 — A missing invite says the link is incomplete

| | |
|---|---|
| Severity | **P3 — Low** |
| Category | Error copy |
| Route | `/i/:code` |
| Preconditions | None |
| Steps | Open `/i/not-a-real-code`. |
| Expected | “We couldn’t find that invitation.” |
| Actual | After “Opening the invitation…”, the heading is “This invitation link is incomplete.” The API itself returns 404 “Invitation not found.” |
| Reproducibility | Confirmed. |
| Root cause | **Confirmed.** `InvitePage` uses one message for a bad legacy code and for a failed fetch. |
| Fix | If the request 404s, say the invitation was not found. Reserve “incomplete” for a code that cannot be parsed. |
| Regression | Unknown slug shows not-found copy. A live slug still opens. |

### BUG-07 — Password reset is a dead end

| | |
|---|---|
| Severity | **P3 — Low** (high impact later, once real users forget passwords) |
| Category | Account recovery |
| Route | `/login` |
| Preconditions | Login mode. |
| Steps | Tap “Forgot password?” |
| Expected | A reset email flow, or no control until it exists. |
| Actual | “Password reset isn’t available yet.” |
| Reproducibility | Confirmed. |
| Root cause | **Confirmed.** The button only sets that notice. |
| Fix | Ship reset, or remove the control until it works. |
| Regression | The control either starts a reset or is absent. |

### BUG-08 — Sign-up tab keeps the login document title

| | |
|---|---|
| Severity | **P3 — Low** |
| Category | Metadata |
| Route | `/login` |
| Preconditions | None |
| Steps | Open `/login`. Switch to Sign up. |
| Expected | Title becomes “Sign up.” |
| Actual | Title stays “Log in \| InvitesReady” while the form says “Create your account.” |
| Reproducibility | Confirmed. |
| Root cause | **Suspected:** page meta is set from the route, not from the login/signup tab. |
| Fix | Update the document title when the tab changes. |
| Regression | Sign-up tab title contains “Sign up.” |

### BUG-09 — Brand name is clipped on narrow phones

| | |
|---|---|
| Severity | **P3 — Low** |
| Category | Responsive layout |
| Route | Public header on `/` and `/browse` |
| Preconditions | Viewport width 320px or 360px. |
| Steps | Set the viewport to 320px and 360px. Read the logo text box. |
| Expected | “invitesready” is fully visible, or the header drops “See the designs” before clipping the name. |
| Actual | At 320px the wordmark’s scroll width is 102px and the visible width is 57px. At 360px the visible width is 88px. At 390px it fits. The first visual pass at about 300px showed “invi…”. Screenshot: `qa-reports/evidence/home-narrow.png`. |
| Reproducibility | Confirmed by layout measurement. |
| Root cause | **Confirmed.** `.ph-logo span` uses ellipsis, and the login link plus “See the designs” pill do not shrink. |
| Fix | Hide the pill below 400px, or allow the logo to keep a minimum width. |
| Regression | At 320px and 360px, logo `scrollWidth` is not greater than `clientWidth`. |

### BUG-10 — Birthday suggestions are labeled as weddings

| | |
|---|---|
| Severity | **P3 — Low** |
| Category | Content |
| Route | `/` |
| Preconditions | None |
| Steps | Tap the Birthday chip. Wait for the three cards. |
| Expected | Birthday designs. |
| Actual | “Inland Letter \| Birthday”, “Sunset Shore \| Wedding”, “Peace \| Wedding”. |
| Reproducibility | Confirmed. |
| Root cause | **Confirmed.** `SETS.birthday` in `Home.tsx` hard-codes category “Wedding” for beach and peace. |
| Fix | Point the birthday set at birthday designs, or label the cards with the real occasion. |
| Regression | Birthday chip cards do not say Wedding unless that design is actually for birthdays. |

### BUG-11 — Anniversary is in the main nav and has no designs

| | |
|---|---|
| Severity | **P3 — Low** |
| Category | Navigation |
| Route | Signed-in header |
| Preconditions | Signed in, on the editor or studio. |
| Steps | Open the Anniversary menu. |
| Expected | Anniversary templates, or no menu item. |
| Actual | The menu opens and says “No designs in this category yet.” |
| Reproducibility | Confirmed. |
| Root cause | **Confirmed.** The nav lists every catalog event, including ones with zero templates. |
| Fix | Hide empty categories. |
| Regression | Every visible category contains at least one design. |

---

## 5. UX and accessibility findings

These are separate from the functional bugs above.

| ID | Severity | Finding | How it was seen |
|---|---|---|---|
| UX-01 | P3 | Homepage promises “Nudge late replies in a tap.” Guests has search and filters only. No nudge control exists in the UI or in a send path. | Guests page plus a code search for “nudge”. |
| UX-02 | P3 | “Go Premium” is a link to `/templates`, the same catalog as “Browse templates.” | Control is visible in the studio header. Destination is the `LoggedInChrome` link. Not clicked separately. |
| UX-03 | P3 | Studio pages (`/events`, `/guests`, `/settings`, `/drafts`, `/purchases`) all use the document title “Your invitations \| InvitesReady.” | Observed on each of those routes. |
| UX-04 | P4 | Guest invites use the title “Guest invitation \| InvitesReady” instead of the couple’s names. Shared previews and browser tabs are generic. | Live Gazal link. |
| UX-05 | P4 | Submitting an empty celebration sentence starts the sample wedding without saying so. | Home form. |
| UX-06 | P3 | The home carousel’s `h2` (“Designs that open like a film.”) comes before the page `h1`. Login has two `h1`s (mobile header and the side panel). | Accessibility tree. |
| UX-07 | P3 | Login and signup errors are inside the label text, not `aria-invalid` or `aria-describedby`. The Gazal name error is a span with no alert role. The settings toast is readable text; association with the name field is weak. | Accessibility tree after invalid submit. The Gazal error existed in the DOM as `.gazal-error` and was easy to miss in the tree. |
| UX-08 | P3 | The publish dialog does not move focus. After opening it, focus stayed on “Publish & share.” | Accessibility tree: dialog heading present, trigger still focused. |
| UX-09 | P3 | On `/browse`, repeated links are named only “Preview” and “Use.” A screen reader cannot tell which design they belong to. The card title link is well named. | Accessibility tree. |

Focus styles exist on several templates (`:focus-visible` in auth, villa, bloom, and others). A full keyboard-only pass of every template was not done. Touch targets on the public header pill meet about 40px height.

Color contrast was not measured with an automated auditor. Body text on the studio and contact pages is dark green on white and looked readable. This is not a certified contrast audit.

---

## 6. Security observations

Checked on the local API. No secret values are included.

**Confirmed**

- Password accounts cannot be opened with `POST /api/session` (401). See BUG-02 for passwordless accounts.
- `GET /api/session`, `/api/invites`, `/api/purchases`, `/api/admin/summary`, and invite-record reads return 401 without a token.
- A nonsense bearer token returns 401 “That session is no longer valid.” and does not include a stack trace.
- Unauthenticated `POST /api/purchases` and `POST /api/create-order` return 401.
- Unauthenticated image upload returns 401 “Sign in is required.”
- Duplicate signup returns 409 “An account with that email already exists. Log in instead.”
- Invalid login JSON returns 400 “Check those details.” No schema dump.
- Unknown template returns 404 “Unknown template.”
- Invalid coupon returns 400 “That coupon code is not valid.”
- Login `next` is limited to a same-site path (`starts with /` and not `//`) in both the unauthorized page and the post-signup continue handler.
- No live secret or Razorpay secret was found in `src/` or `public/`. The session token is stored in `localStorage` under `invitesready.token.v1`. That is stealable by any script that can run on the origin. Typical for this style of SPA, and worth knowing.
- Public invite JSON includes invitation fields and wishes. The test invite’s `hostEmail` was empty. If a host types an email into the invite, it will be in that public payload, because the API returns `fields` as stored.
- Guest wishes can be posted with no account and no rate limit. A public link can be filled with replies. That is the same hole as BUG-01, plus spam.
- Admin, signed in as a normal user, does not show user lists. It shows a separate login. “Sign in with company SSO” reports that SSO is not set up. The two-step screen in `AdminLogin` accepts any 6-digit string and calls `onReady()` with no server check, but nothing in the file ever switches to that step. It is dead UI, not a live bypass. The line “All sign-ins are logged and monitored” was not verified.
- Signing in replaces the account’s single token hash, so a new login ends other sessions. Not tested with two browsers.

**Suspected**

- BUG-03: paid publish may succeed without a purchase if the client is bypassed. Not executed.
- `ensureAdmin` rewrites the admin password hash from configuration on startup. Operational risk if that configuration is weak. Not tested, and the value was not read.

**Not completed**

- Cross-user invite IDs were not guessed or enumerated.
- Admin summary was not opened.
- Razorpay checkout was not started.
- Google OAuth was not completed.
- XSS payloads were not submitted into a live invite.
- Production (`invites-be.vercel.app`) was not called.

---

## 7. Performance observations

Measured in Chrome against the local Vite dev server on 9 October 2026, viewport about 1077×904, after a full navigation to `/`.

| Metric | Result |
|---|---|
| Time to first byte | 10 ms |
| DOMContentLoaded | 93 ms |
| Load event | 94 ms |
| Resource entries | 165 |
| Failed resources (`responseStatus` ≥ 400) | 0 on that home load |
| Broken images on `/browse` | 0 of 23 images |

These numbers are a warm local dev server. They are not production timings and not a load test.

The largest decoded dev modules on that load were `lucide-react` (~5.1 MB), `react-dom` client (~3.1 MB), and `react-router-dom` (~1.4 MB). Vite serves source modules unbundled. A production build was not run, so this is not a claim about the shipped bundle. It is a reason to confirm tree-shaking of icon imports before judging mobile load time.

Qualitative: the home carousel advances every few seconds and the editor autosaved a draft when publish was opened. Neither left the UI stuck. The missing-invite page showed “Opening the invitation…” and then the error, so the loading state cleared.

---

## 8. Blocked and untested scenarios

| Scenario | Why it was not completed |
|---|---|
| Google sign-in | Needs a real Google account and consent. Not used. |
| Razorpay success, failure, cancel, and pending | Would start a real checkout. The paywall dialog was opened and not confirmed. |
| Coupon that reduces a price to zero | No test coupon was available. An invalid code was checked. |
| Admin overview, users, payments | Requires an admin account. Not used. |
| File upload of a photo or audio file in the editor | Auth rejection was checked. The picker flow was not driven. |
| Email and WhatsApp delivery | No sender is implemented (BUG-05). |
| Second browser / session expiry mid-edit | Not set up. |
| Every template’s open animation | Gazal and the Shaadi editor preview were opened. Bloom, Villa, Palace, and the rest were only seen as catalog cards. |
| Every SEO topic (`/nikah`, `/tamil-wedding`, and the rest) | Routes exist. Not each one was clicked. |
| Tablet layout as a full visual pass | Widths 320, 360, 390, and ~1077 were measured. A dedicated 768px screenshot pass was not done. |
| Production build and production API | Out of scope for this local pass. |
| Automated accessibility scanner | Not installed. Findings above are from the accessibility tree and manual checks. |
| Unpaid publish API call | Not run, so a live paid invite would not be created by this test. |

A local test account, one live Gazal invite, one Shaadi draft, two RSVP rows, and one passwordless probe account remain in the local database.

---

## 9. Prioritized action plan

### Fix immediately

1. BUG-01 — RSVP changes must update one reply, and headcount must use that reply.
2. BUG-02 — Stop issuing a session from an email address alone.

### Fix before release

3. BUG-03 — Enforce purchase on the server before an invite can go live. Prove it with a test, since this pass did not execute the bypass.
4. BUG-05 — Do not tell hosts that email and WhatsApp notifications are on.
5. BUG-04 — Add a not-found page.
6. Add a password reset, or remove “Forgot password?” (BUG-07).
7. Rate-limit public RSVP posts.

### Fix in the next iteration

8. BUG-06 missing-invite copy, BUG-08 signup title, BUG-09 narrow header, BUG-10 birthday labels, BUG-11 empty Anniversary nav.
9. UX-01 nudge claim, UX-02 Go Premium, UX-03 page titles, UX-06 heading order, UX-07 error announcements, UX-08 dialog focus, UX-09 “Preview” / “Use” names.

### Optional improvements

10. Guest-page title should include the names.
11. Say so when the home prompt falls back to a sample sentence.
12. Hide or finish the admin two-step screen and the “logged and monitored” line.
13. Add a small automated suite for auth, publish authorization, and RSVP uniqueness. There are currently no tests. Typecheck is clean; lint warnings are mostly React compiler notes in `WhenFields.tsx`, `Editor.tsx`, and `PeaceInvite.tsx`.

---

## 10. Overall release recommendation

**Do not release this build for real hosts yet.**

The product demo is in good shape: the landing page explains itself, signup works, a free invite publishes, the guest page opens, and logout locks the studio. Error messages from the API are short and do not leak stacks.

The two confirmed P1 issues sit on the core promise. Hosts are told they will see a live headcount, and one guest can inflate it by sending the form again. Guest checkout can create an account that anyone with the email can enter. Paid designs are blocked in the editor, and that UI behaved correctly, but the server function that publishes does not look at purchases. That should be proven with a test before money is taken.

Google sign-in, Razorpay, notifications, and admin were not exercised, so this is not a full production sign-off even after the P1 fixes.

---

## Test checklist

| Area | Result |
|---|---|
| Home load, purpose, primary action | Pass |
| Carousel, FAQ accordion, footer links | Pass |
| Home empty prompt | Pass with UX note |
| Birthday matching | Fail |
| Login empty / invalid / unknown user | Pass |
| Password visibility | Pass |
| Forgot password | Fail |
| Signup validation and success | Pass |
| Duplicate signup | Pass (409) |
| Studio, events, drafts empty copy, guests, purchases empty copy | Pass |
| Settings name persistence | Pass |
| Settings notification delivery | Fail |
| Free edit, autosave, publish, public page | Pass |
| RSVP required name | Pass |
| RSVP update | Fail |
| Paid editor paywall dialog | Pass (UI) |
| Logout and `/studio` while signed out | Pass |
| Unknown route | Fail |
| Missing invite | Fail (copy) |
| Template search, empty search, free filter | Pass |
| Anniversary menu | Fail |
| Contact | Pass |
| Admin without admin rights | Pass |
| Unauthenticated API guards | Pass |
| Passwordless session | Fail |
| Payments, Google, uploads, admin data, production | Blocked |
