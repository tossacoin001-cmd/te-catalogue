/**
 * WhatsApp message building — pure functions, unit tested.
 * Every message is plain text; only waUrl() turns it into a link.
 */
import { money, TYPE_LABEL } from "./catalogue.js";

export function waUrl(number, text) {
  const digits = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const CLOSING = {
  physical: "Please confirm availability and delivery details.",
  digital: "Please confirm payment details and send the download link.",
  service: "Please share available dates and booking details."
};

/** Product-level order/enquiry, exactly what the merchant needs to answer. */
export function orderMessage({ business, product, qty = 1, variant = "" }) {
  const lines = [
    `Hello ${business.name}! I'm interested in ordering the ${product.name}.`,
    "",
    `Price: ${money(business.currency, product.price)}`,
    `Quantity: ${qty}`
  ];
  if (product.sku) lines.push(`Ref: ${product.sku}`);
  if (variant) lines.push(`${product.variants ? product.variants.label : "Option"}: ${variant}`);
  lines.push("", CLOSING[product.type] || CLOSING.physical);
  return lines.join("\n");
}

/** Generic "I found your catalogue" message for the header/footer contact button. */
export function enquiryMessage(business) {
  return `Hello ${business.name}! I found your catalogue and I'd like to make an enquiry.`;
}

/** The sales request sent to Toss Enterprise from the "Get your own catalogue" form. */
export function requestMessage({ toss, form }) {
  const lines = [
    `Hi ${toss.name} 👋 I'd like a catalogue like the one I just viewed.`,
    "",
    "WHAT I WANT",
    form.want,
    "",
    "WHAT I SELL",
    form.sell,
    "",
    "PACKAGE",
    form.package,
    "",
    "MY BRAND",
    form.brand,
    "",
    "PRODUCTS / SERVICES I WANT TO PROMOTE",
    form.products,
    "",
    "NEXT STEP",
    form.next
  ];
  if (form.name) lines.push("", "MY NAME", form.name);
  if (form.phone) lines.push("", "MY WHATSAPP", form.phone);
  if (form.context) lines.push("", "Page I was looking at: " + form.context);
  lines.push("", "— sent from the Toss Enterprise catalogue demo");
  return lines.join("\n");
}

/** Human-readable summary of a product, used in previews. */
export function productSummary(business, product, qty, variant) {
  return [
    `Product: ${product.name}`,
    `Type: ${TYPE_LABEL[product.type]}`,
    `Price: ${money(business.currency, product.price)}`,
    `Quantity: ${qty}`,
    product.sku ? `Ref: ${product.sku}` : "",
    variant ? `${product.variants ? product.variants.label : "Option"}: ${variant}` : ""
  ].filter(Boolean).join("\n");
}
