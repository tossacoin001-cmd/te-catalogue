/**
 * Toss Enterprise catalogue engine.
 *
 * One file drives every business in js/data/businesses.js.
 * The selected business comes from ?b=slug, with an optional runtime override
 * (window.__TE_CONFIG__) used by tests and by future server-injected config.
 */
import { TOSS, DEMO_ORDER } from "./config.js";
import { BUSINESSES, DEFAULT_SLUG } from "./data/businesses.js";
import {
  money, stockState, badges, filterProducts, categoriesFor,
  resolveBusiness, applyOverrides, isLive, slugFromLocation,
  normaliseProducts, TYPE_LABEL, TYPE_SHORT, DELIVERY
} from "./lib/catalogue.js";
import { waUrl, orderMessage, enquiryMessage, requestMessage } from "./lib/whatsapp.js";
import { tile } from "./lib/art.js";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channel = c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function mix(hex, target, amount) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const channel = shift => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * amount);
  };
  return "#" + ((1 << 24) + (channel(16) << 16) + (channel(8) << 8) + channel(0))
    .toString(16).slice(1);
}

function initials(name) {
  return String(name || "TE").split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word[0]).join("").toUpperCase();
}

function setMeta(attr, value) {
  const match = attr.match(/^([\w:-]+)="([^"]+)"$/);
  if (!match) return;
  const [, key, name] = match;
  let node = document.head.querySelector(`meta[${key}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(key, name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", value);
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
const state = {
  business: null,
  products: [],
  type: "all",
  cat: "All",
  term: "",
  current: null,
  qty: 1,
  variant: "",
  lastFocus: null
};

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
function boot() {
  const override = window.__TE_CONFIG__;
  let business = resolveBusiness(BUSINESSES, slugFromLocation(window.location.search), DEFAULT_SLUG);
  if (override && typeof override === "object" && override.slug) {
    business = resolveBusiness(BUSINESSES, override.slug, DEFAULT_SLUG);
  }
  if (override && typeof override === "object") {
    business = applyOverrides(business, override);
  }
  business.products = normaliseProducts(business.products);

  state.business = business;
  state.products = business.products;
  state.products.forEach((p, index) => { p.index = index; });

  applyTheme(business);
  renderIdentity();
  renderPackages();
  renderSwitcher();
  renderFooter();
  renderHero();
  bindGlobalEvents();
  renderTypeChips();
  renderCatChips();
  renderCatalogue();

  /* Compatibility + a small public surface for QA and future API work. */
  window.PRODUCTS = state.products;
  window.TE = {
    business,
    products: state.products,
    packages: TOSS.packages,
    toss: TOSS,
    live: isLive(business),
    orderText: (product, qty, variant) =>
      orderMessage({ business, product, qty, variant }),
    enquiryText: () => enquiryMessage(business)
  };
  window.__TE_READY__ = true;
}

/* ------------------------------------------------------------------ */
/* Theme + identity                                                    */
/* ------------------------------------------------------------------ */
function applyTheme(business) {
  const base = HEX.test(business.accent || "") ? business.accent : "#1E5B4B";
  const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const accent = dark ? mix(base, "#FFFFFF", 0.45) : base;
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--on-accent", luminance(accent) > 0.55 ? "#0B1410" : "#FFFFFF");
  root.style.setProperty("--tint", dark ? mix(accent, "#0F1512", 0.82) : mix(base, "#FFFFFF", 0.88));

  const mark = business.logo || initials(business.name);
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${esc(base)}"/><text x="32" y="43" font-family="Georgia,serif" font-size="26" fill="#fff" text-anchor="middle">${esc(mark)}</text></svg>`;
  const link = document.head.querySelector('link[rel="icon"]');
  if (link) link.setAttribute("href", "data:image/svg+xml," + encodeURIComponent(icon));

  const themeColor = document.head.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", base);
}

