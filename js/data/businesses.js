/**
 * Catalogue data.
 * One object per business. The same engine renders every entry — to onboard a
 * new client, copy one object, change the slug, branding and products.
 *
 * Field notes
 *  type        "physical" | "digital" | "service"
 *  stock       "in" | "low" | "out"
 *  was         optional original price (shows a sale badge)
 *  icon        optional tile icon key (see js/lib/art.js); otherwise derived
 *  variants    optional { label, options[] } — e.g. sizes or colours
 *  mode        "demo" = ordering previewed only, every CTA books a Toss call
 *              "live" = real WhatsApp order links to this business's number
 */

const marketEditProducts = [
  {sku:"ME-F01",name:"Classic Leather Bag",cat:"Fashion",type:"physical",price:35000,was:42000,stock:"in",tone:"#8A5A3B",icon:"bag",
   desc:"Structured everyday tote in soft faux leather with a zip pocket and detachable strap.",
   variants:{label:"Colour",options:["Tan","Black","Cream"]}},
  {sku:"ME-F02",name:"Linen Wide-Leg Trousers",cat:"Fashion",type:"physical",price:18500,stock:"in",tone:"#C9B99A",icon:"fashion",
   desc:"Breathable linen blend with an elastic back waist. Sizes S to XL.",
   variants:{label:"Size",options:["S","M","L","XL"]}},
  {sku:"ME-F03",name:"Ankara Wrap Dress",cat:"Fashion",type:"physical",price:27000,stock:"low",tone:"#C0642B",icon:"fashion",
   desc:"Midi wrap dress in bold printed Ankara with a flattering tie waist."},
  {sku:"ME-F04",name:"Everyday Cotton Tee",cat:"Fashion",type:"physical",price:8500,stock:"in",tone:"#E8E6DF",icon:"fashion",
   desc:"Heavyweight cotton, relaxed fit. Available in white, sand and charcoal."},
  {sku:"ME-B01",name:"Vitamin C Glow Serum",cat:"Beauty & skincare",type:"physical",price:14500,was:16500,stock:"in",tone:"#E9A23B",icon:"beauty",
   desc:"Brightening 30ml serum for an even, healthy-looking complexion."},
  {sku:"ME-B02",name:"Shea Body Butter",cat:"Beauty & skincare",type:"physical",price:7800,stock:"in",tone:"#E7D9B6",icon:"beauty",
   desc:"Rich, whipped shea butter for all-day moisture. 250g jar."},
  {sku:"ME-B03",name:"Gentle Foaming Cleanser",cat:"Beauty & skincare",type:"physical",price:9200,stock:"out",tone:"#9CC7BE",icon:"beauty",
   desc:"Fragrance-free daily cleanser suitable for sensitive skin."},
  {sku:"ME-B04",name:"SPF 50 Daily Sunscreen",cat:"Beauty & skincare",type:"physical",price:11000,stock:"low",tone:"#F2C98A",icon:"beauty",
   desc:"Lightweight, no white cast. Works well under makeup."},
  {sku:"ME-A01",name:"Gold Hoop Earrings",cat:"Accessories",type:"physical",price:6500,stock:"in",tone:"#D1A93C",icon:"ring",
   desc:"Tarnish-resistant 18k gold-plated hoops, light enough for all-day wear."},
  {sku:"ME-A02",name:"Woven Straw Hat",cat:"Accessories",type:"physical",price:9800,was:12000,stock:"in",tone:"#D8BC84",icon:"hat",
   desc:"Wide-brim hat with an adjustable inner band."},
  {sku:"ME-A03",name:"Polarised Sunglasses",cat:"Accessories",type:"physical",price:13500,stock:"in",tone:"#2E3A36",icon:"glasses",
   desc:"UV400 lenses with a lightweight acetate frame and carry case."},
  {sku:"ME-L01",name:"Soy Candle, Amber Wood",cat:"Lifestyle",type:"physical",price:10500,stock:"in",tone:"#B8774A",icon:"candle",
   desc:"Hand-poured soy wax, around 45 hours of burn time."},
  {sku:"ME-L02",name:"Ceramic Mug Set (2)",cat:"Lifestyle",type:"physical",price:12500,stock:"low",tone:"#7FA39A",icon:"mug",
   desc:"Two 350ml stoneware mugs, dishwasher and microwave safe."},
  {sku:"ME-L03",name:"Insulated Steel Bottle",cat:"Lifestyle",type:"physical",price:15000,stock:"in",tone:"#5E7F9A",icon:"bottle",
   desc:"750ml, keeps drinks cold for 24 hours or hot for 12."},

  {sku:"ME-D01",name:"Notion Business Template Pack",cat:"Digital downloads",type:"digital",price:12000,stock:"in",tone:"#4B6BFB",icon:"download",
   desc:"14 ready-made Notion templates for orders, stock, invoices and content planning. Delivered as an instant download link."},
  {sku:"ME-D02",name:"Ankara Print Digital Patterns (10)",cat:"Digital downloads",type:"digital",price:9500,was:12000,stock:"in",tone:"#B4552B",icon:"download",
   desc:"Ten print-ready Ankara patterns in PNG and vector format. Instant download, no shipping."},
  {sku:"ME-D03",name:"90-Day Instagram Content Calendar",cat:"Digital downloads",type:"digital",price:15000,stock:"in",tone:"#7A5AF8",icon:"download",
   desc:"A plug-and-play calendar with captions, hooks and posting prompts built for product brands."},
  {sku:"ME-D04",name:"Ebook: Selling on WhatsApp",cat:"Digital downloads",type:"digital",price:7500,stock:"in",tone:"#1E5B4B",icon:"download",
   desc:"A 64-page PDF guide on turning catalogue views into paid orders. File link sent after payment."},

  {sku:"ME-S01",name:"Personal Styling Session",cat:"Services",type:"service",price:25000,stock:"low",tone:"#B08968",icon:"calendar",
   desc:"45-minute virtual styling session with outfit edits, sizing advice and a shopping list. Booked by appointment."},
  {sku:"ME-S02",name:"Makeup Artist — Home Service",cat:"Services",type:"service",price:45000,stock:"in",tone:"#8E4A5B",icon:"calendar",
   desc:"Bridal and event makeup at your location in Lagos, kit included. Dates confirmed on WhatsApp."},
  {sku:"ME-S03",name:"Brand Photography Half-Day",cat:"Services",type:"service",price:120000,stock:"low",tone:"#2E3A36",icon:"camera",
   desc:"Half-day shoot for product and lifestyle images, edited and delivered in five days. Booking required."},
  {sku:"ME-S04",name:"Social Media Management (Monthly)",cat:"Services",type:"service",price:150000,stock:"out",tone:"#5E7F9A",icon:"calendar",
   desc:"Content calendar, 12 posts and community replies handled for your brand each month. Fully booked this month."}
];

