import { cn } from "@/lib/utils";

// A finder eye whose pupil squints every few seconds.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative grid size-7 place-items-center rounded-[6px] border-[3px] border-amber", className)}>
      <span className="block h-[9px] w-[11px] animate-squint rounded-[1.5px] bg-amber" />
    </span>
  );
}
