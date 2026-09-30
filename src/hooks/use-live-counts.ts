import { useEffect } from "react";
import { subscribeCount } from "@/lib/counter";
import { useSquint } from "@/lib/store";

// Keeps the public counts live while the tab is visible. Closing the stream
// when hidden saves battery on phones.
export function useLiveCounts() {
  const setCount = useSquint((s) => s.setCount);

  useEffect(() => {
    let stops: Array<() => void> = [];
    const start = () => {
      if (stops.length) return;
      stops = [
        subscribeCount("codes", (v) => setCount("codes", v)),
        subscribeCount("people", (v) => setCount("people", v)),
      ];
    };
    const stop = () => {
      stops.forEach((s) => s());
      stops = [];
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [setCount]);
}
