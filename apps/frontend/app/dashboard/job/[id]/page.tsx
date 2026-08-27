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

import { deleteJob, getSingleJob, updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";

const PREP = [
  "Research company background",
  "Prepare STAR-method answers",
  "Practise technical questions",
  "Decide on salary expectations",
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

      <Reveal as={Card} className="mt-5 block">
        <CardBody className="flex flex-col justify-between gap-5 sm:flex-row">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">
              {job.title}
            </h1>
            <p className="mt-1 font-medium text-fg-muted">{job.company}</p>
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
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={job.status} />
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

      <Reveal index={1} className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
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

          <Card>
            <CardHeader>
              <CardTitle>Interview prep</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              <p className="label-mono mb-3 !text-[10px]">
                Generic for now — AI-tailored prep coming soon
              </p>
              <ul className="space-y-2">
                {PREP.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5 text-[13px]"
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded border-[1.5px] border-border-strong" />
                    {p}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
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
              <Button
                variant="ghost"
                className="w-full !text-[var(--st-rejected)]"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 size={15} /> Delete
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardBody className="pt-2 text-sm">
              {[
                ["Added", fmt(job.createdAt)],
                ["Applied", fmt(job.appliedDate)],
                ["Status", job.status],
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
