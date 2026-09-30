import type { Scene } from "./scene";
import { sceneToSvg } from "./svg";
import { drawScene, fit, loadImage } from "./draw";

// Draw straight to a canvas instead of SVG -> <img> -> canvas. Safari taints the
// canvas when an SVG image contains another image (the logo), which breaks toBlob.
export async function sceneToCanvas(scene: Scene, width: number, underlay?: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(width * (scene.height / scene.width));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  if (underlay) {
    ctx.fillStyle = underlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const logo = scene.logo ? await loadImage(scene.logo.href) : null;
  drawScene(ctx, scene, { viewport: fit(scene, canvas.width, canvas.height), logo });
  return canvas;
}

export async function sceneToPngBlob(scene: Scene, width: number): Promise<Blob> {
  const canvas = await sceneToCanvas(scene, width);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"),
  );
}

export const sceneToSvgBlob = (scene: Scene) => new Blob([sceneToSvg(scene)], { type: "image/svg+xml" });

export function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}

// Phones get the native share sheet ("Save Image" on iOS, Photos/Files on Android).
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare || !navigator.share) return false;
  try {
    return navigator.canShare({ files: [new File([new Blob()], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export async function shareBlob(blob: Blob, filename: string): Promise<"shared" | "cancelled"> {
  const file = new File([blob], filename, { type: blob.type });
  try {
    await navigator.share({ files: [file], title: "QR code" });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    throw err;
  }
}

export const canCopyImages = () =>
  typeof navigator !== "undefined" && !!navigator.clipboard?.write && typeof ClipboardItem !== "undefined";

export async function copyPng(pngPromise: Promise<Blob>) {
  // Safari wants the promise handed to ClipboardItem directly, inside the click.
  await navigator.clipboard.write([new ClipboardItem({ "image/png": pngPromise })]);
}
