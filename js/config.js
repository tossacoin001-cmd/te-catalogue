/**
 * Toss Enterprise — platform configuration.
 * Everything a *client* changes lives in js/data/businesses.js.
 * Everything Toss changes about how it sells lives here.
 */
export const TOSS = {
  name: "Toss Enterprise",
  /* International format: no plus, no leading zero. */
  whatsapp: "2348087919951",
  whatsappDisplay: "0808 791 9951",
  location: "Lagos, Nigeria",
  replyNote: "Usually replies within a few hours",

  packages: [
    {
      id: "starter",
      name: "Catalogue Starter",
      price: "₦50,000",
      priceNote: "one-off setup",
      status: "available",
      blurb: "Everything you need to sell from one link, live within 24 hours.",
      features: [
        "Up to 10 products or services",
        "Your logo, colours and categories",
        "WhatsApp order buttons",
        "Shareable catalogue link",
        "Mobile-first storefront",
        "Live within 24 hours"
      ]
    },
    {
      id: "pro",
      name: "Catalogue Pro",
      price: "Coming soon",
      priceNote: "on the roadmap",
      status: "planned",
      blurb: "Self-serve control for brands that change products often.",
      features: [
        "Merchant dashboard and login",
        "Edit products, prices and stock yourself",
        "Variants, promotions and themes",
        "Enquiry tracking and analytics",
        "Custom domain"
      ]
    }
  ],

  request: {
    wantOptions: [
      "A one-link catalogue like this",
      "A catalogue plus WhatsApp ordering",
      "Just the WhatsApp ordering setup",
      "Not sure yet — advise me"
    ],
    sellOptions: [
      "Physical products",
      "Digital products",
      "Services",
      "A mix of all three"
    ],
    packageOptions: [
      "Catalogue Starter — ₦50,000",
      "Not sure yet — advise me",
      "Catalogue Pro — add me to the waitlist"
    ],
    nextOptions: [
      "Send me pricing",
      "Book a 15-minute call",
      "Build it now — I'm ready",
      "Send examples first"
    ]
  }
};

/** Demo catalogues shown in the footer switcher, in order. */
export const DEMO_ORDER = ["market-edit", "mamas-kitchen", "volt-gadgets"];
