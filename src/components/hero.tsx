import { IconArrowDownRight } from "@tabler/icons-react";
import { useSquint } from "@/lib/store";
import { useCurrentCode } from "@/hooks/code-context";
import { useExport } from "@/hooks/use-export";
import { describePayload } from "@/lib/payload";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { CodeCanvas } from "@/components/code-canvas";
import { Viewfinder } from "@/components/viewfinder";
import { ScanReadout } from "@/components/scan-readout";
import { ExportActions, btnGhost } from "@/components/export-actions";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["Paste a link", "yourcafe.com/menu", "instagram.com/yourname", "Any text works too"];

export function Hero() {
  const url = useSquint((s) => s.fields.link.url);
  const setField = useSquint((s) => s.setField);
  const transparent = useSquint((s) => s.style.transparent && !s.style.frame);
  const { code, scan } = useCurrentCode();
  const { downloadPng, share, canShare } = useExport(code);

  const label = code.isEmpty ? "Demo QR code for this site" : `QR code for ${describePayload(code.payload)}`;

  return (
    <section id="top" className="relative isolate overflow-hidden">
      <FlickeringGrid className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_65%_at_62%_45%,#000_20%,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="absolute top-[18%] right-[-10%] -z-10 size-[min(70vw,720px)] rounded-full bg-[radial-gradient(closest-side,oklch(0.83_0.155_72/0.09),transparent)]"
      />

      <div
        className={cn(
          "gutter mx-auto grid max-w-[1320px] items-center gap-x-16 gap-y-8",
          "pt-[calc(var(--nav-h)+max(24px,env(safe-area-inset-top)))] pb-16 sm:pb-24 lg:min-h-[100svh]",
          "grid-cols-[minmax(0,1fr)] [grid-template-areas:'copy''finder''controls'] lg:[grid-template-areas:'copy_finder''controls_finder'] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-[auto_auto]",
        )}
      >
        <div className="min-w-0 [grid-area:copy] lg:self-end">
          <h1 className="text-[clamp(2.6rem,8.4vw,5.6rem)]">
            <TextGenerateEffect words="QR codes that" className="text-ink" />
            <TextGenerateEffect words="never expire." className="text-amber" delay={0.35} />
          </h1>
          <p className="mt-5 max-w-[40ch] text-[clamp(1.05rem,1.6vw,1.2rem)] leading-relaxed text-ink-2">
            Free, no account, no watermark. Made in your browser and test-scanned before you download it.
          </p>
        </div>

        <div className="min-w-0 [grid-area:finder] mx-auto w-full max-w-[min(100%,480px)] lg:max-w-[520px]">
          <Viewfinder sweepKey={code.scene.units.length + code.payload} transparent={transparent}>
            <CodeCanvas scene={code.scene} label={label} />
          </Viewfinder>
          <ScanReadout code={code} scan={scan} className="mt-4 px-1" />
        </div>

        <div className="min-w-0 [grid-area:controls] flex max-w-[540px] flex-col gap-4 lg:self-start">
          <PlaceholdersAndVanishInput
            placeholders={PLACEHOLDERS}
            value={url}
            onValueChange={(v) => setField("link", "url", v)}
            onSubmit={() => (canShare ? share() : downloadPng())}
            label="Link or text for your QR code"
            submitLabel={canShare ? "Save or share your QR code" : "Download your QR code"}
          />
          <div className="flex flex-wrap items-center gap-2">
            <ExportActions code={code} showSecondary={false} className="flex-1 sm:flex-none" />
            <a href="#studio" className={cn(btnGhost, "flex-1 sm:flex-none")}>
              Style it
              <IconArrowDownRight className="size-[18px]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
