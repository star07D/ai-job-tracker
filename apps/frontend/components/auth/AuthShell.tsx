import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/ui/motion";

const NOTES = [
  ["Applied", "Linear · Senior Frontend", "st-applied"],
  ["Interview", "Vercel · Staff Engineer", "st-interview"],
  ["Offer", "Supabase · Full-stack", "st-accepted"],
] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-bg md:grid-cols-[1fr_1.05fr]">
      {/* brand panel — desktop only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-fg bg-surface-2 p-12 md:flex">
        <Logo />

        <div>
          <p className="font-display text-[3.4rem] font-extrabold leading-[0.98] tracking-[-0.04em]">
            Every application,{" "}
            <span className="hl">accounted for.</span>
          </p>
          <p className="mt-5 max-w-[36ch] text-[16px] text-fg-muted">
            One calm place for your whole job search — stages, follow-ups, and
            the notes you&apos;ll want before the next call.
          </p>

          <div aria-hidden="true" className="relative mt-12 h-[230px]">
            {NOTES.map(([label, meta, tone], i) => (
              <div
                key={label}
                className="absolute left-0 right-10 flex items-center justify-between rounded-xl border-2 border-fg bg-surface px-4 py-3 shadow-[4px_4px_0_0_var(--offset)]"
                style={{
                  top: `${i * 68}px`,
                  transform: `rotate(${[-2, 1.5, -1][i]}deg) translateX(${i * 22}px)`,
                }}
              >
                <span className="truncate text-[13px] font-semibold">{meta}</span>
                <span
                  className="ml-3 shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
                  style={{ color: `var(--${tone})`, background: `var(--${tone}-bg)` }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="label-mono !text-[10px]">Rolio · the job hunt, under control</p>
      </aside>

      {/* form side */}
      <div className="relative grid place-items-center overflow-hidden px-4 py-10">
        <div
          aria-hidden="true"
          className="rl-glow pointer-events-none absolute left-1/2 top-0 h-[380px] w-[580px] -translate-x-1/2 rounded-full opacity-80 blur-[130px]"
          style={{ background: "var(--accent-soft)" }}
        />
        <div className="absolute left-5 top-5 md:hidden">
          <Logo size="sm" />
        </div>
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>

        <Reveal className="relative w-full max-w-[420px]">
          <div className="ink-card rounded-2xl bg-surface p-7">
            <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
            {children}
          </div>
          <p className="mt-6 text-center text-[13px] text-fg-muted">{footer}</p>
          <p className="mt-4 text-center">
            <Link href="/" className="label-mono transition-colors hover:text-fg">
              ← Back to home
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
