import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  // Changes whenever the code changes, to replay the scan sweep.
  sweepKey: string | number;
  transparent?: boolean;
  className?: string;
};

const Bracket = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={cn("absolute size-7 border-amber sm:size-9", className)} />
);

// Camera-style frame around the live code: corner brackets and a scan line
// that sweeps down each time the code changes.
export function Viewfinder({ children, sweepKey, transparent, className }: Props) {
  const [sweep, setSweep] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSweep((s) => s + 1);
  }, [sweepKey]);

  return (
    <div className={cn("relative p-4 sm:p-6", className)}>
      <Bracket className="top-0 left-0 rounded-tl-md border-t-2 border-l-2" />
      <Bracket className="top-0 right-0 rounded-tr-md border-t-2 border-r-2" />
      <Bracket className="bottom-0 left-0 rounded-bl-md border-b-2 border-l-2" />
      <Bracket className="right-0 bottom-0 rounded-br-md border-r-2 border-b-2" />

      <div
        className={cn(
          "relative overflow-hidden rounded-[6px]",
          transparent &&
            "bg-[conic-gradient(#2a2a2a_25%,#1e1e1e_0_50%,#2a2a2a_0_75%,#1e1e1e_0)] bg-[length:18px_18px]",
        )}
      >
        {children}
        {sweep > 0 && (
          <span
            key={sweep}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[10%] animate-sweep bg-linear-to-b from-transparent via-amber/25 to-transparent after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-amber"
          />
        )}
      </div>
    </div>
  );
}
