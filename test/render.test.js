import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { encode, renderSvg, isFinder, logoArea, scanWarning, QUIET_ZONE } from "../js/render.js";

const qrcode = createRequire(import.meta.url)("../vendor/qrcode.js");

test("encode returns a square matrix with finder patterns in the corners", () => {
  const m = encode(qrcode, "https://example.com");
  assert.equal(m.length, m[0].length);
  assert.equal(m[0][0], true);
  assert.equal(m[1][1], false);
  assert.equal(m[3][3], true);
});

test("encode handles non-ascii text", () => {
  assert.doesNotThrow(() => encode(qrcode, "café 🌮 日本"));
});

test("encode throws when data is too long for a QR code", () => {
  assert.throws(() => encode(qrcode, "x".repeat(5000), "H"));
});

test("isFinder covers the three corners only", () => {
  assert.equal(isFinder(21, 0, 0), true);
  assert.equal(isFinder(21, 6, 20), true);
  assert.equal(isFinder(21, 20, 0), true);
  assert.equal(isFinder(21, 20, 20), false);
  assert.equal(isFinder(21, 10, 10), false);
});

test("logoArea is odd sized and centered", () => {
  const { start, size } = logoArea(33);
  assert.equal(size % 2, 1);
  assert.equal(start * 2 + size, 33);
});

test("renderSvg sizes the viewBox with the quiet zone", () => {
  const m = encode(qrcode, "hi");
  const svg = renderSvg(m);
  const s = m.length + QUIET_ZONE * 2;
  assert.match(svg, new RegExp(`viewBox="0 0 ${s} ${s}"`));
});

test("every dot and eye style renders a non-empty path", () => {
  const m = encode(qrcode, "styles");
  for (const dots of ["square", "dots", "rounded", "bars"]) {
    for (const eyes of ["square", "rounded", "circle"]) {
      const svg = renderSvg(m, { dots, eyes });
      assert.doesNotMatch(svg, /d=""/, `${dots}/${eyes}`);
      assert.doesNotMatch(svg, /NaN/, `${dots}/${eyes}`);
    }
  }
});

test("transparent drops the background rect", () => {
  const m = encode(qrcode, "hi");
  assert.doesNotMatch(renderSvg(m, { transparent: true }), /<rect/);
  assert.match(renderSvg(m), /<rect/);
});

test("logo is embedded and user text is escaped", () => {
  const m = encode(qrcode, "hi", "H");
  const svg = renderSvg(m, { logo: "data:image/png;base64,AAA", frame: true, frameText: '<b>"hi"</b>' });
  assert.match(svg, /<image href="data:image\/png;base64,AAA"/);
  assert.doesNotMatch(svg, /<b>/);
});

test("scanWarning flags low contrast and inverted colors", () => {
  assert.equal(scanWarning("#000000", "#ffffff", false), "");
  assert.match(scanWarning("#cccccc", "#ffffff", false), /Low contrast/);
  assert.match(scanWarning("#ffffff", "#000000", false), /Light dots/);
  assert.match(scanWarning("#000000", "#ffffff", true), /Transparent/);
});
