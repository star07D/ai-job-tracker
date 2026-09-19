"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";
import { Pipeline } from "@/app/dashboard/components/Pipeline";
import { getPublicShare } from "@/lib/api";
import { PublicShare } from "@/lib/types";
import { JOB_STATUSES } from "@/lib/job-status";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<PublicShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicShare(token)
      .then(setShare)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Couldn't load this page"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const counts: Record<string, number> = {};
  if (share) {
    for (const s of JOB_STATUSES) {
      counts[s] = share.jobs.filter((j) => j.status === s).length;
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:px-8">
          <Logo size="sm" href="/" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : error || !share ? (
          <EmptyState
            icon={<Inbox size={18} />}
            title="Link not found"
            description={
              error || "This share link is invalid or has been turned off."
            }
          />
        ) : (
          <>
            <Reveal className="block">
              <p className="label-mono !text-[11px]">A shared pipeline</p>
              <h1 className="mt-2 font-display text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-5xl">
                <span className="hl">{share.displayName}&apos;s job search</span>
              </h1>
              <p className="label-mono mt-3 !text-[10px]">
                {`${share.jobs.length} application${share.jobs.length === 1 ? "" : "s"}`}
                {share.trackingSince && ` · tracking since ${fmt(share.trackingSince)}`}
              </p>
            </Reveal>

            <Reveal index={1} className="mt-6 block">
              <Pipeline counts={counts} total={share.jobs.length} />
            </Reveal>

            <Reveal index={2} className="mt-6 block">
              {share.jobs.length === 0 ? (
                <EmptyState
                  icon={<Inbox size={18} />}
                  title="Nothing shared yet"
                  description="No active applications to show."
                />
              ) : (
                <div className="space-y-2.5">
                  {share.jobs.map((job, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-card"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-[17px] font-bold tracking-[-0.01em]">
                          {job.title}
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-fg-muted">
                          {[job.company, job.location].filter(Boolean).join(" · ")}
                        </div>
                        {job.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {job.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-fg-subtle"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={job.status} />
                      <span className="hidden font-data text-[11px] text-fg-subtle sm:block">
                        {fmt(job.appliedDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>

            <p className="label-mono mt-8 text-center !text-[10px] !normal-case !tracking-normal">
              Tracked with{" "}
              <Link href="/" className="text-accent hover:underline">
                Rolio
              </Link>
              {" — "}
              <Link href="/signup" className="text-accent hover:underline">
                track your own search
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
