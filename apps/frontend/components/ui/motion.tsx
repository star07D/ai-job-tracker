"use client";

import { ElementType, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Fade + rise on mount, via a transition (not a keyframe) that is toggled by
 * a state flip. rAF drives it; a setTimeout failsafe guarantees the element
 * becomes visible even if the animation frame is throttled.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** kept for call-site compatibility */
  index?: number;
  className?: string;
}) {
  // 0 hidden · 1 animating in · 2 settled (transition removed so a frozen
  // compositor can never trap the element mid-fade).
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase((p) => (p < 1 ? 1 : p)));
    const settle = setTimeout(() => setPhase(2), 650);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, []);

  return (
    <Tag
      className={cn(
        phase === 0 &&
          "translate-y-1.5 opacity-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100",
        phase === 1 &&
          "translate-y-0 opacity-100 transition-[opacity,transform] duration-500 ease-out",
        phase === 2 && "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to `value` on mount. Initial + resting state is the real value,
 * so if rAF never runs the number is still correct.
 */
export function CountUp({
  value,
  className,
  duration = 800,
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
      setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const failsafe = setTimeout(() => setDisplay(value), duration + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
