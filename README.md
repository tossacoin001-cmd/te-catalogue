# Toss Enterprise — WhatsApp catalogue engine

A reusable, static, WhatsApp-first catalogue product. One link carries a business's products and
services; every enquiry lands in the merchant's WhatsApp. No app, no checkout, no customer accounts.

**Live:** https://te-catalogue.tossacoin001.workers.dev

The deployment hosts three demo businesses on the same engine:

| URL | Business | Industry |
| --- | --- | --- |
| `/` or `/?b=market-edit` | The Market Edit | Fashion, beauty, accessories, digital downloads, services |
| `/?b=mamas-kitchen` | Mama's Kitchen | Food, cakes, meal prep, catering |
| `/?b=volt-gadgets` | Volt Gadgets | Electronics, audio, repairs |

Use the switcher near the footer to move between them.

## Product tiers

| | Catalogue Starter | Catalogue Pro |
| --- | --- | --- |
| Status | Available now | Roadmap only |
| Price | ₦50,000 one-off setup | Not priced |
| Scope | One catalogue, up to 10 products or services, logo, categories, WhatsApp ordering, shareable link, live within 24 hours | Merchant dashboard, self-serve editing, variants, promotions, analytics, custom domain |
| Where | Rendered in `#packages` | Listed as coming soon — **no dashboard exists** |

The demo never claims automatic payment, automatic order confirmation, inventory reservation or
automatic digital delivery. WhatsApp starts the conversation; the merchant confirms the sale.

## Demo mode vs live mode

Every business has a `mode`:

- `mode: "demo"` — product ordering is a preview only. The sheet shows exactly what the WhatsApp
  message would contain, but creates **no `wa.me` links**. The only WhatsApp destination is Toss
  Enterprise, reached through the "Want this for yourself?" request form. All three shipped demos
  use this mode.
- `mode: "live"` — a real client catalogue. Product sheets get a working order button, the header
  and mobile bar get a general enquiry button, and every link points at that business's own number.

Live mode is covered by tests through a `window.__TE_CONFIG__` runtime override, so the shipped demos
stay safe while the client path is verified.

## How the request flow works

"Get Your Business Catalogue" (header, hero, packages, product sheet, final CTA, mobile bar) opens a
short form: what they want, what they sell, package, brand, products, next step, optional name and
number. On submit it opens WhatsApp to **0808 791 9951** (`2348087919951`) with a formatted message,
plus a "copy the message" fallback. Nothing is stored on the site.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and the complete design system (CSS) |
| `js/app.js` | DOM wiring, rendering, product sheet, request form |
| `js/config.js` | Toss sales details, packages, request-form options |
| `js/data/businesses.js` | All demo businesses and their products |
| `js/lib/catalogue.js` | Pure catalogue logic: normalisation, money, stock, badges, filters |
| `js/lib/whatsapp.js` | Pure message builders and `wa.me` URL encoding |
| `js/lib/art.js` | Generated SVG product tiles (no image hosting needed) |
| `tests/logic.test.mjs` | Unit tests for the pure engine |
| `tests/site.test.mjs` | End-to-end tests (Playwright + `node:test`) |
| `tests/live-smoke.mjs` | Read-only smoke test against the deployed URL |
| `wrangler.jsonc` | Cloudflare Worker config (static assets) |
| `.assetsignore` | Keeps tests, docs and repo files out of the deployment |

There is no build step. The browser loads ES modules directly, so the Cloudflare deploy stays a
plain static upload.

## Add a new business catalogue

1. Open `js/data/businesses.js` and copy one business object.
2. Give it a unique `slug`, `name`, `whatsapp` (international digits only), `whatsappDisplay`,
   `currency`, `accent`, `location`, `mode` and `hero` / `collection` copy.
3. Add `products`. Each product needs `sku`, `name`, `cat`, `type`
   (`physical` / `digital` / `service`), `price`, `stock` (`in` / `low` / `out`) and `desc`.
   Optional: `was`, `tone`, `icon`, `img`, `variants`. See the field notes at the top of the file.
4. Add the slug to `DEMO_ORDER` in `js/config.js` if it should appear in the demo switcher.
5. Set `mode: "live"` only when the client's number and products are approved.
6. For a dedicated link, deploy the same engine and share `https://…/?b=their-slug`. A future Pro
   step is mapping a custom domain or subdomain to that slug.

Real photos can be used with `img: "https://…"`; otherwise a branded SVG tile is generated from
`tone` and `icon`.

## Test

```bash
npm install
npm test                 # pure logic + browser suite
npm run test:logic       # fast, no browser
npm run test:site        # Playwright against a local server
npm run test:live        # read-only smoke test against the deployed URL
```

The suite checks product rendering across all three businesses, filters and search, empty states,
quantity and variants, demo-mode link safety, live-mode message content and number, package
copy, the Toss request flow, mobile layout, the 404 page and the demo switcher.

## Deploy

```bash
npx wrangler deploy
```

Deploys the current folder to the Cloudflare Worker `te-catalogue` →
https://te-catalogue.tossacoin001.workers.dev

Rollback point before this refinement: tag `pre-refine-2026-11-10` (commit `f81b521`).

To use a custom domain, add it to `te-catalogue` in the Cloudflare dashboard
(Workers & Pages → te-catalogue → Settings → Domains & Routes).
