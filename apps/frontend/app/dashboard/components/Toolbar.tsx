"use client";

import { LayoutGrid, List } from "lucide-react";
import { Select } from "@/components/ui/select";
import { JOB_STATUSES } from "@/lib/job-status";
import { cn } from "@/lib/cn";

export type DashboardView = "list" | "board";

export function Toolbar({
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  view,
  setView,
}: {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  view: DashboardView;
  setView: (v: DashboardView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="h-9 w-auto text-[13px]"
        aria-label="Filter by status"
      >
        <option value="All">All statuses</option>
        {JOB_STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>

      <Select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="h-9 w-auto text-[13px]"
        aria-label="Sort"
      >
        <option value="Newest">Newest first</option>
        <option value="Oldest">Oldest first</option>
        <option value="Company">Company A–Z</option>
      </Select>

      <div className="ml-auto inline-flex overflow-hidden rounded-lg border border-border-strong">
        {(
          [
            ["list", List],
            ["board", LayoutGrid],
          ] as const
        ).map(([v, Icon]) => (
          <button
            key={v}
            type="button"
            aria-label={`${v} view`}
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "grid h-9 w-9 place-items-center transition-colors",
              view === v
                ? "bg-accent-soft text-accent"
                : "bg-surface text-fg-subtle hover:text-fg",
            )}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
    </div>
  );
}
