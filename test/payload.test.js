import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayload } from "../js/payload.js";

test("link adds https when the scheme is missing", () => {
  assert.equal(buildPayload("link", { url: "example.com" }), "https://example.com");
});

test("link keeps an existing scheme", () => {
  assert.equal(buildPayload("link", { url: "http://a.co/x" }), "http://a.co/x");
});

test("link returns empty string for blank input", () => {
  assert.equal(buildPayload("link", { url: "   " }), "");
});

test("text is passed through as-is", () => {
  assert.equal(buildPayload("text", { text: "hi there" }), "hi there");
});

test("wifi escapes special characters", () => {
  const out = buildPayload("wifi", { ssid: 'My;Net', password: 'p:a,ss"\\', security: "WPA", hidden: false });
  assert.equal(out, 'WIFI:T:WPA;S:My\\;Net;P:p\\:a\\,ss\\"\\\\;;');
});

test("wifi with no security drops the password", () => {
  const out = buildPayload("wifi", { ssid: "Cafe", password: "ignored", security: "nopass", hidden: true });
  assert.equal(out, "WIFI:T:nopass;S:Cafe;H:true;;");
});

test("wifi without ssid is empty", () => {
  assert.equal(buildPayload("wifi", { ssid: "", security: "WPA" }), "");
});

test("email builds a mailto with encoded subject and body", () => {
  const out = buildPayload("email", { to: "a@b.co", subject: "Hi there", body: "a&b" });
  assert.equal(out, "mailto:a@b.co?subject=Hi%20there&body=a%26b");
});

test("email without subject or body has no query", () => {
  assert.equal(buildPayload("email", { to: "a@b.co" }), "mailto:a@b.co");
});

test("phone strips spaces", () => {
  assert.equal(buildPayload("phone", { number: "+1 480 555 0199" }), "tel:+14805550199");
});

test("sms includes body", () => {
  assert.equal(buildPayload("sms", { number: "4805550199", body: "yo" }), "SMSTO:4805550199:yo");
});

test("contact builds a vcard and escapes commas", () => {
  const out = buildPayload("contact", { first: "Ana", last: "Ruiz", phone: "123", email: "a@r.co", org: "Tacos, Inc", url: "" });
  assert.equal(
    out,
    ["BEGIN:VCARD", "VERSION:3.0", "N:Ruiz;Ana;;;", "FN:Ana Ruiz", "ORG:Tacos\\, Inc", "TEL:123", "EMAIL:a@r.co", "END:VCARD"].join("\n")
  );
});

test("contact with no name is empty", () => {
  assert.equal(buildPayload("contact", { first: "", last: "" }), "");
});

test("unknown type throws", () => {
  assert.throws(() => buildPayload("nope", {}), /Unknown/);
});
