import { describe, expect, test } from "vitest";
import { encode } from "./qr";
import { buildScene } from "./scene";
import { fit, planMorph, unitProgress, MORPH_MS } from "./draw";
import { colorWarning, contrastRatio, isHexColor } from "./contrast";

describe("planMorph", () => {
  const a = buildScene(encode("https://a.co/1", "M"));
  const b = buildScene(encode("https://a.co/2", "M"));

  test("first render: everything enters, nothing leaves", () => {
    const plan = planMorph(null, a);
    expect(plan.entering.size).toBe(a.units.length);
    expect(plan.leaving.size).toBe(0);
  });

  test("same scene: nothing moves", () => {
    const plan = planMorph(a, buildScene(encode("https://a.co/1", "M")));
    expect(plan.entering.size).toBe(0);
    expect(plan.leaving.size).toBe(0);
  });

  test("small edit: only the changed units animate, eyes stay put", () => {
    const plan = planMorph(a, b);
    expect(plan.sameGeometry).toBe(true);
    expect(plan.entering.size).toBeGreaterThan(0);
    expect(plan.entering.size).toBeLessThan(b.units.length);
    const eyeKeys = b.units.slice(0, 3).map((u) => u.key);
    for (const u of plan.entering.keys()) expect(eyeKeys).not.toContain(u.key);
  });

  test("different size: full swap, delays stay inside the morph window", () => {
    const big = buildScene(encode("x".repeat(120), "M"));
    const plan = planMorph(a, big);
    expect(plan.sameGeometry).toBe(false);
    expect(plan.leaving.size).toBe(a.units.length);
    expect(plan.entering.size).toBe(big.units.length);
    for (const d of plan.entering.values()) expect(d).toBeLessThanOrEqual(MORPH_MS);
  });
});

describe("unitProgress", () => {
  test("goes from 0 to 1 after its delay", () => {
    expect(unitProgress(0, 100)).toBe(0);
    expect(unitProgress(100, 100)).toBe(0);
    expect(unitProgress(300, 100)).toBeGreaterThan(0.9);
    expect(unitProgress(5000, 100)).toBe(1);
  });
});

describe("fit", () => {
  test("centers a scene inside a box", () => {
    const scene = buildScene(encode("hi"));
    const v = fit(scene, 400, 200);
    expect(v.scale).toBeCloseTo(200 / scene.width);
    expect(v.y).toBe(0);
    expect(v.x).toBeCloseTo((400 - scene.width * v.scale) / 2);
  });
});

describe("contrast", () => {
  test("ratio and hex checks", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(isHexColor("#a1b2c3")).toBe(true);
    expect(isHexColor("a1b2c3")).toBe(false);
  });

  test("colorWarning flags risky combos only", () => {
    expect(colorWarning("#111111", "#111111", "#ffffff", false)).toBe("");
    expect(colorWarning("#111111", "#ff5b35", "#fff3ee", false)).toBe("");
    expect(colorWarning("#cccccc", "#cccccc", "#ffffff", false)).toMatch(/Low contrast/);
    expect(colorWarning("#ffffff", "#ffffff", "#000000", false)).toMatch(/Light on dark/);
    expect(colorWarning("#000000", "#000000", "#ffffff", true)).toMatch(/Transparent/);
  });
});
