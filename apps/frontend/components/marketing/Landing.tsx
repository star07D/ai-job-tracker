"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/ui/motion";
import { DashboardPreview } from "./DashboardPreview";

const FEATURES = [
  {
    title: "One pipeline",
    body: "Every stage of every application — applied, interview, offer, rejected — in a single view.",
  },
  {
    title: "Board or list",
    body: "Drag a card between stages, or scan a tidy list. Switch whenever you like.",
  },
  {
    title: "Know your numbers",
    body: "Response and interview rates, updated as you move applications along.",
  },
  {
    title: "Notes that stick",
    body: "Recruiter names, salary bands, interview prep — pinned to each role.",
  },
];

const STEPS = [
  ["Add a role", "Title, company, and where you're at. Takes ten seconds."],
  ["Move it along", "Update the stage as you hear back. The board keeps up."],
  ["See the picture", "Your rates and what needs a follow-up, at a glance."],
];

const TICKER = [
  "Applied",
  "Interview",
  "Offer",
  "Follow up",
  "Tailored prep",
  "Nudge the recruiter",
  "Keep notes",
  "Know your numbers",
];

function Ticker() {
  const row = TICKER.map((t) => (
    <span key={t} className="flex items-center gap-8">
      <span>{t}</span>
      <span className="text-accent">✦</span>
    </span>
  ));
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y-2 border-fg bg-fg py-3.5 text-bg"
    >
      <div className="rl-marquee flex w-max gap-8 font-display text-lg font-extrabold uppercase tracking-[0.06em]">
        <div className="flex gap-8">{row}</div>
        <div className="flex gap-8">{row}</div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-fg">
      <div
        aria-hidden="true"
        className="rl-glow pointer-events-none absolute -left-40 -top-40 h-[440px] w-[560px] rounded-full opacity-70 blur-[120px]"
        style={{ background: "var(--accent-soft)" }}
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <header className="flex items-center justify-between py-5">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="grid items-center gap-14 pb-20 pt-10 md:grid-cols-[1.1fr_0.9fr] md:pb-28 md:pt-16">
          <div>
            <Reveal>
              <span className="stamp !text-[11px] text-accent">
                Job search, organised
              </span>
            </Reveal>
            <Reveal
              index={1}
              as="h1"
              className="mt-7 font-display text-[3rem] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[4.8rem]"
            >
              The job hunt,{" "}
              <span className="hl">finally</span> under control.
            </Reveal>
            <Reveal
              index={2}
              as="p"
              className="mt-6 max-w-[44ch] text-lg text-fg-muted"
            >
              Track every application from applied to offer. See where things
              stand at a glance. Keep notes, salary and next steps on every role.
            </Reveal>
            <Reveal index={3}>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg">
                    Start tracking — free <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>
              <p className="label-mono mt-5 !text-[10px]">
                No card required · Your data stays yours
              </p>
            </Reveal>
          </div>

          <Reveal index={2}>
            <div className="relative rotate-[1.6deg] md:pl-4">
              <span
                aria-hidden="true"
                className="stamp absolute -left-1 -top-5 z-10 bg-accent !text-[11px] text-accent-fg md:left-2"
              >
                Interview tomorrow →
              </span>
              <DashboardPreview />
            </div>
          </Reveal>
        </section>
      </div>

      <Ticker />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        {/* FEATURES */}
        <section className="py-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} index={i + 1}>
                <div className="group h-full rounded-2xl border-2 border-border-strong bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-fg hover:shadow-[5px_5px_0_0_var(--offset)]">
                  <div className="font-display text-4xl font-extrabold leading-none text-accent">
                    0{i + 1}
                  </div>
                  <h2 className="mt-5 font-display text-xl font-bold tracking-[-0.01em]">
                    {f.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t-2 border-fg py-20">
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
            Three steps, then it{" "}
            <span className="hl">runs itself.</span>
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <Reveal key={title} index={i}>
                <div className="font-display text-6xl font-extrabold leading-none tracking-[-0.04em] text-accent">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.01em]">
                  {title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[15px] text-fg-muted">
                  {body}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="ink-card flex flex-col items-start justify-between gap-8 rounded-3xl bg-accent p-8 text-accent-fg md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] md:text-5xl">
                Start your pipeline today.
              </h2>
              <p className="mt-3 text-base">
                Free to use. Set up your first role in under a minute.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-fg px-6 text-sm font-semibold text-bg shadow-[0_3px_0_0_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-px active:translate-y-[3px] active:shadow-none"
            >
              Create your account <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t-2 border-fg py-8 text-sm text-fg-subtle sm:flex-row">
          <Logo size="sm" href={null} />
          <p className="label-mono !text-[10px]">Built with Next.js &amp; NestJS</p>
          <a
            href="https://github.com/star07D/ai-job-tracker"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-fg"
          >
            Source <ArrowUpRight size={14} />
          </a>
        </footer>
      </div>
    </div>
  );
}
