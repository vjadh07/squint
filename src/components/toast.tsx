import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";

type ToastState = { message: string; id: number; show: (message: string) => void };

const TOAST_MS = 2800;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: "",
  id: 0,
  show: (message) => {
    clearTimeout(timer);
    set((s) => ({ message, id: s.id + 1 }));
    timer = setTimeout(() => set({ message: "" }), TOAST_MS);
  },
}));

export function Toaster() {
  const { message, id } = useToast();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-(--z-toast) flex justify-center px-4"
      style={{ bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))" }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {message && (
          <motion.p
            key={id}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-full border border-line bg-raised px-5 py-3 text-sm font-medium text-ink shadow-[0_8px_8px_-6px_rgb(0_0_0/0.6)]"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
