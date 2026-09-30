// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_STYLE } from "./scene";
import { PRESETS } from "./presets";

// Node 25 ships its own global localStorage that shadows jsdom's and throws
// without --localstorage-file, so tests use a small in-memory Storage instead.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, String(value)); }
}
const memory = new MemoryStorage();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, "localStorage", { value: memory, configurable: true });
}

async function freshStore(saved?: unknown) {
  window.localStorage.clear();
  if (saved !== undefined) window.localStorage.setItem("squint-v2", JSON.stringify({ state: saved, version: 0 }));
  vi.resetModules();
  const { useSquint } = await import("./store");
  return useSquint;
}

describe("store", () => {
  beforeEach(() => window.localStorage.clear());

  test("starts on the link type with the default style", async () => {
    const store = await freshStore();
    const s = store.getState();
    expect(s.type).toBe("link");
    expect(s.style).toEqual(DEFAULT_STYLE);
    expect(s.counts).toEqual({ codes: null, people: null });
  });

  test("setField switches to that type and only touches that field", async () => {
    const store = await freshStore();
    store.getState().setField("wifi", "ssid", "Home");
    const s = store.getState();
    expect(s.type).toBe("wifi");
    expect(s.fields.wifi.ssid).toBe("Home");
    expect(s.fields.wifi.security).toBe("WPA");
    expect(s.fields.link.url).toBe("");
  });

  test("applyPreset copies the look and turns off transparency", async () => {
    const store = await freshStore();
    store.getState().setStyle({ transparent: true, frame: true });
    store.getState().applyPreset(PRESETS[1]);
    const { style } = store.getState();
    expect(style.fg).toBe(PRESETS[1].fg);
    expect(style.dots).toBe(PRESETS[1].dots);
    expect(style.transparent).toBe(false);
    expect(style.frame).toBe(true);
    expect(style).not.toHaveProperty("name");
  });

  test("counts only go up, stale or repeated values are ignored", async () => {
    const store = await freshStore();
    const { setCount } = store.getState();
    setCount("codes", 5);
    const before = store.getState().counts;
    setCount("codes", 5);
    expect(store.getState().counts).toBe(before);
    setCount("codes", 3);
    expect(store.getState().counts.codes).toBe(5);
    setCount("codes", 9);
    expect(store.getState().counts.codes).toBe(9);
  });

  test("openStudio picks the type and jumps to the content tab", async () => {
    const store = await freshStore();
    store.getState().setStudioTab("extras");
    store.getState().openStudio("contact");
    expect(store.getState().type).toBe("contact");
    expect(store.getState().studioTab).toBe("content");
  });

  test("remembers the look but never what was typed or the logo", async () => {
    const store = await freshStore();
    store.getState().setField("wifi", "password", "secret123");
    store.getState().setStyle({ fg: "#123456", logo: "data:image/png;base64,AAA" });
    const saved = window.localStorage.getItem("squint-v2") ?? "";
    expect(saved).toContain("#123456");
    expect(saved).not.toContain("secret123");
    expect(saved).not.toContain("base64");
  });

  test("restores a saved style but rejects junk values", async () => {
    const store = await freshStore({
      style: { dots: "dots", eyes: "<script>", fg: "#abcdef", bg: "red; x", frameText: "A".repeat(40), transparent: "yes", logo: "data:x" },
      ecc: "Z",
      pngSize: 2048,
    });
    const { style, ecc, pngSize } = store.getState();
    expect(style.dots).toBe("dots");
    expect(style.eyes).toBe(DEFAULT_STYLE.eyes);
    expect(style.fg).toBe("#abcdef");
    expect(style.bg).toBe(DEFAULT_STYLE.bg);
    expect(style.frameText).toHaveLength(18);
    expect(style.transparent).toBe(false);
    expect(style.logo).toBe("");
    expect(ecc).toBe("M");
    expect(pngSize).toBe(2048);
  });
});
