import { useMemo, useState } from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { SPECIMENS, PRESETS } from "@/lib/presets";
import { encode } from "@/lib/qr";
import { buildScene } from "@/lib/scene";
import { useSquint } from "@/lib/store";
import { CodeCanvas } from "@/components/code-canvas";
import { HyperText } from "@/components/ui/hyper-text";
import { Segmented } from "@/components/studio/controls";
import { btnGhost } from "@/components/export-actions";
import { cn } from "@/lib/utils";

const LOOKS = [PRESETS[0], PRESETS[1], PRESETS[2], PRESETS[4], PRESETS[3]];

// "What's inside a QR code": pick a type, the code morphs, the raw text decodes.
export function Inside() {
  const [index, setIndex] = useState(0);
  const openStudio = useSquint((s) => s.openStudio);
  const specimen = SPECIMENS[index];

  const scene = useMemo(() => {
    const { name: _name, ...look } = LOOKS[index % LOOKS.length];
    return buildScene(encode(specimen.payload, "M"), look);
  }, [index, specimen.payload]);

  const make = () => {
    openStudio(specimen.type);
    document.getElementById("studio")?.scrollIntoView();
    setTimeout(() => document.querySelector<HTMLElement>("#studio [role=tabpanel] input, #studio [role=tabpanel] textarea")?.focus({ preventScroll: true }), 450);
  };

  return (
    <section aria-labelledby="inside-title" className="border-y border-line-soft bg-panel">
      <div className="gutter mx-auto grid max-w-[1320px] items-center gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div className="order-2 mx-auto w-full max-w-[380px] lg:order-1 lg:max-w-[440px]">
          <div className="rounded-[12px] bg-white p-3 shadow-[0_6px_8px_-6px_rgb(0_0_0/0.7)] [transform:rotate(-1.5deg)]">
            <CodeCanvas scene={scene} label={`Example ${specimen.label} QR code`} />
          </div>
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
          <h2 id="inside-title" className="max-w-[16ch] text-[clamp(2.2rem,5.4vw,4rem)]">It's just text in there.</h2>
          <p className="max-w-[46ch] text-[17px] text-ink-2">
            A QR code is a picture of some text. Phones know a few formats, so the same squares can join a Wi-Fi network or save a contact.
          </p>
          <Segmented
            label="Example type"
            className="max-w-full overflow-x-auto [scrollbar-width:none]"
            itemClassName="min-w-[64px] flex-1"
            options={SPECIMENS.map((s, i) => ({ value: i, label: s.label }))}
            value={index}
            onChange={setIndex}
          />
          <div className="rounded-[12px] border border-line-soft bg-void p-4 sm:p-5">
            <p className="mb-2 text-[12px] font-semibold text-ink-3">What the phone reads</p>
            <HyperText className="readout block text-[15px] leading-relaxed tracking-[0.04em] text-amber sm:text-base">{specimen.payload}</HyperText>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[40ch] text-[15px] text-ink-2">{specimen.note}</p>
            <button type="button" onClick={make} className={cn(btnGhost, "shrink-0")}>
              Make one
              <IconArrowRight className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
