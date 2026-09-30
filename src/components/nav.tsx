import { useEffect, useState } from "react";
import { IconBrandGithub } from "@tabler/icons-react";
import { BrandMark } from "@/components/brand-mark";
import { LiveCounter } from "@/components/live-counter";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#studio", label: "Studio" },
  { href: "#why", label: "Why it's free" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  // A 1px sentinel at the top of the page tells us when to solidify the bar.
  useEffect(() => {
    const sentinel = document.getElementById("nav-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div id="nav-sentinel" className="absolute top-0 h-px w-px" aria-hidden="true" />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-(--z-nav) pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-300",
          scrolled ? "border-b border-line-soft bg-void/92 backdrop-blur-md" : "border-b border-transparent",
        )}
      >
        <div className="gutter mx-auto flex h-(--nav-h) max-w-[1320px] items-center justify-between gap-3">
          <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md" aria-label="Squint, back to top">
            <BrandMark />
            <span className="font-display text-[1.35rem] font-bold tracking-[-0.03em]">squint</span>
          </a>
          <nav aria-label="Main" className="flex min-w-0 items-center gap-1 sm:gap-2">
            <LiveCounter className="mr-1 sm:mr-3" />
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hidden rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:text-ink md:block"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://github.com/vjadh07/squint"
              className="grid size-11 place-items-center rounded-full text-ink-2 transition-colors hover:text-ink"
              aria-label="Squint source code on GitHub"
            >
              <IconBrandGithub className="size-[22px]" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
