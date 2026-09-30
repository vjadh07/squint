import { describe, expect, test } from "vitest";
import { buildPayload, describePayload, EMPTY_FIELDS } from "./payload";

describe("buildPayload", () => {
  test("link adds https when the scheme is missing", () => {
    expect(buildPayload("link", { url: "example.com" })).toBe("https://example.com");
  });

  test("link keeps an existing scheme and ignores blank input", () => {
    expect(buildPayload("link", { url: "http://a.co/x" })).toBe("http://a.co/x");
    expect(buildPayload("link", { url: "   " })).toBe("");
  });

  test("text is passed through as-is", () => {
    expect(buildPayload("text", { text: "hi there" })).toBe("hi there");
  });

  test("wifi escapes special characters", () => {
    const out = buildPayload("wifi", { ssid: "My;Net", password: 'p:a,ss"\\', security: "WPA", hidden: false });
    expect(out).toBe('WIFI:T:WPA;S:My\\;Net;P:p\\:a\\,ss\\"\\\\;;');
  });

  test("wifi with no security drops the password and marks hidden", () => {
    const out = buildPayload("wifi", { ssid: "Cafe", password: "ignored", security: "nopass", hidden: true });
    expect(out).toBe("WIFI:T:nopass;S:Cafe;H:true;;");
  });

  test("wifi without ssid is empty", () => {
    expect(buildPayload("wifi", EMPTY_FIELDS.wifi)).toBe("");
  });

  test("email builds a mailto with encoded subject and body", () => {
    expect(buildPayload("email", { to: "a@b.co", subject: "Hi there", body: "a&b" })).toBe(
      "mailto:a@b.co?subject=Hi%20there&body=a%26b",
    );
    expect(buildPayload("email", { to: "a@b.co", subject: "", body: "" })).toBe("mailto:a@b.co");
    expect(buildPayload("email", EMPTY_FIELDS.email)).toBe("");
  });

  test("phone and sms strip spaces", () => {
    expect(buildPayload("phone", { number: "+1 480 555 0199" })).toBe("tel:+14805550199");
    expect(buildPayload("sms", { number: "480 555 0199", body: "yo" })).toBe("SMSTO:4805550199:yo");
    expect(buildPayload("phone", EMPTY_FIELDS.phone)).toBe("");
    expect(buildPayload("sms", EMPTY_FIELDS.sms)).toBe("");
  });

  test("contact builds a vcard and escapes commas", () => {
    const out = buildPayload("contact", {
      first: "Ana", last: "Ruiz", phone: "123", email: "a@r.co", org: "Tacos, Inc", url: "ruiz.co",
    });
    expect(out.split("\n")).toEqual([
      "BEGIN:VCARD", "VERSION:3.0", "N:Ruiz;Ana;;;", "FN:Ana Ruiz", "ORG:Tacos\\, Inc",
      "TEL:123", "EMAIL:a@r.co", "URL:ruiz.co", "END:VCARD",
    ]);
  });

  test("contact with no name is empty", () => {
    expect(buildPayload("contact", EMPTY_FIELDS.contact)).toBe("");
  });

  test("unknown type throws", () => {
    // @ts-expect-error testing a bad runtime value
    expect(() => buildPayload("nope", {})).toThrow(/Unknown/);
  });
});

describe("describePayload", () => {
  test("shortens links and labels structured payloads", () => {
    expect(describePayload("https://stillframes.co/")).toBe("stillframes.co");
    expect(describePayload("WIFI:T:WPA;S:Home\\;Net;P:x;;")).toBe("Wi-Fi: Home;Net");
    expect(describePayload("BEGIN:VCARD\nVERSION:3.0\nN:R;A;;;\nFN:Ana Ruiz\nEND:VCARD")).toBe("Contact: Ana Ruiz");
    expect(describePayload("mailto:a@b.co?subject=x")).toBe("Email: a@b.co");
    expect(describePayload("tel:+1480")).toBe("Call: +1480");
    expect(describePayload("SMSTO:4805550199:yo")).toBe("Text: 4805550199");
    expect(describePayload("")).toBe("");
  });
});
