import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { isHexColor } from "@/lib/contrast";
import { cn } from "@/lib/utils";

/* ---------- Segmented: a radiogroup with a sliding highlight ---------- */

type SegOption<T extends string | number> = { value: T; label: ReactNode; ariaLabel?: string };

type SegmentedProps<T extends string | number> = {
  options: ReadonlyArray<SegOption<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  itemClassName?: string;
};

export function Segmented<T extends string | number>({ options, value, onChange, label, className, itemClassName }: SegmentedProps<T>) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-1 rounded-[12px] border border-line-soft bg-void p-1", className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.ariaLabel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] px-3 text-sm font-medium transition-colors",
              selected ? "text-on-amber" : "text-ink-2 hover:text-ink",
              itemClassName,
            )}
          >
            {selected && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[8px] bg-amber"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Field wrappers ---------- */

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-[13px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return <h3 className="font-sans text-[15px] font-semibold tracking-normal text-ink">{children}</h3>;
}

/* ---------- Switch ---------- */

export function Switch({ checked, onChange, label, disabled, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 text-left disabled:opacity-45"
    >
      <span className="flex flex-col">
        <span className="text-[15px] text-ink">{label}</span>
        {hint && <span className="text-[13px] text-ink-3">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-amber bg-amber" : "border-line bg-void",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200 ease-out",
            checked ? "left-[22px] bg-on-amber" : "left-[3px] bg-ink-3",
          )}
        />
      </span>
    </button>
  );
}

/* ---------- Color ---------- */

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={`${id}-hex`} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      <div className="flex min-h-12 items-center gap-2 rounded-[10px] border border-line bg-void p-1.5 pr-3 focus-within:border-amber">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="size-9 shrink-0 cursor-pointer rounded-[7px] border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-[7px] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[7px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          id={`${id}-hex`}
          key={value}
          defaultValue={value}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="off"
          onChange={(e) => {
            const v = e.target.value.trim();
            const full = v.startsWith("#") ? v : `#${v}`;
            if (isHexColor(full)) onChange(full.toLowerCase());
          }}
          className="readout min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.06em] text-ink uppercase outline-none"
        />
      </div>
    </div>
  );
}

/* ---------- Tile: a button with a real code preview ---------- */

export function Tile({ selected, onClick, preview, label, className, imgClassName }: { selected: boolean; onClick: () => void; preview: string; label: string; className?: string; imgClassName?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-[12px] border p-2 pb-2.5 text-[13px] font-medium transition-[border-color,background-color,transform] duration-150 active:scale-[0.97]",
        selected ? "border-amber bg-amber/8 text-ink" : "border-line-soft text-ink-2 hover:border-line hover:text-ink",
        className,
      )}
    >
      <img src={preview} alt="" className={cn("aspect-square w-full rounded-[7px] bg-white", imgClassName)} draggable={false} />
      {label}
    </button>
  );
}
