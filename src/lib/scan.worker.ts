/// <reference lib="webworker" />
// Decodes off the main thread so a slow scan can never freeze the page.
import jsQR from "jsqr";

type Job = { id: number; data: Uint8ClampedArray; width: number; height: number };

self.onmessage = (event: MessageEvent<Job>) => {
  const { id, data, width, height } = event.data;
  try {
    const result = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
    self.postMessage({ id, text: result ? result.data : null });
  } catch {
    self.postMessage({ id, text: null });
  }
};
