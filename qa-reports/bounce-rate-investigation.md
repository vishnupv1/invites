# Bounce-rate and engagement investigation — InvitesReady

**Date:** 9 October 2026  
**Scope:** Local product at `http://127.0.0.1:5173` and the analytics code in the repository.  
**Question:** Why might visitors leave before they find a design, start an invitation, or pay?

This report does not contain a measured bounce rate. No analytics property was queried.

## 1. Executive summary

InvitesReady’s likely drop-off is not proven by traffic data. What the product itself shows is a clear path — see a design, edit it, pay only to publish a paid template — with a few places where the page used to hide that path, and a few that still make the path hard to measure.

The mobile header, missing menu, first-screen prompt, contrast, loading blanks, birthday mislabels, clipped invitation text, “Go Premium,” the nudge claim, the blank 404, and the dead password-reset button were checked against the current code. They are fixed. See section 5.

What is still true, and matters for engagement:

- There is no access to GA4 reports, so bounce rate, device mix, and funnel drop-off are unknown.
- Tracking exists, but it does not record occasion choice, search, a failed or cancelled payment, or a saved draft. A passwordless checkout session is not a `sign_up`. Google `sign_up` now fires only when the account is new. A repeat `purchase` in the same page load is suppressed.
- Baby-shower and housewarming suggestions on the homepage included wedding designs. They now show only the matching catalog design (Little Blessing, Hearth).
- A visitor can design before paying. Payment is required to publish a paid template, and the server now refuses an unpaid publish. That is a business rule, not a broken button.
- Password reset still does not exist. The control no longer pretends to send an email.

Do not treat a lower bounce rate as the goal by itself. A guest who opens an invitation link and RSVPs can be a one-page session that succeeded. Measure engaged sessions, template previews, design starts, publishes, and purchases.

## 2. Reports reviewed

| Report | Use |
|---|---|
| `qa-reports/real-user-testing-report.md` | Functional baseline |
| `qa-reports/ui-ux-responsive-audit.md` | Layout and contrast baseline |
| `qa-reports/comprehensive-qa-report.md` | Which of those issues were later fixed |
| `qa-reports/regression-test-results.md` | What was retested |
| `qa-reports/evidence/` | Not in the repository now. There is no GA4 export and no metrics file to analyze. |

## 3. Analytics setup

Google Analytics 4 is loaded in the browser from `src/lib/analytics.ts`.

| Item | What the code does |
|---|---|
| Property | Measurement ID `G-NNF07Q6XYV` (this is a public tag id, not a secret) |
| Loader | `gtag.js` injected on the first tracked event or page view |
| Page views | Manual `page_view`. Automatic page views are off (`send_page_view: false`). |
| Internal traffic | `?team=1` stores `invitesready.internal` and sends `traffic_type: internal` |
| Consent mode | Not implemented. The script loads for every visitor. |
| Server-side analytics | None found |
| Tag Manager, PostHog, Plausible, Search Console, ad pixels | Not found in the repository |

The privacy policy (`src/pages/Legal.tsx`) says Google Analytics is used and that visitors can block analytics cookies. There is no in-page consent banner.

**Live metrics:** not available. This session has no GA4, Search Console, or ad-account credentials. No sessions, bounce rate, revenue, or device split are reported, because those numbers would be invented.

## 4. Data required before calling the bounce rate “high”

Export from GA4, same property as `G-NNF07Q6XYV`, for a stated date range:

- Sessions, engaged sessions, engagement rate, average engagement time.
- Landing page, split by device and by session source / medium.
- Event counts for `page_view`, `template_preview`, `start_design`, `first_edit`, `save_draft`, `sign_up`, `login`, `begin_checkout`, `payment_cancelled`, `payment_failed`, `purchase`, and `publish`. Use the denominators in `analytics-event-plan.md`.
- New vs returning.
- A note on whether internal `traffic_type` is filtered out of the main view.

Until that export exists, “high bounce rate” is a hypothesis, not a finding.

## 5. Previously reported barriers — current status

| Barrier | Status |
|---|---|
| Wordmark clipped under 430px | Fixed. Measured at 320px: wordmark 102px wide, fully visible. |
| Navigation missing below 960px | Fixed. Menu opens Templates, How it works, and FAQs. |
| Primary prompt below the first phone screen | Fixed. At 320px the start section begins under the header; the film is below it. |
| Low-contrast topic links and error text | Fixed for chrome. Topic links compute to ink `#1C3A2A` and are underlined. |
| Blank guests/events loading | Fixed. Favorites and purchases had the same blank gap; a loading line was added in this pass. |
| Birthday cards labelled Wedding | Fixed earlier. Baby shower and housewarming still mixed in wedding cards; corrected in this pass to the one matching design each. |
| Mobile editor hides the preview | “View invitation” is in the sheet. The expand action was not clicked again in this pass. |
| Invitation line clipped | Fixed. The field is a 3-row textarea. |
| “Go Premium” | Renamed to “Paid designs.” It opens the catalog, which is what the control does. |
| “Nudge late replies” | Removed from the homepage. Nudges are still not a feature. |
| Password reset | The button is gone. Reset email is still not implemented. |
| Blank unknown URL | Fixed. Not-found page with a way home. |
| Heading and title mismatches | Largely fixed. See the comprehensive QA report. |

