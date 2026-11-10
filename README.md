# The Market Edit — One-Link Catalogue

A live, shareable demo of a one-link catalogue built by **Toss Enterprise**.
One link carries **physical products, digital products and services** — and every order, download or
booking lands in WhatsApp. No app, no checkout, no account.

**Live:** https://te-catalogue.tossacoin001.workers.dev

## What the demo shows

| Type | How it behaves in the demo |
| --- | --- |
| **Physical products** | Stock badges, sale prices, delivery fee confirmed in chat |
| **Digital products** | "Instant download" badge, file or link sent in chat after payment, no shipping |
| **Services** | "Book a session" badge, appointment/deposit flow, availability instead of stock |

The catalogue filters by seller type (`Everything / Physical / Digital / Services`) and by category,
and searches across names, categories and types.

## How the request flow works

Product cards deliberately do **not** link to WhatsApp. Every "Want this for yourself?" button
(header, hero, product sheet, mid-page CTA, footer, mobile sticky bar) opens a short form that asks:

1. **What do you want?** — catalogue / catalogue + WhatsApp ordering / ordering only / advise me
2. **What do you sell?** — physical products / digital products / services / a mix of all three
3. **Brand name**
4. **Products or services you want to promote**
5. **Next step** — pricing / 15-min call / build it now / examples first
6. Name and WhatsApp number (optional)

On submit the site builds a formatted message and opens WhatsApp to **0808 791 9951**
(`2348087919951`) with those exact answers, plus a fallback "copy message" option.

Nothing is stored or sent to a server — the message is composed in the browser and handed to WhatsApp.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site (HTML, CSS, JS, demo data) |
| `404.html` | Friendly not-found page |
| `tests/site.test.mjs` | End-to-end test suite (Playwright + node:test) |
| `tests/helpers/server.mjs` | Static server and Chromium resolver used by the tests |
| `wrangler.jsonc` | Cloudflare deploy config (static assets, `te-catalogue`) |
| `.assetsignore` | Keeps repo and test files out of the deployed site |
| `_headers` | Security headers (used if the site is hosted on Pages) |
| `README.md` | This file |

## Editing

Open `index.html`. Everything a client needs to change lives in two blocks near the top of the
`<script>`: `CONFIG` (name, WhatsApp number, currency, banner, categories, seller types) and
`PRODUCTS` (name, category, **type** (`physical` / `digital` / `service`), price, stock, tone,
description). Add `img: "https://…"` to a product to use a real photo instead of the generated tile.

To point requests at a different number, change `CONFIG.whatsapp` to the international format
(no `+`, no leading `0`) and `CONFIG.whatsappDisplay` to the local format.

## Test

```bash
npm install
npm test
```

The suite drives a real Chromium against a local copy of the site and checks 23 behaviours:
every product renders, no WhatsApp deep links leak into the catalogue, all three seller types exist,
filters and search work, each type explains its own fulfilment, the request form validates, and the
message sent to `2348087919951` contains brand, products, seller type and next step.

## Deploy

```bash
npx wrangler deploy
```

Deploys the current folder to the Cloudflare Worker `te-catalogue` →
https://te-catalogue.tossacoin001.workers.dev

To use your own domain, add a custom domain to `te-catalogue` in the Cloudflare dashboard
(Workers & Pages → te-catalogue → Settings → Domains & Routes).
