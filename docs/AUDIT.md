# Audit — The Market Edit / Toss Enterprise catalogue

**Date:** 10 November 2026
**Live:** https://te-catalogue.tossacoin001.workers.dev
**Rollback point:** commit `f81b521` (tag `pre-refine-2026-11-10`)

## Current architecture

| Layer | Implementation |
| --- | --- |
| Hosting | Cloudflare Worker `te-catalogue` (static assets, `wrangler.jsonc`) |
| Build step | None — static files deployed as-is (`npx wrangler deploy`) |
| Application | One `index.html` (≈56 KB): CSS, markup and all JS inline |
| Data | `CONFIG` + `PRODUCTS` constants at the top of the inline script |
| Routing | Single page; `#shop` anchor only |
| Images | Generated inline SVG tiles (no external image requests) |
| Fonts | Google Fonts (Fraunces / Manrope) |
| Tests | 23 Playwright end-to-end tests (`tests/site.test.mjs`) |

## Working today

- Catalogue of 22 listings across physical / digital / service types
- Type filter, category filter, search (names, categories, types)
- Product sheet with type-aware delivery copy
- Request form → prefilled WhatsApp message to 0808 791 9951 (brand, seller type, products, next step, name, phone)
- Mobile sticky CTA, 404 page, dark mode, reduced-motion support
- Lighthouse 100 / 100 / 100 on the live URL
- Cloudflare deployment with `.assetsignore` keeping repo files private

## Incomplete / misleading today

| Item | Problem |
| --- | --- |
| Product ordering | Deliberately disabled in the demo (client requirement). No quantity, no variants, no live order path in the engine. |
| Business configuration | Single business hardcoded in `index.html`. No way to serve a second catalogue without editing the file. |
| Commercial tiers | Starter / Pro offering not represented at all. |
| Package context | Form does not capture which package or budget the lead wants. |
| "Edit it yourself" claim | Homepage strip implies self-service editing, which is **Pro**, not Starter. |
| Architecture | Data, logic and presentation are interleaved in one script — blocks reuse across clients. |

## Recommended changes (this pass)

1. **Extract the engine** into `js/config.js`, `js/data/businesses.js`, `js/lib/*.js`, `js/app.js` — no framework, no build step, same deploy.
2. **Multi-business**: three demo catalogues (fashion/lifestyle+drops+services, food, electronics+repairs) selected by `?b=slug`.
3. **Ordering engine**: quantity, variants, price, SKU and type-aware WhatsApp messages, behind a `mode: "demo" | "live"` switch. Demo keeps the approved no-link behaviour; live catalogues get real order buttons.
4. **Honest commerce**: Starter (₦50,000) vs Pro (coming soon) clearly separated; no fake dashboards or automation claims.
5. **Sales block** with package information and a package field in the request form.
6. **Presentation polish**: hero uses the business's featured items, consistent cards, footer contact + socials, catalogue switcher.

## Implementation status

All six changes above are implemented with no framework and no build step:

| Area | Result |
| --- | --- |
| Architecture | `index.html` keeps its CSS and markup; logic moved to ES modules under `js/` |
| Configuration | Toss sales config in `js/config.js`; each client in `js/data/businesses.js`; no numbers in components |
| Businesses | `market-edit` (22), `mamas-kitchen` (8), `volt-gadgets` (8), selected by `?b=slug`, switcher in the page |
| Ordering | Quantity stepper, variants, price/SKU in the message; `mode: "live"` produces real `wa.me` links |
| Demo safety | All shipped demos stay `mode: "demo"`; zero `wa.me` anchors until the Toss request is submitted |
| Commercial tiers | `#packages` renders Starter (₦50,000, 10 items, 24 hours) and Pro (roadmap, no dashboard) |
| Request flow | Adds a package field; message includes package, brand, products, next step, optional name/number |
| Honesty | No auto-payment, auto-confirmation, inventory or delivery claims; Pro labelled "Coming soon" |

## Risks

| Risk | Mitigation |
| --- | --- |
| Regressing the approved demo flow | Existing e2e suite kept and extended; no wa.me anchors may appear in demo mode |
| Breaking the live deployment | Deploy only after full local suite + screenshot review; previous Worker version retained in Cloudflare |
| Multi-business data errors | Pure logic unit tests for filtering, badges and message building |
| Scope creep into Pro | Pro is documentation and "coming soon" only — no fake UI |
