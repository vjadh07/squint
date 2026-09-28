// Turns form fields into the string that actually goes inside the QR code.

const trim = (v) => (v ?? "").toString().trim();

// Wi-Fi and vCard both need backslash escaping for their separator chars.
const escapeWifi = (v) => v.replace(/([\\;,:"])/g, "\\$1");
const escapeVcard = (v) => v.replace(/([\\;,])/g, "\\$1");

function link({ url }) {
  const u = trim(url);
  if (!u) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;
}

function text({ text }) {
  return (text ?? "").toString();
}

function wifi({ ssid, password, security, hidden }) {
  const name = trim(ssid);
  if (!name) return "";
  const type = security || "WPA";
  let out = `WIFI:T:${type};S:${escapeWifi(name)};`;
  if (type !== "nopass" && password) out += `P:${escapeWifi(password)};`;
  if (hidden) out += "H:true;";
  return out + ";";
}

function email({ to, subject, body }) {
  const addr = trim(to);
  if (!addr) return "";
  const params = [];
  if (trim(subject)) params.push(`subject=${encodeURIComponent(trim(subject))}`);
  if (trim(body)) params.push(`body=${encodeURIComponent(trim(body))}`);
  return `mailto:${addr}${params.length ? "?" + params.join("&") : ""}`;
}

function phone({ number }) {
  const n = trim(number).replace(/\s+/g, "");
  return n ? `tel:${n}` : "";
}

function sms({ number, body }) {
  const n = trim(number).replace(/\s+/g, "");
  if (!n) return "";
  return `SMSTO:${n}:${trim(body)}`;
}

function contact({ first, last, phone: tel, email: mail, org, url }) {
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
  if (trim(tel)) lines.push(`TEL:${trim(tel)}`);
  if (trim(mail)) lines.push(`EMAIL:${trim(mail)}`);
  if (trim(url)) lines.push(`URL:${trim(url)}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

const BUILDERS = { link, text, wifi, email, phone, sms, contact };

export function buildPayload(type, fields) {
  const fn = BUILDERS[type];
  if (!fn) throw new Error(`Unknown payload type: ${type}`);
  return fn(fields || {});
}

export const PAYLOAD_TYPES = Object.keys(BUILDERS);
