// Tiny real-code previews for the style tiles, as data URLs (no innerHTML).
import { encode } from "@/lib/qr";
import { buildScene, QUIET_ZONE, type Style } from "@/lib/scene";
import { sceneToSvg } from "@/lib/svg";

const sample = encode("squint", "M");
const cache = new Map<string, string>();

const toDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function cropped(svg: string, x: number, y: number, size: number) {
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${size} ${size}"`);
}

export function previewFor(style: Partial<Style>, crop?: "dots" | "eyes"): string {
  const key = JSON.stringify([style, crop]);
  const hit = cache.get(key);
  if (hit) return hit;
  let svg = sceneToSvg(buildScene(sample, { ...style, logo: "", frame: false, transparent: false }));
  if (crop === "dots") svg = cropped(svg, QUIET_ZONE + 6, QUIET_ZONE + 6, 10);
  if (crop === "eyes") svg = cropped(svg, QUIET_ZONE - 1, QUIET_ZONE - 1, 9);
  const url = toDataUrl(svg);
  if (cache.size > 200) cache.clear();
  cache.set(key, url);
  return url;
}
