/**
 * The Market Edit — one-link catalogue demo.
 * Written before the build: these tests describe what the finished demo must do,
 * for physical products, digital products and services alike.
 */
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { startServer, chromiumExecutable } from "./helpers/server.mjs";

const WA_NUMBER = "2348087919951";
const WA_DISPLAY = "0808 791 9951";

let server;
let browser;
let context;
let page;

before(async () => {
  server = await startServer();
  browser = await chromium.launch({ executablePath: chromiumExecutable(), headless: true });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

beforeEach(async () => {
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    window.__opened = [];
    window.open = url => {
      window.__opened.push(String(url));
      return null;
    };
  });
  context.setDefaultTimeout(8000);
  context.setDefaultNavigationTimeout(15000);
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, route => route.abort());
  page = await context.newPage();
  await page.goto(server.url + "/", { waitUntil: "load" });
});

/** Re-open the app with a runtime config override (used for live-mode tests). */
const openWith = async ({ config = null, path = "/", viewport = { width: 1280, height: 900 } } = {}) => {
  await context.close();
  context = await browser.newContext({ viewport });
  await context.addInitScript(cfg => {
    window.__opened = [];
    window.open = url => {
      window.__opened.push(String(url));
      return null;
    };
    if (cfg) window.__TE_CONFIG__ = cfg;
  }, config);
  context.setDefaultTimeout(8000);
  context.setDefaultNavigationTimeout(15000);
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, route => route.abort());
  page = await context.newPage();
  await page.goto(server.url + path, { waitUntil: "load" });
  await page.waitForFunction(() => window.__TE_READY__ === true);
};

const openForm = async () => {
  await page.click("header [data-request]");
  await page.waitForSelector("#requestModal.open");
};

const fillForm = async (overrides = {}) => {
  const data = {
    want: "A one-link catalogue like this",
    sell: "Digital products",
    brand: "Ada's Closet",
    products: "12 Ankara dresses, 6 skincare bundles",
    next: "Send me pricing",
    name: "Ada",
    phone: "0803 111 2222",
    ...overrides
  };
  await page.selectOption("#f-want", data.want);
  await page.selectOption("#f-sell", data.sell);
  await page.fill("#f-brand", data.brand);
  await page.fill("#f-products", data.products);
  await page.selectOption("#f-next", data.next);
  await page.fill("#f-name", data.name);
  await page.fill("#f-phone", data.phone);
  return data;
};

const submittedText = async () => {
  const urls = await page.evaluate(() => window.__opened);
  assert.equal(urls.length, 1, "exactly one WhatsApp window should be opened");
  return new URL(urls[0]).searchParams.get("text");
};

