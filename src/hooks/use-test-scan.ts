import { useEffect, useState } from "react";
import type { Scene } from "@/lib/scene";
import { testScan, ScanTimeoutError } from "@/lib/scan";

export type ScanState =
  | { status: "checking" }
  | { status: "ok"; decoded: string }
  | { status: "mismatch"; decoded: string }
  | { status: "fail" }
  | { status: "skipped" };

const DEBOUNCE_MS = 380;

// Runs a real decode on the rendered code whenever it settles.
export function useTestScan(scene: Scene, expected: string): ScanState {
  const [state, setState] = useState<ScanState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "checking" });
    const timer = setTimeout(() => {
      testScan(scene)
        .then((decoded) => {
          if (cancelled) return;
          if (decoded === null) setState({ status: "fail" });
          else setState({ status: decoded === expected ? "ok" : "mismatch", decoded });
        })
        .catch((err) => {
          if (!cancelled) setState({ status: err instanceof ScanTimeoutError ? "skipped" : "fail" });
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scene, expected]);

  return state;
}
