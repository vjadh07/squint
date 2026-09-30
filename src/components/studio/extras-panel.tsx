import { useId, useState } from "react";
import { IconPhotoPlus, IconX } from "@tabler/icons-react";
import { useSquint, type PngSize } from "@/lib/store";
import type { Ecc } from "@/lib/qr";
import { Field, GroupLabel, Segmented, Switch } from "./controls";
import { btnGhost } from "@/components/export-actions";
import { cn } from "@/lib/utils";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = /^image\/(png|jpeg|svg\+xml|webp)$/;
const DEFAULT_HINT = "PNG, JPG, SVG or WebP, up to 2 MB. Damage tolerance goes to Max so it still scans.";

const ECC_OPTIONS: Array<{ value: Ecc; label: string }> = [
  { value: "L", label: "Low" },
  { value: "M", label: "Medium" },
  { value: "Q", label: "High" },
  { value: "H", label: "Max" },
];
const ECC_HINT: Record<Ecc, string> = {
  L: "Smallest code. Fine for clean screens.",
  M: "Good default. Survives a scuff or two.",
  Q: "For stickers and things that get handled.",
  H: "Still reads with 30% covered. Needed for logos.",
};

function LogoPicker() {
  const logo = useSquint((s) => s.style.logo);
  const setStyle = useSquint((s) => s.setStyle);
  const [hint, setHint] = useState(DEFAULT_HINT);
  const id = useId();

  const read = (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES.test(file.type)) return setHint("That file type won't work. Use PNG, JPG, SVG or WebP.");
    if (file.size > MAX_LOGO_BYTES) return setHint("That image is over 2 MB. Try a smaller one.");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setHint(file.name);
      setStyle({ logo: reader.result });
    };
    reader.onerror = () => setHint("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <Field label="Logo in the middle" htmlFor={id} hint={hint}>
      <div className="flex flex-wrap gap-2">
        <label className={cn(btnGhost, "cursor-pointer focus-within:outline-2 focus-within:outline-amber")}>
          <IconPhotoPlus className="size-[18px]" aria-hidden="true" />
          {logo ? "Change image" : "Upload image"}
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="sr-only"
            onChange={(e) => {
              read(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {logo && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setStyle({ logo: "" });
              setHint(DEFAULT_HINT);
            }}
          >
            <IconX className="size-[18px]" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
    </Field>
  );
}

export function ExtrasPanel() {
  const style = useSquint((s) => s.style);
  const setStyle = useSquint((s) => s.setStyle);
  const ecc = useSquint((s) => s.ecc);
  const setEcc = useSquint((s) => s.setEcc);
  const pngSize = useSquint((s) => s.pngSize);
  const setPngSize = useSquint((s) => s.setPngSize);
  const effectiveEcc: Ecc = style.logo ? "H" : ecc;

  return (
    <div className="flex flex-col gap-8">
      <LogoPicker />

      <section className="flex flex-col gap-3" aria-label="Sticker frame">
        <Switch label="Sticker frame with a label" hint="A border and a caption under the code." checked={style.frame} onChange={(frame) => setStyle({ frame })} />
        {style.frame && (
          <Field label="Label" htmlFor="frame-text">
            <input id="frame-text" className="field-input readout uppercase tracking-[0.12em]" maxLength={18} value={style.frameText} onChange={(e) => setStyle({ frameText: e.target.value })} />
          </Field>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-label="Damage tolerance">
        <GroupLabel>Damage tolerance</GroupLabel>
        <Segmented label="Damage tolerance" options={ECC_OPTIONS} value={effectiveEcc} onChange={(v) => !style.logo && setEcc(v)} />
        <p className="text-[13px] text-ink-3">{style.logo ? "Locked to Max while there's a logo." : ECC_HINT[effectiveEcc]}</p>
      </section>

      <section className="flex flex-col gap-3" aria-label="PNG size">
        <GroupLabel>PNG size</GroupLabel>
        <Segmented<PngSize>
          label="PNG size in pixels"
          options={[512, 1024, 2048].map((v) => ({ value: v as PngSize, label: <span className="tabular-nums">{v}px</span> }))}
          value={pngSize}
          onChange={setPngSize}
        />
        <p className="text-[13px] text-ink-3">Printing big? Grab the SVG. It stays sharp at any size.</p>
      </section>
    </div>
  );
}
