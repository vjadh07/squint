import { useSquint } from "@/lib/store";
import { DOT_OPTIONS, EYE_OPTIONS, PRESETS } from "@/lib/presets";
import { colorWarning } from "@/lib/contrast";
import { ColorField, GroupLabel, Switch, Tile } from "./controls";
import { previewFor } from "./previews";

export function LookPanel() {
  const style = useSquint((s) => s.style);
  const setStyle = useSquint((s) => s.setStyle);
  const applyPreset = useSquint((s) => s.applyPreset);
  const warning = colorWarning(style.fg, style.eye || style.fg, style.bg, style.transparent && !style.frame);
  const colorOnly = { fg: style.fg, eye: style.eye, bg: style.bg };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-label="Presets">
        <GroupLabel>Presets</GroupLabel>
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-6 sm:overflow-visible">
          {PRESETS.map((p) => {
            const { name, ...look } = p;
            const selected = (Object.keys(look) as Array<keyof typeof look>).every((k) => style[k] === look[k]);
            return (
              <Tile
                key={name}
                label={name}
                selected={selected}
                onClick={() => applyPreset(p)}
                preview={previewFor(look)}
                className="w-[84px] shrink-0 snap-start sm:w-auto"
              />
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[4fr_3fr]">
        <section className="flex flex-col gap-3" aria-label="Dot style">
          <GroupLabel>Dots</GroupLabel>
          <div className="grid grid-cols-4 gap-2">
            {DOT_OPTIONS.map((o) => (
              <Tile key={o.value} label={o.label} selected={style.dots === o.value} onClick={() => setStyle({ dots: o.value })} preview={previewFor({ ...colorOnly, dots: o.value, eyes: style.eyes }, "dots")} />
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-3" aria-label="Corner style">
          <GroupLabel>Corners</GroupLabel>
          <div className="grid grid-cols-3 gap-2">
            {EYE_OPTIONS.map((o) => (
              <Tile key={o.value} label={o.label} selected={style.eyes === o.value} onClick={() => setStyle({ eyes: o.value })} preview={previewFor({ ...colorOnly, dots: style.dots, eyes: o.value }, "eyes")} />
            ))}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3" aria-label="Colors">
        <GroupLabel>Colors</GroupLabel>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
          <ColorField label="Dots" value={style.fg} onChange={(fg) => setStyle({ fg })} />
          <ColorField label="Corners" value={style.eye || style.fg} onChange={(eye) => setStyle({ eye })} />
          <ColorField label="Background" value={style.bg} onChange={(bg) => setStyle({ bg })} />
        </div>
        <Switch
          label="Transparent background"
          hint={style.frame ? "Turn off the sticker frame to use this." : "For putting the code on your own design."}
          checked={style.transparent && !style.frame}
          disabled={style.frame}
          onChange={(transparent) => setStyle({ transparent })}
        />
        {warning && <p className="rounded-[10px] border border-line-soft bg-void px-3.5 py-3 text-[13px] text-ink-2">{warning}</p>}
      </section>
    </div>
  );
}
