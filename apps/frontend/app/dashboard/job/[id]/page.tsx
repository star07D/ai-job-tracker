"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Banknote,
  CalendarDays,
  Clock,
  User,
  Mail,
  ExternalLink,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/motion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  JobFormDialog,
  JobFormValues,
  formToJobInput,
  jobToForm,
} from "@/app/dashboard/components/JobFormDialog";
import { PrepCard } from "./components/PrepCard";
import { MatchCard } from "./components/MatchCard";
import { NextStep } from "./components/NextStep";

import { deleteJob, getSingleJob, setJobArchived, updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { isStale, stageInfo } from "@/lib/stale";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import { cn } from "@/lib/cn";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function linkedinHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function JobDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<JobFormValues | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    getSingleJob(id)
      .then(setJob)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function saveForm(values: JobFormValues) {
    const updated = await updateJob(id, formToJobInput(values));
    setJob(updated);
    toast.success("Application updated");
  }

  async function changeStatus(status: JobStatus) {
    if (!job || status === job.status) return;
    const prev = job;
    setJob({ ...job, status });
    try {
      await updateJob(id, { status });
      toast.success("Status updated");
    } catch (e) {
      setJob(prev);
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  async function remove() {
    await deleteJob(id);
    toast.success("Application deleted");
    router.push("/dashboard");
  }

  async function toggleArchive() {
    if (!job) return;
    const archived = !job.archived;
    try {
      const updated = await setJobArchived(id, archived);
      setJob(updated);
      toast.success(archived ? "Application archived" : "Application restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <EmptyState
          title="Application not found"
          description="It may have been deleted."
          action={
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/dashboard"
        className="label-mono inline-flex items-center gap-1.5 transition-colors hover:text-fg"
      >
        <ArrowLeft size={13} /> Dashboard
      </Link>

      {job.archived && (
        <div className="label-mono mt-5 flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2 px-3.5 py-2.5 !text-[11px] !normal-case !tracking-normal text-fg-muted">
          <Archive size={13} /> This application is archived — it&apos;s
          excluded from your active pipeline and reminders.
        </div>
      )}

      <Reveal
        as={Card}
        className="mt-5 block border-2 border-fg shadow-[6px_6px_0_0_var(--offset)]"
      >
        <CardBody className="flex flex-col justify-between gap-5 sm:flex-row">
          <div>
            <h1 className="font-display text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[3rem]">
              {job.title}
            </h1>
            <p className="mt-2.5 text-lg font-medium text-fg-muted">
              <span className="hl">{job.company}</span>
            </p>
            <div className="label-mono mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 !text-[10px]">
              {job.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} /> {job.location}
                </span>
              )}
              {job.salary && (
                <span className="inline-flex items-center gap-1.5">
                  <Banknote size={12} /> {job.salary}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} /> Applied {fmt(job.appliedDate)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  isStale(job) && "text-[var(--st-interview)]",
                )}
              >
                <Clock size={12} /> {stageInfo(job).label} in {job.status}
              </span>
            </div>
            {job.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge
              status={job.status}
              className="rotate-[-3deg] border-2 border-current !px-3 !py-1 !text-[12px]"
            />
            <Select
              value={job.status}
              onChange={(e) => changeStatus(e.target.value as JobStatus)}
              className="h-8 w-auto text-[13px]"
              aria-label="Change status"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Reveal>

      {(job.nextAction || job.nextActionDue) && (
        <Reveal index={1} className="mt-4 block">
          <NextStep job={job} onUpdated={setJob} />
        </Reveal>
      )}

      <Reveal index={2} className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              {job.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                  {job.notes}
                </p>
              ) : (
                <p className="text-sm text-fg-subtle">No notes yet.</p>
              )}
            </CardBody>
          </Card>

          <PrepCard job={job} onUpdated={setJob} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-2 pt-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditing(jobToForm(job));
                  setFormOpen(true);
                }}
              >
                <Pencil size={15} /> Edit application
              </Button>
              <Button variant="outline" className="w-full" onClick={toggleArchive}>
                {job.archived ? (
                  <>
                    <ArchiveRestore size={15} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Archive
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full !text-[var(--st-rejected)]"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 size={15} /> Delete
              </Button>
            </CardBody>
          </Card>

          <MatchCard job={job} onUpdated={setJob} />

          {(job.contactName || job.contactEmail || job.contactLinkedin) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2.5 pt-3 text-sm">
                {job.contactName && (
                  <div className="flex items-center gap-2 font-medium">
                    <User size={14} className="shrink-0 text-fg-subtle" />
                    <span className="truncate">{job.contactName}</span>
                  </div>
                )}
                {job.contactEmail && (
                  <a
                    href={`mailto:${job.contactEmail}`}
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <Mail size={14} className="shrink-0 text-fg-subtle" />
                    <span className="truncate">{job.contactEmail}</span>
                  </a>
                )}
                {job.contactLinkedin && (
                  <a
                    href={linkedinHref(job.contactLinkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <ExternalLink size={14} className="shrink-0 text-fg-subtle" />
                    <span className="truncate">{job.contactLinkedin}</span>
                  </a>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardBody className="pt-2 text-sm">
              {[
                ["Added", fmt(job.createdAt)],
                ["Applied", fmt(job.appliedDate)],
                [
                  `In ${job.status}`,
                  `${fmt(job.statusChangedAt)} · ${stageInfo(job).label}`,
                ],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex justify-between py-2.5 ${i > 0 ? "border-t border-dashed border-border" : ""}`}
                >
                  <span className="text-fg-subtle">{k}</span>
                  <span className="font-data font-medium">{v}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </Reveal>

      <JobFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSubmit={saveForm}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        title="Delete application"
        message={`Delete "${job.title}" at ${job.company}? This can't be undone.`}
      />
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg">
        <AppTopbar />
        <JobDetailContent />
      </div>
    </ProtectedRoute>
  );
}
