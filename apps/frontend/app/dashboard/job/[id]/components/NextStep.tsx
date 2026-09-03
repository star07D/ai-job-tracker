"use client";

import { useState } from "react";
import { Check, Flag } from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { dueInfo, dueToneClass } from "@/lib/due";
import { cn } from "@/lib/cn";

export function NextStep({
  job,
  onUpdated,
}: {
  job: Job;
  onUpdated: (job: Job) => void;
}) {
  const [clearing, setClearing] = useState(false);

  if (!job.nextAction && !job.nextActionDue) return null;

  const info = job.nextActionDue ? dueInfo(job.nextActionDue) : null;

  async function markDone() {
    setClearing(true);
    try {
      const updated = await updateJob(job.id, {
        nextAction: null,
        nextActionDue: null,
      });
      onUpdated(updated);
      toast.success("Nice — step cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card
      className={cn(
        "flex items-center gap-3 px-5 py-3.5",
        info?.tone === "overdue" && "border-[var(--st-rejected)]",
      )}
    >
      <Flag size={15} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <span className="label-mono !text-[10px]">Next step</span>
        <p className="truncate text-[13.5px] font-medium">
          {job.nextAction || "Follow up"}
        </p>
      </div>
      {info && (
        <span
          className={cn(
            "font-data shrink-0 text-[11.5px] font-semibold",
            dueToneClass(info.tone),
          )}
        >
          {info.label}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={markDone}
        loading={clearing}
        className="shrink-0"
      >
        <Check size={14} /> Done
      </Button>
    </Card>
  );
}
