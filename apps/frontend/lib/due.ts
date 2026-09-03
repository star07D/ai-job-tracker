/**
 * Follow-up due-date helpers. All comparisons are by calendar day in the
 * viewer's local timezone, so "due today" means today wherever they are.
 */

export type DueTone = "overdue" | "today" | "soon" | "later";

export interface DueInfo {
  tone: DueTone;
  /** Short label, e.g. "3 days overdue", "Due today", "Due in 4 days". */
  label: string;
  /** Whole days from today — negative when overdue, 0 today. */
  days: number;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dueInfo(iso: string, now: Date = new Date()): DueInfo {
  const DAY = 86_400_000;
  const days = Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / DAY,
  );

  if (days < 0) {
    const n = -days;
    return { tone: "overdue", days, label: `${n} day${n === 1 ? "" : "s"} overdue` };
  }
  if (days === 0) return { tone: "today", days, label: "Due today" };
  if (days === 1) return { tone: "soon", days, label: "Due tomorrow" };
  if (days <= 7) return { tone: "soon", days, label: `Due in ${days} days` };

  const label = `Due ${new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
  return { tone: "later", days, label };
}

/** Tailwind text-colour class for a tone, using the shared status tokens. */
export function dueToneClass(tone: DueTone): string {
  switch (tone) {
    case "overdue":
      return "text-[var(--st-rejected)]";
    case "today":
      return "text-[var(--st-interview)]";
    case "soon":
      return "text-fg-muted";
    default:
      return "text-fg-subtle";
  }
}

/** Whether a due date should surface in the dashboard "Needs attention" strip. */
export function needsAttention(iso: string | null | undefined, now?: Date): boolean {
  if (!iso) return false;
  return dueInfo(iso, now).days <= 0;
}
