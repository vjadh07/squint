// Turns form fields into the string that actually goes inside the QR code.

export type PayloadType = "link" | "text" | "wifi" | "email" | "phone" | "sms" | "contact";

export type FieldsByType = {
  link: { url: string };
  text: { text: string };
  wifi: { ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean };
  email: { to: string; subject: string; body: string };
  phone: { number: string };
  sms: { number: string; body: string };
  contact: { first: string; last: string; phone: string; email: string; org: string; url: string };
};

export const EMPTY_FIELDS: FieldsByType = {
  link: { url: "" },
  text: { text: "" },
  wifi: { ssid: "", password: "", security: "WPA", hidden: false },
  email: { to: "", subject: "", body: "" },
  phone: { number: "" },
  sms: { number: "", body: "" },
  contact: { first: "", last: "", phone: "", email: "", org: "", url: "" },
};

const trim = (v: string | undefined) => (v ?? "").trim();

// Wi-Fi and vCard both need backslash escaping for their separator chars.
const escapeWifi = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");
const escapeVcard = (v: string) => v.replace(/([\\;,])/g, "\\$1");
const compactNumber = (v: string) => trim(v).replace(/\s+/g, "");

const builders: { [K in PayloadType]: (f: FieldsByType[K]) => string } = {
  link: ({ url }) => {
    const u = trim(url);
    if (!u) return "";
    return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;
  },
  text: ({ text }) => text ?? "",
  wifi: ({ ssid, password, security, hidden }) => {
    const name = trim(ssid);
    if (!name) return "";
    const type = security || "WPA";
    let out = `WIFI:T:${type};S:${escapeWifi(name)};`;
    if (type !== "nopass" && password) out += `P:${escapeWifi(password)};`;
    if (hidden) out += "H:true;";
    return `${out};`;
  },
  email: ({ to, subject, body }) => {
    const addr = trim(to);
    if (!addr) return "";
    const params: string[] = [];
    if (trim(subject)) params.push(`subject=${encodeURIComponent(trim(subject))}`);
    if (trim(body)) params.push(`body=${encodeURIComponent(trim(body))}`);
    return `mailto:${addr}${params.length ? `?${params.join("&")}` : ""}`;
  },
  phone: ({ number }) => {
    const n = compactNumber(number);
    return n ? `tel:${n}` : "";
  },
  sms: ({ number, body }) => {
    const n = compactNumber(number);
    return n ? `SMSTO:${n}:${trim(body)}` : "";
  },
  contact: ({ first, last, phone, email, org, url }) => {
    const f = trim(first);
    const l = trim(last);
    if (!f && !l) return "";
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVcard(l)};${escapeVcard(f)};;;`,
      `FN:${escapeVcard([f, l].filter(Boolean).join(" "))}`,
    ];
    if (trim(org)) lines.push(`ORG:${escapeVcard(trim(org))}`);
    if (trim(phone)) lines.push(`TEL:${trim(phone)}`);
    if (trim(email)) lines.push(`EMAIL:${trim(email)}`);
    if (trim(url)) lines.push(`URL:${trim(url)}`);
    lines.push("END:VCARD");
    return lines.join("\n");
  },
};

export function buildPayload<K extends PayloadType>(type: K, fields: FieldsByType[K]): string {
  const build = builders[type] as ((f: FieldsByType[K]) => string) | undefined;
  if (!build) throw new Error(`Unknown payload type: ${String(type)}`);
  return build(fields);
}

// Short human version of a payload for readouts ("stillframes.co", "Wi-Fi: Home").
export function describePayload(payload: string): string {
  if (!payload) return "";
  const wifi = payload.match(/^WIFI:.*?S:((?:\\.|[^;])*)/);
  if (wifi) return `Wi-Fi: ${wifi[1].replace(/\\(.)/g, "$1")}`;
  if (payload.startsWith("BEGIN:VCARD")) {
    const fn = payload.match(/\nFN:(.*)/);
    return `Contact: ${fn ? fn[1].replace(/\\(.)/g, "$1") : "card"}`;
  }
  if (payload.startsWith("mailto:")) return `Email: ${payload.slice(7).split("?")[0]}`;
  if (payload.startsWith("tel:")) return `Call: ${payload.slice(4)}`;
  if (payload.startsWith("SMSTO:")) return `Text: ${payload.split(":")[1]}`;
  return payload.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
