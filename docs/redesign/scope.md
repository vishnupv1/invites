# Redesign scope

Phase 0 only. No app code has been changed. Waiting for an OK before tokens, components, or screens.

Classification used `git grep` / `git ls-files` on 10 Oct 2026. A file is template code if it renders an invitation, styles one, holds its assets, fonts, sample copy, or theme config, or if it is the guest page `/i/:code`. Everything else a couple sees from landing through payment, share, and dashboard is app shell.

The 14 HTML exports under `~/Downloads/m1` … `m14` are mobile artboards only. Desktop (1440×900) and mobile (390×844) targets are the PNGs in this folder. `m2` and `m3` are the same file (`Proto2-02.dc.html`). There is no `Proto2-04` HTML; editor step 1 exists only as `mobile-04-editor-1-couple.png` and `desktop-04-editor-1-couple.png`.

There is no Storybook, so the new shell components will not get stories.

## How the new UI may show a template

Embed only. Call the existing `InviteView` or `InviteSite` (or the same `<XInvite />` props the page already passes). Do not edit those components to make the shell fit.

`Editor.tsx`, `TemplatePage.tsx`, and `TemplatePreview.tsx` import the invite components directly and pass `quiet`, `demo`, `autoPlay`, language, and swatch props. Those pages can be restyled. The prop lists stay. If a prop would have to change, stop and list the file instead of editing it.

## Screen → existing shell file

| Screen | Route today | Shell file that will be restyled |
|---|---|---|
| 01 Landing | `/` (also `/how`, `/features`, `/faq`, `/occasions`) | `src/pages/Home.tsx`, `src/pages/landing.css` |
| 02 Templates | `/browse`, `/browse/:id` | `src/pages/AllTemplates.tsx`, `src/pages/all-templates.css` |
| 03 Template detail | `/template/:id` | `src/pages/TemplatePage.tsx`, `src/pages/purchase.css` |
| 04–06 Editor | `/create/:id` | `src/pages/Editor.tsx`, `src/pages/editor.css`, `src/components/WhenFields.tsx`, `src/pages/PackFields.tsx` |
| 07 Full preview | editor expand (not a separate route) | same editor files, wrapping `InviteSite` |
| 08–09 Sign in / OTP | `/login`, and publish gate | `src/pages/Auth.tsx`, `src/pages/auth.css`, `src/components/GuestAuthDialog.tsx`, `src/components/GoogleButton.tsx` |
| 10–11 Checkout / Razorpay | inside the editor purchase step | `src/components/Checkout.tsx`, `src/components/checkout.css` |
| 12–13 Success / share | after publish, inside dashboard share | `src/pages/LoggedInHome.tsx`, `src/lib/share.ts` |
| 14 Dashboard | `/studio` and the signed-in studio routes | `src/pages/Studio.tsx`, `src/pages/LoggedInHome.tsx`, `src/pages/studio.css`, `src/pages/logged-in.css`, `src/components/LoggedInChrome.tsx` |
| Signed-in catalog | `/templates` | `src/pages/Templates.tsx`, `src/pages/templates.css` |

`/create/:id` is already public. `RequireAccount` is not on that route. Guest drafts already go to `localStorage` (`localDraftKey` in `Editor.tsx`), and `GuestAuthDialog` is the publish gate. The work is to keep that path, match the new UI, and attach the draft on the server after sign-in with the existing `saveDraft` / `createInvite` calls.

The live dashboard is `LoggedInHome` rendered by `Studio`. `src/pages/DashboardHome.tsx` has no imports. Leave it. Do not delete it in this pass.

Prices: `listTemplates()` and `getTemplateRecord()` in `src/api.ts` return the database catalog. `formatPrice()` only prints `template.price`. The numbers inside `src/data/templates.ts` are fallbacks for ids missing from the API. The shell keeps calling the API. It does not read or edit those literals, and it does not hard-code ₹499, ₹299, or ₹699. “From ₹X” is the lowest price in the live catalog response.

Phone OTP is not a current auth method. Sign-in stays Google (and whatever `Auth.tsx` already does), restyled, with `TODO(auth)` where the mock shows OTP. No new auth system.

Coupon verify already exists (`verifyCoupon`). Checkout may keep that field. Placeholder copy from the mocks (FIRST50, 7-day refund, “Live for 1 year”, sample reviews, fake dashboard counts) is not shipped.

## Will change

Shell screens, their CSS, and the small shared pieces the new flow has to touch. New files are listed at the bottom. Nothing here is an invite component.

