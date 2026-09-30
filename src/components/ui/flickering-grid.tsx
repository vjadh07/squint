// Adapted from Magic UI "Flickering Grid" (magicui.design, MIT).
// Changes for phones and low-end laptops: frame rate cap, device-pixel-ratio
// cap, a single static frame under reduced motion, pauses when offscreen.

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  fps?: number;
  className?: string;
};

const MAX_DPR = 1.5;

function toRgbPrefix(color: string): string {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return "rgba(255,255,255,";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},`;
}

export function FlickeringGrid({
  squareSize = 3,
  gridGap = 7,
  flickerChance = 0.25,
  color = "#ffffff",
  maxOpacity = 0.14,
  fps = 24,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const prefix = toRgbPrefix(color);
    const step = squareSize + gridGap;
    let cols = 0, rows = 0, dpr = 1;
    let squares = new Float32Array(0);
    let raf = 0, last = 0, visible = false;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.fillStyle = `${prefix}${squares[i * rows + j].toFixed(3)})`;
          ctx.fillRect(i * step * dpr, j * step * dpr, squareSize * dpr, squareSize * dpr);
        }
      }
    };

    const setup = () => {
      const { clientWidth: w, clientHeight: h } = wrap;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      cols = Math.ceil(w / step);
      rows = Math.ceil(h / step);
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) squares[i] = Math.random() * maxOpacity;
      draw();
    };

    const loop = (t: number) => {
      if (!visible) return;
      raf = requestAnimationFrame(loop);
      const dt = t - last;
      if (dt < 1000 / fps) return;
      last = t;
      const chance = flickerChance * (dt / 1000);
      for (let i = 0; i < squares.length; i++) if (Math.random() < chance) squares[i] = Math.random() * maxOpacity;
      draw();
    };

    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduceMotion;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity, fps, reduceMotion]);

  return (
    <div ref={wrapRef} className={cn("h-full w-full", className)} aria-hidden="true">
      <canvas ref={canvasRef} className="pointer-events-none" />
    </div>
  );
}
