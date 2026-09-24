"use client";

import { useEffect, useState } from "react";
import { Target, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/components/ui/bullet-section";
import { ApiError, generateMatch, getMe } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { MATCH_BAND_STYLES } from "@/lib/match";
import { Job, ResumeMatch } from "@/lib/types";
import { cn } from "@/lib/cn";

export function MatchCard({
  job,
  onUpdated,
}: {
  job: Job;
  onUpdated: (job: Job) => void;
}) {
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const match = job.resumeMatch ?? null;

  useEffect(() => {
    getMe()
      .then((user) => setHasResume(!!user.hasResume))
      .catch(() => setHasResume(false));
  }, []);

  async function run() {
    setLoading(true);
    setNotConfigured(false);
    try {
      const updated = await generateMatch(job.id);
      onUpdated(updated);
      toast.success("Match checked");
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setNotConfigured(true);
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error("Slow down a moment, then try again.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Couldn't check the match",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé match</CardTitle>
        {match && !loading && (
          <Button variant="ghost" size="sm" onClick={run}>
            <RefreshCw size={13} /> Re-check
          </Button>
        )}
      </CardHeader>

      <CardBody className="pt-3">
        {loading ? (
          <div className="space-y-3">
            <p className="label-mono !text-[10px]">Reading the role…</p>
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-5/6 rounded-lg" />
          </div>
        ) : match ? (
          <MatchBody match={match} generatedAt={job.resumeMatchAt ?? null} />
        ) : hasResume === null ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : hasResume ? (
          <div className="py-2">
            <p className="text-[13px] text-fg-muted">
              See how well your résumé fits this specific role — a score, what
              lines up, and what&apos;s missing.
            </p>
            {notConfigured ? (
              <p className="label-mono mt-4 !text-[10px] !normal-case !tracking-normal">
                AI matching isn&apos;t set up on this server yet.
              </p>
            ) : (
              <Button className="mt-4" onClick={run}>
                <Target size={15} /> Check match
              </Button>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-fg-muted">
            Upload your résumé in Settings (account menu, top right) to check
            how well it fits this role.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function MatchBody({
  match,
  generatedAt,
}: {
  match: ResumeMatch;
  generatedAt: string | null;
}) {
  const style = MATCH_BAND_STYLES[match.band];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[36px] font-extrabold leading-none tracking-[-0.03em]">
            {match.score}
          </span>
          <span
            className={cn(
              "label-mono rounded-md px-1.5 py-0.5 !text-[10px]",
              style.badge,
            )}
          >
            {match.band} match
          </span>
        </div>
        <div
          aria-hidden="true"
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className={cn("funnel-bar h-full rounded-full", style.bar)}
            style={{ ["--w" as string]: `${Math.max(match.score, 4)}%` }}
          />
        </div>
      </div>

      {match.summary && (
        <p className="text-sm leading-relaxed text-fg-muted">
          {match.summary}
        </p>
      )}
      <Section title="Strengths" items={match.strengths} />
      <Section title="Gaps" items={match.gaps} />
      {generatedAt && (
        <p className="label-mono !text-[10px] !normal-case !tracking-normal">
          Checked {relativeTime(generatedAt)} · AI-assisted, double-check the
          facts
        </p>
      )}
    </div>
  );
}
