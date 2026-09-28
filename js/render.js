// Turns a QR module matrix into an SVG string. Pure, no DOM, so it's testable
// and the same output is used for the preview, the SVG download and the PNG.

export const QUIET_ZONE = 4;
const FINDER = 7;
const LOGO_FRACTION = 0.22;

const f = (n) => +n.toFixed(3);

export function encode(qrcodeLib, text, ecc = "M") {
  qrcodeLib.stringToBytes = qrcodeLib.stringToBytesFuncs["UTF-8"];
  const qr = qrcodeLib(0, ecc);
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

export function isFinder(n, r, c) {
  const inBox = (r0, c0) => r >= r0 && r < r0 + FINDER && c >= c0 && c < c0 + FINDER;
  return inBox(0, 0) || inBox(0, n - FINDER) || inBox(n - FINDER, 0);
}

// Alignment pattern centre rows/cols per QR version (from the spec, same table qrcode.js uses).
const ALIGNMENT_POSITIONS = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
  [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

// Centres of the small 5x5 alignment squares. Scanners lean on these, so they
// get drawn solid like the corner eyes instead of in the dot style.
export function alignmentCenters(n) {
  const pos = ALIGNMENT_POSITIONS[(n - 17) / 4 - 1] || [];
  const out = [];
  for (const r of pos) for (const c of pos) if (!isFinder(n, r, c)) out.push([r, c]);
  return out;
}

function inAlignment(centers, r, c) {
  return centers.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);
}

// Centered square of modules to leave empty under a logo. Odd size keeps it centered.
export function logoArea(n) {
  let size = Math.round(n * LOGO_FRACTION);
  if (size % 2 === 0) size += 1;
  const start = (n - size) / 2;
  return { start, size };
}

function inArea(area, r, c) {
  return area && r >= area.start && r < area.start + area.size && c >= area.start && c < area.start + area.size;
}

function roundedRect(x, y, w, h, r) {
  if (r <= 0) return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
  return (
    `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}` +
    `v${f(h - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}` +
    `h${f(-(w - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}` +
    `v${f(-(h - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}z`
  );
}

function circle(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
}

// A module whose corners round off only where it has no neighbours,
// so touching modules melt into blobs.
function blobModule(x, y, dark) {
  const R = 0.5;
  const t = dark(-1, 0), b = dark(1, 0), l = dark(0, -1), rt = dark(0, 1);
  const tl = !t && !l ? R : 0, tr = !t && !rt ? R : 0, br = !b && !rt ? R : 0, bl = !b && !l ? R : 0;
  const arc = (r, dx, dy) => (r ? `a${r} ${r} 0 0 1 ${dx} ${dy}` : "");
  return (
    `M${x + tl} ${y}H${x + 1 - tr}${arc(tr, tr, tr)}V${y + 1 - br}${arc(br, -br, br)}` +
    `H${x + bl}${arc(bl, -bl, -bl)}V${y + tl}${arc(tl, tl, -tl)}z`
  );
}

function bodyPath(matrix, style, skip, m) {
  const n = matrix.length;
  const dark = (r, c) => r >= 0 && c >= 0 && r < n && c < n && matrix[r][c] && !skip(r, c);
  let d = "";

  if (style === "bars") {
    for (let c = 0; c < n; c++) {
      let r = 0;
      while (r < n) {
        if (!dark(r, c)) { r++; continue; }
        const start = r;
        while (dark(r, c)) r++;
        d += roundedRect(c + m + 0.12, start + m + 0.06, 0.76, r - start - 0.12, 0.38);
      }
    }
    return d;
  }

  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!dark(r, c)) { c++; continue; }
      if (style === "square") {
        const start = c;
        while (dark(r, c)) c++;
        d += `M${start + m} ${r + m}h${c - start}v1h${start - c}z`;
        continue;
      }
      if (style === "dots") d += circle(c + m + 0.5, r + m + 0.5, 0.44);
      else d += blobModule(c + m, r + m, (dr, dc) => dark(r + dr, c + dc));
      c++;
    }
  }
  return d;
}

