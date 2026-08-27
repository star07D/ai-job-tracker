import { Briefcase, Building2, MapPin, DollarSign } from "lucide-react";

import InputField from "./InputField";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";

export interface JobFormValues {
  title: string;
  company: string;
  location: string;
  salary: string;
  notes: string;
  status: JobStatus;
  /** ISO yyyy-mm-dd, or "" to let the backend default it to today. */
  appliedDate: string;
}

interface JobFormProps {
  values: JobFormValues;
  onFieldChange: <K extends keyof JobFormValues>(
    field: K,
    value: JobFormValues[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function JobForm({
  values,
  onFieldChange,
  onSubmit,
  onCancel,
  isEditing,
}: JobFormProps) {
  return (
    <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8 mb-8">
      <h2 className="text-5xl font-black mb-8">
        {isEditing ? "Edit Job" : "Add New Job"}
      </h2>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <InputField
          icon={<Briefcase size={18} />}
          placeholder="Job Title"
          value={values.title}
          onChange={(value) => onFieldChange("title", value)}
        />

        <InputField
          icon={<Building2 size={18} />}
          placeholder="Company"
          value={values.company}
          onChange={(value) => onFieldChange("company", value)}
        />

        <InputField
          icon={<MapPin size={18} />}
          placeholder="Location"
          value={values.location}
          onChange={(value) => onFieldChange("location", value)}
        />

        <InputField
          icon={<DollarSign size={18} />}
          placeholder="Salary"
          value={values.salary}
          onChange={(value) => onFieldChange("salary", value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <select
          value={values.status}
          onChange={(e) => onFieldChange("status", e.target.value as JobStatus)}
          className="w-full bg-black/50 border border-slate-700 rounded-2xl py-4 px-4 outline-none"
        >
          {JOB_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <label className="flex items-center gap-3 bg-black/50 border border-slate-700 rounded-2xl py-4 px-4 text-slate-400">
          <span className="shrink-0 text-sm">Applied date</span>
          <input
            type="date"
            value={values.appliedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onFieldChange("appliedDate", e.target.value)}
            className="w-full bg-transparent text-white outline-none [color-scheme:dark]"
          />
        </label>
      </div>

      <textarea
        placeholder="Notes..."
        value={values.notes}
        onChange={(e) => onFieldChange("notes", e.target.value)}
        className="w-full bg-black/50 border border-slate-700 rounded-2xl p-4 h-32 outline-none mb-5"
      />

      <div className="flex gap-4">
        <button
          onClick={onSubmit}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition px-8 py-4 rounded-2xl font-bold"
        >
          {isEditing ? "Update Job" : "+ Add Job"}
        </button>

        {isEditing && (
          <button
            onClick={onCancel}
            className="bg-slate-700 hover:bg-slate-600 transition px-8 py-4 rounded-2xl font-bold"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
