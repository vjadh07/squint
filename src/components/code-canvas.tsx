import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { Scene, Unit } from "@/lib/scene";
import { drawScene, fit, loadImage, planMorph, unitProgress, MORPH_MS, type UnitPose } from "@/lib/draw";
import { cn } from "@/lib/utils";

type Props = {
  scene: Scene;
  label: string;
  className?: string;
  animate?: boolean;
};

const MAX_DPR = 2.5;

// The live code. When the scene changes, only the pieces that changed ripple
// out and back in from the center, so typing feels like the code is reacting.
export function CodeCanvas({ scene, label, className, animate = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevScene = useRef<Scene | null>(null);
  const frame = useRef<number>(0);
  const reduceMotion = useReducedMotion();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((b) => (Math.abs(b.w - width) < 0.5 && Math.abs(b.h - height) < 0.5 ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    if (!scene.logo) {
      setLogo(null);
      return;
    }
    loadImage(scene.logo.href)
      .then((img) => alive && setLogo(img))
      .catch(() => alive && setLogo(null));
    return () => {
      alive = false;
    };
  }, [scene.logo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || box.w === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.round(box.w * dpr), h = Math.round(box.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const nextView = fit(scene, w, h);
    const prev = prevScene.current;
    prevScene.current = scene;
    cancelAnimationFrame(frame.current);

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      drawScene(ctx, scene, { viewport: nextView, logo });
    };

    const plan = planMorph(prev, scene);
    if (!animate || reduceMotion || (plan.entering.size === 0 && plan.leaving.size === 0)) {
      drawStatic();
      return;
    }

    const prevView = prev ? fit(prev, w, h) : nextView;
    const start = performance.now();
    const enterPose = (u: Unit): UnitPose | null => {
      const delay = plan.entering.get(u);
      if (delay === undefined) return null;
      const p = unitProgress(performance.now() - start, delay);
      return { scale: p, alpha: Math.min(1, p * 1.6) };
    };
    const leavePose = (u: Unit): UnitPose => {
      const p = unitProgress(performance.now() - start, plan.leaving.get(u) ?? 0);
      return { scale: 1 - p, alpha: 1 - p };
    };
    const leavingScene = prev ? { ...prev, base: [], units: [...plan.leaving.keys()], logo: undefined, label: undefined } : null;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      if (plan.sameGeometry || !prev) {
        drawScene(ctx, scene, { viewport: nextView, logo, pose: enterPose });
        if (leavingScene) drawScene(ctx, leavingScene, { viewport: prevView, pose: leavePose });
      } else {
        // Size changed (longer text = bigger code): old code shrinks away under the new one.
        drawScene(ctx, { ...scene, units: [], logo: undefined, label: undefined }, { viewport: nextView });
        if (leavingScene) drawScene(ctx, leavingScene, { viewport: prevView, pose: leavePose, skipBase: true });
        drawScene(ctx, scene, { viewport: nextView, logo, pose: enterPose, skipBase: true });
      }
      if (performance.now() - start < MORPH_MS + 40) frame.current = requestAnimationFrame(tick);
      else drawStatic();
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [scene, box, logo, animate, reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${scene.width} / ${scene.height}` }}
    >
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
