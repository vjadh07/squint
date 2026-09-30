// Adapted from Aceternity UI "Placeholders and Vanish Input" (ui.aceternity.com).
// Changes: controlled value that syncs with the rest of the app, labels for
// screen readers, reduced-motion support, typed particles, Squint styling.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; color: string };

type Props = {
  placeholders: string[];
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  label: string;
  submitLabel: string;
  className?: string;
};

const CANVAS = 800;
const CYCLE_MS = 3000;

export function PlaceholdersAndVanishInput({ placeholders, value: external, onValueChange, onSubmit, label, submitLabel, className }: Props) {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [value, setValue] = useState(external);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const particles = useRef<Particle[]>([]);

  // Pick up edits made elsewhere (the studio link field).
  useEffect(() => {
    if (!animating) setValue((v) => (v === external ? v : external));
  }, [external]);

  useEffect(() => {
    if (reduceMotion) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!id) id = setInterval(() => setCurrent((p) => (p + 1) % placeholders.length), CYCLE_MS);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [placeholders, reduceMotion]);

  const draw = useCallback(() => {
    const input = inputRef.current;
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!input || !ctx || !canvasRef.current) return;
    canvasRef.current.width = CANVAS;
    canvasRef.current.height = CANVAS;
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    const styles = getComputedStyle(input);
    ctx.font = `${parseFloat(styles.fontSize) * 2}px ${styles.fontFamily}`;
    ctx.fillStyle = "#f2f2f2";
    ctx.fillText(value, 16, 40);

    const data = ctx.getImageData(0, 0, CANVAS, CANVAS).data;
    const out: Particle[] = [];
    for (let y = 0; y < CANVAS; y++) {
      for (let x = 0; x < CANVAS; x++) {
        const i = 4 * (y * CANVAS + x);
        if (data[i] !== 0 && data[i + 1] !== 0 && data[i + 2] !== 0) {
          out.push({ x, y, r: 1, color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3]})` });
        }
      }
    }
    particles.current = out;
  }, [value]);

  const vanish = (start: number, done: () => void) => {
    const step = (pos: number) => {
      requestAnimationFrame(() => {
        const next: Particle[] = [];
        for (const p of particles.current) {
          if (p.x < pos) next.push(p);
          else if (p.r > 0) {
            p.x += Math.random() > 0.5 ? 1 : -1;
            p.y += Math.random() > 0.5 ? 1 : -1;
            p.r -= 0.05 * Math.random();
            next.push(p);
          }
        }
        particles.current = next;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, CANVAS, CANVAS);
          for (const p of next) {
            if (p.x > pos) {
              ctx.fillStyle = p.color;
              ctx.fillRect(p.x, p.y, p.r, p.r);
            }
          }
        }
        if (next.length > 0) step(pos - 8);
        else done();
      });
    };
    step(start);
  };

  const submit = () => {
    const text = inputRef.current?.value ?? "";
    if (!text || animating) return;
    onSubmit(text);
    const clear = () => {
      setValue("");
      setAnimating(false);
    };
    if (reduceMotion) return clear();
    setAnimating(true);
    draw();
    const maxX = particles.current.reduce((m, p) => (p.x > m ? p.x : m), 0);
    vanish(maxX, clear);
  };

  return (
    <form
      className={cn(
        "group relative flex h-14 w-full items-center overflow-hidden rounded-full border border-line bg-panel transition-[border-color,box-shadow] duration-200",
        "focus-within:border-amber focus-within:shadow-[0_0_0_3px_oklch(0.83_0.155_72/0.2)]",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-[22%] left-3 origin-top-left scale-50 pr-20 sm:left-5",
          animating ? "opacity-100" : "opacity-0",
        )}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          if (animating) return;
          setValue(e.target.value);
          onValueChange(e.target.value);
        }}
        type="text"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="url"
        spellCheck={false}
        enterKeyHint="go"
        aria-label={label}
        className={cn(
          "relative z-(--z-content) h-full w-full min-w-0 rounded-full border-none bg-transparent pr-16 pl-5 text-ink focus:outline-none sm:pl-7",
          animating && "text-transparent",
        )}
      />
      <button
        type="submit"
        disabled={!value || animating}
        aria-label={submitLabel}
        className="absolute right-2 z-(--z-content) grid size-10 place-items-center rounded-full bg-amber text-on-amber transition-[transform,background-color,opacity] duration-200 active:scale-95 disabled:bg-raised disabled:text-ink-3"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path
            d="M5 12h14"
            initial={{ strokeDasharray: "50%", strokeDashoffset: "50%" }}
            animate={{ strokeDashoffset: value ? 0 : "50%" }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
          <path d="M13 18l6-6" />
          <path d="M13 6l6 6" />
        </svg>
      </button>
      <div className="pointer-events-none absolute inset-0 flex items-center rounded-full" aria-hidden="true">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              key={`placeholder-${current}`}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="w-[calc(100%-5rem)] truncate pl-5 text-left text-ink-3 sm:pl-7"
            >
              {placeholders[current]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
