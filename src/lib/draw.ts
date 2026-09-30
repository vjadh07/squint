// Canvas side of the scene: static drawing (preview, PNG export, test scan)
// and the ripple morph between two scenes.

import type { Scene, Unit } from "./scene";
import { LABEL_FONT } from "./svg";

export type Viewport = { x: number; y: number; scale: number };
export type UnitPose = { scale: number; alpha: number };

const pathCache = new Map<string, Path2D>();
function path2d(d: string): Path2D {
  let p = pathCache.get(d);
  if (!p) {
    if (pathCache.size > 6000) pathCache.clear();
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(href: string): Promise<HTMLImageElement> {
  let p = imageCache.get(href);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load that image"));
      img.src = href;
    });
    if (imageCache.size > 8) imageCache.clear();
    imageCache.set(href, p);
  }
  return p;
}

// Fit a scene into a box, centered.
export function fit(scene: Scene, width: number, height: number): Viewport {
  const scale = Math.min(width / scene.width, height / scene.height);
  return { scale, x: (width - scene.width * scale) / 2, y: (height - scene.height * scale) / 2 };
}

function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, pose: UnitPose | null) {
  if (pose && (pose.scale <= 0.001 || pose.alpha <= 0.001)) return;
  ctx.save();
  if (pose) {
    ctx.globalAlpha *= pose.alpha;
    ctx.translate(unit.cx, unit.cy);
    ctx.scale(pose.scale, pose.scale);
    ctx.translate(-unit.cx, -unit.cy);
  }
  for (const p of unit.paths) {
    ctx.fillStyle = p.fill;
    ctx.fill(path2d(p.d), p.evenOdd ? "evenodd" : "nonzero");
  }
  ctx.restore();
}

type DrawOptions = {
  viewport: Viewport;
  logo?: HTMLImageElement | null;
  pose?: (unit: Unit) => UnitPose | null;
  skipBase?: boolean;
};

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, opts: DrawOptions) {
  const { viewport: v, logo, pose, skipBase } = opts;
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.scale(v.scale, v.scale);

  if (!skipBase) {
    for (const p of scene.base) {
      ctx.fillStyle = p.fill;
      ctx.fill(path2d(p.d), p.evenOdd ? "evenodd" : "nonzero");
    }
  }
  for (const u of scene.units) drawUnit(ctx, u, pose ? pose(u) : null);

  if (scene.logo && logo) {
    const { x, y, size } = scene.logo;
    const ratio = logo.naturalWidth / logo.naturalHeight || 1;
    const w = ratio >= 1 ? size : size * ratio;
    const h = ratio >= 1 ? size / ratio : size;
    ctx.drawImage(logo, x + (size - w) / 2, y + (size - h) / 2, w, h);
  }
  if (scene.label) {
    const { text, x, y, size, fill } = scene.label;
    ctx.fillStyle = fill;
    ctx.font = `900 ${size}px ${LABEL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${size * 0.08}px`;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

/* ---------- morph planning (pure, tested) ---------- */

export const MORPH_MS = 720;
const UNIT_MS = 380;

export type MorphPlan = {
  entering: Map<Unit, number>; // unit -> delay ms
  leaving: Map<Unit, number>;
  sameGeometry: boolean;
};

// Units that exist in both scenes stay still; the rest ripple out/in from the center.
export function planMorph(prev: Scene | null, next: Scene): MorphPlan {
  const sameGeometry = !!prev && prev.width === next.width && prev.height === next.height;
  const prevKeys = new Set(sameGeometry && prev ? prev.units.map((u) => u.key) : []);
  const nextKeys = new Set(next.units.map((u) => u.key));

  const delayFor = (scene: Scene) => {
    const cx = scene.width / 2, cy = scene.height / 2;
    const max = Math.hypot(cx, cy) || 1;
    return (u: Unit) => (Math.hypot(u.cx - cx, u.cy - cy) / max) * (MORPH_MS - UNIT_MS);
  };

  const entering = new Map<Unit, number>();
  const nextDelay = delayFor(next);
  for (const u of next.units) if (!prevKeys.has(u.key)) entering.set(u, nextDelay(u));

  const leaving = new Map<Unit, number>();
  if (prev) {
    const prevDelay = delayFor(prev);
    for (const u of prev.units) if (!sameGeometry || !nextKeys.has(u.key)) leaving.set(u, prevDelay(u) * 0.6);
  }
  return { entering, leaving, sameGeometry };
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function unitProgress(elapsed: number, delay: number): number {
  const t = Math.min(1, Math.max(0, (elapsed - delay) / UNIT_MS));
  return easeOutExpo(t);
}
