/**
 * Pure engine tests — no browser, no DOM.
 * These cover the parts of the catalogue that must be right for every client:
 * product normalisation, filtering, stock labels, badges and WhatsApp messages.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { BUSINESSES, DEFAULT_SLUG } from "../js/data/businesses.js";
import { TOSS, DEMO_ORDER } from "../js/config.js";
import {
  normaliseProduct, normaliseProducts, money, stockState, isAvailable,
  badges, filterProducts, categoriesFor, resolveBusiness, applyOverrides,
  isLive, slugFromLocation
} from "../js/lib/catalogue.js";
import {
  waUrl, orderMessage, enquiryMessage, requestMessage, productSummary
} from "../js/lib/whatsapp.js";

const market = BUSINESSES.find(b => b.slug === "market-edit");
const bag = market.products.find(p => p.sku === "ME-F01");

describe("Product normalisation", () => {
  test("fills safe defaults for a sparse client product", () => {
    const p = normaliseProduct({ name: "Mystery box" }, 3);
    assert.equal(p.id, "item-3");
    assert.equal(p.type, "physical");
    assert.equal(p.cat, "Other");
    assert.equal(p.price, 0);
    assert.equal(p.stock, "in");
    assert.equal(p.variants, null);
  });

  test("keeps valid fields and trims variant options", () => {
    const p = normaliseProduct({
      sku: "X-1", name: "Tee", cat: "Fashion", type: "digital",
      price: "9000", was: "12000", stock: "low", tone: "#123456",
      variants: { label: "Size", options: ["S", "M"] }
    });
    assert.equal(p.id, "X-1");
    assert.equal(p.price, 9000);
    assert.equal(p.was, 12000);
    assert.equal(p.type, "digital");
    assert.deepEqual(p.variants, { label: "Size", options: ["S", "M"] });
  });

  test("rejects an unknown type and unknown stock state", () => {
    const p = normaliseProduct({ name: "Odd", type: "mystery", stock: "maybe" });
    assert.equal(p.type, "physical");
    assert.equal(p.stock, "in");
  });

  test("normalises a whole product list", () => {
    assert.equal(normaliseProducts([{ name: "A" }, { name: "B" }]).length, 2);
    assert.deepEqual(normaliseProducts(null), []);
  });
});

describe("Money and stock", () => {
  test("formats naira prices with thousands separators", () => {
    assert.equal(money("₦", 35000), "₦35,000");
    assert.equal(money("₦", 0), "₦0");
  });

  test("stock labels differ by product type", () => {
    assert.equal(stockState({ type: "physical", stock: "out" }).label, "Sold out");
    assert.equal(stockState({ type: "digital", stock: "out" }).label, "Coming soon");
    assert.equal(stockState({ type: "service", stock: "out" }).label, "Fully booked");
    assert.equal(stockState({ type: "physical", stock: "low" }).tone, "low");
  });

  test("availability is false only when sold out", () => {
    assert.equal(isAvailable({ stock: "in" }), true);
    assert.equal(isAvailable({ stock: "low" }), true);
    assert.equal(isAvailable({ stock: "out" }), false);
  });
});

describe("Badges", () => {
  test("digital items advertise an instant download", () => {
    const list = badges({ type: "digital", stock: "in", was: null });
    assert.deepEqual(list.map(b => b.text), ["Instant download"]);
  });

  test("services advertise a session and sold-out state", () => {
    const list = badges({ type: "service", stock: "out", was: null });
    assert.deepEqual(list.map(b => b.text), ["Book a session", "Fully booked"]);
  });

  test("a sale is labelled once on the left for physical products", () => {
    const list = badges({ type: "physical", stock: "in", was: 42000 });
    assert.deepEqual(list, [{ text: "Sale", tone: "sale", side: "left" }]);
  });

  test("a discounted digital item gets its sale label on the right", () => {
    const list = badges({ type: "digital", stock: "in", was: 12000 });
    assert.deepEqual(list.map(b => `${b.text}:${b.side}`), ["Instant download:left", "Sale:right"]);
  });
});

describe("Filtering and categories", () => {
  const products = normaliseProducts(market.products);

  test("filters by type, category and search together", () => {
    const search = filterProducts(products, { type: "all", category: "All", term: "serum" });
    assert.equal(search.length, 1);
    assert.match(search[0].name, /Vitamin C/i);

    const combined = filterProducts(products, { type: "physical", category: "Fashion", term: "dress" });
    assert.equal(combined.length, 1);
    assert.equal(combined[0].sku, "ME-F03");
  });

  test("search also matches category and type labels", () => {
    assert.ok(filterProducts(products, { term: "digital" }).length >= 4);
    assert.ok(filterProducts(products, { term: "beauty" }).length >= 4);
  });

  test("category list respects the selected type", () => {
    const cats = categoriesFor(products, "digital");
    assert.deepEqual(cats, ["Digital downloads"]);
    assert.ok(categoriesFor(products, "all").includes("Services"));
  });

  test("an empty result is possible and clean", () => {
    assert.deepEqual(filterProducts(products, { term: "zzzzz" }), []);
  });
});

describe("Business resolution and overrides", () => {
  test("resolves a slug, then the default, then the first business", () => {
    assert.equal(resolveBusiness(BUSINESSES, "volt-gadgets", DEFAULT_SLUG).slug, "volt-gadgets");
    assert.equal(resolveBusiness(BUSINESSES, "nope", DEFAULT_SLUG).slug, DEFAULT_SLUG);
    assert.equal(resolveBusiness(BUSINESSES, "", "also-nope").slug, BUSINESSES[0].slug);
  });

  test("reads ?b= from a query string", () => {
    assert.equal(slugFromLocation("?b=mamas-kitchen"), "mamas-kitchen");
    assert.equal(slugFromLocation("?x=1"), "");
    assert.equal(slugFromLocation(""), "");
  });

  test("runtime overrides win without destroying nested defaults", () => {
    const next = applyOverrides(market, {
      mode: "live",
      whatsapp: "2348012345678",
      hero: { title: "Custom hero" }
    });
    assert.equal(next.mode, "live");
    assert.equal(next.whatsapp, "2348012345678");
    assert.equal(next.hero.title, "Custom hero");
    assert.equal(next.hero.eyebrow, market.hero.eyebrow);
    assert.equal(next.products.length, market.products.length);
  });

  test("only mode 'live' unlocks ordering", () => {
    assert.equal(isLive({ mode: "live" }), true);
    assert.equal(isLive({ mode: "demo" }), false);
    assert.equal(isLive({}), false);
  });
});

describe("WhatsApp messages", () => {
  test("orders include name, price, quantity, reference and variant", () => {
    const text = orderMessage({ business: market, product: bag, qty: 2, variant: "Black" });
    assert.match(text, /Classic Leather Bag/);
    assert.match(text, /Price: ₦35,000/);
    assert.match(text, /Quantity: 2/);
    assert.match(text, /Ref: ME-F01/);
    assert.match(text, /Colour: Black/);
    assert.match(text, /confirm availability and delivery/i);
  });

  test("closing copy matches the product type", () => {
    const digital = market.products.find(p => p.type === "digital");
    const service = market.products.find(p => p.type === "service");
    assert.match(orderMessage({ business: market, product: digital, qty: 1 }), /download link/i);
    assert.match(orderMessage({ business: market, product: service, qty: 1 }), /available dates/i);
  });

  test("general enquiry names the business", () => {
    assert.match(enquiryMessage(market), /The Market Edit/);
    assert.match(enquiryMessage(market), /enquiry/i);
  });

  test("wa.me uses international digits only and encodes newlines", () => {
    const url = waUrl("+234 808 791 9951", "Hello\nWorld & co");
    assert.ok(url.startsWith("https://wa.me/2348087919951?text="));
    assert.ok(url.endsWith(encodeURIComponent("Hello\nWorld & co")));
    assert.ok(url.includes("%0A"));
    assert.ok(!url.includes("+234"));
  });

  test("the Toss request carries package, brand, products and next step", () => {
    const text = requestMessage({
      toss: TOSS,
      form: {
        want: "A one-link catalogue like this",
        sell: "Physical products",
        package: "Catalogue Starter — ₦50,000",
        brand: "Ada's Closet",
        products: "12 dresses",
        next: "Send me pricing",
        name: "Ada",
        phone: "0803 111 2222",
        context: "Classic Leather Bag"
      }
    });
    assert.match(text, /PACKAGE/);
    assert.match(text, /Catalogue Starter/);
    assert.match(text, /Ada's Closet/);
    assert.match(text, /12 dresses/);
    assert.match(text, /Send me pricing/);
    assert.match(text, /0803 111 2222/);
    assert.match(text, /Classic Leather Bag/);
  });

  test("product summary is human-readable", () => {
    const text = productSummary(market, bag, 3, "Tan");
    assert.match(text, /Product: Classic Leather Bag/);
    assert.match(text, /Quantity: 3/);
    assert.match(text, /Colour: Tan/);
  });
});

describe("Catalogue data integrity", () => {
  test("ships three demo businesses and every slug is unique", () => {
    assert.equal(BUSINESSES.length, 3);
    assert.equal(new Set(BUSINESSES.map(b => b.slug)).size, BUSINESSES.length);
    assert.deepEqual(DEMO_ORDER, BUSINESSES.map(b => b.slug));
  });

  test("every business is complete enough to render", () => {
    for (const b of BUSINESSES) {
      assert.ok(b.name && b.slug && b.whatsapp && b.currency);
      assert.ok(b.hero && b.collection);
      assert.ok(Array.isArray(b.products) && b.products.length >= 8);
      assert.ok(b.featured.every(sku => b.products.some(p => p.sku === sku)));
      assert.equal(b.mode, "demo", "shipped demos must keep the approved no-link behaviour");
    }
  });

  test("every product has a unique SKU, valid type and a real price", () => {
    for (const b of BUSINESSES) {
      const skus = b.products.map(p => p.sku);
      assert.equal(new Set(skus).size, skus.length, `${b.slug} has duplicate SKUs`);
      for (const p of b.products) {
        assert.ok(["physical", "digital", "service"].includes(p.type), `${p.sku} type`);
        assert.ok(Number(p.price) > 0, `${p.sku} price`);
        assert.ok(p.name && p.cat && p.desc, `${p.sku} required fields`);
        if (p.variants) {
          assert.ok(p.variants.options.length >= 2, `${p.sku} variants`);
        }
      }
    }
  });

  test("the catalogue demonstrates more than one industry", () => {
    const categories = new Set(BUSINESSES.flatMap(b => b.products.map(p => p.cat)));
    for (const expected of ["Fashion", "Mains", "Repairs", "Digital downloads", "Services"]) {
      assert.ok(categories.has(expected), expected);
    }
  });
});
