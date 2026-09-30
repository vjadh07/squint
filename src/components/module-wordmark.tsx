import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// "SQUINT" in a 7-row pixel font, drawn as QR-style modules.
const GLYPHS: Record<string, string[]> = {
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
};
const WORD = "SQUINT";
const ROWS = 7;

function buildCells() {
  const cells: Array<[number, number]> = [];
  let x = 0;
  for (const ch of WORD) {
    const g = GLYPHS[ch];
    g.forEach((row, y) => row.split("").forEach((c, dx) => c === "#" && cells.push([x + dx, y])));
    x += g[0].length + 1;
  }
  return { cells, cols: x - 1 };
}
const { cells: CELLS, cols: COLS } = buildCells();

const INK = [236, 236, 236];
const AMBER = [246, 184, 74];
const RADIUS = 3.2;

// Modules light up amber around the pointer (or finger) and fade back.
export function ModuleWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const heat = new Float32Array(CELLS.length);
    let cell = 0, dpr = 1, raf = 0, pointer: { x: number; y: number } | null = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      cell = w / COLS;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(cell * ROWS * dpr);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = cell * dpr, gap = s * 0.1;
      CELLS.forEach(([cx, cy], i) => {
        const h = heat[i];
        const c = INK.map((v, k) => Math.round(v + (AMBER[k] - v) * h));
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        const inset = gap / 2 + (1 - h) * 0;
        ctx.fillRect(cx * s + inset, cy * s + inset, s - gap, s - gap);
      });
    };

    const tick = () => {
      let active = false;
      CELLS.forEach(([cx, cy], i) => {
        let target = 0;
        if (pointer) {
          const d = Math.hypot(cx + 0.5 - pointer.x, cy + 0.5 - pointer.y);
          target = Math.max(0, 1 - d / RADIUS);
        }
        heat[i] += (target - heat[i]) * (target > heat[i] ? 0.35 : 0.06);
        if (Math.abs(target - heat[i]) > 0.01) active = true;
      });
      draw();
      raf = active ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / cell, y: (e.clientY - r.top) / cell };
      kick();
    };
    const onLeave = () => {
      pointer = null;
      kick();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (!reduceMotion) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerdown", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerup", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerup", onLeave);
    };
  }, [reduceMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="block w-full touch-pan-y" style={{ aspectRatio: `${COLS} / ${ROWS}` }} />;
}
