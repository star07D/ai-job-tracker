import { JobStatus, STATUS_COLORS } from "@/lib/job-status";

interface StatusBadgeProps {
  status: JobStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
        STATUS_COLORS[status]?.badge ??
        "bg-slate-500/20 text-slate-300 border-slate-500/30"
      }`}
    >
      {status}
    </span>
  );
}
