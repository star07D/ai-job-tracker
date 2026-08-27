"use client";

import { ElementType, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Entrance reveal. Pure CSS via `.reveal` + `@starting-style` (see globals.css):
 * the resting state is visible, so nothing can trap the element hidden.
 * `index` (1–6) adds a stagger delay.
 */
export function Reveal({
  children,
  as: Tag = "div",
  index = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  index?: number;
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "reveal",
        index > 0 && `reveal-d${Math.min(index, 6)}`,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to `value` on first mount. Resting/initial state is the real
 * value, so the number is always correct even if rAF is unavailable.
 */
export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      setDisplay(value);
      return;
    }
    ran.current = true;

    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      value === 0
    ) {
      return;
    }

    let raf = 0;
    const start = performance.now();
    setDisplay(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round((1 - Math.pow(1 - t, 4)) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
