// A "scene" is the drawable description of a styled QR code. The canvas preview
// (with the ripple animation) and the SVG/PNG export both draw from the same
// scene, so what you see is exactly what you download.

import { alignmentCenters, FINDER, isFinder, logoArea, type Matrix } from "./qr";

export type DotStyle = "square" | "rounded" | "dots" | "bars";
export type EyeStyle = "square" | "rounded" | "circle";

export type Style = {
  dots: DotStyle;
  eyes: EyeStyle;
  fg: string;
  eye: string;
  bg: string;
  transparent: boolean;
  logo: string;
  frame: boolean;
  frameText: string;
};

export const DEFAULT_STYLE: Style = {
  dots: "square",
  eyes: "square",
  fg: "#111111",
  eye: "#111111",
  bg: "#ffffff",
  transparent: false,
  logo: "",
  frame: false,
  frameText: "SCAN ME",
};

export type ScenePath = { d: string; fill: string; evenOdd?: boolean };
// A unit is the smallest animated piece: a module, a run of modules, an eye.
export type Unit = { key: string; cx: number; cy: number; paths: ScenePath[] };
export type Scene = {
  width: number;
  height: number;
  base: ScenePath[];
  units: Unit[];
  logo?: { href: string; x: number; y: number; size: number };
  label?: { text: string; x: number; y: number; size: number; fill: string };
};

export const QUIET_ZONE = 4;
const FRAME_BORDER = 1.5;
const LABEL_MAX = 18;

const f = (n: number) => +n.toFixed(3);

export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  if (r <= 0) return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
  const a = (dx: number, dy: number) => `a${f(r)} ${f(r)} 0 0 1 ${f(dx)} ${f(dy)}`;
  return (
    `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}${a(r, r)}v${f(h - 2 * r)}${a(-r, r)}` +
    `h${f(-(w - 2 * r))}${a(-r, -r)}v${f(-(h - 2 * r))}${a(r, -r)}z`
  );
}

export function circle(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
}

// A module whose corners round off only where it has no neighbours,
// so touching modules melt into blobs.
function blobModule(x: number, y: number, dark: (dr: number, dc: number) => boolean): string {
  const R = 0.5;
  const t = dark(-1, 0), b = dark(1, 0), l = dark(0, -1), rt = dark(0, 1);
  const tl = !t && !l ? R : 0, tr = !t && !rt ? R : 0, br = !b && !rt ? R : 0, bl = !b && !l ? R : 0;
  const arc = (r: number, dx: number, dy: number) => (r ? `a${r} ${r} 0 0 1 ${dx} ${dy}` : "");
  return (
    `M${f(x + tl)} ${f(y)}H${f(x + 1 - tr)}${arc(tr, tr, tr)}V${f(y + 1 - br)}${arc(br, -br, br)}` +
    `H${f(x + bl)}${arc(bl, -bl, -bl)}V${f(y + tl)}${arc(tl, tl, -tl)}z`
  );
}

const unit = (cx: number, cy: number, paths: ScenePath[]): Unit => ({
  key: paths.map((p) => `${p.fill}${p.evenOdd ? "e" : ""}${p.d}`).join("|"),
  cx: f(cx),
  cy: f(cy),
  paths,
});

type Grid = { n: number; ox: number; oy: number; dark: (r: number, c: number) => boolean };

function bodyUnits(style: DotStyle, g: Grid, fill: string): Unit[] {
  const { n, ox, oy, dark } = g;
  const out: Unit[] = [];

  if (style === "bars") {
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n; ) {
        if (!dark(r, c)) { r++; continue; }
        const start = r;
        while (dark(r, c)) r++;
        const len = r - start;
        out.push(unit(ox + c + 0.5, oy + start + len / 2, [
          { d: roundedRect(ox + c + 0.12, oy + start + 0.06, 0.76, len - 0.12, 0.38), fill },
        ]));
      }
    }
    return out;
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; ) {
      if (!dark(r, c)) { c++; continue; }
      if (style === "square") {
        const start = c;
        while (dark(r, c)) c++;
        const len = c - start;
        out.push(unit(ox + start + len / 2, oy + r + 0.5, [
          { d: `M${ox + start} ${oy + r}h${len}v1h${-len}z`, fill },
        ]));
        continue;
      }
      const d = style === "dots"
        ? circle(ox + c + 0.5, oy + r + 0.5, 0.44)
        : blobModule(ox + c, oy + r, (dr, dc) => dark(r + dr, c + dc));
      out.push(unit(ox + c + 0.5, oy + r + 0.5, [{ d, fill }]));
      c++;
    }
  }
  return out;
}

