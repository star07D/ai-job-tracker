import { LogoMark } from "@/components/brand/Logo";

/** Static, non-interactive mock of the app shell — used on the landing hero. */
export function DashboardPreview() {
  const rows = [
    ["Senior Frontend Engineer", "Linear · Remote", "Interview", "st-interview"],
    ["Product Designer", "Vercel · New York", "Applied", "st-applied"],
    ["Full-stack Developer", "Supabase · Remote", "Accepted", "st-accepted"],
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-pop">
      <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
        <LogoMark className="h-[18px] w-[18px]" />
        <span className="font-display text-xs font-semibold">Rolio</span>
        <span className="ml-2 h-5 flex-1 rounded-md bg-surface-2" />
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["12", "Applied"],
            ["4", "Interview"],
            ["1", "Offer"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-lg border border-border p-2.5">
              <div className="font-display text-lg font-semibold">{n}</div>
              <div className="label-mono !text-[9px]">{l}</div>
            </div>
          ))}
        </div>
        {rows.map(([title, meta, label, tone]) => (
          <div
            key={title}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{title}</div>
              <div className="truncate text-[11.5px] text-fg-muted">{meta}</div>
            </div>
            <span
              className="ml-3 shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase"
              style={{
                color: `var(--${tone})`,
                background: `var(--${tone}-bg)`,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
