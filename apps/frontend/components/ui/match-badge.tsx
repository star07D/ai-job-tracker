import { MATCH_BAND_STYLES } from "@/lib/match";
import { ResumeMatch } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Small "82 match" pill, coloured by band — shown on list rows and kanban cards. */
export function MatchBadge({
  match,
  className,
}: {
  match: ResumeMatch;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono shrink-0 rounded-md px-1.5 py-0.5 !text-[10px]",
        MATCH_BAND_STYLES[match.band].badge,
        className,
      )}
    >
      {match.score} match
    </span>
  );
}
