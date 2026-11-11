import { chromium } from "playwright-core";
import { chromiumExecutable } from "./helpers/server.mjs";

const BASE = "https://te-catalogue.tossacoin001.workers.dev";
const checks = [];
const check = (name, ok, extra = "") => {
  checks.push({ name, ok: Boolean(ok), extra: String(extra || "") });
  if (!ok) console.log("FAIL", name, extra);
};

const browser = await chromium.launch({ executablePath: chromiumExecutable(), headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() => {
  window.__opened = [];
  window.open = url => { window.__opened.push(String(url)); return null; };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

const res = await page.goto(BASE + "/", { waitUntil: "load", timeout: 30000 });
await page.waitForFunction(() => window.__TE_READY__ === true, null, { timeout: 15000 });
check("home status", res.status() === 200, res.status());
check("home title", /Market Edit/.test(await page.title()));
check("home cards", await page.locator("#grid .card").count() === 22);
check("home demo mode", await page.evaluate(() => window.TE.business.mode) === "demo");
check("no wa.me anchors", await page.locator('a[href*="wa.me"]').count() === 0);
check("packages visible", await page.locator("#packages").isVisible());
check("switcher links", await page.locator("#bizswitch a").count() === 2);

await page.locator("#grid .card", { hasText: "Classic Leather Bag" }).first().click();
await page.waitForSelector("#modal.open");
await page.click('#sheet [data-qty="1"]');
const preview = await page.textContent("#orderPreview");
check("demo preview quantity", /Quantity: 2/.test(preview));
check("demo preview price", /₦35,000/.test(preview));
check("demo preview sku", /ME-F01/.test(preview));
check("demo sheet still no links", await page.locator('#modal a[href*="wa.me"]').count() === 0);
await page.click("#sheet [data-close-product]");

await page.click("header [data-request]");
await page.waitForSelector("#requestModal.open");
await page.fill("#f-brand", "QA Brand");
await page.fill("#f-products", "QA products");
await page.click("#sendBtn");
const opened = await page.evaluate(() => window.__opened);
const url = new URL(opened[0]);
check("request recipient", url.origin + url.pathname === "https://wa.me/2348087919951", url.href);
check("request package", /PACKAGE/.test(url.searchParams.get("text")));
check("request brand", /QA Brand/.test(url.searchParams.get("text")));
await page.click("#requestSheet [data-close-request]");

for (const [slug, name, count] of [["mamas-kitchen", "Mama's Kitchen", 8], ["volt-gadgets", "Volt Gadgets", 8]]) {
  await page.goto(`${BASE}/?b=${slug}#shop`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__TE_READY__ === true);
  check(`${slug} name`, (await page.textContent("#bname")).includes(name));
  check(`${slug} cards`, await page.locator("#grid .card").count() === count);
  check(`${slug} no links`, await page.locator('a[href*="wa.me"]').count() === 0);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForFunction(() => window.__TE_READY__ === true);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check("mobile no overflow", overflow <= 1, overflow);
check("mobile sticky CTA", await page.locator(".sticky [data-request]").isVisible());

const js = await page.request.get(BASE + "/js/app.js");
check("app.js served", js.status() === 200, js.status());
check("app.js type", /javascript/.test(js.headers()["content-type"] || ""), js.headers()["content-type"]);

const notFound = await page.goto(BASE + "/this-page-does-not-exist", { waitUntil: "load" });
check("404 status", notFound.status() === 404, notFound.status());

const docs = await page.request.get(BASE + "/docs/QA.md");
check("docs excluded", docs.status() === 404, docs.status());

check("no console/page errors", errors.length === 0, errors.join(" | "));

const failed = checks.filter(c => !c.ok);
console.log(JSON.stringify({ total: checks.length, failed: failed.length, failures: failed, errors }, null, 2));
await browser.close();
process.exit(failed.length ? 1 : 0);
