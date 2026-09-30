import { lazy, Suspense } from "react";
import { MotionConfig } from "motion/react";
import { CodeProvider } from "@/hooks/code-context";
import { useLiveCounts } from "@/hooks/use-live-counts";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Studio } from "@/components/studio/studio";
import { Toaster } from "@/components/toast";

// Below-the-fold sections load as separate chunks. The imports start right away
// (in parallel with the first render) so nav links to #why and #faq still land.
const whyChunk = import("@/components/why");
const insideChunk = import("@/components/inside");
const faqChunk = import("@/components/faq");
const footerChunk = import("@/components/footer");
const Why = lazy(() => whyChunk.then((m) => ({ default: m.Why })));
const Inside = lazy(() => insideChunk.then((m) => ({ default: m.Inside })));
const Faq = lazy(() => faqChunk.then((m) => ({ default: m.Faq })));
const Footer = lazy(() => footerChunk.then((m) => ({ default: m.Footer })));

const SectionPlaceholder = () => <div className="min-h-[60vh]" aria-hidden="true" />;

export default function App() {
  useLiveCounts();
  return (
    <MotionConfig reducedMotion="user">
      <CodeProvider>
        <a
          href="#studio"
          className="fixed top-3 left-3 z-(--z-toast) -translate-y-24 rounded-full bg-amber px-4 py-2 font-semibold text-on-amber focus:translate-y-0"
        >
          Skip to the generator
        </a>
        <Nav />
        <main>
          <Hero />
          <Studio />
          <Suspense fallback={<SectionPlaceholder />}>
            <Why />
            <Inside />
            <Faq />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <Toaster />
      </CodeProvider>
    </MotionConfig>
  );
}
