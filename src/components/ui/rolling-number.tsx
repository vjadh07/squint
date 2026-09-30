// Odometer-style number, in the spirit of Motion Primitives' "Sliding Number"
// but pure CSS: each digit is a 0-9 strip moved with a transform. No layout
// measuring, so it stays cheap on phones even while the count updates live.

import { cn } from "@/lib/utils";

const DIGITS = "0123456789".split("");

function Digit({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none" aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] text-center leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const text = Math.max(0, Math.floor(value)).toLocaleString("en-US");
  return (
    <span className={cn("inline-flex items-center tabular-nums", className)}>
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          // Key from the right so existing digits keep their slot when the number grows.
          <Digit key={text.length - i} value={Number(ch)} />
        ) : (
          <span key={`sep-${text.length - i}`} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
      <span className="sr-only">{text}</span>
    </span>
  );
}
