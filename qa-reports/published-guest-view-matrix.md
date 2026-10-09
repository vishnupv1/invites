# Published guest view matrix — InvitesReady

**Date:** 9 October 2026  
**Browser:** Google Chrome 154.0.8037.98, headless, 390×844 unless noted.  
**Fixture:** the same stress text as `template-interior-audit.md`. Disposable local accounts only. No production invitation was changed. The Phase 3 pass did not submit a payment.

## Published

| Template | Route | Result | Evidence |
|---|---|---|---|
| gazal | `/i/6JS7jMNU` | Pass. Opened with the real button. Both full names, Saturday, February 14, 2026, the ceremony, and the address are on the page. The editor title for the same draft is the same couple and occasion. | Automated Chrome. `phase3/guest-gazal-opened.png` |
| aurelia | `/i/EfdiHCRE` | Pass. Names, Saturday, February 14, 2026, 6:30 PM, and the venue are readable. The long venue wraps. | Automated Chrome. `phase3/guest-aurelia.png` |

Both publishes returned HTTP 200 and `status: live`. Gazal was also compared with the reopened editor draft. Aurelia’s editor was still loading in Phase 2; this phase checked the live guest page.

## Blocked

Paid templates cannot be published without a purchase. Bloom’s publish returned **402** “Pay for this template before publishing.” The other paid templates were not published in that pass. That is blocked, not a pass. The API on port 4010 uses the live Razorpay key, so that pass made no test purchase.

A later pass started a second API on port 4012 with the test key only. After a successful test-mode card payment, Bloom was purchased and published at `/i/aGdXtK3S`. A failed OTP and a cancelled checkout left their drafts unpaid: publish still returned 402, and no purchase was recorded. Details are in `device-compatibility-summary.md`.

## Authorization and missing links

| Check | Result |
|---|---|
| `GET /api/templates` | 21 templates, including bloom. |
| Draft save for all 21 | HTTP 200. |
| Unknown template id | HTTP 404 “Unknown template.” |
| Another account reading the Gazal draft | HTTP 404. |
| `GET /api/invites/not-a-real-code` | HTTP 404. Drafts are not public: `getPublicInvite` rejects `status: draft`. |
| Page `/i/not-a-real-code` | “We couldn’t find that invitation.” |
| Saving a live Gazal again | Status stays `live`. `saveDraftEvent` still returns null when status is live, so a live invite is not counted as a new draft save. |
| Bloom in the app | `/create/bloom?invite=` shows the stress title and “Draft saved”. `/browse` at 320px includes Bloom and uses one column. |

## Not tested

RSVP submit on a live invite was not completed. Landscape, a physical phone, Safari, Firefox, and Edge were not used for these guest links.
