import { ResumeMatch } from "./types";

type MatchBandStyle = {
  /** text + bg for a badge/pill (theme-aware via CSS vars) */
  badge: string;
  /** solid bar color for the score gauge */
  bar: string;
};

// Reuses the existing, already contrast-checked status tokens rather than
// inventing a new palette for the score gauge.
export const MATCH_BAND_STYLES: Record<ResumeMatch["band"], MatchBandStyle> = {
  strong: {
    badge: "text-[var(--st-accepted)] bg-[var(--st-accepted-bg)]",
    bar: "bg-[var(--st-accepted)]",
  },
  partial: {
    badge: "text-[var(--st-interview)] bg-[var(--st-interview-bg)]",
    bar: "bg-[var(--st-interview)]",
  },
  weak: {
    badge: "text-[var(--st-rejected)] bg-[var(--st-rejected-bg)]",
    bar: "bg-[var(--st-rejected)]",
  },
};
