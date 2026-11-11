/** Generated product tiles — keeps the demo fast and dependency-free. */

const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, c + amount));
  return "#" + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1);
};

const ICONS = {
  fashion: (l, d) => `<path d="M100 70c0-12 22-12 22 4 0 6-8 8-8 16l78 50c8 6 4 16-4 16H32c-8 0-12-10-4-16l78-50" fill="none" stroke="${l}" stroke-width="7" stroke-linejoin="round"/><rect x="70" y="170" width="100" height="70" rx="10" fill="${l}" opacity=".5"/>`,
  bag: (l, d) => `<path d="M88 118V98a32 32 0 0164 0v20" fill="none" stroke="${d}" stroke-width="10" stroke-linecap="round"/><rect x="62" y="116" width="116" height="112" rx="16" fill="${l}"/><rect x="62" y="148" width="116" height="10" fill="${d}" opacity=".35"/>`,
  beauty: (l, d, t) => `<rect x="92" y="60" width="56" height="26" rx="6" fill="${d}"/><rect x="78" y="86" width="84" height="150" rx="18" fill="${l}"/><rect x="94" y="130" width="52" height="44" rx="6" fill="${t}" opacity=".7"/>`,
  ring: (l, d) => `<circle cx="120" cy="150" r="62" fill="none" stroke="${l}" stroke-width="14"/><circle cx="120" cy="150" r="30" fill="${d}" opacity=".35"/>`,
  hat: (l, d) => `<ellipse cx="120" cy="178" rx="86" ry="24" fill="${l}" opacity=".75"/><path d="M76 176c0-52 12-78 44-78s44 26 44 78" fill="${l}"/><rect x="76" y="166" width="88" height="12" rx="6" fill="${d}" opacity=".45"/>`,
  glasses: (l, d) => `<rect x="44" y="126" width="66" height="46" rx="20" fill="none" stroke="${l}" stroke-width="9"/><rect x="130" y="126" width="66" height="46" rx="20" fill="none" stroke="${l}" stroke-width="9"/><path d="M110 146h20" stroke="${l}" stroke-width="9" stroke-linecap="round"/>`,
  candle: (l, d, t) => `<rect x="88" y="130" width="64" height="96" rx="10" fill="${l}"/><path d="M120 108c14-16 4-30 0-38-8 12-16 22 0 38z" fill="${t}" opacity=".9"/><rect x="108" y="116" width="24" height="6" rx="3" fill="${d}"/>`,
  mug: (l, d) => `<path d="M74 104h78v96a24 24 0 01-24 24H98a24 24 0 01-24-24z" fill="${l}"/><path d="M152 122h14a22 22 0 010 44h-14" fill="none" stroke="${l}" stroke-width="12"/>`,
  bottle: (l, d) => `<rect x="96" y="52" width="48" height="26" rx="8" fill="${d}"/><path d="M84 92h72v134a26 26 0 01-26 26h-20a26 26 0 01-26-26z" fill="${l}"/><rect x="84" y="150" width="72" height="8" fill="${d}" opacity=".3"/>`,
  download: (l, d) => `<rect x="66" y="44" width="108" height="152" rx="14" fill="${l}"/><path d="M120 92v58" stroke="${d}" stroke-width="10" stroke-linecap="round"/><path d="M94 128l26 26 26-26" fill="none" stroke="${d}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><rect x="84" y="218" width="72" height="12" rx="6" fill="${d}" opacity=".45"/>`,
  calendar: (l, d) => `<rect x="58" y="70" width="124" height="152" rx="16" fill="${l}"/><rect x="58" y="70" width="124" height="38" rx="16" fill="${d}" opacity=".55"/><rect x="84" y="54" width="12" height="32" rx="6" fill="${d}"/><rect x="144" y="54" width="12" height="32" rx="6" fill="${d}"/><path d="M100 166l14 14 26-28" fill="none" stroke="${d}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  camera: (l, d) => `<rect x="48" y="104" width="144" height="104" rx="18" fill="${l}"/><rect x="96" y="84" width="48" height="24" rx="8" fill="${d}" opacity=".6"/><circle cx="120" cy="156" r="34" fill="${d}" opacity=".55"/><circle cx="120" cy="156" r="18" fill="${l}"/>`,
  bowl: (l, d) => `<path d="M52 148h136a68 68 0 01-68 68 68 68 0 01-68-68z" fill="${l}"/><ellipse cx="120" cy="148" rx="68" ry="14" fill="${d}" opacity=".4"/><path d="M96 122c0-14 10-18 10-30M120 116c0-16 10-20 10-32M144 122c0-14 10-18 10-30" stroke="${d}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".55"/>`,
  snack: (l, d) => `<circle cx="96" cy="176" r="24" fill="${l}"/><circle cx="146" cy="166" r="20" fill="${d}" opacity=".55"/><circle cx="120" cy="118" r="22" fill="${l}" opacity=".8"/><path d="M112 204h16" stroke="${d}" stroke-width="8" stroke-linecap="round"/>`,
  cake: (l, d, t) => `<rect x="66" y="150" width="108" height="62" rx="10" fill="${l}"/><rect x="66" y="132" width="108" height="26" rx="10" fill="${d}" opacity=".45"/><path d="M120 132v-34" stroke="${d}" stroke-width="7" stroke-linecap="round"/><path d="M120 92c9-10 3-20 0-26-6 8-11 16 0 26z" fill="${t}"/>`,
  drink: (l, d) => `<path d="M82 96h76l-10 130a16 16 0 01-16 14h-24a16 16 0 01-16-14z" fill="${l}"/><path d="M138 60l-6 40" stroke="${d}" stroke-width="8" stroke-linecap="round"/><ellipse cx="120" cy="96" rx="38" ry="10" fill="${d}" opacity=".35"/>`,
  battery: (l, d) => `<rect x="80" y="56" width="80" height="30" rx="8" fill="${d}"/><rect x="62" y="86" width="116" height="160" rx="16" fill="${l}"/><path d="M126 122l-26 44h22l-10 42 32-52h-22z" fill="${d}" opacity=".75"/>`,
  plug: (l, d) => `<rect x="70" y="120" width="100" height="92" rx="18" fill="${l}"/><rect x="96" y="84" width="12" height="40" rx="6" fill="${d}"/><rect x="132" y="84" width="12" height="40" rx="6" fill="${d}"/><path d="M120 212v18" stroke="${d}" stroke-width="10" stroke-linecap="round"/>`,
  buds: (l, d) => `<path d="M92 96c22 0 26 26 26 44s-6 34-26 34-26-16-26-34 4-44 26-44z" fill="${l}"/><path d="M148 96c22 0 26 26 26 44s-6 34-26 34-26-16-26-34 4-44 26-44z" fill="${d}" opacity=".7"/><rect x="96" y="170" width="48" height="14" rx="7" fill="${d}" opacity=".5"/>`,
  speaker: (l, d) => `<rect x="74" y="66" width="92" height="168" rx="20" fill="${l}"/><circle cx="120" cy="120" r="26" fill="${d}" opacity=".6"/><circle cx="120" cy="186" r="16" fill="${d}" opacity=".5"/>`,
  laptop: (l, d) => `<rect x="66" y="98" width="108" height="72" rx="8" fill="${l}"/><rect x="78" y="110" width="84" height="48" fill="${d}" opacity=".45"/><path d="M46 194h148l-14 20H60z" fill="${d}" opacity=".7"/>`,
  tool: (l, d) => `<path d="M150 92a34 34 0 00-44 44l-42 42a14 14 0 0020 20l42-42a34 34 0 0044-44l-24 24-20-20z" fill="${l}"/>`,
  box: (l, d) => `<path d="M120 62l58 30v76l-58 30-58-30V92z" fill="${l}"/><path d="M62 92l58 30 58-30M120 122v76" stroke="${d}" stroke-width="8" fill="none" opacity=".6"/>`
};

const TYPE_ICON = { digital: "download", service: "calendar", physical: "box" };

export function tile(product) {
  if (product.img) return product.img;
  const tone = product.tone || "#8A5A3B";
  const dark = shade(tone, -40);
  const light = shade(tone, 50);
  const draw = ICONS[product.icon] || ICONS[TYPE_ICON[product.type]] || ICONS.box;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(tone, 20)}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><rect width="240" height="300" fill="url(#a)"/>${draw(light, dark, tone)}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
