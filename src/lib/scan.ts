// Test-scans a code before anyone prints it. Decoding runs in a Web Worker so it
// never blocks scrolling or typing, with an in-page fallback for old browsers.

import type { Scene } from "./scene";
import { sceneToCanvas } from "./exporter";

// jsQR gets very slow on perfectly sharp synthetic images (too many identical
// finder candidates). A small image with a slight camera-like blur decodes in
// ~15ms and is closer to what a real phone sees anyway.
const SCAN_SIZE = 320;
const CAMERA_BLUR_PX = 1.2;
// Some devices starve worker threads (background QoS, battery saver). If the
// worker doesn't answer quickly we decode in the page instead, which only takes
// a few ms at this size, and stick with that for the rest of the visit.
const WORKER_PATIENCE_MS = 1500;

export class ScanTimeoutError extends Error {}

let worker: Worker | null | undefined;
let nextId = 0;
const pending = new Map<number, (text: string | null) => void>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./scan.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number; text: string | null }>) => {
      pending.get(e.data.id)?.(e.data.text);
      pending.delete(e.data.id);
    };
    worker.onerror = () => {
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function decodeInPage(img: ImageData): Promise<string | null> {
  const jsQR = (await import("jsqr")).default;
  const r = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  return r ? r.data : null;
}

async function snapshot(scene: Scene): Promise<ImageData | null> {
  const sharp = await sceneToCanvas(scene, SCAN_SIZE, "#ffffff");
  const canvas = document.createElement("canvas");
  canvas.width = sharp.width;
  canvas.height = sharp.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `blur(${CAMERA_BLUR_PX}px)`;
  ctx.drawImage(sharp, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export async function testScan(scene: Scene): Promise<string | null> {
  const img = await snapshot(scene);
  if (!img) return null;
  const w = getWorker();
  if (!w) return decodeInPage(img);

  const id = ++nextId;
  const copy = new Uint8ClampedArray(img.data);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker?.terminate();
      worker = null;
      resolve(decodeInPage(new ImageData(copy, img.width, img.height)));
    }, WORKER_PATIENCE_MS);
    pending.set(id, (text) => {
      clearTimeout(timer);
      resolve(text);
    });
    w.postMessage({ id, data: img.data, width: img.width, height: img.height }, [img.data.buffer]);
  });
}