function eyeUnits(n: number, style: EyeStyle, ox: number, oy: number, fill: string): Unit[] {
  const corners: Array<[number, number]> = [[0, 0], [0, n - FINDER], [n - FINDER, 0]];
  return corners.map(([r, c]) => {
    const x = c + ox, y = r + oy, mid = 3.5;
    if (style === "circle") {
      return unit(x + mid, y + mid, [
        { d: circle(x + mid, y + mid, 3.5) + circle(x + mid, y + mid, 2.5), fill, evenOdd: true },
        { d: circle(x + mid, y + mid, 1.5), fill },
      ]);
    }
    const round = style === "rounded";
    return unit(x + mid, y + mid, [
      { d: roundedRect(x, y, 7, 7, round ? 2 : 0) + roundedRect(x + 1, y + 1, 5, 5, round ? 1.4 : 0), fill, evenOdd: true },
      { d: roundedRect(x + 2, y + 2, 3, 3, round ? 0.9 : 0), fill },
    ]);
  });
}

function alignmentUnits(centers: Array<[number, number]>, style: EyeStyle, ox: number, oy: number, fill: string): Unit[] {
  return centers.map(([r, c]) => {
    const cx = c + ox + 0.5, cy = r + oy + 0.5;
    if (style === "circle") {
      return unit(cx, cy, [{ d: circle(cx, cy, 2.5) + circle(cx, cy, 1.5) + circle(cx, cy, 0.5), fill, evenOdd: true }]);
    }
    const round = style === "rounded";
    const d =
      roundedRect(cx - 2.5, cy - 2.5, 5, 5, round ? 1.4 : 0) +
      roundedRect(cx - 1.5, cy - 1.5, 3, 3, round ? 0.8 : 0) +
      roundedRect(cx - 0.5, cy - 0.5, 1, 1, round ? 0.3 : 0);
    return unit(cx, cy, [{ d, fill, evenOdd: true }]);
  });
}

export function buildScene(matrix: Matrix, options: Partial<Style> = {}): Scene {
  const s: Style = { ...DEFAULT_STYLE, ...options };
  const n = matrix.length;
  const size = n + QUIET_ZONE * 2;
  const border = s.frame ? FRAME_BORDER : 0;
  const ox = border + QUIET_ZONE;
  const oy = border + QUIET_ZONE;

  const area = s.logo ? logoArea(n) : null;
  const inLogo = (r: number, c: number) =>
    !!area && r >= area.start && r < area.start + area.size && c >= area.start && c < area.start + area.size;
  const centers = alignmentCenters(n).filter(([r, c]) => !inLogo(r, c));
  const inAlignment = (r: number, c: number) => centers.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);
  const dark = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < n && c < n && matrix[r][c] && !isFinder(n, r, c) && !inLogo(r, c) && !inAlignment(r, c);

  const units = [
    ...eyeUnits(n, s.eyes, ox, oy, s.eye || s.fg),
    ...alignmentUnits(centers, s.eyes, ox, oy, s.fg),
    ...bodyUnits(s.dots, { n, ox, oy, dark }, s.fg),
  ];

  const logo = area
    ? { href: s.logo, x: f(ox + area.start + 0.6), y: f(oy + area.start + 0.6), size: f(area.size - 1.2) }
    : undefined;

  if (!s.frame) {
    return {
      width: size,
      height: size,
      base: s.transparent ? [] : [{ d: `M0 0h${size}v${size}h${-size}z`, fill: s.bg }],
      units,
      logo,
    };
  }

  // Sticker frame: a coloured border with a label band at the bottom.
  const band = Math.max(5, size * 0.17);
  const width = size + border * 2;
  const height = size + border + band;
  return {
    width: f(width),
    height: f(height),
    base: [
      { d: roundedRect(0, 0, width, height, 2.4), fill: s.fg },
      { d: roundedRect(border, border, size, size, 1.2), fill: s.bg },
    ],
    units,
    logo,
    label: { text: s.frameText.slice(0, LABEL_MAX), x: f(width / 2), y: f(size + border + band / 2), size: f(band * 0.46), fill: s.bg },
  };
}
