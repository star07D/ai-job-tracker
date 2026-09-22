/**
 * Pure maths behind a résumé match score — no Gemini, no Prisma, so the
 * banding rule is unit-testable on its own. The model supplies the score and
 * the write-up; everything about turning a number into a verdict lives here,
 * not in the prompt, so the band can never drift from the number next to it.
 */

export type MatchBand = 'strong' | 'partial' | 'weak';

export interface ResumeMatch {
  score: number;
  band: MatchBand;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export const STRONG_THRESHOLD = 75;
export const PARTIAL_THRESHOLD = 45;

export function bandForScore(score: number): MatchBand {
  if (score >= STRONG_THRESHOLD) return 'strong';
  if (score >= PARTIAL_THRESHOLD) return 'partial';
  return 'weak';
}

export function buildResumeMatch(result: {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}): ResumeMatch {
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  return {
    score,
    band: bandForScore(score),
    summary: result.summary,
    strengths: result.strengths,
    gaps: result.gaps,
  };
}
