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
  page = await context.newPage();
  await page.goto(server.url + "/", { waitUntil: "load" });
});

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
