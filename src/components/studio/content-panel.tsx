import type { ComponentType } from "react";
import {
  IconAddressBook, IconLink, IconMail, IconMessage, IconPhone, IconTextSize, IconWifi, type IconProps,
} from "@tabler/icons-react";
import { useSquint } from "@/lib/store";
import { TYPE_OPTIONS } from "@/lib/presets";
import type { FieldsByType, PayloadType } from "@/lib/payload";
import { Field, Switch } from "./controls";
import { cn } from "@/lib/utils";

const ICONS: Record<PayloadType, ComponentType<IconProps>> = {
  link: IconLink, text: IconTextSize, wifi: IconWifi, email: IconMail, phone: IconPhone, sms: IconMessage, contact: IconAddressBook,
};

type InputKind = "text" | "url" | "email" | "tel" | "area";
type FieldSpec = { key: string; label: string; kind: InputKind; placeholder?: string; auto?: string; wide?: boolean };

const SPECS: Record<Exclude<PayloadType, "wifi">, FieldSpec[]> = {
  link: [{ key: "url", label: "Link", kind: "url", placeholder: "yourwebsite.com", auto: "url", wide: true }],
  text: [{ key: "text", label: "Text", kind: "area", placeholder: "Anything you want someone to read", wide: true }],
  email: [
    { key: "to", label: "Send to", kind: "email", placeholder: "you@example.com", auto: "email", wide: true },
    { key: "subject", label: "Subject", kind: "text", placeholder: "Optional", wide: true },
    { key: "body", label: "Message", kind: "area", placeholder: "Optional", wide: true },
  ],
  phone: [{ key: "number", label: "Phone number", kind: "tel", placeholder: "+1 480 555 0199", auto: "tel", wide: true }],
  sms: [
    { key: "number", label: "Phone number", kind: "tel", placeholder: "+1 480 555 0199", auto: "tel", wide: true },
    { key: "body", label: "Message", kind: "area", placeholder: "Pre-filled text, optional", wide: true },
  ],
  contact: [
    { key: "first", label: "First name", kind: "text", auto: "given-name" },
    { key: "last", label: "Last name", kind: "text", auto: "family-name" },
    { key: "phone", label: "Phone", kind: "tel", auto: "tel" },
    { key: "email", label: "Email", kind: "email", auto: "email" },
    { key: "org", label: "Company", kind: "text", auto: "organization" },
    { key: "url", label: "Website", kind: "url", auto: "url" },
  ],
};

function TypePicker() {
  const type = useSquint((s) => s.type);
  const setType = useSquint((s) => s.setType);
  return (
    <div role="radiogroup" aria-label="What goes in the code" className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
      {TYPE_OPTIONS.map(({ value, label }) => {
        const Icon = ICONS[value];
        const selected = value === type;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setType(value)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] border px-2 text-[12px] font-medium transition-colors sm:flex-row sm:gap-2 sm:px-3.5 sm:text-sm",
              selected ? "border-amber bg-amber text-on-amber" : "border-line-soft text-ink-2 hover:border-line hover:text-ink",
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TextInputs({ type }: { type: Exclude<PayloadType, "wifi"> }) {
  const values = useSquint((s) => s.fields[type]) as Record<string, string>;
  const setField = useSquint((s) => s.setField);
  const set = (key: string, v: string) => setField(type, key as never, v as never);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SPECS[type].map((f) => {
        const id = `f-${type}-${f.key}`;
        return (
          <Field key={id} label={f.label} htmlFor={id} className={cn(f.wide && "sm:col-span-2")}>
            {f.kind === "area" ? (
              <textarea id={id} rows={3} className="field-input" placeholder={f.placeholder} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            ) : (
              <input
                id={id}
                type={f.kind === "url" ? "text" : f.kind}
                inputMode={f.kind === "url" ? "url" : undefined}
                autoComplete={f.auto}
                autoCapitalize={f.kind === "text" ? "words" : "off"}
                spellCheck={f.kind === "text"}
                className="field-input"
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

function WifiInputs() {
  const wifi = useSquint((s) => s.fields.wifi);
  const setField = useSquint((s) => s.setField);
  const set = <K extends keyof FieldsByType["wifi"]>(k: K, v: FieldsByType["wifi"][K]) => setField("wifi", k, v);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Network name" htmlFor="f-wifi-ssid">
        <input id="f-wifi-ssid" className="field-input" placeholder="Home Wi-Fi" autoCapitalize="off" value={wifi.ssid} onChange={(e) => set("ssid", e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="f-wifi-password" hint="Stays in your browser. Never saved or sent.">
        <input id="f-wifi-password" className="field-input" autoCapitalize="off" autoComplete="off" spellCheck={false} value={wifi.password} disabled={wifi.security === "nopass"} onChange={(e) => set("password", e.target.value)} />
      </Field>
      <Field label="Security" htmlFor="f-wifi-security">
        <select id="f-wifi-security" className="field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23aaa%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10" value={wifi.security} onChange={(e) => set("security", e.target.value as FieldsByType["wifi"]["security"])}>
          <option value="WPA">WPA / WPA2 / WPA3</option>
          <option value="WEP">WEP (old routers)</option>
          <option value="nopass">No password</option>
        </select>
      </Field>
      <div className="flex items-end">
        <Switch label="Hidden network" checked={wifi.hidden} onChange={(v) => set("hidden", v)} />
      </div>
    </div>
  );
}

export function ContentPanel() {
  const type = useSquint((s) => s.type);
  return (
    <div className="flex flex-col gap-6">
      <TypePicker />
      {type === "wifi" ? <WifiInputs /> : <TextInputs type={type} />}
    </div>
  );
}
