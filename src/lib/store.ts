import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EMPTY_FIELDS, type FieldsByType, type PayloadType } from "./payload";
import { DEFAULT_STYLE, type Style } from "./scene";
import type { Ecc } from "./qr";
import { DOT_OPTIONS, EYE_OPTIONS, type Preset } from "./presets";
import { isHexColor } from "./contrast";

export type PngSize = 512 | 1024 | 2048;
export type StudioTab = "content" | "look" | "extras";

type State = {
  type: PayloadType;
  fields: FieldsByType;
  style: Style;
  ecc: Ecc;
  pngSize: PngSize;
  counts: { codes: number | null; people: number | null };
  studioTab: StudioTab;
};

type Actions = {
  setType: (type: PayloadType) => void;
  setField: <K extends PayloadType>(type: K, key: keyof FieldsByType[K], value: FieldsByType[K][keyof FieldsByType[K]]) => void;
  setStyle: (patch: Partial<Style>) => void;
  applyPreset: (preset: Preset) => void;
  setEcc: (ecc: Ecc) => void;
  setPngSize: (size: PngSize) => void;
  setCount: (key: "codes" | "people", value: number) => void;
  setStudioTab: (tab: StudioTab) => void;
  openStudio: (type: PayloadType) => void;
};

// Stored styles come back from localStorage, so treat them as untrusted.
function sanitizeStyle(raw: unknown): Partial<Style> {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Style> = {};
  if (DOT_OPTIONS.some((o) => o.value === r.dots)) out.dots = r.dots as Style["dots"];
  if (EYE_OPTIONS.some((o) => o.value === r.eyes)) out.eyes = r.eyes as Style["eyes"];
  for (const k of ["fg", "eye", "bg"] as const) if (typeof r[k] === "string" && isHexColor(r[k] as string)) out[k] = r[k] as string;
  if (typeof r.transparent === "boolean") out.transparent = r.transparent;
  if (typeof r.frame === "boolean") out.frame = r.frame;
  if (typeof r.frameText === "string") out.frameText = r.frameText.slice(0, 18);
  return out;
}

const ECCS: Ecc[] = ["L", "M", "Q", "H"];
const SIZES: PngSize[] = [512, 1024, 2048];

const safeLocal = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    return undefined as unknown as Storage;
  }
});

export const useSquint = create<State & Actions>()(
  persist(
    (set) => ({
      type: "link",
      fields: EMPTY_FIELDS,
      style: DEFAULT_STYLE,
      ecc: "M",
      pngSize: 1024,
      counts: { codes: null, people: null },
      studioTab: "content",

      setType: (type) => set({ type }),
      setField: (type, key, value) =>
        set((s) => ({ type, fields: { ...s.fields, [type]: { ...s.fields[type], [key]: value } } })),
      setStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
      applyPreset: ({ name: _name, ...look }) => set((s) => ({ style: { ...s.style, ...look, transparent: false } })),
      setEcc: (ecc) => set({ ecc }),
      setPngSize: (pngSize) => set({ pngSize }),
      setStudioTab: (studioTab) => set({ studioTab }),
      openStudio: (type) => set({ type, studioTab: "content" }),
      // Counts only ever go up; ignore stale values that arrive out of order.
      setCount: (key, value) =>
        set((s) => {
          const current = s.counts[key];
          if (current !== null && value <= current) return s;
          return { counts: { ...s.counts, [key]: value } };
        }),
    }),
    {
      name: "squint-v2",
      storage: safeLocal,
      // Only the look is remembered. What people type (Wi-Fi passwords...) and logos are not.
      partialize: (s) => ({ style: { ...s.style, logo: "" }, ecc: s.ecc, pngSize: s.pngSize }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...current,
          style: { ...current.style, ...sanitizeStyle(p.style), logo: "" },
          ecc: ECCS.includes(p.ecc as Ecc) ? (p.ecc as Ecc) : current.ecc,
          pngSize: SIZES.includes(p.pngSize as PngSize) ? (p.pngSize as PngSize) : current.pngSize,
        };
      },
    },
  ),
);