const kitchenProducts = [
  {sku:"MK-01",name:"Jollof Rice Party Tray (5L)",cat:"Mains",type:"physical",price:18000,stock:"in",tone:"#C4552B",icon:"bowl",
   desc:"Smoky party jollof, serves 8–10. Comes with fried plantain and coleslaw.",
   variants:{label:"Protein",options:["Chicken","Beef","Fish","Mixed"]}},
  {sku:"MK-02",name:"Egusi Soup & Swallow Pack",cat:"Mains",type:"physical",price:9500,stock:"in",tone:"#7E6A3A",icon:"bowl",
   desc:"Melon seed soup with assorted meat, eba and pounded yam. Serves 2–3."},
  {sku:"MK-03",name:"Peppered Chicken (6 pieces)",cat:"Mains",type:"physical",price:12000,stock:"low",tone:"#A63D22",icon:"bowl",
   desc:"Grilled then tossed in pepper sauce. Order a day ahead for events."},
  {sku:"MK-04",name:"Small Chops Platter (50 pieces)",cat:"Small chops",type:"physical",price:15000,stock:"in",tone:"#D99A1B",icon:"snack",
   desc:"Puff-puff, samosa, spring rolls and peppered gizzard. Ready in 3 hours."},
  {sku:"MK-05",name:"Chocolate Fudge Cake (8 inch)",cat:"Cakes",type:"physical",price:22000,was:25000,stock:"in",tone:"#5A3A2E",icon:"cake",
   desc:"Rich chocolate sponge with fudge frosting. Message on the cake is free."},
  {sku:"MK-06",name:"Fresh Chapman (1 litre)",cat:"Drinks",type:"physical",price:3500,stock:"in",tone:"#B4382F",icon:"drink",
   desc:"Chilled Lagos-style Chapman with cucumber and citrus. Bottled fresh daily."},
  {sku:"MK-07",name:"Weekend Meal Prep (5 lunches)",cat:"Meal prep",type:"service",price:25000,stock:"low",tone:"#4E7A5E",icon:"calendar",
   desc:"Five balanced lunches delivered Sunday and Wednesday. Menu shared every Thursday.",
   variants:{label:"Plan",options:["Regular","Low carb","Family (2 people)"]}},
  {sku:"MK-08",name:"Event Catering Quote",cat:"Catering",type:"service",price:150000,stock:"in",tone:"#8A5A3B",icon:"calendar",
   desc:"Full catering for 50–200 guests. Price is a booking deposit; final quote confirmed after a call."}
];