| File | What changes |
|---|---|
| `src/App.tsx` | `.ir-app` wrapper on shell routes. Temporary `/design-check` route. `/i/:code` stays `<InvitePage />`. |
| `src/main.tsx` | Import the scoped token stylesheet only. |
| `index.html` | Preconnect and `display=swap` for Fraunces and Manrope. Favicon links stay. |
| `src/pages/Home.tsx` | Landing layout. |
| `src/pages/landing.css` | Landing layout. |
| `src/pages/AllTemplates.tsx` | Browse layout. Still embeds `InviteView`. |
| `src/pages/all-templates.css` | Browse layout. |
| `src/pages/TemplatePage.tsx` | Detail layout. Same invite props. Same SEO calls. |
| `src/pages/purchase.css` | Detail / purchase chrome. |
| `src/pages/Editor.tsx` | Editor chrome and steps. Same field names, payloads, and invite props. |
| `src/pages/editor.css` | Editor chrome. |
| `src/components/WhenFields.tsx` | Field chrome only. |
| `src/components/when-fields.css` | Field chrome only. |
| `src/pages/PackFields.tsx` | Kept, under “More options” if the mock omits it. |
| `src/pages/Auth.tsx` | Sign-in layout. Existing providers only. |
| `src/pages/auth.css` | Sign-in layout. |
| `src/components/GuestAuthDialog.tsx` | Publish gate, same auth calls. |
| `src/components/GoogleButton.tsx` | Visual only. |
| `src/components/Checkout.tsx` | Receipt layout. Same Razorpay open, verify, and recovery calls. `theme.color` `#0E4D3C`. |
| `src/components/checkout.css` | Receipt layout. |
| `src/pages/Templates.tsx` | Signed-in catalog chrome. Same route and auth gate. |
| `src/pages/templates.css` | Catalog chrome. |
| `src/pages/TemplatePreview.tsx` | Chrome only, same invite props. Route stays behind the account gate. |
| `src/pages/preview.css` | Chrome only. |
| `src/pages/Studio.tsx` | Dashboard chrome. Same data loading. |
| `src/pages/LoggedInHome.tsx` | Dashboard, success, and share layout. Real RSVP rows only. |
| `src/pages/studio.css` | Dashboard chrome. |
| `src/pages/logged-in.css` | Dashboard chrome. |
| `src/components/LoggedInChrome.tsx` | Sidebar / tab bar chrome. |
| `src/components/MobileDock.tsx` | Replaced by the new tab bar once the dashboard matches. |
| `src/components/AccountMenu.tsx` | Account control chrome. |
| `src/components/AppMenu.tsx` | Account control chrome. |
| `src/components/Brand.tsx` | Shell logo lockup. |
| `src/components/brand.css` | Shell logo lockup. |
| `src/components/FavoriteHeart.tsx` | Save control on browse cards. |
| `src/components/favorite-heart.css` | Save control. |
| `src/components/CardSkeleton.tsx` | Browse loading state. |
| `src/components/card-skeleton.css` | Browse loading state. |
| `src/lib/analytics.ts` | Add the new events. Keep every current event and `?team=1` / `traffic_type=internal`. |
| `src/lib/funnel-events.ts` | Same. |
| `src/lib/analytics-wiring.test.mjs` | Cover the new events. |
| `src/lib/funnel-events.test.mjs` | Cover the new events. |
| `src/lib/share.ts` | WhatsApp text helper. Invite URL shape stays. |
| `src/lib/seo.tsx` | `noindex` for `/design-check` only. Canonicals and Product JSON-LD stay. |
| `scripts/seo-pages.mjs` | Omit `/design-check` from the sitemap. Existing prerender output stays. |
| `public/robots.txt` | `Disallow: /design-check`. |
| `src/state.tsx` | Attach the local draft after sign-in, using the current invite APIs. |

New files, added beside these, not instead of them:

- `src/styles/tokens.css` — tokens under `.ir-app` only
- `src/components/shell/` — `PrimaryButton`, `TextLink`, `UnderlineField`, `Segmented`, `Toggle`, `TopBar`, `DesktopNav`, breadcrumb bar, `TemplatePreview` wrapper, `PhoneFrame`, `StickyFooterCTA`
- `src/pages/DesignCheck.tsx` — temporary component gallery, `noindex`, not in the sitemap
- a Playwright spec for anonymous → paid, in a later phase

`src/index.css` is not in this list. It sets `:root` and styles `h1`, `button`, and the simple invitation cards (`.card`, `.garden`, `.midnight`, `.marigold`, `.confetti`, `.table-card`, `.tone-*`, `.site-*`). Those rules are template CSS. New tokens must not rewrite them.

## Will NOT change

### Invitation components, CSS, and art