function renderIdentity() {
  const b = state.business;
  const description = b.description || b.tagline || "";

  document.title = `${b.name} — One-Link Catalogue by Toss Enterprise`;
  setMeta('name="description"', description);
  setMeta('property="og:title"', `${b.name} — One-Link Catalogue`);
  setMeta('property="og:description"', description);
  setMeta('property="og:site_name"', b.name);

  $("#logo").textContent = b.logo || initials(b.name);
  $("#bname").textContent = b.name;
  $("#btag").textContent = b.tagline || "";
  $("#banner").innerHTML = b.banner || "";
  $("#collectionTitle").textContent = b.collection ? b.collection.title : "The catalogue";
  $("#collectionNote").textContent = b.collection ? b.collection.note : "";
  $("#footerName").textContent = b.name;
  $("#footerNote").textContent = `Sample catalogue experience powered by Toss Enterprise.`;
  $("#contactWa").textContent = `WhatsApp: ${b.whatsappDisplay || TOSS.whatsappDisplay}`;
  $("#contactLoc").textContent = b.location || TOSS.location;
  $("#contactReply").textContent = TOSS.replyNote;

  const enquiry = $("#enquiryBtn");
  if (enquiry) {
    if (isLive(b)) {
      enquiry.href = waUrl(b.whatsapp, enquiryMessage(b));
      enquiry.hidden = false;
    } else {
      enquiry.hidden = true;
    }
  }

  const headerCta = $("#headerCta");
  if (headerCta) headerCta.hidden = isLive(b);

  const stickyRequest = $("#stickyRequest");
  const stickyEnquiry = $("#stickyEnquiry");
  if (stickyRequest && stickyEnquiry) {
    stickyRequest.hidden = isLive(b);
    stickyEnquiry.hidden = !isLive(b);
    if (isLive(b)) stickyEnquiry.href = waUrl(b.whatsapp, enquiryMessage(b));
  }
}

function renderHero() {
  const b = state.business;
  const hero = b.hero || {};
  $("#heroEyebrow").innerHTML = `<i></i>${esc(hero.eyebrow || "One link · every product")}`;
  $("#heroTitle").innerHTML = hero.title || `Your whole catalogue, <em>in one link.</em>`;
  $("#heroText").innerHTML = hero.text || "";
  $("#heroFine").textContent = hero.fine || "";

  const picks = [];
  (b.featured || []).forEach(sku => {
    const found = state.products.find(p => p.sku === sku);
    if (found && !picks.includes(found)) picks.push(found);
  });
  if (picks.length < 3) {
    for (const p of state.products) {
      if (picks.length >= 3) break;
      if (!picks.includes(p)) picks.push(p);
    }
  }
  $("#collage").innerHTML = picks.slice(0, 3).map(p =>
    `<img alt="${esc(p.name)}" src="${tile(p)}">`).join("");
}

