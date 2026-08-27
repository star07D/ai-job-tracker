import { cn } from "@/lib/cn";
import { statusStyle } from "@/lib/job-status";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const s = statusStyle(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide",
        s.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}
