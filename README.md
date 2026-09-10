# twopalms.studio — brand site

Static one-pager. No build step, no dependencies: `index.html` + `styles.css` + `main.js` + `assets/`.

- **Live:** https://aitor1111.github.io/twopalms-site/
- **Design source:** claude.ai/design project `11cb29f7` → `twopalms Site.dc.html` + `twopalms Design System.dc.html`
- Booking: Cal.com inline embed (`aitor-truji/15min`)

## Deploy

Currently on **GitHub Pages** (free, auto-deploys on every push to `main`).

### Recommended final home: Cloudflare Pages (free)

Best cheap/efficient host for the agency (this site + future client sites): unlimited bandwidth, unlimited sites, preview deploys per commit, free SSL and custom domains, commercial use allowed on the free tier.

One-time setup (~5 min, needs a Cloudflare login):
1. Create account at dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Pick `Aitor1111/twopalms-site`, no build command, output dir `/`
3. Done — every push deploys. When ready, add the custom domain `twopalms.studio` there (DNS moves to Cloudflare, also free).

GitHub Pages keeps working meanwhile; nothing breaks by adding Cloudflare later.

## Meta pixel

Pixel `1645505560339533`, client-side only. Base snippet + `PageView` in the
`<head>` of `index.html`; the funnel events at the bottom of `main.js`.

| Event | Trigger |
|---|---|
| `PageView` | page load |
| `InitiateCheckout` | first click on any CTA (`a[href="#call"]` / `a[href="#book"]`) |
| `ViewContent` | Cal widget scrolls into view (20% visible) |
| `Schedule` + `Lead` | booking completed |

The booking event is the important one and the only non-obvious piece: Cal renders
in a **cross-origin iframe**, so the pixel cannot see a booking by itself. We hook
Cal's embed events (`bookingSuccessfulV2`, with `bookingSuccessful` as fallback for
older embed builds). If the Cal embed is ever swapped or the namespace `15min`
renamed, **the conversion event dies silently** — re-test in Meta Test Events after
any change to the embed.

Each event ships an `eventID` (`tp-<base36>`) so a future Conversions API
integration can dedupe server-side events against these. Events fire at most once
per pageview.

**No CAPI yet, and no access token in this repo — ever.** This is a public repo on
GitHub Pages with no server; a CAPI token here would let anyone inject fake events
into the pixel. Server-side needs its own host (Cloudflare Worker + Cal.com
`BOOKING_CREATED` webhook is the intended path).

## Pending assets

See `../ASSETS-BRIEF/` (not deployed) — hero cards, work carousel, founder portraits, SVG logos, social URLs.
