# Regression test results — InvitesReady

**Date:** 9 October 2026  
**API:** `http://127.0.0.1:4010`  
**Frontend:** `http://127.0.0.1:5173`  
**Runner:** Node.js built-in test runner for API cases. Chromium for UI checks. No tokens or passwords are stored here.

| Test ID | Feature | Preconditions | Steps | Expected | Actual | Result | Evidence | Bug |
|---|---|---|---|---|---|---|---|---|
| RT-01 | Passwordless session | Local API | Create a session for a new email. Call it again with the same email. Read the first token. | First call 200. Second call 401. First token still returns the original name. | Pass. Name stayed “First.” | Pass | `backend/test/regression.test.mjs` | BUG-02 |
| RT-02 | Password account | Local API | Sign up with a password. Call `POST /api/session` with that email. | 401. The signup token still works. | Pass | Pass | Same file | BUG-02 |
| RT-03 | RSVP update | Signed-in host, live Gazal | Post a greeting. Post again with the returned reply token and a new note. List greetings. | One row. Note and attendance match the second post. Same id. | Pass. Length 1. | Pass | Same file | BUG-01 |
| RT-04 | Paid publish | Signed-in host, no purchase | Save a Shaadi draft and publish it. Also `POST /api/invites` for Shaadi. | Both return 402. | Pass | Pass | Same file | BUG-03 |
| RT-05 | Free publish | Same suite as RT-03 | Create a Gazal invite. | 200 and a public code. | Pass | Pass | Same file | BUG-03 |
| RT-06 | Claim passwordless account | Local API | Create a passwordless session, then sign up with a password on that email. Try email-only session again. Log in with the password. | Claim succeeds. Email-only session stays 401. Password login returns the new name. | create 200, claim 200, reopen 401, login 200 | Pass | Manual API check, statuses only | BUG-02 |
| RT-07 | Cross-account invite | Two local accounts | Host B reads and publishes host A’s invite id. | 404 for both. | cross-read 404, cross-publish 404 | Pass | Manual API check | SEC-02 |
| RT-08 | Unknown URL | Frontend | Open `/does-not-exist`. | Heading and a way home. | “We couldn’t find that page.” Links to home and browse. | Pass | Browser snapshot | BUG-04 |
| RT-09 | Missing invite | Frontend | Open `/i/not-a-real-code`. | Not-found copy, not “incomplete.” | “We couldn’t find that invitation.” | Pass | Browser snapshot | BUG-06 |
| RT-10 | Narrow header | Frontend at 320×720 | Measure the wordmark and page scroll. Open Menu. | Full wordmark, no page overflow, menu lists Templates, How it works, FAQs. | `scrollWidth` 102, `clientWidth` 102, overflow false. Menu expanded. | Pass | Browser measurement, `qa-reports/evidence/fix-home-320.png` | UI-01, UI-03 |
| RT-11 | First viewport | Same 320×720 page | Compare the start section and the film. | The prompt is above the film. | Start `top` 68. Film `top` 890. | Pass | Browser measurement | UI-08 |
| RT-12 | Topic link contrast | `/wedding` at 1280 | Read computed color of a related link. | Ink, not mint. | `rgb(28, 58, 42)`, underlined. Heading 51.2px. | Pass | Browser measurement | UI-02 |
| RT-13 | Signup title | `/login` | Switch to Sign up. | Title contains “Sign up.” | “Sign up \| InvitesReady.” | Pass | Browser snapshot | BUG-08 |
| RT-14 | Password reset control | `/login` | Look for Forgot password. | No button that pretends to send mail. | Static line: “Password reset is not available yet.” | Pass | Browser snapshot | BUG-07 |
| RT-15 | Editor long line | `/create/gazal` at 375 | Inspect the invitation line control. | Multiline, full sample visible. | `TEXTAREA`, 3 rows, value length 59, scroll height equals client height. “View invitation” is present. | Pass | Browser measurement | UI-07, UI-06 |
| RT-16 | Typecheck | Repo | `tsc -b --noEmit` and backend `tsc --noEmit`. | No errors. | Both exited 0. | Pass | Command output | — |
| RT-17 | Lint | `src` | `oxlint`. | No errors. | Exit 0. Existing React compiler warnings remain. | Pass | Command output | LINT-01 |
| RT-18 | Production build | Repo | `npm run build`. | Build completes. | Completed. Main JS chunk about 1.08 MB. | Pass | Command output | — |

## Not run

| Test | Why |
|---|---|
| Google sign-in | Needs a real Google account. |
| Razorpay success, failure, cancel | Would start a real checkout. The unpaid API path was tested instead. |
| Admin overview | No admin session was used. |
| Firefox and Safari | Only Chromium was available. |
| 200% browser zoom | Not executed. |
| Screen reader pass | Not executed. Automated axe was not installed. |
| Populated guests table screenshot | Loading copy was added in code. The populated table from the earlier session was not recaptured. |
| Click “View invitation” | The control is in the accessibility tree. The expand animation was not clicked. |
| Production API | Out of scope. |
