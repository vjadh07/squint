import { IconCopy, IconDownload, IconShare2 } from "@tabler/icons-react";
import type { CodeState } from "@/hooks/use-code";
import { useExport } from "@/hooks/use-export";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

export const btnBase =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-[15px] font-semibold transition-[transform,background-color,border-color,color] duration-150 active:translate-y-px active:scale-[0.98] disabled:opacity-50";
export const btnPrimary = cn(btnBase, "relative overflow-hidden bg-amber text-on-amber hover:bg-[oklch(0.87_0.14_75)]");
export const btnGhost = cn(btnBase, "border border-line bg-transparent text-ink hover:border-ink-3 hover:bg-panel");

type Props = { code: CodeState; showSecondary?: boolean; className?: string };

// Download on desktop, native share sheet on phones (Save Image, AirDrop, Files...).
export function ExportActions({ code, showSecondary = true, className }: Props) {
  const { downloadPng, downloadSvg, share, copy, canShare, canCopy } = useExport(code);
  const disabled = code.isEmpty || !!code.error;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {canShare ? (
        <button type="button" className={cn(btnPrimary, "flex-1 sm:flex-none")} onClick={share} aria-disabled={disabled}>
          <IconShare2 className="size-[18px]" aria-hidden="true" />
          Save or share
          {!disabled && <BorderBeam className="border-beam" size={60} duration={5} colorFrom="#fff4d6" colorTo="#fff4d600" borderWidth={2} />}
        </button>
      ) : (
        <button type="button" className={cn(btnPrimary, "flex-1 sm:flex-none")} onClick={downloadPng} aria-disabled={disabled}>
          <IconDownload className="size-[18px]" aria-hidden="true" />
          Download PNG
          {!disabled && <BorderBeam className="border-beam" size={60} duration={5} colorFrom="#fff4d6" colorTo="#fff4d600" borderWidth={2} />}
        </button>
      )}
      {showSecondary && (
        <>
          {canShare ? (
            <button type="button" className={btnGhost} onClick={downloadPng} aria-disabled={disabled}>
              <IconDownload className="size-[18px]" aria-hidden="true" />
              PNG
            </button>
          ) : null}
          <button type="button" className={btnGhost} onClick={downloadSvg} aria-disabled={disabled}>
            SVG
          </button>
          {canCopy && (
            <button type="button" className={cn(btnGhost, "px-4")} onClick={copy} aria-disabled={disabled} aria-label="Copy image">
              <IconCopy className="size-[18px]" aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
