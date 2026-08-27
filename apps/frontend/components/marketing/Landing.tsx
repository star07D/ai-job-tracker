"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Columns3,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/ui/motion";
import { DashboardPreview } from "./DashboardPreview";

const FEATURES = [
  {
    icon: ListChecks,
    title: "One pipeline",
    body: "Every stage of every application — applied, interview, offer, rejected — in a single view.",
  },
  {
    icon: Columns3,
    title: "Board or list",
    body: "Drag a card between stages, or scan a tidy list. Switch whenever you like.",
  },
  {
    icon: BarChart3,
    title: "Know your numbers",
    body: "Response and interview rates, updated as you move applications along.",
  },
  {
    icon: NotebookPen,
    title: "Notes that stick",
    body: "Recruiter names, salary bands, interview prep — pinned to each role.",
  },
];

const STEPS = [
  ["Add a role", "Title, company, and where you're at. Takes ten seconds."],
  ["Move it along", "Update the stage as you hear back. The board keeps up."],
  ["See the picture", "Your rates and what needs a follow-up, at a glance."],
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-fg">
      {/* single static accent glow, top-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[520px] rounded-full opacity-60 blur-[120px]"
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
        <section className="grid items-center gap-12 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <Reveal>
            <span className="label-mono inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 !text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Job search, organised
            </span>
            <h1 className="mt-5 font-display text-[2.7rem] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[3.4rem]">
              The job hunt, <span className="text-accent">finally</span> under
              control.
            </h1>
            <p className="mt-5 max-w-[42ch] text-lg text-fg-muted">
              Track every application from applied to offer. See where things
              stand at a glance. Keep notes, salary and next steps on every role.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Start tracking — free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">Sign in</Button>
              </Link>
            </div>
            <p className="label-mono mt-4 !text-[10px]">
              No card required · Your data stays yours
            </p>
          </Reveal>

          <Reveal index={1}>
            <DashboardPreview />
          </Reveal>
        </section>

        {/* FEATURES */}
        <section className="border-t border-border py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                index={i}
                className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-line"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
                  <f.icon size={17} />
                </div>
                <h3 className="mt-3.5 font-display text-[15px] font-semibold">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] text-fg-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t border-border py-16">
          <h2 className="font-display text-2xl font-semibold">
            Three steps, then it runs itself.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <Reveal key={title} index={i}>
                <div className="label-mono !text-accent">0{i + 1}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Start your pipeline today.
              </h2>
              <p className="mt-1.5 text-sm text-fg-muted">
                Free to use. Set up your first role in under a minute.
              </p>
            </div>
            <Link href="/signup">
              <Button size="lg">
                Create your account <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-border py-8 text-sm text-fg-subtle sm:flex-row">
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