/* ------------------------------------------------------------------ */
describe("Catalogue page", () => {
  test("loads with the brand, a hero and no console errors", async () => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.reload({ waitUntil: "load" });

    assert.match(await page.title(), /Market Edit/);
    assert.match(await page.textContent("h1"), /catalogue/i);
    assert.deepEqual(errors, []);
  });

  test("renders every product in the demo data", async () => {
    const total = await page.evaluate(() => PRODUCTS.length);
    const cards = await page.locator("#grid .card").count();
    assert.equal(cards, total);
    assert.ok(total >= 20, `expected a fuller catalogue, got ${total}`);
  });

  test("covers physical products, digital products and services", async () => {
    const counts = await page.evaluate(() =>
      PRODUCTS.reduce((acc, p) => ({ ...acc, [p.type]: (acc[p.type] || 0) + 1 }), {}));
    assert.ok(counts.physical >= 3, "physical products");
    assert.ok(counts.digital >= 3, "digital products");
    assert.ok(counts.service >= 3, "services");
  });

  test("exposes no WhatsApp order links anywhere in the catalogue", async () => {
    assert.equal(await page.locator('a[href*="wa.me"]').count(), 0);
    const opens = await page.evaluate(() => window.__opened);
    assert.deepEqual(opens, []);
  });

  test("filters by seller type: physical, digital, services", async () => {
    for (const type of ["physical", "digital", "service"]) {
      await page.click(`.chip[data-type="${type}"]`);
      const types = await page.$$eval("#grid .card", els => els.map(e => e.dataset.type));
      assert.ok(types.length > 0, `${type} filter should show items`);
      assert.deepEqual([...new Set(types)], [type], `${type} filter must only show ${type} items`);
    }

    await page.click('.chip[data-type="all"]');
    const all = await page.$$eval("#grid .card", els => els.map(e => e.dataset.type));
    assert.ok(new Set(all).size >= 3);
  });

  test("labels digital items as instant downloads and services as bookable", async () => {
    const digital = page.locator('#grid .card[data-type="digital"]').first();
    assert.match(await digital.innerText(), /instant download/i);

    const service = page.locator('#grid .card[data-type="service"]').first();
    assert.match(await service.innerText(), /book/i);
  });

  test("still filters by category and search", async () => {
    await page.click('.chip[data-cat="Fashion"]');
    const cats = await page.$$eval("#grid .card", els => els.map(e => e.dataset.cat));
    assert.ok(cats.length && cats.every(c => c === "Fashion"));

    await page.click('.chip[data-cat="All"]');
    await page.fill("#q", "serum");
    await page.waitForFunction(() => document.querySelectorAll("#grid .card").length === 1);
    assert.match(await page.textContent("#grid .card"), /Vitamin C/i);
  });
});

/* ------------------------------------------------------------------ */
describe("Product details sheet", () => {
  const openProduct = async name => {
    await page.locator("#grid .card", { hasText: name }).first().click();
    await page.waitForSelector("#modal.open");
    return page.locator("#sheet");
  };

  test("opens with no WhatsApp link and a single request CTA", async () => {
    const sheet = await openProduct("Classic Leather Bag");
    assert.equal(await page.locator('#modal a[href*="wa.me"]').count(), 0);
    assert.equal(await page.locator("#sheet [data-request]").count(), 1);
    await page.click("#sheet [data-close-product]");
    assert.equal(await page.locator("#modal.open").count(), 0);
  });

  test("explains instant delivery for a digital product", async () => {
    const sheet = await openProduct("Notion Business Template Pack");
    const text = await sheet.innerText();
    assert.match(text, /instant/i);
    assert.match(text, /download|file|link/i);
    assert.doesNotMatch(text, /shipping fee/i);
  });

  test("explains booking for a service", async () => {
    const sheet = await openProduct("Personal Styling Session");
    const text = await sheet.innerText();
    assert.match(text, /book|session|appointment/i);
    assert.doesNotMatch(text, /shipping fee/i);
  });

  test("explains delivery for a physical product", async () => {
    const sheet = await openProduct("Classic Leather Bag");
    assert.match(await sheet.innerText(), /deliver/i);
  });
});

