import { useId, useRef, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconDownload, IconShare2 } from "@tabler/icons-react";
import { useCurrentCode } from "@/hooks/code-context";
import { useExport } from "@/hooks/use-export";
import { useSquint, type StudioTab } from "@/lib/store";
import { describePayload } from "@/lib/payload";
import { CodeCanvas } from "@/components/code-canvas";
import { Viewfinder } from "@/components/viewfinder";
import { ScanReadout } from "@/components/scan-readout";
import { ExportActions, btnPrimary } from "@/components/export-actions";
import { ContentPanel } from "./content-panel";
import { LookPanel } from "./look-panel";
import { ExtrasPanel } from "./extras-panel";
import { cn } from "@/lib/utils";

type TabId = StudioTab;
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "content", label: "Content" },
  { id: "look", label: "Look" },
  { id: "extras", label: "Extras" },
];

function Tabs({ tab, setTab, baseId }: { tab: TabId; setTab: (t: TabId) => void; baseId: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Studio sections" className="flex gap-1 border-b border-line-soft">
      {TABS.map((t, i) => {
        const selected = t.id === tab;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${baseId}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative min-h-12 flex-1 px-4 text-[15px] font-semibold transition-colors sm:flex-none sm:px-6",
              selected ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {t.label}
            {selected && (
              <motion.span layoutId={`${baseId}-underline`} className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-amber" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Phones: a slim sticky bar with the live code, status and the save button.
function MobileBar() {
  const { code, scan } = useCurrentCode();
  const { share, downloadPng, canShare } = useExport(code);
  return (
    <div className="sticky top-[calc(var(--nav-h)+env(safe-area-inset-top))] z-(--z-sticky) -mx-(--gutter) mb-6 border-y border-line-soft bg-void/95 px-(--gutter) py-2.5 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0 overflow-hidden rounded-[5px]">
          <CodeCanvas scene={code.scene} label="Your QR code, small preview" animate={false} />
        </div>
        <ScanReadout code={code} scan={scan} compact className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={canShare ? share : downloadPng}
          aria-disabled={code.isEmpty || !!code.error}
          className={cn(btnPrimary, "h-11 shrink-0 px-4")}
          aria-label={canShare ? "Save or share your QR code" : "Download PNG"}
        >
          {canShare ? <IconShare2 className="size-[18px]" aria-hidden="true" /> : <IconDownload className="size-[18px]" aria-hidden="true" />}
          <span className="max-[359px]:sr-only">Save</span>
        </button>
      </div>
    </div>
  );
}

export function Studio() {
  const tab = useSquint((s) => s.studioTab);
  const setTab = useSquint((s) => s.setStudioTab);
  const baseId = useId();
  const { code, scan } = useCurrentCode();
  const transparent = useSquint((s) => s.style.transparent && !s.style.frame);
  const label = code.isEmpty ? "Demo QR code for this site" : `QR code for ${describePayload(code.payload)}`;

  return (
    <section id="studio" aria-labelledby="studio-title" className="gutter mx-auto max-w-[1320px] py-20 sm:py-28">
      <div className="mb-10 max-w-[46ch] sm:mb-14">
        <h2 id="studio-title" className="text-[clamp(2.2rem,5.4vw,4rem)]">Make it yours.</h2>
        <p className="mt-4 text-[17px] text-ink-2">Wi-Fi logins, contact cards, your colors, your logo. The preview is exactly what you download.</p>
      </div>

      <MobileBar />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <aside className="hidden lg:block" aria-label="Preview and download">
          <div className="sticky top-[calc(var(--nav-h)+24px)] flex flex-col gap-5">
            <div className="rounded-(--radius-panel) border border-line-soft bg-panel p-6">
              <Viewfinder sweepKey={code.scene.units.length + code.payload} transparent={transparent}>
                <CodeCanvas scene={code.scene} label={label} />
              </Viewfinder>
              <ScanReadout code={code} scan={scan} className="mt-5" />
            </div>
            <ExportActions code={code} />
          </div>
        </aside>

        <div className="min-w-0 rounded-(--radius-panel) border border-line-soft bg-panel">
          <div className="px-2 pt-2 sm:px-4">
            <Tabs tab={tab} setTab={setTab} baseId={baseId} />
          </div>
          <div className="p-4 sm:p-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                id={`${baseId}-panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${tab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === "content" && <ContentPanel />}
                {tab === "look" && <LookPanel />}
                {tab === "extras" && <ExtrasPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="border-t border-line-soft p-4 sm:p-7 lg:hidden">
            <ExportActions code={code} />
          </div>
        </div>
      </div>
    </section>
  );
}
