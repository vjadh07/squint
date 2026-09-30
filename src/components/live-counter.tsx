import { useEffect, useRef, useState } from "react";
import { useSquint } from "@/lib/store";
import { RollingNumber } from "@/components/ui/rolling-number";
import { cn } from "@/lib/utils";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// Live public count in the nav. The dot pings whenever someone somewhere makes a code.
export function LiveCounter({ className }: { className?: string }) {
  const { codes, people } = useSquint((s) => s.counts);
  const [ping, setPing] = useState(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (codes === null) return;
    if (last.current !== null && codes > last.current) setPing((p) => p + 1);
    last.current = codes;
  }, [codes]);

  if (codes === null) return null;

  const label = `${codes} ${plural(codes, "code", "codes")} made${people !== null ? ` by ${people} ${plural(people, "person", "people")}` : ""} so far, live`;

  return (
    <a
      href="#made"
      aria-label={label}
      className={cn(
        "flex h-9 items-center gap-2 rounded-full border border-line-soft bg-panel/80 pr-3.5 pl-3 text-[13px] text-ink-2 transition-colors hover:border-line hover:text-ink",
        className,
      )}
    >
      <span className="relative grid size-2 place-items-center" aria-hidden="true">
        <span className="size-2 rounded-full bg-amber" />
        {ping > 0 && <span key={ping} className="absolute inset-0 animate-ping-once rounded-full bg-amber" />}
      </span>
      <span className="flex items-center gap-1 tabular-nums" aria-hidden="true">
        <span className="font-semibold text-ink">
          <RollingNumber value={codes} />
        </span>
        {plural(codes, "code", "codes")}
      </span>
      {people !== null && (
        <span className="hidden items-center gap-1 tabular-nums min-[420px]:flex" aria-hidden="true">
          <span className="text-ink-3">by</span>
          <span className="font-semibold text-ink">
            <RollingNumber value={people} />
          </span>
          {plural(people, "person", "people")}
        </span>
      )}
    </a>
  );
}
