# Comprehensive QA report — InvitesReady

**Date:** 9 October 2026  
**Environment:** Local frontend `http://127.0.0.1:5173` (Vite). Local API `http://127.0.0.1:4010`. Chromium via the in-app browser, plus Node `fetch` against the API.  
**Mode:** Findings from the two earlier reports were reproduced, then confirmed defects were fixed and retested. This is not a claim that the product is bug-free, fully secure, WCAG-conformant, or production-ready.

## 1. Executive summary

The two earlier reports were used as a baseline, then checked against the current code and the running local app. The three high-severity issues were still present at the start of this pass and are now fixed in code and verified on the local API:

- Changing an RSVP no longer inserts a second reply when the browser sends the reply token.
- An existing account can no longer be entered, renamed, or have its session replaced by `POST /api/session` with only an email.
- Publishing a paid template without a purchase returns 402, including a direct `POST /api/invites` that would previously have gone live.

Unknown URLs now show a not-found page. A missing invitation says it was not found. The public wordmark fits at 320px, the header has a menu below 960px, topic links are ink with an underline, and guests/events show a loading state instead of a blank or a premature empty card.

**Release view after these fixes:** the confirmed data-integrity and authorization holes from the earlier reports are closed on this local build. Google sign-in, live payments, email delivery, admin operations, other browsers, and a full accessibility conformance pass were not completed. Do not treat the green build as a production sign-off.

## 2. Scope and environment

| Check | Result |
|---|---|
| Frontend `tsc -b --noEmit` | Pass |
| `oxlint` | Pass (warnings only, exit 0) |
| Backend `tsc --noEmit` | Pass |
| `npm run build` | Pass. JS chunk is about 1.08 MB (280 KB gzip). Vite warned that the chunk is large. |
| API regression tests | 4 passed (`backend/test/regression.test.mjs`) |
| Browser | Chromium only. Firefox and Safari were not available in this session. |

No production traffic, no completed Razorpay payment, no Google sign-in, and no admin console login. Test accounts used `@example.com` addresses created on the local database. Tokens and passwords are not recorded in this report.

## 3. Source reports

| Report | Path |
|---|---|
| Real-user testing | `qa-reports/real-user-testing-report.md` |
| UI, UX, and responsive audit | `qa-reports/ui-ux-responsive-audit.md` |

Evidence already on disk under `qa-reports/evidence/` was reused. New evidence from this pass: `qa-reports/evidence/fix-home-320.png` and `backend/test/regression.test.mjs`.

## 4. How duplicates were handled

BUG-09 and UI-01 are the same clipped wordmark. BUG-02 is the passwordless takeover. UI-02 / A11Y-01–03 are the contrast and token issues. UI-04 and the guests blank state are the same loading gap. UX-01 and the “nudge” marketing line are the same claim. UX-02 and “Go Premium” are the same link. Original IDs are kept in the status table.

## 5. Status of every original finding

| ID | Original severity | Status after this pass | What was verified |
|---|---|---|---|
| BUG-01 | P1 | **Fixed** | API test: second greeting with the returned `replyToken` keeps one row and updates the note and attendance. |
| BUG-02 | P1 | **Fixed** | Second `POST /api/session` for an existing email returns 401. The first token still reads the original name. Password accounts also return 401. |
| BUG-03 | P1, previously unexecuted | **Confirmed, then fixed** | Unpaid Shaadi draft publish and direct `POST /api/invites` both return 402. Free Gazal still publishes. |
| BUG-04 | P2 | **Fixed** | `/does-not-exist` renders “We couldn’t find that page,” with home and catalog links. Title: “Page not found \| InvitesReady.” |
| BUG-05 | P2 | **Fixed in the UI** | Notification switches are disabled and labelled “Not available yet.” Save no longer says the alerts were turned on. Delivery is still not implemented. |
| BUG-06 | P3 | **Fixed** | `/i/not-a-real-code` heading is “We couldn’t find that invitation.” |
| BUG-07 | P3 | **Partially resolved** | The “Forgot password?” control is gone. A line states that reset is not available. A real reset email flow was not built, because there is no mail sender. |
| BUG-08 | P3 | **Fixed** | Sign-up tab title is “Sign up \| InvitesReady.” |
| BUG-09 / UI-01 | P3 / High | **Fixed** | At 320px the wordmark `scrollWidth` equals `clientWidth` (102px). “See the designs” is hidden under 430px. |
| BUG-10 | P3 | **Fixed** | Birthday suggestions are only Inland Letter, which is the birthday design in the catalog. |
| BUG-11 | P3 | **Fixed** | Categories with no templates, including Anniversary, are omitted from the studio nav. |
| UX-01 | P3 | **Fixed** | The home tile no longer says guests can be nudged. |
| UX-02 | P3 | **Fixed** | The studio control is labelled “Paid designs” and still opens the template catalog. |
| UX-03 | P3 | **Fixed** | `/events`, `/drafts`, `/favorites`, `/guests`, `/purchases`, and `/settings` have their own document titles. |
| UX-04 | P4 | **Fixed when the invite loads** | A loaded invite sets the title from the names. The not-found state keeps “Guest invitation.” |
| UX-05 | P4 | **Fixed** | An empty celebration prompt says a sample wedding is being shown. |
| UX-06 | P3 | **Fixed** | The film line is a paragraph, not a heading before the `h1`. Login no longer has two `h1`s. |
| UX-07 | P3 | **Partially resolved** | Login and signup fields use `aria-invalid` and `aria-describedby`. Form errors use `role="alert"`. Not every template field was wired. |
| UX-08 | P3 | **Fixed in code, click not retested** | The publish dialog is focused when it opens and Escape closes it. |
| UX-09 | P3 | **Fixed on `/browse`** | Preview and Use links include the design name. |
| UI-02 / A11Y-01 | High | **Fixed for chrome** | Wedding topic links compute to `rgb(28, 58, 42)` with an underline. |
| A11Y-02 | High | **Fixed** | Error and Log out text use `#8F2D2D` (about 8:1 on white). |
| A11Y-03 | Medium | **Fixed for chrome hovers** | Studio, catalog, and preview link hovers no longer use `#8FB9A0` as text. |
| UI-03 | High | **Fixed** | Below 960px a Menu button opens Templates, How it works, and FAQs. Confirmed in the accessibility tree at 320px. |
| UI-04 | Medium | **Fixed** | Guests, events, and drafts render a loading status while data is in flight. |
| UI-05 | Medium | **Fixed** | The global `h1` cap is `3.25rem`. Wedding `h1` measured 51.2px at 1280px. Landing heroes keep their own larger size. |
| UI-06 | Medium | **Partially resolved** | “View invitation” is in the mobile editor sheet. The expand action was not clicked in this pass. |
| UI-07 | Medium | **Fixed** | The invitation line is a 3-row textarea. At 375px the Gazal sample line fits (`scrollHeight` equals `clientHeight`). |
| UI-08 | Medium | **Fixed** | At 320×720 the start section is at the top (`top: 68`) and the film is below it (`top: 890`). |
| UI-09 | Low | **Fixed** | Studio wordmark is `invitesready`, matching the public header. |
| UI-10 | Low | **Partially resolved** | Menu, nav links, footer links, and “Watch the opening” have a 44px minimum height. Not every text control in every template was measured again. |
| UI-11 | Low | **Fixed** | Legal and purchase `font-weight: 560` is now 600. |
| A11Y-05 | Medium | **Fixed** | Same as UX-06. |
| A11Y-06 | Medium | **Partially resolved** | Auth errors are associated. Publish dialog focus is implemented. Not re-clicked. |
| A11Y-07 | Low | **Fixed** | The guests loading line has `role="status"` and `aria-busy`. |
| A11Y-08 | Low | **Unchanged, still passing** | Muted `#5E7368` was not lightened. |

