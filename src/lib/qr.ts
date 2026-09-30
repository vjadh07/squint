import qrcode from "qrcode-generator";

export type Ecc = "L" | "M" | "Q" | "H";
export type Matrix = boolean[][];

export const FINDER = 7;

// qrcode-generator defaults to Latin-1. Swap in UTF-8 so emoji and accents survive.
const utf8 = new TextEncoder();
qrcode.stringToBytes = (s: string) => Array.from(utf8.encode(s));

export class PayloadTooLongError extends Error {
  constructor() {
    super("That's too much for one QR code. Try a shorter link or less text.");
    this.name = "PayloadTooLongError";
  }
}

export function encode(text: string, ecc: Ecc = "M"): Matrix {
  const qr = qrcode(0, ecc);
  qr.addData(text, "Byte");
  try {
    qr.make();
  } catch {
    throw new PayloadTooLongError();
  }
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

export function isFinder(n: number, r: number, c: number): boolean {
  const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + FINDER && c >= c0 && c < c0 + FINDER;
  return inBox(0, 0) || inBox(0, n - FINDER) || inBox(n - FINDER, 0);
}

// Alignment pattern centre rows/cols per QR version (from the spec, same table qrcode.js uses).
const ALIGNMENT_POSITIONS: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
  [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

export const versionOf = (n: number) => (n - 17) / 4;

// Centres of the small 5x5 alignment squares. Scanners lean on these, so they
// get drawn solid like the corner eyes instead of in the dot style.
export function alignmentCenters(n: number): Array<[number, number]> {
  const pos = ALIGNMENT_POSITIONS[versionOf(n) - 1] ?? [];
  const out: Array<[number, number]> = [];
  for (const r of pos) for (const c of pos) if (!isFinder(n, r, c)) out.push([r, c]);
  return out;
}

const LOGO_FRACTION = 0.22;

// Centered square of modules left empty under a logo. Odd size keeps it centered.
export function logoArea(n: number): { start: number; size: number } {
  let size = Math.round(n * LOGO_FRACTION);
  if (size % 2 === 0) size += 1;
  return { start: (n - size) / 2, size };
}