/* ------------------------------------------------------------------ */
describe("'Want this for yourself?' request form", () => {
  test("opens from the header and asks what they want, what they sell and their brand", async () => {
    await openForm();
    assert.equal(await page.locator("#f-want").count(), 1);
    assert.equal(await page.locator("#f-sell").count(), 1);
    assert.equal(await page.locator("#f-brand").count(), 1);
    assert.equal(await page.locator("#f-products").count(), 1);
    assert.equal(await page.locator("#f-next").count(), 1);
  });

  test("offers physical products, digital products and services as seller types", async () => {
    await openForm();
    const options = await page.$$eval("#f-sell option", els => els.map(e => e.textContent.trim()));
    assert.ok(options.some(o => /physical/i.test(o)));
    assert.ok(options.some(o => /digital/i.test(o)));
    assert.ok(options.some(o => /service/i.test(o)));
  });

  test("blocks an empty submit", async () => {
    await openForm();
    await page.click("#sendBtn");
    assert.deepEqual(await page.evaluate(() => window.__opened), []);
    assert.equal(await page.locator("#f-brand").count(), 1, "form stays open");
    assert.equal(await page.locator("#f-brand.invalid").count(), 1);
  });

  test("sends exactly what they want, their brand, products and next step to the DM", async () => {
    await openForm();
    const data = await fillForm();
    await page.click("#sendBtn");

    const url = (await page.evaluate(() => window.__opened))[0];
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, `https://wa.me/${WA_NUMBER}`);

    const text = parsed.searchParams.get("text");
    assert.ok(text.includes(data.brand), "brand");
    assert.ok(text.includes(data.products), "products");
    assert.ok(text.includes(data.next), "next step");
    assert.ok(text.includes(data.want), "what they want");
    assert.ok(text.includes(data.sell), "what they sell");
    assert.ok(text.includes(data.name), "name");
    assert.ok(text.includes(data.phone), "their number");
    assert.match(text, /WHAT I WANT/);
    assert.match(text, /MY BRAND/);
    assert.match(text, /PRODUCTS/);
    assert.match(text, /NEXT STEP/);
  });

  test("keeps the preview and the sent message in sync", async () => {
    await openForm();
    await fillForm({ products: "Something very specific" });
    await page.click(".preview summary");
    const preview = await page.textContent("#msgPreview");
    await page.click("#sendBtn");
    assert.equal(await submittedText(), preview);
  });

  test("carries the product they were viewing into the message", async () => {
    await page.locator("#grid .card", { hasText: "Ankara Wrap Dress" }).first().click();
    await page.click("#sheet [data-request]");
    await fillForm();
    await page.click("#sendBtn");
    assert.match(await submittedText(), /Ankara Wrap Dress/);
  });

  test("shows a confirmation with a copy fallback and closes cleanly", async () => {
    await openForm();
    await fillForm();
    await page.click("#sendBtn");
    await page.waitForSelector("#requestSheet .sent");
    assert.match(await page.textContent("#requestSheet"), /copy/i);
    assert.match(await page.textContent("#requestSheet"), new RegExp(WA_DISPLAY.replace(/ /g, "\\s?")));
    await page.click("#requestSheet [data-close-request]");
    assert.equal(await page.locator("#requestModal.open").count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  });

  test("the WhatsApp number is visible for people who would rather message directly", async () => {
    assert.match(await page.textContent("body"), new RegExp(WA_DISPLAY.replace(/ /g, "\\s?")));
  });
});

/* ------------------------------------------------------------------ */
describe("Sharing, links and pages", () => {
  test("has no dead links: every '#' anchor is wired to the request flow", async () => {
    const dead = await page.$$eval("a", els =>
      els.filter(a => (a.getAttribute("href") || "") === "#" && !a.hasAttribute("data-request")).length);
    assert.equal(dead, 0);
  });

  test("offers a mobile sticky CTA", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator(".sticky [data-request]").isVisible());
  });

  test("serves a friendly 404 that links home", async () => {
    const res = await page.goto(server.url + "/this-page-does-not-exist");
    assert.equal(res.status(), 404);
    assert.match(await page.textContent("h1"), /moved on/i);
    assert.equal(await page.getAttribute("main a", "href"), "/");
  });

  test("credits Toss Enterprise and flags the page as a demo", async () => {
    assert.match(await page.textContent("footer"), /Toss Enterprise/);
    assert.match(await page.textContent(".banner"), /demo/i);
  });
});

