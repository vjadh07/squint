import { describe, expect, test } from "vitest";
import { alignmentCenters, encode, isFinder, logoArea, PayloadTooLongError, versionOf } from "./qr";
import { buildScene, QUIET_ZONE, type DotStyle, type EyeStyle } from "./scene";
import { sceneToSvg } from "./svg";

describe("encode", () => {
  test("returns a square matrix with finder patterns in the corners", () => {
    const m = encode("https://example.com");
    expect(m.length).toBe(m[0].length);
    expect(m[0][0]).toBe(true);
    expect(m[1][1]).toBe(false);
    expect(m[3][3]).toBe(true);
  });

  test("handles non-ascii text as utf-8", () => {
    const ascii = encode("cafe", "L").length;
    expect(() => encode("café 🌮 日本")).not.toThrow();
    expect(ascii).toBe(21);
  });

  test("throws a friendly error when data is too long", () => {
    expect(() => encode("x".repeat(5000), "H")).toThrow(PayloadTooLongError);
  });
});

describe("geometry helpers", () => {
  test("isFinder covers the three corners only", () => {
    expect(isFinder(21, 0, 0)).toBe(true);
    expect(isFinder(21, 6, 20)).toBe(true);
    expect(isFinder(21, 20, 0)).toBe(true);
    expect(isFinder(21, 20, 20)).toBe(false);
    expect(isFinder(21, 10, 10)).toBe(false);
  });

  test("alignmentCenters skips finder corners", () => {
    expect(alignmentCenters(21)).toEqual([]);
    expect(alignmentCenters(25)).toEqual([[18, 18]]);
    expect(alignmentCenters(45)).toHaveLength(6);
    expect(versionOf(25)).toBe(2);
  });

  test("logoArea is odd sized and centered", () => {
    const { start, size } = logoArea(33);
    expect(size % 2).toBe(1);
    expect(start * 2 + size).toBe(33);
  });
});

describe("buildScene", () => {
  const m = encode("styles check", "M");

  test("sizes the canvas with the quiet zone", () => {
    const scene = buildScene(m);
    expect(scene.width).toBe(m.length + QUIET_ZONE * 2);
    expect(scene.height).toBe(scene.width);
  });

  test("every dot and eye style produces valid units", () => {
    const dots: DotStyle[] = ["square", "rounded", "dots", "bars"];
    const eyes: EyeStyle[] = ["square", "rounded", "circle"];
    for (const d of dots) {
      for (const e of eyes) {
        const scene = buildScene(m, { dots: d, eyes: e });
        expect(scene.units.length).toBeGreaterThan(10);
        for (const u of scene.units) {
          expect(Number.isFinite(u.cx) && Number.isFinite(u.cy)).toBe(true);
          for (const p of u.paths) expect(p.d).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });

  test("unit keys change with color so the morph knows what changed", () => {
    const a = buildScene(m, { fg: "#000000" }).units.at(-1)!.key;
    const b = buildScene(m, { fg: "#222222" }).units.at(-1)!.key;
    expect(a).not.toBe(b);
  });

  test("transparent drops the background", () => {
    expect(buildScene(m, { transparent: true }).base).toHaveLength(0);
    expect(buildScene(m).base).toHaveLength(1);
  });

  test("frame adds a border, band and label, and ignores transparency", () => {
    const scene = buildScene(m, { frame: true, transparent: true, frameText: "A VERY LONG LABEL THAT GETS CUT" });
    expect(scene.height).toBeGreaterThan(scene.width);
    expect(scene.base).toHaveLength(2);
    expect(scene.label?.text.length).toBeLessThanOrEqual(18);
  });

  test("logo clears the center modules", () => {
    const withLogo = buildScene(encode("logo test", "H"), { logo: "data:image/png;base64,AAA" });
    const without = buildScene(encode("logo test", "H"));
    expect(withLogo.logo).toBeDefined();
    expect(withLogo.units.length).toBeLessThan(without.units.length);
  });
});

describe("sceneToSvg", () => {
  test("renders a viewBox, merges paths and escapes user text", () => {
    const scene = buildScene(encode("hi", "H"), {
      logo: 'data:image/png;base64,AAA"onload="x',
      frame: true,
      frameText: '<b>"hi"</b>',
    });
    const svg = sceneToSvg(scene);
    expect(svg).toMatch(new RegExp(`viewBox="0 0 ${scene.width} ${scene.height}"`));
    expect(svg).not.toMatch(/<b>/);
    expect(svg).not.toMatch(/"onload=/);
    expect((svg.match(/<path/g) ?? []).length).toBeLessThan(8);
  });
});
