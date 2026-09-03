"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import { Job, JobInput } from "@/lib/types";

export interface JobFormValues {
  title: string;
  company: string;
  location: string;
  salary: string;
  notes: string;
  status: JobStatus;
  appliedDate: string;
  nextAction: string;
  nextActionDue: string;
}

export const EMPTY_JOB_FORM: JobFormValues = {
  title: "",
  company: "",
  location: "",
  salary: "",
  notes: "",
  status: "Applied",
  appliedDate: "",
  nextAction: "",
  nextActionDue: "",
};

export function jobToForm(job: Job): JobFormValues {
  return {
    title: job.title,
    company: job.company,
    location: job.location || "",
    salary: job.salary || "",
    notes: job.notes || "",
    status: job.status,
    appliedDate: job.appliedDate ? job.appliedDate.slice(0, 10) : "",
    nextAction: job.nextAction || "",
    nextActionDue: job.nextActionDue ? job.nextActionDue.slice(0, 10) : "",
  };
}

export function formToJobInput(v: JobFormValues): JobInput {
  return {
    title: v.title.trim(),
    company: v.company.trim(),
    location: v.location.trim(),
    salary: v.salary.trim(),
    notes: v.notes.trim(),
    status: v.status,
    appliedDate: v.appliedDate
      ? new Date(v.appliedDate).toISOString()
      : undefined,
    nextAction: v.nextAction.trim() || null,
    nextActionDue: v.nextActionDue
      ? new Date(v.nextActionDue).toISOString()
      : null,
  };
}

export function JobFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: JobFormValues | null;
  onSubmit: (values: JobFormValues) => Promise<void>;
}) {
  const isEditing = initial !== null;
  const [values, setValues] = useState<JobFormValues>(EMPTY_JOB_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(initial ?? EMPTY_JOB_FORM);
  }, [open, initial]);

  function set<K extends keyof JobFormValues>(key: K, val: JobFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.company.trim()) {
      toast.error("Role and company are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit application" : "Add application"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="jf-title" className="sm:col-span-2">
            <Input
              id="jf-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Senior Frontend Engineer"
              autoFocus
            />
          </Field>
          <Field label="Company" htmlFor="jf-company">
            <Input
              id="jf-company"
              value={values.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Linear"
            />
          </Field>
          <Field label="Location" htmlFor="jf-location">
            <Input
              id="jf-location"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Remote"
            />
          </Field>
          <Field label="Salary" htmlFor="jf-salary">
            <Input
              id="jf-salary"
              value={values.salary}
              onChange={(e) => set("salary", e.target.value)}
              placeholder="$170k–200k"
            />
          </Field>
          <Field label="Status" htmlFor="jf-status">
            <Select
              id="jf-status"
              value={values.status}
              onChange={(e) => set("status", e.target.value as JobStatus)}
            >
              {JOB_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Applied date"
            htmlFor="jf-date"
            hint="Leave blank for today"
            className="sm:col-span-2"
          >
            <Input
              id="jf-date"
              type="date"
              max={today}
              value={values.appliedDate}
              onChange={(e) => set("appliedDate", e.target.value)}
              className="[color-scheme:light] dark:[color-scheme:dark]"
            />
          </Field>
          <Field
            label="Next step"
            htmlFor="jf-next-action"
            hint="Optional — what you need to do next for this role"
          >
            <Input
              id="jf-next-action"
              value={values.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
              placeholder="Follow up with the recruiter"
            />
          </Field>
          <Field label="Due" htmlFor="jf-next-due" hint="When to do it by">
            <Input
              id="jf-next-due"
              type="date"
              value={values.nextActionDue}
              onChange={(e) => set("nextActionDue", e.target.value)}
              className="[color-scheme:light] dark:[color-scheme:dark]"
            />
          </Field>
          <Field label="Notes" htmlFor="jf-notes" className="sm:col-span-2">
            <Textarea
              id="jf-notes"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Recruiter name, next step, anything worth remembering…"
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEditing ? "Save changes" : "Add application"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