## 6. Newly discovered or newly executed findings

| ID | Severity | Status | Notes |
|---|---|---|---|
| SEC-01 | P1 | Fixed | BUG-03 was only suspected before. This pass executed the unpaid publish and it returned 402 after the fix. Before the fix, `assertCanUse` did not look at purchases. |
| SEC-02 | — | Pass | A second host reading or publishing the first host’s invite id gets 404. |
| SEC-03 | — | Pass | Signing up with a password on an existing passwordless email claims that account. A later email-only session call stays 401, and password login works. |
| LINT-01 | — | Fixed | `useHref` in `AllTemplates.tsx` was a normal function. oxlint treated the name as a Hook and failed the lint. Renamed to `hrefFor`. Behavior is unchanged. |

No new P0 issue was found.

## 7. Fixes implemented

**Authorization and data**

- `openSession` creates an account only when the email is new. An existing account, with or without a password, returns 401 and does not rotate the token.
- `assertCanUse` requires the template to be free or already purchased before `createInvite` or `publishInvite` can make it live. Draft saves are unchanged.
- `addGreeting` stores a reply-token hash. A later post with that token updates the same greeting. `sendGreeting` keeps the token in `localStorage` under `invitesready.replies.v1`.
- Public greeting and session posts are rate-limited in process memory (12 greetings per minute per IP and invite, 20 session creates per minute per IP).

**Product and UI**

- Catch-all route and not-found page.
- Distinct missing-invite copy.
- Honest notification settings.
- Public header menu, unclipped wordmark, and a hidden pill under 430px.
- Chrome contrast: topic links, errors, logout, and link hovers.
- Loading states, heading scale, mobile prompt order, birthday set, empty categories, page titles, editor textarea, and “View invitation.”
- Invitation template stylesheets were not recolored.

## 8. Regression results

See `qa-reports/regression-test-results.md`. Summary: the four API tests passed. Frontend and backend typechecks passed. Lint passed. Production build passed. Browser checks confirmed the not-found page, the 320px header, the menu, topic-link color, the missing-invite heading, the signup title, and the editor textarea.

## 9. Limitations and unresolved risks

- Password reset email does not exist. The dead button was removed. People who forget a password still cannot recover it.
- Email and WhatsApp are not sent. The UI no longer pretends they are.
- Reply updates depend on the token stored in that browser. Clearing site data, or posting without the token, still creates a new guest row. That is a different person, or a lost token, not “Change my reply.”
- Older duplicate rows already stored for the local Gazal invite were not merged.
- The rate limit lives in one process. It does not protect a multi-instance deployment.
- `--plum`, `--rose`, and `--gold` still alias the mint fill, because several chrome buttons use `--plum` as a background and some invitation styles inherit the names. Topic-link text no longer uses `--plum`. Invitation palettes were left alone.
- Google sign-in, Razorpay success and failure, admin data, file upload in the editor, and production were not exercised.
- XSS payloads were not submitted.
- Firefox, Safari, and 200% zoom were not tested.
- Breakpoints were not collapsed into one scale. A global rewrite was not justified.
- This is not a WCAG 2.2 conformance claim.

## 10. Recommended next steps

1. Add a real password-reset flow only when a mail sender exists. Until then, keep the current honest line.
2. Put the greeting and session rate limits in a shared store before running more than one API instance.
3. Decide whether old duplicate RSVP rows should be collapsed. Do not do that without a host-visible review, because two people can share a name.
4. Run the same API tests against a staging database before release.
5. A later pass can check RSVP contrast inside each invitation without changing the artwork palette.
