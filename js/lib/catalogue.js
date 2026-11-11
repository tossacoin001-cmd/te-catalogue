/** Pure catalogue logic — no DOM, no browser APIs. Unit tested. */

export const TYPE_LABEL = { physical: "Physical product", digital: "Digital download", service: "Service" };
export const TYPE_SHORT = { physical: "Physical", digital: "Digital", service: "Services" };

export const STOCK = {
  physical: { in: ["In stock", ""], low: ["Only a few left", "low"], out: ["Sold out", "out"] },
  digital: { in: ["Available now", ""], low: ["Available now", ""], out: ["Coming soon", "low"] },
  service: { in: ["Available", ""], low: ["A few slots left", "low"], out: ["Fully booked", "out"] }
};

export const DELIVERY = {
  physical: {
    title: "Delivered to your door",
    text: "Lagos delivery in 1–3 working days, 2–5 days nationwide. Delivery fee confirmed on WhatsApp before you pay."
  },
  digital: {
    title: "Instant delivery",
    text: "The business sends the download link or file in WhatsApp once payment is confirmed. Nothing ships and no address is needed."
  },
  service: {
    title: "Booked by appointment",
    text: "Choose a date and time on WhatsApp, then pay a deposit to confirm the booking. Slots reopen monthly."
  }
};

/** Fill in safe defaults so a half-filled client config never breaks the page. */
export function normaliseProduct(p, index = 0) {
  return {
    id: p.id || p.sku || `item-${index}`,
    sku: p.sku || "",
    name: p.name || "Untitled item",
    cat: p.cat || "Other",
    type: TYPE_LABEL[p.type] ? p.type : "physical",
    price: Number(p.price) || 0,
    was: p.was ? Number(p.was) : null,
    stock: STOCK.physical[p.stock] ? p.stock : "in",
    tone: p.tone || "#8A5A3B",
    icon: p.icon || "",
    img: p.img || "",
    desc: p.desc || "",
    variants: p.variants && Array.isArray(p.variants.options) && p.variants.options.length
      ? { label: p.variants.label || "Option", options: p.variants.options.slice() }
      : null
  };
}

export const normaliseProducts = products => (products || []).map(normaliseProduct);

export function money(currency, value) {
  return String(currency || "") + Number(value || 0).toLocaleString("en-NG");
}

export function stockState(product) {
  const table = STOCK[product.type] || STOCK.physical;
  const [label, tone] = table[product.stock] || table.in;
  return { label, tone };
}

export function isAvailable(product) {
  return product.stock !== "out";
}

/** Corner labels: at most one left and one right, never duplicated. */
export function badges(product) {
  const out = [];
  if (product.type === "digital") out.push({ text: "Instant download", tone: "muted", side: "left" });
  else if (product.type === "service") out.push({ text: "Book a session", tone: "muted", side: "left" });
  else if (product.was) out.push({ text: "Sale", tone: "sale", side: "left" });

  if (product.stock === "out") {
    const label = product.type === "service" ? "Fully booked" : product.type === "digital" ? "Coming soon" : "Sold out";
    out.push({ text: label, tone: "muted", side: "right" });
  } else if (product.was && product.type !== "physical") {
    out.push({ text: "Sale", tone: "sale", side: "right" });
  }
  return out;
}

export function filterProducts(products, { type = "all", category = "All", term = "" } = {}) {
  const q = String(term || "").trim().toLowerCase();
  return products.filter(p =>
    (type === "all" || p.type === type) &&
    (category === "All" || p.cat === category) &&
    (!q ||
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      (TYPE_LABEL[p.type] || "").toLowerCase().includes(q)));
}

/** Categories that actually contain items of the selected type. */
export function categoriesFor(products, type = "all") {
  const seen = [];
  for (const p of products) {
    if (type !== "all" && p.type !== type) continue;
    if (!seen.includes(p.cat)) seen.push(p.cat);
  }
  return seen;
}

export function resolveBusiness(businesses, slug, fallbackSlug) {
  return businesses.find(b => b.slug === slug) ||
    businesses.find(b => b.slug === fallbackSlug) ||
    businesses[0];
}

/**
 * Runtime overrides (server-injected config, QA fixtures).
 * Only shallow-merges the keys given, so a client config cannot be corrupted by accident.
 */
export function applyOverrides(business, overrides) {
  if (!overrides || typeof overrides !== "object") return business;
  const next = { ...business, ...overrides };
  next.hero = { ...business.hero, ...(overrides.hero || {}) };
  next.collection = { ...business.collection, ...(overrides.collection || {}) };
  next.products = normaliseProducts(overrides.products || business.products);
  return next;
}

export function isLive(business) {
  return business.mode === "live";
}

export function slugFromLocation(search) {
  const params = new URLSearchParams(search || "");
  return params.get("b") || "";
}
