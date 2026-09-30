import { IconAlertTriangle, IconCircleCheckFilled, IconScan } from "@tabler/icons-react";
import type { CodeState } from "@/hooks/use-code";
import type { ScanState } from "@/hooks/use-test-scan";
import { describePayload } from "@/lib/payload";
import { versionOf } from "@/lib/qr";
import { cn } from "@/lib/utils";

// The line under the viewfinder: what a phone will read from this code.
type Props = { code: CodeState; scan: ScanState; className?: string; compact?: boolean };

export function ScanReadout({ code, scan, className, compact = false }: Props) {

  let icon = <IconScan className="size-4 shrink-0 animate-pulse text-ink-3" aria-hidden="true" />;
  let tone = "text-ink-2";
  let text = "Test scanning";

  if (code.error) {
    icon = <IconAlertTriangle className="size-4 shrink-0 text-alarm" aria-hidden="true" />;
    tone = "text-alarm";
    text = code.error;
  } else if (scan.status === "ok" || scan.status === "mismatch") {
    icon = <IconCircleCheckFilled className="size-4 shrink-0 text-amber" aria-hidden="true" />;
    tone = "text-ink";
    text = code.isEmpty ? "Demo code. Reads as this site. Type to make yours." : `Scans as ${describePayload(scan.decoded)}`;
  } else if (scan.status === "fail") {
    icon = <IconAlertTriangle className="size-4 shrink-0 text-alarm" aria-hidden="true" />;
    tone = "text-alarm";
    text = "Won't scan reliably. Try more contrast or a smaller logo.";
  }

  const n = code.moduleCount;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <p className={cn("flex min-w-0 items-center gap-2 text-sm font-medium", tone)} role="status" aria-live="polite">
        {icon}
        <span className="min-w-0 truncate">{text}</span>
      </p>
      {!compact && n > 0 && (
        <p className="readout text-[11px] tracking-[0.08em] text-ink-3" aria-label={`Version ${versionOf(n)}, ${n} by ${n} modules, error correction ${code.ecc}`}>
          V{versionOf(n)} &nbsp; {n}x{n} &nbsp; ECC {code.ecc}
        </p>
      )}
    </div>
  );
}
