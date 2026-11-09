# The Market Edit — One-Link Catalogue

A live, shareable demo of a one-link product catalogue built by **Toss Enterprise**.
Customers browse every product on one page and orders land in WhatsApp — no app, no checkout, no account.

**Live:** https://te-catalogue.pages.dev

## How the request flow works

Product cards deliberately do **not** link to WhatsApp. Every "Want this for yourself?" button
(header, hero, product sheet, mid-page CTA, footer, mobile sticky bar) opens a short form that asks:

1. **What do you want?** — catalogue / catalogue + WhatsApp ordering / ordering only / advise me
2. **Brand name**
3. **Products you want to promote**
4. **Next step** — pricing / 15-min call / build it now / examples first
5. Name and WhatsApp number (optional)

On submit the site builds a formatted message and opens WhatsApp to **0808 791 9951**
(`2348087919951`) with those exact answers, plus a fallback "copy message" option.

Nothing is stored or sent to a server — the message is composed in the browser and handed to WhatsApp.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site (HTML, CSS, JS, demo data) |
| `_headers` | Cloudflare Pages security + caching headers |
| `README.md` | This file |

## Editing

Open `index.html`. Everything a client needs to change lives in two blocks near the top of the
`<script>`: `CONFIG` (name, WhatsApp number, currency, banner, categories) and `PRODUCTS`
(name, category, price, stock, tone, description). Add an `img: "https://…"` to a product to use a
real photo instead of the generated tile.

To point requests at a different number, change `CONFIG.whatsapp` to the international format
(no `+`, no leading `0`) and `CONFIG.whatsappDisplay` to the local format.

## Deploy

```bash
npx wrangler pages deploy . --project-name te-catalogue --branch main
```

Or connect the GitHub repo (`tossacoin001-cmd/te-catalogue`) to Cloudflare Pages with build command
`none` and output directory `/`.
