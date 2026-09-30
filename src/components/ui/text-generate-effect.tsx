// Adapted from Aceternity UI "Text Generate Effect" (ui.aceternity.com).
// Changes: renders inline inside a heading, optional delay, and the words are
// visible straight away under reduced motion.

import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = { words: string; className?: string; delay?: number; duration?: number };

export function TextGenerateEffect({ words, className, delay = 0, duration = 0.6 }: Props) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    animate(
      "span",
      { opacity: 1, filter: "blur(0px)", y: 0 },
      { duration, delay: stagger(0.12, { startDelay: delay }), ease: [0.16, 1, 0.3, 1] },
    );
  }, [animate, delay, duration, reduceMotion]);

  return (
    <motion.span ref={scope} className={cn("block", className)}>
      {words.split(" ").map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={reduceMotion ? false : { opacity: 0, filter: "blur(10px)", y: 8 }}
        >
          {word}
          {i < words.split(" ").length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
