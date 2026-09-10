# /more-ads — paid traffic landing

Port of the Claude Design canvas **`TP Paid Landing v2.dc.html`**
(project `11cb29f7-00cc-4036-b011-234f4f3f33ca`).

The canvas ran on Claude Design's reactive runtime (`state` + `{{ bindings }}` +
`sc-if` / `sc-for`). Here that same state lives in `landing.js` and drives
`[data-bind]` nodes; the qualification modal is rendered from JS.

## Routes

The canvas switched between three screens with a `view` prop. On the live site
they are three URLs, so paid traffic can be pointed at each one and audiences
can be built off them:

| URL | Canvas screen | Use |
|---|---|---|
| `/more-ads/` | Landing | Cold traffic |
| `/more-ads/short/` | Short retargeting | Retargeting — people who saw the landing |
| `/more-ads/thanks/` | Thank you | Post-booking, redirected to after a booking |

All three are `noindex,follow`: they are ad destinations, not organic pages.

## Meta pixel

Same pixel as the main site (`1645505560339533`), base snippet in each `<head>`.

| Event | Trigger |
|---|---|
| `PageView` | load, all three pages |
| `InitiateCheckout` | qualification modal opens (any of the 7 CTAs) |
| `ViewContent` | reaches step 4 and the calendar renders |
| `AuditDisqualified` *(custom)* | picks "Under $10k" — build an **exclusion audience** off this |
| `Schedule` + `Lead` | booking completed |

Events fire at most once per pageview and carry an `eventID` for future
Conversions API dedup.

**The conversion fires in the modal, not on `/thanks/`.** Cal.com is a
cross-origin iframe, so the booking is only visible through its embed callback
(`bookingSuccessfulV2`, with `bookingSuccessful` as fallback). We fire there and
then redirect to `/thanks/` after 700 ms so the pixel request leaves first.
`/thanks/` therefore fires only `PageView` — do **not** add a conversion event
there or every booking counts twice.

## The calculator

`spendPos` (log slider, $5k → $500k) and `cur` (0–150 ads/week) drive everything:
weekly ads needed, the gap, the format mix by spend tier, the dot grid and the
CPA drift. Formulas are ported 1:1 from the canvas — if you change them here,
change them in the canvas too or the two will drift apart.

Answers from the modal are passed into the Cal.com booking as `notes`, so the
call starts with spend / vertical / role / calculator state already known.

## Scarcity

`<body data-spots="2">` on each page — 0 to 3. It drives the "N of 3 spots left"
label and the capacity card. **Keep it truthful**; it is in the markup precisely
so it can be edited without touching logic.

## Assets

`assets/work/` — 18 creatives picked from `~/Desktop/twopalms-studio/brands/*/`,
across five brands so the grid reads as range rather than one account:

| Brand | Files |
|---|---|
| Histrips | `hs-silent-alarm`, `hs-8am-whiteboard`, `hs-felt-here`, `hs-445-club`, `hs-credit-applied` |
| NAKD | `nk-edge-titanium`, `nk-1000-perforations`, `nk-still-bulky`, `nk-heat-kills`, `nk-full-of-holes` |
| EDEL | `ed-gold-tears`, `ed-classical-head`, `ed-broken-glass` |
| Loast | `lo-mountain-fog`, `lo-ridge-sunset`, `lo-coastal-trail` |
| Stromgear | `sg-noise-off`, `sg-padel-court` |

All WebP, max 900px wide, ~1.7 MB total. Sources are recorded in the session
notes; originals stay in the studio repo — these are web derivatives, re-export
from the originals rather than upscaling these.

The four video stills reuse real UGC posters already in the site root:
`/assets/ugc/ugc-glowdrop.jpg`, `ugc-nakd-1.jpg`, `ugc-strom-1.jpg`,
`ugc-north.jpg`. **The two 9:16 tiles link to specific Drive videos** — check
that each poster actually matches the video it links to before running traffic.

Founders and logos resolve from the site root: `/assets/founder-tor.jpg`,
`/assets/founder-pol.jpg`, `/assets/logo-white.png`, `/assets/logo-green.png`.

Boxes marked `.slot` are media the canvas left as empty placeholders — they were
never in the design file either. They are listed in the parent README.