const gadgetProducts = [
  {sku:"VG-01",name:"Anker 20,000mAh Power Bank",cat:"Power",type:"physical",price:32000,stock:"in",tone:"#2E3A52",icon:"battery",
   desc:"Fast-charges two devices at once, charges a phone about four times. 18-month warranty.",
   variants:{label:"Colour",options:["Black","White"]}},
  {sku:"VG-02",name:"65W USB-C Fast Charger",cat:"Power",type:"physical",price:18500,stock:"in",tone:"#3D4A5C",icon:"plug",
   desc:"GaN charger for laptops and phones. Cable sold separately."},
  {sku:"VG-03",name:"Wireless Earbuds Pro",cat:"Audio",type:"physical",price:45000,was:52000,stock:"in",tone:"#1F2937",icon:"buds",
   desc:"Active noise cancelling, 30-hour case, USB-C. Sealed pack with warranty."},
  {sku:"VG-04",name:"Bluetooth Speaker Mini",cat:"Audio",type:"physical",price:28000,stock:"in",tone:"#4B6BFB",icon:"speaker",
   desc:"Pocket speaker with 12-hour battery and IPX5 splash resistance."},
  {sku:"VG-05",name:"Phone Camera Lens Kit",cat:"Accessories",type:"physical",price:12000,stock:"out",tone:"#5B6472",icon:"glasses",
   desc:"Clip-on wide and macro lenses with a carry case. Restocking next week."},
  {sku:"VG-06",name:"Aluminium Laptop Stand",cat:"Accessories",type:"physical",price:15000,stock:"low",tone:"#8A8F98",icon:"laptop",
   desc:"Adjustable height, fits 11–17 inch laptops, folds flat for travel."},
  {sku:"VG-07",name:"Screen Replacement Service",cat:"Repairs",type:"service",price:25000,stock:"in",tone:"#374151",icon:"tool",
   desc:"Same-day screen replacement for most iPhone and Samsung models. Parts quoted after inspection."},
  {sku:"VG-08",name:"Device Setup & Data Transfer",cat:"Repairs",type:"service",price:8000,stock:"in",tone:"#4E7A5E",icon:"tool",
   desc:"New phone set up, apps installed and data moved across. Walk-in at Ikeja or remote."}
];

