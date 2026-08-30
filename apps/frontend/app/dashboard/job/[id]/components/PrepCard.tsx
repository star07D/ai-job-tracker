"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, generatePrep } from "@/lib/api";
import { Job, JobPrep } from "@/lib/types";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="label-mono mb-2 !text-[10px]">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] leading-relaxed"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PrepCard({
  job,
  onUpdated,
}: {
  job: Job;
  onUpdated: (job: Job) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const prep = job.prep ?? null;

  async function run() {
    setLoading(true);
    setNotConfigured(false);
    try {
      const updated = await generatePrep(job.id);
      onUpdated(updated);
      toast.success("Prep ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setNotConfigured(true);
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error("Slow down a moment, then try again.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Couldn't generate prep",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview prep</CardTitle>
        {prep && !loading && (
          <Button variant="ghost" size="sm" onClick={run}>
            <RefreshCw size={13} /> Regenerate
          </Button>
        )}
      </CardHeader>

      <CardBody className="pt-3">
        {loading ? (
          <div className="space-y-3">
            <p className="label-mono !text-[10px]">Analysing the role…</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-5/6 rounded-lg" />
          </div>
        ) : prep ? (
          <PrepBody
            prep={prep}
            generatedAt={job.prepGeneratedAt ?? null}
          />
        ) : (
          <div className="py-2">
            <p className="text-[13px] text-fg-muted">
              Generate prep tailored to this role from its details and your notes —
              likely questions, talking points, and what to research.
            </p>
            {notConfigured ? (
              <p className="label-mono mt-4 !text-[10px] !normal-case !tracking-normal">
                AI prep isn&apos;t set up on this server yet.
              </p>
            ) : (
              <Button className="mt-4" onClick={run}>
                <Sparkles size={15} /> Generate prep
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PrepBody({
  prep,
  generatedAt,
}: {
  prep: JobPrep;
  generatedAt: string | null;
}) {
  return (
    <div className="space-y-5">
      {prep.summary && (
        <p className="text-sm leading-relaxed text-fg-muted">{prep.summary}</p>
      )}
      <Section title="Likely questions" items={prep.likelyQuestions} />
      <Section title="Your talking points" items={prep.talkingPoints} />
      <Section title="Research the company" items={prep.research} />
      <Section title="Questions to ask them" items={prep.questionsToAsk} />
      {generatedAt && (
        <p className="label-mono !text-[10px] !normal-case !tracking-normal">
          Generated {relativeTime(generatedAt)} · AI-assisted, double-check the facts
        </p>
      )}
    </div>
  );
}
