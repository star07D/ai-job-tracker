import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/ui/motion";

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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-10">
      <div
        aria-hidden="true"
        className="rl-glow pointer-events-none absolute left-1/2 top-0 h-[380px] w-[580px] -translate-x-1/2 rounded-full opacity-80 blur-[130px]"
        style={{ background: "var(--accent-soft)" }}
      />
      <div className="absolute left-5 top-5">
        <Logo size="sm" />
      </div>
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <Reveal className="relative w-full max-w-[400px]">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
          {children}
        </div>
        <p className="mt-4 text-center text-[13px] text-fg-muted">{footer}</p>
        <p className="mt-4 text-center">
          <Link href="/" className="label-mono transition-colors hover:text-fg">
            ← Back to home
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
