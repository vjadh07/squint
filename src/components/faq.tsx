import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    q: "Do the codes expire?",
    a: "No. The link is stored inside the pattern, so the code works as long as the link does. The only way it stops is if the website behind it goes away.",
  },
  {
    q: "Is it actually free?",
    a: "Yes. No account, no watermark, no trial. It's a static site with no server doing the work, so there's nothing to charge for.",
  },
  {
    q: "Do you see what I type?",
    a: "No. Codes are made by JavaScript in your browser. Nothing you type or upload gets sent anywhere. The live counter only receives a +1 when someone downloads a code. The source is on GitHub if you want to check.",
  },
  {
    q: "What does \"test-scanned\" mean?",
    a: "After every change, the page reads your code back with a QR decoder, the same way a phone would. If it can't read it, you'll see a warning before you download.",
  },
  {
    q: "Can I change where a code points later?",
    a: "Not with a static code, that's the tradeoff for never expiring. If the link might change, point the code at a page you control and update that page instead.",
  },
  {
    q: "Why won't my code scan?",
    a: "Usually contrast. Keep the dots dark and the background light, keep the empty border around the code, and don't print it smaller than about 2 cm. A big logo can cover too much, so keep damage tolerance on Max.",
  },
  {
    q: "Can I use them for my business?",
    a: "Yes. Menus, packaging, flyers, whatever. No credit needed.",
  },
];

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className="border-b border-line-soft">
      <h3 className="font-sans text-base tracking-normal">
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-[17px] font-semibold text-ink transition-colors hover:text-amber"
        >
          {q}
          <IconPlus aria-hidden="true" className={cn("size-5 shrink-0 text-amber transition-transform duration-300", open && "rotate-45")} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[62ch] pb-6 text-[16px] leading-relaxed text-ink-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-title" className="gutter mx-auto max-w-[1320px] py-20 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <h2 id="faq-title" className="text-[clamp(2.2rem,5.4vw,4rem)] lg:sticky lg:top-[calc(var(--nav-h)+32px)] lg:self-start">
          Questions people ask.
        </h2>
        <div className="border-t border-line-soft">
          {QUESTIONS.map((item, i) => (
            <Item key={item.q} {...item} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
