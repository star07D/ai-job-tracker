"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Inbox } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/ui/motion";

import { Pipeline } from "./components/Pipeline";
import { Toolbar, DashboardView } from "./components/Toolbar";
import { JobRow } from "./components/JobRow";
import { KanbanBoard } from "./components/KanbanBoard";
import { NeedsAttention } from "./components/NeedsAttention";
import {
  JobFormDialog,
  JobFormValues,
  formToJobInput,
  jobToForm,
} from "./components/JobFormDialog";

import { createJob, deleteJob, getJobs, setJobArchived, updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { needsAttention } from "@/lib/due";
import { staleCount } from "@/lib/stale";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function DashboardContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [view, setView] = useState<DashboardView>("list");
  const [showArchived, setShowArchived] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobFormValues | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoadError(null);
    try {
      setJobs(await getJobs());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load applications";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(job: Job) {
    setEditing(jobToForm(job));
    setEditingId(job.id);
    setFormOpen(true);
  }

  async function submitForm(values: JobFormValues) {
    const payload = formToJobInput(values);
    if (editingId) {
      await updateJob(editingId, payload);
      toast.success("Application updated");
    } else {
      await createJob(payload);
      toast.success("Application added");
    }
    await loadJobs();
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    const prev = jobs;
    setJobs((j) => j.map((job) => (job.id === id ? { ...job, status } : job)));
    try {
      await updateJob(id, { status });
      toast.success("Status updated");
    } catch (error) {
      setJobs(prev);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget.id);
      toast.success("Application deleted");
      await loadJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function toggleArchived(job: Job) {
    const prev = jobs;
    const archived = !job.archived;
    setJobs((j) =>
      j.map((x) => (x.id === job.id ? { ...x, archived } : x)),
    );
    try {
      await setJobArchived(job.id, archived);
      toast.success(archived ? "Application archived" : "Application restored");
    } catch (error) {
      setJobs(prev);
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  }

  // Active pipeline — everything that isn't archived. Drives the stats strip
  // and needs-attention regardless of the "Archived" toggle in the toolbar.
  const activeJobs = useMemo(() => jobs.filter((j) => !j.archived), [jobs]);

  const allTags = useMemo(
    () => Array.from(new Set(jobs.flatMap((j) => j.tags))).sort(),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = showArchived ? jobs : activeJobs;
    const list = base.filter((job) => {
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === "All" || job.status === filterStatus;
      const matchesTag = filterTag === "All" || job.tags.includes(filterTag);
      return matchesSearch && matchesStatus && matchesTag;
    });

    const byDate = (a: Job, b: Job) =>
      new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();

    if (sortBy === "Newest") list.sort((a, b) => byDate(b, a));
    if (sortBy === "Oldest") list.sort(byDate);
    if (sortBy === "Company")
      list.sort((a, b) => a.company.localeCompare(b.company));

    return list;
  }, [jobs, activeJobs, showArchived, search, filterStatus, filterTag, sortBy]);

  // The kanban board is about the active pipeline — archived roles never
  // show there even when "Archived" is toggled on in list view.
  const boardJobs = useMemo(
    () => filtered.filter((j) => !j.archived),
    [filtered],
  );

  const hasAttention = useMemo(
    () => activeJobs.some((j) => needsAttention(j.nextActionDue)),
    [activeJobs],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of JOB_STATUSES)
      c[s] = activeJobs.filter((j) => j.status === s).length;
    return c;
  }, [activeJobs]);

  const stale = useMemo(() => staleCount(activeJobs), [activeJobs]);

  return (
    <div className="min-h-screen bg-bg">
      <AppTopbar search={search} onSearch={setSearch} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">
              Applications
            </h1>
            <p className="label-mono mt-1.5 !text-[10px]">
              {activeJobs.length} tracked
              {jobs.length > activeJobs.length &&
                ` · ${jobs.length - activeJobs.length} archived`}
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} /> Add application
          </Button>
        </Reveal>

        {!loading && !loadError && hasAttention && (
          <Reveal index={1} className="mt-6 block">
            <NeedsAttention jobs={activeJobs} />
          </Reveal>
        )}

        <Reveal index={1} className="mt-6 block">
          <Pipeline counts={counts} total={activeJobs.length} stale={stale} />
        </Reveal>

        <Reveal index={2} className="mt-8 block">
          <Toolbar
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            tags={allTags}
            sortBy={sortBy}
            setSortBy={setSortBy}
            view={view}
            setView={setView}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />

          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : loadError ? (
              <EmptyState
                title="Couldn't load your applications"
                description={loadError}
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLoading(true);
                      loadJobs();
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Inbox size={18} />}
                title={jobs.length === 0 ? "No applications yet" : "Nothing matches"}
                description={
                  jobs.length === 0
                    ? "Add your first role to start building your pipeline."
                    : "Try a different search or filter."
                }
                action={
                  jobs.length === 0 ? (
                    <Button onClick={openAdd}>
                      <Plus size={15} /> Add application
                    </Button>
                  ) : undefined
                }
              />
            ) : view === "board" ? (
              <KanbanBoard
                jobs={boardJobs}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <Card className="divide-y divide-border overflow-hidden p-0">
                {filtered.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onEdit={openEdit}
                    onToggleArchive={toggleArchived}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </Card>
            )}
          </div>
        </Reveal>
      </main>

      <JobFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSubmit={submitForm}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete application"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}" at ${deleteTarget.company}? This can't be undone.`
            : ""
        }
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
