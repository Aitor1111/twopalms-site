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

## Pending assets

See `../ASSETS-BRIEF/` (not deployed) — hero cards, work carousel, founder portraits, SVG logos, social URLs.
