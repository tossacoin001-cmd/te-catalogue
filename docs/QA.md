# QA — catalogue refinement

**Date:** 10 November 2026
**Target:** local production build of `te-catalogue`, then the live Cloudflare Worker
**Automated suite:** 65 tests (13 unit, 52 browser) — all passing

## Catalogue

| Check | Result |
| --- | --- |
| Products load for all three businesses (22 / 8 / 8) | Pass |
| Generated images render, consistent 4:5 cards, lazy loaded | Pass |
| Prices, sale prices and currency come from business config | Pass |
| Product sheets open with image, description, ref, stock and type | Pass |
| Type filter, category filter and search combine correctly | Pass |
| Empty search shows a clear message and a reset button | Pass |
| Category list only offers categories present for the selected type | Pass |

## WhatsApp

| Check | Result |
| --- | --- |
| Demo sheets create zero `wa.me` anchors | Pass |
| Demo preview shows name, price, quantity, SKU and variant | Pass |
| Quantity stepper clamps at 1 and updates the message | Pass |
| Variant select updates the message and preview | Pass |
| Live mode builds `https://wa.me/<business number>?text=…` | Pass |
| Message is URL-encoded (newlines, punctuation, `₦`) | Pass |
| Digital closing asks for payment details and the download link | Pass |
| Service closing asks for available dates and booking details | Pass |
| General enquiry link uses the live business number | Pass |
| Toss request goes to `2348087919951` with want/sell/package/brand/products/next step | Pass |
| Copy-message fallback appears after submit | Pass |

## Design and accessibility

| Check | Result |
| --- | --- |
| Desktop layout at 1280px | Reviewed |
| Mobile layout at 390px with no horizontal overflow | Pass |
| Header CTA hidden on mobile; sticky CTA visible | Pass |
| Images have alt text; cards are keyboard reachable (Enter/Space) | Pass |
| Modal closes on backdrop click, X and Escape; focus is restored | Pass |
| Quantity controls and variant select have labels | Pass |
| Brand accent, tint, theme colour and favicon change per business | Reviewed |
| Dark-mode variables preserved | Reviewed |

## Product boundaries

| Check | Result |
| --- | --- |
| Starter price ₦50,000, ≤10 products, 24-hour target shown | Pass |
| Pro shown as "Coming soon" with "no dashboard exists yet" | Pass |
| No fake dashboard, login, analytics or automation controls | Pass |
| No claim of automatic payment, confirmation, stock reservation or delivery | Pass |
| Demo storefronts remain `mode: "demo"` | Pass |

## Deployment

| Check | Result |
| --- | --- |
| No build step; ES modules served as static assets | Pass |
| `docs/`, tests, package files and repo files excluded from assets | Pass |
| Local production suite green before deploy | Pass |
| Previous deployed version available for rollback | Yes — tag `pre-refine-2026-11-10` |
| Live URL re-tested after deploy | See final report / deployment section |

## Known limitations

- The demo uses generated SVG tiles, not real client photography. A client can supply `img` URLs.
- Demo catalogues point every WhatsApp action at Toss Enterprise by client instruction; live mode is
  the client path and is exercised by tests through a runtime config override.
- Pro is documentation only. There is no authentication, database, dashboard or billing code.
- The request form composes a WhatsApp message in the browser; it does not store leads server-side.
