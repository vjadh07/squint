import { MotionConfig } from "motion/react";
import { CodeProvider } from "@/hooks/code-context";
import { useLiveCounts } from "@/hooks/use-live-counts";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Studio } from "@/components/studio/studio";
import { Why } from "@/components/why";
import { Inside } from "@/components/inside";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/toast";

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
          <Why />
          <Inside />
          <Faq />
        </main>
        <Footer />
        <Toaster />
      </CodeProvider>
    </MotionConfig>
  );
}