- `src/components/AnnaInvite.tsx`, `anna.css`
- `src/components/AureliaInvite.tsx`, `aurelia.css`
- `src/components/BaptismInvite.tsx`, `baptism.css`
- `src/components/BeachInvite.tsx`, `beach.css`
- `src/components/BloomInvite.tsx`, `bloom.css`
- `src/components/BotanicaInvite.tsx`, `botanica.css`
- `src/components/GazalInvite.tsx`, `gazal.css`
- `src/components/GrandDoorInvite.tsx`, `grandoor.css`
- `src/components/GrandEnvelopeInvite.tsx`, `grandenvelope.css`
- `src/components/HansaInvite.tsx`, `hansa.css`
- `src/components/HeavenlyInvite.tsx`, `heavenly.css`
- `src/components/HomeInvite.tsx`, `home.css`
- `src/components/InlandInvite.tsx`, `inland.css`
- `src/components/MoonlitInvite.tsx`, `moonlit.css`
- `src/components/PalaceInvite.tsx`, `palace.css`
- `src/components/PastalInvite.tsx`, `pastal.css`, `pastal-art.tsx`
- `src/components/PeaceInvite.tsx`, `peace.css`
- `src/components/PullInvite.tsx`, `pull.css`
- `src/components/ShaadiInvite.tsx`, `shaadi.css`, `shaadi-art.tsx`, `shaadi.ts`
- `src/components/ThiruvizhaInvite.tsx`, `thiruvizha.css`
- `src/components/VillaInvite.tsx`, `villa.css`
- `src/components/VivahInvite.tsx`, `vivah.css`
- `src/components/InviteView.tsx` (dispatcher, plus the garden / midnight / marigold / confetti / table cards)
- `src/components/InviteSite.tsx`, `invite-site.css`
- `src/components/InstagramLink.tsx`, `instagram-link.css` (rendered inside the cards)
- `src/components/GuestCta.tsx`, `guest-cta.css` (rendered on `/i/:code`)

### Guest page and other template hosts

- `src/pages/InvitePage.tsx` — `/i/:code`
- `src/pages/OpenInvite.tsx`, `open-invite.css` — `/open/:id` renders templates full-bleed
- `src/pages/Topic.tsx` — SEO topics; embeds `InlandInvite`
- `src/pages/Category.tsx`
- `src/components/PreviewModal.tsx` — used by Topic and Category
- `src/data/topics.ts`
- `src/data/seo-copy.json`
- `src/lib/template-seo.mjs`, `src/lib/template-seo.d.mts`

### Template data, fonts, types

- `src/data/templates.ts` (including the price literals and `formatPrice`)
- `src/data/template-meta.json`
- `src/data/custom.ts`, `src/data/custom-defaults.json`
- `src/data/events.ts`
- `src/data/photos.ts`
- `src/lib/themes.ts`
- `src/lib/fonts.ts` (template families; Fraunces and Manrope load from the shell, not from here)
- `src/lib/dates.ts`
- `src/lib/codec.ts`
- `src/types.ts` (field names stay; new shell types go in a new file)

### Template and brand assets that stay as they are

- `public/bloom/`, `public/botanica/`, `public/grandenvelope/`, `public/grandoor/`, `public/hansa/`, `public/heavenly/`, `public/moonlit/`, `public/palace/`, `public/villa/`
- `public/covers/`, `public/og/`
- `public/favicon-v2.ico`, `public/favicon-v2-48.png`, `public/favicon-v2.png`, `public/favicon.ico`, `public/favicon.png`, `public/apple-touch-icon.png`
- `public/brand/`, `public/icons.svg`, `public/whatsapp.png`
- `public/sitemap.xml` (regenerated by the script; URLs already in it stay)
- `src/index.css`
- `src/App.css` (not imported)
- `src/assets/`

### Routes and pages outside the 14 screens

- `src/pages/CreateGuest.tsx`, `create-guest.css` — `/create` (no id). Different flow from `/create/:id`.
- `src/pages/Legal.tsx`, `legal.css`
- `src/pages/Admin.tsx`, `AdminLogin.tsx`, `admin.css`
- `src/pages/Unauthorized.tsx`
- `src/pages/DashboardHome.tsx` (unused)
- `src/components/PublicHeader.tsx`, `public-header.css` — still used by legal, topics, categories, unauthorized, and `/create`. Redesigned pages get `DesktopNav` / `TopBar` instead of editing this header.
- `src/components/Breadcrumbs.tsx`, `breadcrumbs.css`
- `src/components/Notice.tsx`, `notice.css`
- `src/components/Loader.tsx`, `loader.css` (the guest page uses the spinner)

### Payments, session, API, backend

- `src/api.ts` — including Razorpay order, verify, `saveDraft`, `createInvite`, `verifyCoupon`, `listTemplates`
- `src/lib/payment-recovery.ts` and its test
- `src/lib/purchase-event-key.ts` and its test
- `src/lib/google.ts`
- `src/session.tsx`
- `src/lib/favorites.ts`, `src/lib/media.ts`
- `scripts/og-images.mjs`
- the whole `backend/` repo: webhook, signature check, catalog, models

If attaching a guest draft after login needs an endpoint that is not already in `src/api.ts`, stop and list it. Do not add one silently.

## Left alone on purpose

These stay working and are not restyled in this pass: `/privacy`, `/terms`, `/refunds`, `/contact`, `/admin`, `/c/:id`, the topic paths, `/open/:id`, `/create` (no id), `/unauthorized`.
