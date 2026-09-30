import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { IconDeviceMobile, IconServer2, IconWorld } from "@tabler/icons-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useSquint } from "@/lib/store";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.83 0.155 72)";
const ALARM = "oklch(0.7 0.19 28)";
const LIVE_MS = 4200;
const ENDED_MS = 3200;

function Node({ nodeRef, icon, label, sub, state = "on" }: { nodeRef: RefObject<HTMLDivElement | null>; icon: ReactNode; label: string; sub?: string; state?: "on" | "off" | "alarm" }) {
  return (
    <div className="relative z-(--z-content) flex w-20 flex-col items-center gap-2 text-center sm:w-28">
      <div
        ref={nodeRef}
        className={cn(
          "grid size-12 place-items-center rounded-[12px] border bg-panel transition-colors duration-500 sm:size-14",
          state === "alarm" ? "border-alarm/70 text-alarm" : state === "off" ? "border-line-soft text-ink-3" : "border-line text-ink",
        )}
      >
        {icon}
      </div>
      <span className={cn("text-[13px] leading-tight font-medium transition-colors duration-500", state === "off" ? "text-ink-3" : "text-ink-2")}>{label}</span>
      <span className={cn("readout h-4 text-[11px] tracking-[0.06em] transition-colors duration-500", state === "alarm" ? "text-alarm" : "text-ink-3")}>{sub}</span>
    </div>
  );
}

function Routes() {
  const box = useRef<HTMLDivElement>(null);
  const aPhone = useRef<HTMLDivElement>(null);
  const aServer = useRef<HTMLDivElement>(null);
  const aSite = useRef<HTMLDivElement>(null);
  const bPhone = useRef<HTMLDivElement>(null);
  const bSite = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [ended, setEnded] = useState(false);

  // Their code works for a while, then the trial runs out. On repeat.
  useEffect(() => {
    if (!inView || reduceMotion) return;
    const t = setTimeout(() => setEnded((e) => !e), ended ? ENDED_MS : LIVE_MS);
    return () => clearTimeout(t);
  }, [inView, ended, reduceMotion]);
  const showEnded = reduceMotion ? true : ended;

  const beam = { containerRef: box, pathColor: "#ffffff", pathOpacity: 0.1, pathWidth: 2, duration: 2.4, gradientStartColor: AMBER, gradientStopColor: AMBER };

  return (
    <div ref={box} className="relative flex flex-col gap-6 rounded-(--radius-panel) border border-line-soft bg-void p-5 sm:gap-8 sm:p-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-ink-2">Other generators</p>
        <div className="flex items-start justify-between">
          <Node nodeRef={aPhone} icon={<IconDeviceMobile className="size-6" />} label="Your scan" />
          <Node nodeRef={aServer} icon={<IconServer2 className="size-6" />} label="Their server" sub={showEnded ? "TRIAL ENDED" : "COUNTING"} state={showEnded ? "alarm" : "on"} />
          <Node nodeRef={aSite} icon={<IconWorld className="size-6" />} label="Your site" sub={showEnded ? "UNREACHABLE" : ""} state={showEnded ? "off" : "on"} />
        </div>
      </div>
      <div className="h-px bg-line-soft" aria-hidden="true" />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-amber">Squint</p>
        <div className="flex items-start justify-between">
          <Node nodeRef={bPhone} icon={<IconDeviceMobile className="size-6" />} label="Your scan" />
          <Node nodeRef={bSite} icon={<IconWorld className="size-6" />} label="Your site" sub="ALWAYS" />
        </div>
      </div>

      <AnimatedBeam {...beam} fromRef={aPhone} toRef={aServer} startYOffset={-14} endYOffset={-14} />
      {showEnded ? (
        <AnimatedBeam {...beam} fromRef={aServer} toRef={aSite} startYOffset={-14} endYOffset={-14} pathColor={ALARM} pathOpacity={0.5} gradientStartColor="transparent" gradientStopColor="transparent" />
      ) : (
        <AnimatedBeam {...beam} fromRef={aServer} toRef={aSite} startYOffset={-14} endYOffset={-14} delay={0.6} />
      )}
      <AnimatedBeam {...beam} fromRef={bPhone} toRef={bSite} startYOffset={-14} endYOffset={-14} duration={2} />

      <p className="sr-only">
        With other generators, your scan goes to their server first, and when the trial ends the code stops reaching your site. With Squint, the scan goes straight to your site.
      </p>
    </div>
  );
}

function MadeCounter() {
  const { codes, people } = useSquint((s) => s.counts);
  return (
    <div id="made" className="mt-24 flex flex-col gap-4 border-t border-line-soft pt-14 sm:mt-32 sm:pt-20">
      {codes !== null ? (
        <>
          <p className="readout text-[clamp(4.5rem,19vw,13rem)] leading-[0.9] text-amber tabular-nums [--rond:0]" aria-hidden="true">
            <NumberTicker value={codes} className="text-amber" />
          </p>
          <p className="max-w-[34ch] font-display text-[clamp(1.5rem,3.4vw,2.6rem)] leading-tight font-bold tracking-[-0.02em]">
            {codes === 1 ? "code" : "codes"} made here{people !== null ? ` by ${people.toLocaleString("en-US")} ${people === 1 ? "person" : "people"}` : ""}. <span className="text-ink-3">Zero expired.</span>
          </p>
          <p className="sr-only">{`${codes} codes made on Squint so far. None of them expire.`}</p>
          <p className="text-sm text-ink-3">Live count. The only thing sent is a +1, never what's in your code.</p>
        </>
      ) : (
        <p className="max-w-[34ch] font-display text-[clamp(1.5rem,3.4vw,2.6rem)] leading-tight font-bold">
          Every code made here keeps working. <span className="text-ink-3">Zero expired.</span>
        </p>
      )}
    </div>
  );
}

export function Why() {
  return (
    <section id="why" aria-labelledby="why-title" className="gutter mx-auto max-w-[1320px] py-20 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <h2 id="why-title" className="max-w-[14ch] text-[clamp(2.2rem,5.4vw,4rem)]">Most free QR codes are rented.</h2>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            Other generators send every scan through their own server first. That lets them count your scans and switch the code off when your trial ends.
          </p>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            A Squint code holds your link itself. There's nothing in the middle to switch off, and no account to lose.
          </p>
        </div>
        <Routes />
      </div>
      <MadeCounter />
    </section>
  );
}
