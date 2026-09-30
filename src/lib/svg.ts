import type { Scene, ScenePath } from "./scene";

export const LABEL_FONT = "Arial Black, Arial, Helvetica, sans-serif";

const esc = (s: string) => String(s).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const pathTag = ({ d, fill, evenOdd }: ScenePath) =>
  `<path d="${d}" fill="${esc(fill)}"${evenOdd ? ' fill-rule="evenodd"' : ""}/>`;

// Merge unit paths that share fill + rule into one element to keep files small.
function mergedUnitPaths(scene: Scene): ScenePath[] {
  const groups = new Map<string, ScenePath>();
  for (const u of scene.units) {
    for (const p of u.paths) {
      const key = `${p.fill}|${p.evenOdd ? 1 : 0}`;
      const existing = groups.get(key);
      groups.set(key, existing ? { ...existing, d: existing.d + p.d } : { ...p });
    }
  }
  return [...groups.values()];
}

export function sceneToSvg(scene: Scene): string {
  const parts = [
    ...scene.base.map(pathTag),
    ...mergedUnitPaths(scene).map(pathTag),
  ];
  if (scene.logo) {
    const { href, x, y, size } = scene.logo;
    parts.push(`<image href="${esc(href)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`);
  }
  if (scene.label) {
    const { text, x, y, size, fill } = scene.label;
    parts.push(
      `<text x="${x}" y="${y}" fill="${esc(fill)}" font-family="${LABEL_FONT}" font-weight="900" font-size="${size}" ` +
        `letter-spacing="${+(size * 0.08).toFixed(3)}" text-anchor="middle" dominant-baseline="central">${esc(text)}</text>`,
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.width} ${scene.height}" ` +
    `width="${scene.width * 10}" height="${scene.height * 10}" shape-rendering="geometricPrecision">${parts.join("")}</svg>`
  );
}
