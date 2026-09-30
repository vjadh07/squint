import type { DotStyle, EyeStyle, Style } from "./scene";
import type { PayloadType } from "./payload";

export type Preset = { name: string } & Pick<Style, "dots" | "eyes" | "fg" | "eye" | "bg">;

export const PRESETS: Preset[] = [
  { name: "Ink", dots: "square", eyes: "square", fg: "#111111", eye: "#111111", bg: "#ffffff" },
  { name: "Amber", dots: "rounded", eyes: "rounded", fg: "#1c1204", eye: "#1c1204", bg: "#f6b84a" },
  { name: "Dotty", dots: "dots", eyes: "circle", fg: "#1b1b6f", eye: "#1b1b6f", bg: "#eef0ff" },
  { name: "Bars", dots: "bars", eyes: "rounded", fg: "#0d0d0d", eye: "#d97a06", bg: "#fbfbf7" },
  { name: "Moss", dots: "rounded", eyes: "square", fg: "#113a2a", eye: "#113a2a", bg: "#eaf2e3" },
  { name: "Night", dots: "dots", eyes: "rounded", fg: "#f6b84a", eye: "#f6b84a", bg: "#101010" },
];

export const DOT_OPTIONS: Array<{ value: DotStyle; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Blob" },
  { value: "dots", label: "Dots" },
  { value: "bars", label: "Bars" },
];

export const EYE_OPTIONS: Array<{ value: EyeStyle; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Soft" },
  { value: "circle", label: "Round" },
];

export const TYPE_OPTIONS: Array<{ value: PayloadType; label: string }> = [
  { value: "link", label: "Link" },
  { value: "text", label: "Text" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "contact", label: "Contact" },
];

// Made-up examples for the "what's inside" section. Not real accounts.
export const SPECIMENS = [
  { type: "wifi", label: "Wi-Fi", payload: "WIFI:T:WPA;S:Guest Wi-Fi;P:tacotuesday;;", note: "Tape it to the fridge. Guests join without asking for the password." },
  { type: "link", label: "Link", payload: "https://yourcafe.com/menu", note: "Menus, posters, packaging. Opens the page, nothing in between." },
  { type: "contact", label: "Contact", payload: "BEGIN:VCARD\nVERSION:3.0\nN:Okafor;Maya;;;\nFN:Maya Okafor\nTEL:+14805550142\nEND:VCARD", note: "Put it on a business card. One scan saves you to their phone." },
  { type: "email", label: "Email", payload: "mailto:hello@yourcafe.com?subject=Catering", note: "Opens a new email with the address and subject filled in." },
  { type: "sms", label: "SMS", payload: "SMSTO:4805550199:Table 4 needs water", note: "Opens a text with the message already typed." },
] as const satisfies ReadonlyArray<{ type: PayloadType; label: string; payload: string; note: string }>;