/* ------------------------------------------------------------------ */
/* Commercial packages                                                 */
/* ------------------------------------------------------------------ */
function renderPackages() {
  $("#packageGrid").innerHTML = TOSS.packages.map(pkg => {
    const planned = pkg.status === "planned";
    return `<article class="package${planned ? " is-planned" : ""}">
      <div class="package-top">
        <h3>${esc(pkg.name)}</h3>
        <span class="pill ${planned ? "soon" : "now"}">${planned ? "Coming soon" : "Available now"}</span>
      </div>
      <p class="package-price">${esc(pkg.price)} <span>${esc(pkg.priceNote)}</span></p>
      <p class="package-blurb">${esc(pkg.blurb)}</p>
      <ul>${pkg.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      <button class="btn ${planned ? "ghost" : "primary"} block" data-request
        data-package="${esc(pkg.id === "pro" ? TOSS.request.packageOptions[2] : TOSS.request.packageOptions[0])}">
        ${planned ? "Join the Pro waitlist" : "Start with Starter"}
      </button>
      ${planned ? `<p class="package-note">Roadmap only — no dashboard exists yet. We'll tell you when it does.</p>` : ""}
    </article>`;
  }).join("");
}

/* ------------------------------------------------------------------ */
/* Demo catalogue switcher                                             */
/* ------------------------------------------------------------------ */
function renderSwitcher() {
  const entries = DEMO_ORDER
    .map(slug => resolveBusiness(BUSINESSES, slug, DEFAULT_SLUG))
    .filter(Boolean)
    .filter((b, i, all) => all.findIndex(x => x.slug === b.slug) === i);

  $("#bizswitch").innerHTML = entries.map(b => {
    const active = b.slug === state.business.slug;
    const label = `${esc(b.name)}<small>${esc(b.tagline || "")}</small>`;
    return active
      ? `<span class="biz active" aria-current="page">${label}</span>`
      : `<a class="biz" href="?b=${encodeURIComponent(b.slug)}#shop">${label}</a>`;
  }).join("");
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
function renderFooter() {
  const b = state.business;
  const links = [`<a href="#shop">Browse the catalogue</a>`];

  if (isLive(b)) {
    links.push(`<a href="${waUrl(b.whatsapp, enquiryMessage(b))}" target="_blank" rel="noopener">Chat on WhatsApp</a>`);
  } else {
    links.push(`<a href="#" data-request>Get your own catalogue</a>`);
  }
  links.push(`<a href="#packages">Packages</a>`);

  (b.social || [])
    .filter(s => s && /^https?:\/\//i.test(s.href || ""))
    .forEach(s => links.push(`<a href="${esc(s.href)}" target="_blank" rel="noopener">${esc(s.label)}</a>`));

  $("#footerLinks").innerHTML = links.join("");
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */
function orderedCategories() {
  const available = categoriesFor(state.products, state.type);
  const preferred = (state.business.categories || []).filter(c => available.includes(c));
  const rest = available.filter(c => !preferred.includes(c));
  return [...preferred, ...rest];
}

function renderTypeChips() {
  const items = [
    { id: "all", short: "Everything" },
    { id: "physical", short: TYPE_SHORT.physical },
    { id: "digital", short: TYPE_SHORT.digital },
    { id: "service", short: TYPE_SHORT.service }
  ];
  $("#typechips").innerHTML = items.map(t =>
    `<button class="chip" data-type="${t.id}" aria-pressed="${t.id === state.type}">${esc(t.short)}</button>`
  ).join("");
}

function renderCatChips() {
  const available = orderedCategories();
  if (state.cat !== "All" && !available.includes(state.cat)) state.cat = "All";
  const cats = ["All", ...available];
  $("#chips").innerHTML = cats.map(c =>
    `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${esc(c)}</button>`
  ).join("");
}

function badgeHtml(product) {
  return badges(product).map(b =>
    `<span class="tag${b.tone === "muted" ? " muted" : ""}"${b.side === "right" ? ' style="left:auto;right:10px"' : ""}>${esc(b.text)}</span>`
  ).join("");
}

function cardHtml(product) {
  const [stockLabel, stockTone] = [stockState(product).label, stockState(product).tone];
  return `<article class="card" data-i="${product.index}" data-type="${product.type}" data-cat="${esc(product.cat)}" data-sku="${esc(product.sku)}" tabindex="0" role="button" aria-label="View ${esc(product.name)}">
    <div class="ph">
      <img loading="lazy" alt="${esc(product.name)}" src="${tile(product)}">
      ${badgeHtml(product)}
    </div>
    <div class="in">
      <h3>${esc(product.name)}</h3>
      <small>${esc(product.cat)}</small>
      <div class="price">${money(state.business.currency, product.price)}${product.was ? `<s>${money(state.business.currency, product.was)}</s>` : ""}</div>
      <div class="stock"><i class="dot ${stockTone}"></i>${esc(stockLabel)}</div>
      <span class="view">View details
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </div>
  </article>`;
}

function renderCatalogue() {
  const list = filterProducts(state.products, {
    type: state.type,
    category: state.cat,
    term: state.term
  });

  const count = $("#count");
  count.textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;

  const grid = $("#grid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty">
      <b>Nothing matches that search.</b>
      <span>Try another name, category or type.</span>
      <button class="btn ghost sm" data-clear-filters>Clear filters</button>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(cardHtml).join("");
}

/* ------------------------------------------------------------------ */
/* Product sheet                                                       */
/* ------------------------------------------------------------------ */
function deliveryIcon(type) {
  if (type === "digital") {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  }
  if (type === "service") {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>';
  }
  return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
}

function openProduct(product) {
  state.current = product;
  state.qty = 1;
  state.variant = product.variants ? product.variants.options[0] : "";
  state.lastFocus = document.activeElement;
  renderSheet();
  openModal("#modal");
}

function openModal(selector) {
  const modal = $(selector);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(selector, restoreFocus = true) {
  const modal = $(selector);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (!$("#modal").classList.contains("open") && !$("#requestModal").classList.contains("open")) {
    document.body.style.overflow = "";
  }
  if (restoreFocus && state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
}

function orderContext(product) {
  const bits = [product.name, product.sku, TYPE_LABEL[product.type].toLowerCase()];
  if (state.qty > 1) bits.push(`qty ${state.qty}`);
  if (state.variant) bits.push(state.variant);
  return bits.filter(Boolean).join(" · ");
}

function renderSheet() {
  const p = state.current;
  if (!p) return;
  const b = state.business;
  const stock = stockState(p);
  const d = DELIVERY[p.type] || DELIVERY.physical;
  const live = isLive(b);
  const message = orderMessage({ business: b, product: p, qty: state.qty, variant: state.variant });

  const variantField = p.variants ? `
    <div class="field compact">
      <label for="sheetVariant">${esc(p.variants.label)}</label>
      <select id="sheetVariant">${p.variants.options.map(o =>
        `<option value="${esc(o)}"${o === state.variant ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>
    </div>` : "";

  const demoPreview = live ? "" : `
    <details class="preview order-preview">
      <summary>Preview the WhatsApp message</summary>
      <pre id="orderPreview">${esc(message)}</pre>
    </details>`;

  const action = live ? `
    <a class="btn wa block" id="orderLink" href="${waUrl(b.whatsapp, message)}" target="_blank" rel="noopener">
      ${p.type === "digital" ? "Buy on WhatsApp" : p.type === "service" ? "Book on WhatsApp" : "Order on WhatsApp"}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
    <p class="form-foot">Opens WhatsApp with this item, price, quantity and reference. Nothing is charged or confirmed automatically.</p>` : `
    <button class="btn primary block" data-request data-context="${esc(orderContext(p))}">
      Want this for yourself?
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
    <p class="form-foot">Tells us your brand and what you sell — we'll reply on WhatsApp.</p>
    <div class="note">
      <b>This is a demo</b>
      Ordering is switched off on the sample. In a live catalogue, ordering opens WhatsApp with the message below and the business confirms availability and delivery in the chat.
    </div>`;

  $("#sheet").innerHTML = `
    <div style="position:relative">
      <img class="prod-img" alt="${esc(p.name)}" src="${tile(p)}">
      <button class="x" aria-label="Close" data-close-product>×</button>
    </div>
    <div class="body">
      <h2 id="sheetTitle">${esc(p.name)}</h2>
      <div class="prod-meta">
        <span class="price">${money(b.currency, p.price)}${p.was ? `<s>${money(b.currency, p.was)}</s>` : ""}</span>
        <span class="stock"><i class="dot ${stock.tone}"></i>${esc(stock.label)}</span>
        <span class="stock">${esc(TYPE_LABEL[p.type])}</span>
        ${p.sku ? `<span class="stock">Ref ${esc(p.sku)}</span>` : ""}
      </div>
      <p class="prod-desc">${esc(p.desc)}</p>

      <div class="sheet-controls">
        ${variantField}
        <div class="qtyrow">
          <span>Quantity</span>
          <div class="stepper" role="group" aria-label="Quantity">
            <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
            <output id="qtyVal" aria-live="polite">${state.qty}</output>
            <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
          </div>
        </div>
      </div>

      ${action}

      <div class="delivery">
        ${deliveryIcon(p.type)}
        <div><b>${esc(d.title)}</b><p>${esc(d.text)}</p></div>
      </div>

      ${demoPreview}
    </div>`;

  bindSheet();
}

function bindSheet() {
  const sheet = $("#sheet");
  sheet.querySelector("[data-close-product]").onclick = () => closeModal("#modal");

  const variant = $("#sheetVariant");
  if (variant) {
    variant.addEventListener("change", e => {
      state.variant = e.target.value;
      refreshSheetOrder();
    });
  }

  sheet.querySelectorAll("[data-qty]").forEach(button => {
    button.addEventListener("click", () => {
      const delta = Number(button.dataset.qty);
      state.qty = Math.min(20, Math.max(1, state.qty + delta));
      $("#qtyVal").textContent = state.qty;
      refreshSheetOrder();
    });
  });

  sheet.querySelector("[data-close-product]").focus();
}

function refreshSheetOrder() {
  const p = state.current;
  const b = state.business;
  const message = orderMessage({ business: b, product: p, qty: state.qty, variant: state.variant });

  const preview = $("#orderPreview");
  if (preview) preview.textContent = message;

  const link = $("#orderLink");
  if (link) link.href = waUrl(b.whatsapp, message);

  const request = $("#sheet [data-request]");
  if (request) request.dataset.context = orderContext(p);
}

/* ------------------------------------------------------------------ */
/* Request form                                                        */
/* ------------------------------------------------------------------ */
function optionList(options, selected) {
  return options.map(o => {
    const isSelected = typeof selected === "string" ? o === selected : o === options[0];
    return `<option value="${esc(o)}"${isSelected ? " selected" : ""}>${esc(o)}</option>`;
  }).join("");
}

function openRequest(context = "", packageValue = "") {
  state.lastFocus = document.activeElement;
  const ctx = context || "";
  const pkg = packageValue || TOSS.request.packageOptions[0];

  $("#requestSheet").innerHTML = `
    <div class="body">
      <div class="form-head">
        <div class="ico">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.03.24-3.47-.73-2.94-1.17-4.8-4.2-4.94-4.4-.15-.2-1.18-1.58-1.18-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39.002.56.01.18.008.42-.068.66.5.24.58.83 2.01.9 2.16.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>
        </div>
        <div>
          <h2 id="reqTitle">Get your business catalogue</h2>
          <p>A few quick questions. Your answers go straight to our WhatsApp.</p>
        </div>
      </div>

      <form id="reqForm" novalidate>
        <div class="field">
          <label for="f-want">What do you want? <span>· required</span></label>
          <select id="f-want" name="want" required>${optionList(TOSS.request.wantOptions)}</select>
        </div>

        <div class="field">
          <label for="f-sell">What do you sell? <span>· required</span></label>
          <select id="f-sell" name="sell" required>${optionList(TOSS.request.sellOptions)}</select>
        </div>

        <div class="field">
          <label for="f-package">Which package? <span>· required</span></label>
          <select id="f-package" name="package" required>${optionList(TOSS.request.packageOptions, pkg)}</select>
        </div>

        <div class="field">
          <label for="f-brand">Your brand name <span>· required</span></label>
          <input id="f-brand" name="brand" type="text" placeholder="e.g. Ada's Closet, Lekki" required autocomplete="organization" maxlength="80">
        </div>

        <div class="field">
          <label for="f-products">Products or services you want to promote <span>· required</span></label>
          <textarea id="f-products" name="products" placeholder="e.g. 12 Ankara dresses, a 40-page ebook, 3 styling packages — or 20 phone cases. Photos and files are already on my phone." required maxlength="600"></textarea>
        </div>

        <div class="field">
          <label for="f-next">Next step <span>· required</span></label>
          <select id="f-next" name="next" required>${optionList(TOSS.request.nextOptions)}</select>
        </div>

        <div class="two">
          <div class="field">
            <label for="f-name">Your name <span>· optional</span></label>
            <input id="f-name" name="name" type="text" placeholder="First name is fine" autocomplete="name" maxlength="60">
          </div>
          <div class="field">
            <label for="f-phone">Your WhatsApp <span>· optional</span></label>
            <input id="f-phone" name="phone" type="tel" placeholder="0803 000 0000" autocomplete="tel" inputmode="tel" maxlength="24">
          </div>
        </div>

        <details class="preview">
          <summary>Preview the message we'll receive</summary>
          <pre id="msgPreview"></pre>
        </details>

        <button class="btn wa block" type="submit" id="sendBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.03.24-3.47-.73-2.94-1.17-4.8-4.2-4.94-4.4-.15-.2-1.18-1.58-1.18-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39.002.56.01.18.008.42-.068.66.5.24.58.83 2.01.9 2.16.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>
          Send to Toss Enterprise on WhatsApp
        </button>
        <p class="form-foot">Goes to <b>${esc(TOSS.whatsappDisplay)}</b> only. Nothing is stored on this site.</p>
        <button class="x" aria-label="Close" data-close-request type="button" style="background:var(--card);box-shadow:none;border:1px solid var(--line)">×</button>
      </form>
    </div>`;

  const form = $("#reqForm");
  const readForm = () => ({
    want: $("#f-want").value,
    sell: $("#f-sell").value,
    package: $("#f-package").value,
    brand: $("#f-brand").value.trim(),
    products: $("#f-products").value.trim(),
    next: $("#f-next").value,
    name: $("#f-name").value.trim(),
    phone: $("#f-phone").value.trim(),
    context: ctx
  });

  const refresh = () => {
    $("#msgPreview").textContent = requestMessage({ toss: TOSS, form: readForm() });
  };
  form.addEventListener("input", e => {
    if (e.target.classList) e.target.classList.remove("invalid");
    refresh();
  });
  form.addEventListener("change", refresh);
  refresh();

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = readForm();
    const missing = [];
    if (!data.brand) missing.push($("#f-brand"));
    if (!data.products) missing.push($("#f-products"));
    if (missing.length) {
      missing[0].focus();
      missing.forEach(el => el.classList.add("invalid"));
      return;
    }
    const text = requestMessage({ toss: TOSS, form: data });
    const url = waUrl(TOSS.whatsapp, text);
    window.open(url, "_blank", "noopener");
    showSent(text, url);
  });

  $("#requestSheet").querySelector("[data-close-request]").onclick = () => closeModal("#requestModal");
  openModal("#requestModal");
  setTimeout(() => { const el = $("#f-brand"); if (el) el.focus(); }, 260);
}

function showSent(text, url) {
  $("#requestSheet").innerHTML = `
    <div class="body">
      <div class="sent">
        <div class="tick">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2 id="reqTitle">Message ready</h2>
        <p>WhatsApp should have opened in a new tab with your details filled in. Just press send.</p>
        <a class="btn wa block" href="${url}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/></svg>
          Open WhatsApp again
        </a>
        <button class="copy" id="copyMsg" type="button">Copy the message instead</button>
        <p class="fallback">Nothing opened? Message <a href="${url}" target="_blank" rel="noopener">${esc(TOSS.whatsappDisplay)}</a> directly on WhatsApp.</p>
        <button class="btn ghost block" style="margin-top:18px" data-close-request type="button">Back to the catalogue</button>
      </div>
    </div>`;

  $("#copyMsg").onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      $("#copyMsg").textContent = "Copied ✓";
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      $("#copyMsg").textContent = "Copied ✓";
    }
  };

  const buttons = $$("#requestSheet [data-close-request]");
  buttons.forEach(button => { button.onclick = () => closeModal("#requestModal"); });
  if (buttons[0]) buttons[0].focus();
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */
function bindGlobalEvents() {
  $("#typechips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.type = chip.dataset.type;
    state.cat = "All";
    renderTypeChips();
    renderCatChips();
    renderCatalogue();
  });

  $("#chips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.cat = chip.dataset.cat;
    renderCatChips();
    renderCatalogue();
  });

  const search = $("#q");
  search.addEventListener("input", e => {
    state.term = e.target.value.trim().toLowerCase();
    renderCatalogue();
  });

  $("#grid").addEventListener("click", e => {
    const clear = e.target.closest("[data-clear-filters]");
    if (clear) {
      state.type = "all";
      state.cat = "All";
      state.term = "";
      search.value = "";
      renderTypeChips();
      renderCatChips();
      renderCatalogue();
      return;
    }
    const card = e.target.closest(".card");
    if (card) openProduct(state.products[Number(card.dataset.i)]);
  });

  $("#grid").addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    openProduct(state.products[Number(card.dataset.i)]);
  });

  document.addEventListener("click", e => {
    const trigger = e.target.closest("[data-request]");
    if (!trigger) return;
    e.preventDefault();
    openRequest(trigger.dataset.context || "", trigger.dataset.package || "");
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        closeModal(`#${modal.id}`);
      }
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if ($("#requestModal").classList.contains("open")) closeModal("#requestModal");
    else if ($("#modal").classList.contains("open")) closeModal("#modal");
  });
}

/* ------------------------------------------------------------------ */
boot();
