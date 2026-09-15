"use client";

import { Archive, LayoutGrid, List } from "lucide-react";
import { Select } from "@/components/ui/select";
import { JOB_STATUSES } from "@/lib/job-status";
import { cn } from "@/lib/cn";

export type DashboardView = "list" | "board";

export function Toolbar({
  filterStatus,
  setFilterStatus,
  filterTag,
  setFilterTag,
  tags,
  sortBy,
  setSortBy,
  view,
  setView,
  showArchived,
  setShowArchived,
}: {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterTag: string;
  setFilterTag: (v: string) => void;
  tags: string[];
  sortBy: string;
  setSortBy: (v: string) => void;
  view: DashboardView;
  setView: (v: DashboardView) => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
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

      {tags.length > 0 && (
        <Select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="h-9 w-auto text-[13px]"
          aria-label="Filter by tag"
        >
          <option value="All">All tags</option>
          {tags.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      )}

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

      <button
        type="button"
        aria-pressed={showArchived}
        onClick={() => setShowArchived(!showArchived)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors",
          showArchived
            ? "border-accent bg-accent-soft text-accent"
            : "border-border-strong bg-surface text-fg-subtle hover:text-fg",
        )}
      >
        <Archive size={14} /> Archived
      </button>

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
