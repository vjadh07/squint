// Adapted from Magic UI "Hyper Text" (magicui.design, MIT).
// Changes: keeps the original case and line breaks, replays whenever the text
// changes, and shows the final text straight away under reduced motion.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const CHARSET = "01#%&*+=<>/\\:;".split("");
const pick = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

type Props = { children: string; className?: string; duration?: number };

export function HyperText({ children, className, duration = 700 }: Props) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(children);
  const frame = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(children);
      return;
    }
    const start = performance.now();
    const chars = children.split("");
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = progress * chars.length;
      setDisplay(chars.map((ch, i) => (ch === " " || ch === "\n" || i <= revealed ? ch : pick())).join(""));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [children, duration, reduceMotion]);

  return (
    <span className={cn("whitespace-pre-wrap break-all", className)}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{children}</span>
    </span>
  );
}