export const BUSINESSES = [
  {
    slug: "market-edit",
    name: "The Market Edit",
    logo: "ME",
    tagline: "A demo catalogue by Toss Enterprise",
    description: "Everyday finds, digital downloads and services from a Lagos brand.",
    mode: "demo",
    whatsapp: "2348087919951",
    whatsappDisplay: "0808 791 9951",
    currency: "₦",
    location: "Lekki Phase 1, Lagos",
    accent: "#1E5B4B",
    banner: '<b>Live demo</b> — this is what your customers would see. <a href="#" data-request>Get your own catalogue →</a>',
    hero: {
      eyebrow: "One link · every product",
      title: "Your whole catalogue, <em>in one link.</em>",
      text: "This is a live demo of a one-link catalogue built for a Lagos brand. It carries <b>physical products</b>, <b>digital downloads</b> and <b>services</b> on one page — and every item opens straight into WhatsApp.",
      fine: "No app to download. Works from any link, flyer or Instagram bio."
    },
    collection: {
      title: "The edit",
      note: "22 sample listings across physical products, digital downloads and services. Tap any item to see how a customer would buy it."
    },
    categories: ["Fashion", "Beauty & skincare", "Accessories", "Lifestyle", "Digital downloads", "Services"],
    featured: ["ME-F01", "ME-B01", "ME-A01"],
    social: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" }
    ],
    products: marketEditProducts
  },

  {
    slug: "mamas-kitchen",
    name: "Mama's Kitchen",
    logo: "MK",
    tagline: "Home cooking, delivered across Lagos",
    description: "Party trays, small chops and weekly meal prep from a home kitchen in Yaba.",
    mode: "demo",
    whatsapp: "2348087919951",
    whatsappDisplay: "0808 791 9951",
    currency: "₦",
    location: "Yaba, Lagos",
    accent: "#A63D22",
    banner: '<b>Demo catalogue</b> — a food business running on the same Toss engine. <a href="#" data-request>Get yours →</a>',
    hero: {
      eyebrow: "Fresh from the kitchen",
      title: "Party food, platters <em>and weekly meal prep.</em>",
      text: "A second demo catalogue showing the same engine for a food business: trays, small chops and catering booked straight from WhatsApp.",
      fine: "Order before 2pm for same-day delivery within Lagos mainland."
    },
    collection: {
      title: "Today's menu",
      note: "Eight listings including catering and meal-prep services. Tap any item to see how a customer would order it."
    },
    categories: ["Mains", "Small chops", "Cakes", "Drinks", "Meal prep", "Catering"],
    featured: ["MK-01", "MK-04", "MK-05"],
    social: [
      { label: "Instagram", href: "#" }
    ],
    products: kitchenProducts
  },

  {
    slug: "volt-gadgets",
    name: "Volt Gadgets",
    logo: "VG",
    tagline: "Phones, power and repairs in Ikeja",
    description: "Accessories, audio and same-day device repairs from a shop in Ikeja.",
    mode: "demo",
    whatsapp: "2348087919951",
    whatsappDisplay: "0808 791 9951",
    currency: "₦",
    location: "Ikeja, Lagos",
    accent: "#2E3A52",
    banner: '<b>Demo catalogue</b> — an electronics shop on the same Toss engine. <a href="#" data-request>Get yours →</a>',
    hero: {
      eyebrow: "Gadgets · audio · repairs",
      title: "Prices in the open, <em>answers in your DM.</em>",
      text: "A third demo catalogue for an electronics shop — stock, accessories and repair services on one link, with every enquiry landing in WhatsApp.",
      fine: "Walk-in at Ikeja or order for delivery within Lagos."
    },
    collection: {
      title: "In stock now",
      note: "Eight listings mixing accessories and repair services. Tap any item to see the customer experience."
    },
    categories: ["Power", "Audio", "Accessories", "Repairs"],
    featured: ["VG-01", "VG-03", "VG-07"],
    social: [
      { label: "Instagram", href: "#" },
      { label: "X", href: "#" }
    ],
    products: gadgetProducts
  }
];

export const DEFAULT_SLUG = "market-edit";
