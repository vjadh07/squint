// WCAG relative luminance, used for a quick heads-up before the real test scan runs.

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((ch) => ch + ch).join("") : v;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const ch = parseInt(full.slice(i, i + 2), 16) / 255;
    return ch <= 0.03928 ? ch / 12.92 : ((ch + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const isHexColor = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

// Corner eyes are big and chunky, so they get away with less contrast than the dots.
export function colorWarning(fg: string, eye: string, bg: string, transparent: boolean): string {
  if (transparent) return "Transparent background. Put it on something light so phones can read it.";
  if (contrastRatio(fg, bg) < 3 || contrastRatio(eye, bg) < 2.2) return "Low contrast. Try darker dots or a lighter background.";
  if (luminance(fg) > luminance(bg)) return "Light on dark. Newer phones are fine, some older scanners aren't.";
  return "";
}