## 6. Landing page

On a phone, the first screen is now the sentence prompt, occasion chips, and “See all designs,” with the film underneath. On a desktop-width layout the film still leads and the prompt follows. That matches the brand film without hiding the task on a small screen.

The page says what the product is: animated invitations, a sentence to start, pay once when you publish. Real covers are in the film and in the catalog. Prices appear on cards (`₹0` for free, otherwise the catalog price).

`/pricing` redirects to `/`. There is no separate pricing page. The homepage tile says “Pay once, from ₹299” and “no subscription,” which matches the one-time template prices in the catalog (Inland Letter ₹299, Shaadi ₹499, Gazal free).

SEO titles for `/`, `/wedding`, and `/browse` describe digital invitations. Occasion routes such as `/wedding` and `/birthday` exist and list templates for that topic. Anniversary has no templates; the studio no longer shows an empty Anniversary menu.

## 7. What can be said about abandonment without traffic data

These are confirmed product facts, not measured drop-off rates.

| Stage | What can go wrong | Confidence |
|---|---|---|
| Arrival | A guest invitation (`/i/:code`) is a successful one-page visit. Counting it as a bounce would misread the product. `page_view` marks these `page_type: guest`. | High, from code |
| Occasion match | Wedding is the default when the sentence does not mention birthday, baby, or house. An unclear sentence shows wedding designs, and the page now says so when the field was empty. | High |
| Catalog | Search, free/paid, and category filters exist on `/browse`. Preview and Use are named with the design. | High |
| Editor | Opens without an account. Drafts save. Paid publish opens checkout. The server returns 402 if the template was not bought. | High, API-tested |
| Account | Real signup and login fire `sign_up` and `login`. Forgot-password is honestly unavailable. | High |
| Payment | Razorpay is implemented. This pass did not complete a payment. A cancelled payment shows “Payment was cancelled.” A failed payment shows Razorpay’s message. Neither failure is an analytics event. | High for the UI copy; payment itself not executed |
| Return | Drafts, favorites, and purchases are behind sign-in. Loading no longer looks like an empty account. | High |

## 8. Purchase confidence

Supported by the product today:

- Price is on the card and again in the editor paywall (“Pay ₹499 and publish” for Shaadi).
- Copy says design and preview are free and payment is once, at publish.
- Refunds, privacy, terms, and `hello@invitesready.com` are linked.
- Checkout uses Razorpay and verifies the signature on the server before the purchase is stored.

Not present, and not invented here: customer reviews, ratings, buyer counts, or a security certification.

Checkout still creates a passwordless account when a new email pays. That person can later set a password by signing up with the same email. They cannot recover a forgotten password.

## 9. Performance (local only)

The earlier local dev-server check (9 October 2026, warm Vite, about 1077×904) saw a 10 ms time to first byte and a 94 ms load event on `/`, with 165 resources and no failed requests. That is not production. The production build of this workspace emits one JS chunk of about 1.08 MB (about 280 KB gzip) and one CSS file of about 678 KB (about 121 KB gzip). Vite warned that the JS chunk is large. Whether that delays first interaction in production was not measured.

## 10. Root causes versus hypotheses

**Supported by the product**

- Measurement cannot tell a guest RSVP from a visitor who left.
- Occasion suggestions used to show the wrong celebration. Birthday was fixed earlier. Baby and housewarming were fixed in this pass.
- Signup counts were inflated by guest checkout. Corrected in this pass.
- Password recovery and email alerts are absent. The UI no longer claims they work.
- Paid publish is gated. That will reduce “purchases” among people who only wanted to preview, which is intended.

**Not supported yet**

- That bounce rate is high.
- That the film, rather than traffic quality or guest links, is the main cause.
- That any copy change will raise revenue by a stated percent.

## 11. Open questions

1. What share of sessions land on `/i/` versus `/`, `/wedding`, or `/browse`?
2. What share of `start_design` events reach `publish` or `purchase`?
3. How many `begin_checkout` events have no matching `purchase`?
4. Are internal `?team=1` sessions excluded from the public GA4 view?
5. Is a dedicated pricing URL needed for ads, or is the homepage tile enough?
