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
import {
  JobFormDialog,
  JobFormValues,
  formToJobInput,
  jobToForm,
} from "./components/JobFormDialog";

import { createJob, deleteJob, getJobs, updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function DashboardContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [view, setView] = useState<DashboardView>("list");

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = jobs.filter((job) => {
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === "All" || job.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    const byDate = (a: Job, b: Job) =>
      new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();

    if (sortBy === "Newest") list.sort((a, b) => byDate(b, a));
    if (sortBy === "Oldest") list.sort(byDate);
    if (sortBy === "Company")
      list.sort((a, b) => a.company.localeCompare(b.company));

    return list;
  }, [jobs, search, filterStatus, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of JOB_STATUSES) c[s] = jobs.filter((j) => j.status === s).length;
    return c;
  }, [jobs]);

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
              {jobs.length} tracked
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} /> Add application
          </Button>
        </Reveal>

        <Reveal index={1} className="mt-6 block">
          <Pipeline counts={counts} total={jobs.length} />
        </Reveal>

        <Reveal index={2} className="mt-8 block">
          <Toolbar
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            view={view}
            setView={setView}
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
                jobs={filtered}
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