/* ------------------------------------------------------------------ */
describe("Multi-business engine", () => {
  test("serves a second, food-industry catalogue from the same engine", async () => {
    await page.goto(server.url + "/?b=mamas-kitchen", { waitUntil: "load" });
    await page.waitForFunction(() => window.__TE_READY__ === true);

    assert.match(await page.title(), /Mama's Kitchen/);
    assert.match(await page.textContent("#bname"), /Mama's Kitchen/);
    assert.match(await page.textContent("#heroTitle"), /Party food/i);
    assert.equal(await page.locator("#grid .card").count(), 8);
    assert.equal(await page.evaluate(() => window.TE.business.slug), "mamas-kitchen");

    await page.click('.chip[data-cat="Mains"]');
    assert.ok(await page.locator("#grid .card").count() >= 3);
  });

  test("serves an electronics catalogue and falls back safely for unknown slugs", async () => {
    await page.goto(server.url + "/?b=volt-gadgets#shop", { waitUntil: "load" });
    await page.waitForFunction(() => window.__TE_READY__ === true);
    assert.match(await page.textContent("#bname"), /Volt Gadgets/);
    assert.equal(await page.locator("#grid .card").count(), 8);

    await page.goto(server.url + "/?b=not-a-real-business", { waitUntil: "load" });
    await page.waitForFunction(() => window.__TE_READY__ === true);
    assert.match(await page.textContent("#bname"), /The Market Edit/);
  });

  test("the demo switcher moves between all three catalogues", async () => {
    assert.equal(await page.locator("#bizswitch .biz").count(), 3);
    assert.match(await page.textContent("#bizswitch .biz.active"), /The Market Edit/);

    await page.click('#bizswitch a[href*="volt-gadgets"]');
    await page.waitForLoadState("load");
    await page.waitForFunction(() => window.__TE_READY__ === true);
    assert.match(await page.textContent("#bname"), /Volt Gadgets/);
    assert.match(page.url(), /b=volt-gadgets/);
  });

  test("keeps every shipped demo free of WhatsApp order links", async () => {
    for (const slug of ["market-edit", "mamas-kitchen", "volt-gadgets"]) {
      await page.goto(server.url + `/?b=${slug}`, { waitUntil: "load" });
      await page.waitForFunction(() => window.__TE_READY__ === true);
      assert.equal(await page.locator('a[href*="wa.me"]').count(), 0, slug);
      assert.equal(await page.evaluate(() => window.TE.business.mode), "demo", slug);
    }
  });
});

/* ------------------------------------------------------------------ */
describe("Product quantity and variants", () => {
  test("updates the demo order preview with quantity, variant, price and reference", async () => {
    await page.locator("#grid .card", { hasText: "Classic Leather Bag" }).first().click();
    await page.waitForSelector("#modal.open");

    await page.click('#sheet [data-qty="1"]');
    await page.click('#sheet [data-qty="1"]');
    await page.selectOption("#sheetVariant", "Cream");

    assert.equal(await page.textContent("#qtyVal"), "3");
    const preview = await page.textContent("#orderPreview");
    assert.match(preview, /Classic Leather Bag/);
    assert.match(preview, /Price: ₦35,000/);
    assert.match(preview, /Quantity: 3/);
    assert.match(preview, /Colour: Cream/);
    assert.match(preview, /Ref: ME-F01/);

    assert.equal(await page.locator('#modal a[href*="wa.me"]').count(), 0);
    assert.equal(await page.locator("#sheet [data-request]").count(), 1);
  });

  test("never drops below one item", async () => {
    await page.locator("#grid .card", { hasText: "Classic Leather Bag" }).first().click();
    await page.waitForSelector("#modal.open");
    await page.click('#sheet [data-qty="-1"]');
    assert.equal(await page.textContent("#qtyVal"), "1");
  });
});

/* ------------------------------------------------------------------ */
describe("Live catalogue mode", () => {
  const LIVE = { mode: "live", whatsapp: "2348012345678", whatsappDisplay: "0801 234 5678" };

  test("builds a correctly encoded product order for the business number", async () => {
    await openWith({ config: LIVE });
    await page.locator("#grid .card", { hasText: "Classic Leather Bag" }).first().click();
    await page.waitForSelector("#modal.open");

    await page.click('#sheet [data-qty="1"]');
    await page.selectOption("#sheetVariant", "Black");
    const href = await page.getAttribute("#orderLink", "href");
    const url = new URL(href);

    assert.equal(url.origin + url.pathname, "https://wa.me/2348012345678");
    const text = url.searchParams.get("text");
    assert.match(text, /Classic Leather Bag/);
    assert.match(text, /Price: ₦35,000/);
    assert.match(text, /Quantity: 2/);
    assert.match(text, /Ref: ME-F01/);
    assert.match(text, /Colour: Black/);
    assert.match(text, /confirm availability and delivery/i);
    assert.equal(await page.locator('#modal a[href*="wa.me"]').count(), 1);
    assert.equal(await page.locator("#sheet [data-request]").count(), 0);
  });

  test("shows a working general enquiry button in the header", async () => {
    await openWith({ config: LIVE });
    const link = page.locator("#enquiryBtn");
    assert.ok(await link.isVisible());

    const url = new URL(await link.getAttribute("href"));
    assert.equal(url.origin + url.pathname, "https://wa.me/2348012345678");
    assert.match(url.searchParams.get("text"), /found your catalogue/i);
    assert.equal(await page.locator("#headerCta").isVisible(), false, "no Toss sales CTA is shown on a live client catalogue");
  });

  test("keeps digital ordering accurate", async () => {
    await openWith({ config: LIVE });
    await page.locator("#grid .card", { hasText: "Notion Business Template Pack" }).first().click();
    await page.waitForSelector("#modal.open");
    assert.match(await page.textContent("#orderLink"), /Buy on WhatsApp/);
    const text = new URL(await page.getAttribute("#orderLink", "href")).searchParams.get("text");
    assert.match(text, /download link/i);
    assert.doesNotMatch(text, /shipping/i);
  });
});

/* ------------------------------------------------------------------ */
describe("Commercial packages", () => {
  test("presents Starter with its price and delivery target, and Pro honestly", async () => {
    const packages = page.locator("#packages");
    await packages.scrollIntoViewIfNeeded();
    const text = await packages.innerText();
    assert.match(text, /Catalogue Starter/);
    assert.match(text, /₦50,000/);
    assert.match(text, /10 products/i);
    assert.match(text, /24 hours/i);
    assert.match(text, /Catalogue Pro/);
    assert.match(text, /Coming soon/);
    assert.match(text, /no dashboard exists yet/i);
  });

  test("preselects the package and sends it to Toss WhatsApp", async () => {
    await page.locator(".package").first().locator("button").click();
    await page.waitForSelector("#requestModal.open");
    assert.equal(await page.inputValue("#f-package"), "Catalogue Starter — ₦50,000");

    await page.fill("#f-brand", "Ada's Closet");
    await page.fill("#f-products", "10 Ankara dresses");
    await page.click("#sendBtn");

    const url = new URL((await page.evaluate(() => window.__opened))[0]);
    assert.equal(url.origin + url.pathname, `https://wa.me/${WA_NUMBER}`);
    const text = url.searchParams.get("text");
    assert.match(text, /PACKAGE/);
    assert.match(text, /Catalogue Starter — ₦50,000/);
    assert.match(text, /Ada's Closet/);
    assert.match(text, /10 Ankara dresses/);
  });
});

/* ------------------------------------------------------------------ */
describe("Mobile and empty states", () => {
  test("has no horizontal overflow at phone width", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `page overflows by ${overflow}px`);
  });

  test("shows a clear empty state and resets the filters", async () => {
    await page.fill("#q", "zzzz-not-a-product");
    await page.waitForSelector("#grid .empty");
    assert.match(await page.textContent("#grid"), /nothing matches/i);
    await page.click("[data-clear-filters]");
    assert.equal(await page.inputValue("#q"), "");
    assert.equal(await page.locator("#grid .card").count(), 22);
  });
});