function eyePaths(n, style, m) {
  const corners = [[0, 0], [0, n - FINDER], [n - FINDER, 0]];
  let outer = "", inner = "";
  for (const [r, c] of corners) {
    const x = c + m, y = r + m;
    if (style === "circle") {
      outer += circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
      inner += circle(x + 3.5, y + 3.5, 1.5);
    } else {
      const round = style === "rounded";
      outer += roundedRect(x, y, 7, 7, round ? 2 : 0) + roundedRect(x + 1, y + 1, 5, 5, round ? 1.4 : 0);
      inner += roundedRect(x + 2, y + 2, 3, 3, round ? 0.9 : 0);
    }
  }
  return { outer, inner };
}

function alignmentPath(centers, style, m) {
  let d = "";
  for (const [r, c] of centers) {
    const cx = c + m + 0.5, cy = r + m + 0.5;
    if (style === "circle") {
      d += circle(cx, cy, 2.5) + circle(cx, cy, 1.5) + circle(cx, cy, 0.5);
    } else {
      const round = style === "rounded";
      d += roundedRect(cx - 2.5, cy - 2.5, 5, 5, round ? 1.4 : 0) + roundedRect(cx - 1.5, cy - 1.5, 3, 3, round ? 0.8 : 0);
      d += roundedRect(cx - 0.5, cy - 0.5, 1, 1, round ? 0.3 : 0);
    }
  }
  return d;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

export const DEFAULT_STYLE = {
  dots: "square",
  eyes: "square",
  fg: "#16171a",
  bg: "#ffffff",
  eye: "",
  transparent: false,
  logo: "",
  frame: false,
  frameText: "SCAN ME",
};

export function renderSvg(matrix, options = {}) {
  const o = { ...DEFAULT_STYLE, ...options };
  const n = matrix.length;
  const m = QUIET_ZONE;
  const size = n + m * 2;
  const area = o.logo ? logoArea(n) : null;
  const centers = alignmentCenters(n).filter(([r, c]) => !inArea(area, r, c));
  const skip = (r, c) => isFinder(n, r, c) || inArea(area, r, c) || inAlignment(centers, r, c);

  const body = bodyPath(matrix, o.dots, skip, m) + alignmentPath(centers, o.eyes, m);
  const eyes = eyePaths(n, o.eyes, m);
  const eyeColor = o.eye || o.fg;
  const solidBg = o.frame || !o.transparent;

  let code = "";
  if (solidBg) code += `<rect width="${size}" height="${size}" fill="${esc(o.bg)}"/>`;
  code += `<path d="${body}" fill="${esc(o.fg)}" fill-rule="evenodd"/>`;
  code += `<path d="${eyes.outer}" fill="${esc(eyeColor)}" fill-rule="evenodd"/>`;
  code += `<path d="${eyes.inner}" fill="${esc(eyeColor)}"/>`;
  if (area) {
    const pad = 0.6;
    const x = area.start + m + pad, s = area.size - pad * 2;
    code += `<image href="${esc(o.logo)}" x="${f(x)}" y="${f(x)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  if (!o.frame) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="geometricPrecision">${code}</svg>`;
  }

  // Sticker frame: a coloured border with a label band at the bottom.
  const border = 1.5;
  const band = Math.max(5, size * 0.17);
  const w = size + border * 2;
  const h = size + border + band;
  const fontSize = f(band * 0.46);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" shape-rendering="geometricPrecision">` +
    `<path d="${roundedRect(0, 0, w, h, 2.4)}" fill="${esc(o.fg)}"/>` +
    `<g transform="translate(${border} ${border})"><path d="${roundedRect(0, 0, size, size, 1.2)}" fill="${esc(o.bg)}"/>${code.replace(/^<rect[^>]*\/>/, "")}</g>` +
    `<text x="${f(w / 2)}" y="${f(size + border + band / 2)}" fill="${esc(o.bg)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="${f(fontSize * 0.08)}" text-anchor="middle" dominant-baseline="central">${esc(o.frameText.slice(0, 18))}</text>` +
    `</svg>`
  );
}

// WCAG relative luminance, used to warn about codes phones will struggle with.
function luminance(hex) {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((ch) => ch + ch).join("") : v;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const ch = parseInt(full.slice(i, i + 2), 16) / 255;
    return ch <= 0.03928 ? ch / 12.92 : ((ch + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function scanWarning(fg, bg, transparent) {
  if (transparent) return "Transparent background: make sure whatever it sits on is light.";
  const a = luminance(fg), b = luminance(bg);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  if (ratio < 3) return "Low contrast. Some phones won't read this, try darker dots or a lighter background.";
  if (a > b) return "Light dots on a dark background. Newer phones are fine, some older scanners aren't.";
  return "";
}
